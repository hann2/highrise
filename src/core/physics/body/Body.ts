import type Entity from "../../entity/Entity";
import { CompatibleVector, V, V2d } from "../../Vector";
import { AABB } from "../collision/AABB";
import { EventEmitter } from "../events/EventEmitter";
import { PhysicsEventMap } from "../events/PhysicsEvents";
import type { Shape } from "../shapes/Shape";
import type { World } from "../world/World";
import type { BodyShape, MotionMode } from "./bodyInterfaces";
import { SleepBehavior, type SleepableBody } from "./SleepBehavior";
import { updateAABB as updateAABBSystem } from "../systems/AABBSystem";
import {
  applyDampingPointMass2D,
  applyDampingRigid2D,
} from "../systems/DampingSystem";
import {
  applyForce as applyForceSystem,
  applyForceLocal as applyForceLocalSystem,
  applyImpulse as applyImpulseSystem,
  applyImpulseLocal as applyImpulseLocalSystem,
  setZeroForce as setZeroForceSystem,
} from "../systems/ForceSystem";
import {
  integratePositionPointMass2D,
  integratePositionRigid2D,
  integrateVelocityPointMass2D,
  integrateVelocityRigid2D,
} from "../systems/IntegrationSystem";
import { updateMassProperties as updateMassPropertiesSystem } from "../systems/MassPropertiesSystem";
import { sleepTick as sleepTickSystem } from "../systems/SleepSystem";

/** Sleep state for dynamic bodies. */
export enum SleepState {
  /** Body is active and simulated. */
  AWAKE = 0,
  /** Body is nearly idle and may sleep soon. */
  SLEEPY = 1,
  /** Body is sleeping and not simulated until woken. */
  SLEEPING = 2,
}

/**
 * Construction options for {@link Body}. Fields irrelevant to the chosen
 * shape/motion combination are ignored silently; the factories in
 * `bodyFactories.ts` present typed facades.
 */
export interface BodyOptions {
  shape: BodyShape;
  motion: MotionMode;
  position?: CompatibleVector;
  angle?: number;
  id?: number;
  collisionResponse?: boolean;

  // Dynamic-only (ignored if motion !== "dynamic"):
  mass?: number;
  velocity?: CompatibleVector;
  angularVelocity?: number;
  damping?: number;
  angularDamping?: number;
  allowSleep?: boolean;
  sleepSpeedLimit?: number;
  sleepTimeLimit?: number;
  ccdSpeedThreshold?: number;
  ccdIterations?: number;
}

/**
 * Concrete, one-size-fits-all physics body. Carries every field any shape or
 * motion mode might need; which fields are meaningful is determined by the
 * readonly `shape` and `motion` tags. Narrowed interface views live in
 * `bodyInterfaces.ts`; factories in `bodyFactories.ts` produce this class
 * cast to the appropriate view.
 *
 * Behavior (integration, force application, damping, sleep tick, mass
 * recomputation, AABB update) is intentionally NOT on this class — it lives
 * in systems that iterate partitioned body buckets. The only methods kept
 * here are pure transforms and shape bookkeeping.
 */
export class Body
  extends EventEmitter<PhysicsEventMap>
  implements SleepableBody
{
  /** @internal Monotonic id counter. */
  static _idCounter = 0;

  /** Unique identifier for this body. */
  readonly id: number;
  /** Readonly DOF tag — drives which fields are meaningful to the solver. */
  readonly shape: BodyShape;
  /** Motion role — static, kinematic, or dynamic. Fixed at construction. */
  readonly motion: MotionMode;

  world: World | null = null;
  owner?: Entity;

  shapes: Shape[] = [];
  concavePath: V2d[] | null = null;
  aabb: AABB = new AABB();
  aabbNeedsUpdate: boolean = true;
  boundingRadius: number = 0;
  collisionResponse: boolean;

  /** @internal */
  _wakeUpAfterNarrowphase: boolean = false;
  /** @internal CCD sets this when it's nuked a substep so position integrate skips. */
  _skipPositionThisStep: boolean = false;

  // ── Position / angle ─────────────────────────────────────────────────
  position: V2d = V();
  /** Rotation in radians. Always 0 for point masses. */
  angle: number = 0;

  // ── Velocity ─────────────────────────────────────────────────────────
  velocity: V2d = V();
  /** Angular velocity in radians/s. Not simulated for point masses. */
  angularVelocity: number = 0;

  // ── Forces ───────────────────────────────────────────────────────────
  force: V2d = V();
  /** Accumulated torque. Ignored for point masses. */
  angularForce: number = 0;

  // ── Mass / inertia ───────────────────────────────────────────────────
  mass: number = 0;
  invMass: number = 0;
  inertia: number = 0;
  invInertia: number = 0;

  // ── Damping / CCD ────────────────────────────────────────────────────
  damping: number = 0;
  angularDamping: number = 0;
  ccdSpeedThreshold: number = -1;
  ccdIterations: number = 10;

  // ── Sleep ────────────────────────────────────────────────────────────
  /** @internal Sleep behavior, allocated for every body for uniformity. */
  _sleep: SleepBehavior;

  constructor(options: BodyOptions) {
    super();

    this.id = options.id ?? ++Body._idCounter;
    this.shape = options.shape;
    this.motion = options.motion;
    this.collisionResponse = options.collisionResponse ?? true;

    if (options.position) {
      this.position.set(options.position);
    }
    this.angle = options.angle ?? 0;

    // Allocate sleep behavior for every body; SleepSystem filters to dynamic.
    this._sleep = new SleepBehavior({
      allowSleep: options.allowSleep ?? true,
      sleepSpeedLimit: options.sleepSpeedLimit ?? 0.2,
      sleepTimeLimit: options.sleepTimeLimit ?? 1,
    });

    if (options.motion === "dynamic") {
      this.mass = options.mass ?? 0;
      if (options.velocity) {
        this.velocity.set(options.velocity);
      }
      if (options.angularVelocity !== undefined) {
        this.angularVelocity = options.angularVelocity;
      }
      this.damping = options.damping ?? 0;
      this.angularDamping = options.angularDamping ?? 0;
      this.ccdSpeedThreshold = options.ccdSpeedThreshold ?? -1;
      this.ccdIterations = options.ccdIterations ?? 10;

      // Initialize invMass / invInertia from mass (and from
      // shapes if any were added pre-construction). Callers typically add
      // shapes after construction; addShape re-runs this.
      updateMassPropertiesSystem(this);
    } else if (options.motion === "kinematic") {
      if (options.velocity) {
        this.velocity.set(options.velocity);
      }
      if (options.angularVelocity !== undefined) {
        this.angularVelocity = options.angularVelocity;
      }
    }
  }

  // ── Sleep proxies ────────────────────────────────────────────────────

  get sleepState(): SleepState {
    return this._sleep.sleepState;
  }
  get allowSleep(): boolean {
    return this._sleep.allowSleep;
  }
  get sleepSpeedLimit(): number {
    return this._sleep.sleepSpeedLimit;
  }
  get wantsToSleep(): boolean {
    return this._sleep.wantsToSleep;
  }
  get idleTime(): number {
    return this._sleep.idleTime;
  }
  set idleTime(value: number) {
    this._sleep.idleTime = value;
  }
  get timeLastSleepy(): number {
    return this._sleep.timeLastSleepy;
  }
  set timeLastSleepy(value: number) {
    this._sleep.timeLastSleepy = value;
  }

  isSleeping(): boolean {
    return this._sleep.isSleeping();
  }
  isAwake(): boolean {
    return this._sleep.isAwake();
  }
  wakeUp(): this {
    this._sleep.wakeUp(this);
    return this;
  }
  sleep(): this {
    this._sleep.sleep(this);
    return this;
  }

  // ── Shape bookkeeping ────────────────────────────────────────────────

  /**
   * Add a shape with an optional local transform. Recomputes mass
   * properties and bounding radius.
   */
  addShape(shape: Shape, offset?: CompatibleVector, angle?: number): this {
    if (shape.body) {
      throw new Error("A shape can only be added to one body.");
    }
    shape.body = this;
    if (offset) {
      shape.position.set(offset);
    }
    shape.angle = angle ?? 0;

    this.shapes.push(shape);
    updateMassPropertiesSystem(this);
    this.updateBoundingRadius();

    this.aabbNeedsUpdate = true;
    return this;
  }

  removeShape(shape: Shape): boolean {
    const idx = this.shapes.indexOf(shape);
    if (idx !== -1) {
      this.shapes.splice(idx, 1);
      this.aabbNeedsUpdate = true;
      shape.body = null;
      return true;
    }
    return false;
  }

  updateBoundingRadius(): this {
    const shapes = this.shapes;
    const N = shapes.length;
    let radius = 0;
    for (let i = 0; i !== N; i++) {
      const shape = shapes[i];
      const offset = shape.position.magnitude;
      const r = shape.boundingRadius;
      if (offset + r > radius) {
        radius = offset + r;
      }
    }
    this.boundingRadius = radius;
    return this;
  }

  // ── Pure transforms ──────────────────────────────────────────────────

  toLocalFrame(worldPoint: V2d): V2d {
    return worldPoint.toLocalFrame(this.position, this.angle);
  }

  toWorldFrame(localPoint: V2d): V2d {
    return localPoint.toGlobalFrame(this.position, this.angle);
  }

  vectorToLocalFrame(worldVector: V2d): V2d {
    return worldVector.rotate(-this.angle);
  }

  vectorToWorldFrame(localVector: V2d): V2d {
    return localVector.rotate(this.angle);
  }

  overlaps(body: Body): boolean {
    return this.world!.overlapKeeper.bodiesAreOverlapping(this, body);
  }

  getVelocityAtPoint(localPoint: V2d): V2d {
    return localPoint
      .crossVZ(this.angularVelocity)
      .imul(-1)
      .iadd(this.velocity);
  }

  getVelocityAtWorldPoint(worldPoint: V2d): V2d {
    return worldPoint
      .toLocalFrame(this.position, this.angle)
      .icrossVZ(this.angularVelocity)
      .imul(-1)
      .iadd(this.velocity);
  }

  // ── Convenience getters ──────────────────────────────────────────────

  /** True for point masses (pm2d): rotation is not simulated. */
  get fixedRotation(): boolean {
    return this.shape === "pm2d";
  }

  get density(): number {
    const totalArea = this.getArea();
    return totalArea > 0 ? this.mass / totalArea : 0;
  }
  set density(density: number) {
    const totalArea = this.getArea();
    this.mass = totalArea * density;
    this.updateMassProperties();
  }

  // ── AABB / area helpers ──────────────────────────────────────────────

  getAABB(): AABB {
    if (this.aabbNeedsUpdate) {
      this.updateAABB();
    }
    return this.aabb;
  }

  updateAABB(): this {
    updateAABBSystem(this);
    return this;
  }

  getArea(): number {
    let totalArea = 0;
    for (let i = 0; i < this.shapes.length; i++) {
      totalArea += this.shapes[i].area;
    }
    return totalArea;
  }

  // ── Force / impulse application (delegates to ForceSystem) ───────────

  applyForce(force: V2d, relativePoint?: V2d): this {
    applyForceSystem(this, force, relativePoint);
    return this;
  }

  applyForceLocal(localForce: V2d, localPoint?: V2d): this {
    applyForceLocalSystem(this, localForce, localPoint);
    return this;
  }

  applyImpulse(impulse: V2d, relativePoint?: V2d): this {
    applyImpulseSystem(this, impulse, relativePoint);
    return this;
  }

  applyImpulseLocal(localImpulse: V2d, localPoint?: V2d): this {
    applyImpulseLocalSystem(this, localImpulse, localPoint);
    return this;
  }

  setZeroForce(): this {
    setZeroForceSystem(this);
    return this;
  }

  // ── Mass properties / integration / damping (delegate to systems) ────

  updateMassProperties(): this {
    updateMassPropertiesSystem(this);
    return this;
  }

  integrateVelocity(dt: number): void {
    if (this.motion !== "dynamic") return;
    switch (this.shape) {
      case "pm2d":
        integrateVelocityPointMass2D(this, dt);
        break;
      case "rigid2d":
        integrateVelocityRigid2D(this, dt);
        break;
    }
  }

  integratePosition(dt: number): void {
    if (this.motion === "static") return;
    if (this.motion === "kinematic") {
      this.position[0] += this.velocity[0] * dt;
      this.position[1] += this.velocity[1] * dt;
      if (this.shape === "rigid2d") {
        this.angle += this.angularVelocity * dt;
      }
      this.aabbNeedsUpdate = true;
      return;
    }
    switch (this.shape) {
      case "pm2d":
        integratePositionPointMass2D(this, dt, this.world);
        break;
      case "rigid2d":
        integratePositionRigid2D(this, dt, this.world);
        break;
    }
  }

  integrate(dt: number): void {
    this.integrateVelocity(dt);
    this.integratePosition(dt);
  }

  applyDamping(dt: number): void {
    if (this.motion !== "dynamic") return;
    switch (this.shape) {
      case "pm2d":
        applyDampingPointMass2D(this, dt);
        break;
      case "rigid2d":
        applyDampingRigid2D(this, dt);
        break;
    }
  }

  sleepTick(time: number, dontSleep: boolean, dt: number): void {
    sleepTickSystem(this, time, dontSleep, dt);
  }

  // ── Center-of-mass adjustment (legacy helper) ────────────────────────

  adjustCenterOfMass(): this {
    const sum = V();
    let totalArea = 0;
    for (let i = 0; i !== this.shapes.length; i++) {
      const s = this.shapes[i];
      const offset_times_area = V(s.position);
      offset_times_area.imul(s.area);
      sum.iadd(offset_times_area);
      totalArea += s.area;
    }
    const cm = V(sum);
    cm.imul(1 / totalArea);
    for (let i = 0; i !== this.shapes.length; i++) {
      this.shapes[i].position.isub(cm);
    }
    this.position.iadd(cm);
    for (let i = 0; this.concavePath && i < this.concavePath.length; i++) {
      this.concavePath[i].isub(cm);
    }
    this.updateMassProperties();
    this.updateBoundingRadius();
    return this;
  }
}
