import type Entity from "../../entity/Entity";
import { clamp } from "../../util/MathUtil";
import { CompatibleVector, V, V2d } from "../../Vector";
import { CompatibleVector3, V3d } from "../../Vector3";
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
  applyDampingPointMass3D,
  applyDampingRigid2D,
  applyDampingRigid3D,
} from "../systems/DampingSystem";
import {
  applyForce as applyForceSystem,
  applyForce3D as applyForce3DSystem,
  applyForceLocal as applyForceLocalSystem,
  applyImpulse as applyImpulseSystem,
  applyImpulseLocal as applyImpulseLocalSystem,
  setZeroForce as setZeroForceSystem,
} from "../systems/ForceSystem";
import {
  integratePositionPointMass2D,
  integratePositionPointMass3D,
  integratePositionRigid2D,
  integratePositionRigid3D,
  integrateVelocityPointMass2D,
  integrateVelocityPointMass3D,
  integrateVelocityRigid2D,
  integrateVelocityRigid3D,
} from "../systems/IntegrationSystem";
import {
  recomputeWorldInertia as recomputeWorldInertiaSystem,
  updateMassProperties as updateMassPropertiesSystem,
} from "../systems/MassPropertiesSystem";
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
  z?: number;
  id?: number;
  collisionResponse?: boolean;

  // Dynamic-only (ignored if motion !== "dynamic"):
  mass?: number;
  velocity?: CompatibleVector;
  angularVelocity?: number;
  zVelocity?: number;
  damping?: number;
  angularDamping?: number;
  zDamping?: number;
  rollPitchDamping?: number;
  allowSleep?: boolean;
  sleepSpeedLimit?: number;
  sleepTimeLimit?: number;
  ccdSpeedThreshold?: number;
  ccdIterations?: number;

  // Rigid3D-only:
  rollInertia?: number;
  pitchInertia?: number;
  zMass?: number;
}

/**
 * Concrete, one-size-fits-all physics body. Carries every field any shape or
 * motion mode might need; field meaningfulness is controlled by the readonly
 * `shape` and `motion` tags. Narrowed interface views live in
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

  // Shared arrays for non-6DOF accessor defaults. Never written to.
  /** @internal */ static readonly ZERO_3 = new Float64Array(3);
  /** @internal */ static readonly ZERO_9 = new Float64Array(9);
  /** @internal */ static readonly IDENTITY_3X3 = new Float64Array([
    1, 0, 0, 0, 1, 0, 0, 0, 1,
  ]);

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

  // ── Position / orientation ───────────────────────────────────────────
  position: V2d = V();
  /** @internal backing field for the {@link angle} accessor. */
  _angle: number = 0;
  z: number = 0;
  /** 3x3 rotation matrix (row-major). Always allocated; identity for non-rigid3d bodies. */
  orientation: Float64Array = new Float64Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);

  // ── Velocity ─────────────────────────────────────────────────────────
  velocity: V2d = V();
  zVelocity: number = 0;
  /** 3D angular velocity [wx, wy, wz]. Only [2] is meaningful for 2D bodies. */
  angularVelocity3: Float64Array = new Float64Array(3);

  // ── Forces ───────────────────────────────────────────────────────────
  force: V2d = V();
  zForce: number = 0;
  angularForce3: Float64Array = new Float64Array(3);

  // ── Mass / inertia ───────────────────────────────────────────────────
  mass: number = 0;
  invMass: number = 0;
  inertia: number = 0;
  invInertia: number = 0;
  invZMass: number = 0;
  invRollInertia: number = 0;
  invPitchInertia: number = 0;
  invWorldInertia: Float64Array = new Float64Array(9);

  // ── Damping / CCD ────────────────────────────────────────────────────
  damping: number = 0;
  angularDamping: number = 0;
  zDamping: number = 0;
  rollPitchDamping: number = 0;
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
    this._angle = options.angle ?? 0;
    this.z = options.z ?? 0;

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
        this.angularVelocity3[2] = options.angularVelocity;
      }
      this.zVelocity = options.zVelocity ?? 0;
      this.damping = options.damping ?? 0;
      this.angularDamping = options.angularDamping ?? 0;
      this.zDamping = clamp(options.zDamping ?? 0, 0, 1);
      this.rollPitchDamping = clamp(options.rollPitchDamping ?? 0, 0, 1);
      this.ccdSpeedThreshold = options.ccdSpeedThreshold ?? -1;
      this.ccdIterations = options.ccdIterations ?? 10;

      // Z-axis mass applies to any 3D body (pm3d and rigid3d) — without this,
      // invZMass stays 0 and the body never responds to Z forces/constraints.
      if (options.shape === "pm3d" || options.shape === "rigid3d") {
        const zMass = options.zMass ?? this.mass;
        this.invZMass = zMass > 0 ? 1 / zMass : 0;
      }

      // Roll/pitch inertia only exists for rigid3d; pm3d has no rotation.
      if (options.shape === "rigid3d") {
        this.invRollInertia =
          options.rollInertia && options.rollInertia > 0
            ? 1 / options.rollInertia
            : 0;
        this.invPitchInertia =
          options.pitchInertia && options.pitchInertia > 0
            ? 1 / options.pitchInertia
            : 0;
      }

      // Initialize invMass / invInertia / invWorldInertia from mass (and from
      // shapes if any were added pre-construction). Callers typically add
      // shapes after construction; addShape re-runs this.
      updateMassPropertiesSystem(this);
    } else if (options.motion === "kinematic") {
      if (options.velocity) {
        this.velocity.set(options.velocity);
      }
      if (options.angularVelocity !== undefined) {
        this.angularVelocity3[2] = options.angularVelocity;
      }
    }

    // Sync orientation matrix from initial yaw for rigid3d bodies.
    if (this.shape === "rigid3d" && this._angle !== 0) {
      this._syncOrientationFromAngle();
    }
  }

  // ── Accessors that proxy into backing arrays/fields ──────────────────

  get angle(): number {
    return this._angle;
  }
  set angle(value: number) {
    this._angle = value;
    // Rigid3D keeps a full orientation matrix; sync its yaw component.
    if (this.shape === "rigid3d") {
      this._syncOrientationFromAngle();
    }
  }

  get angularVelocity(): number {
    return this.angularVelocity3[2];
  }
  set angularVelocity(value: number) {
    this.angularVelocity3[2] = value;
  }

  get angularForce(): number {
    return this.angularForce3[2];
  }
  set angularForce(value: number) {
    this.angularForce3[2] = value;
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

  // ── Pure transforms (2D) ─────────────────────────────────────────────

  toLocalFrame(worldPoint: V2d): V2d {
    return worldPoint.toLocalFrame(this.position, this._angle);
  }

  toWorldFrame(localPoint: V2d): V2d {
    return localPoint.toGlobalFrame(this.position, this._angle);
  }

  vectorToLocalFrame(worldVector: V2d): V2d {
    return worldVector.rotate(-this._angle);
  }

  vectorToWorldFrame(localVector: V2d): V2d {
    return localVector.rotate(this._angle);
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
      .toLocalFrame(this.position, this._angle)
      .icrossVZ(this.angularVelocity)
      .imul(-1)
      .iadd(this.velocity);
  }

  // ── Pure transforms (3D) ─────────────────────────────────────────────

  /**
   * World Z-height of a body-local 3D point. Uses the orientation matrix
   * directly — valid for every shape because the matrix is always allocated
   * (identity for non-rigid3d bodies, meaning localZ passes through).
   */
  worldZ(localX: number, localY: number, localZ: number): number {
    const R = this.orientation;
    return R[6] * localX + R[7] * localY + R[8] * localZ + this.z;
  }

  toWorldFrame3D(point: CompatibleVector3, out?: V3d): V3d;
  toWorldFrame3D(
    localX: number,
    localY: number,
    localZ: number,
    out?: V3d,
  ): V3d;
  toWorldFrame3D(
    localXOrPoint: number | CompatibleVector3,
    localYOrOut?: number | V3d,
    localZ?: number,
    out?: V3d,
  ): V3d {
    let lx: number, ly: number, lz: number;
    let target: V3d | undefined;
    if (typeof localXOrPoint === "number") {
      lx = localXOrPoint;
      ly = localYOrOut as number;
      lz = localZ!;
      target = out;
    } else {
      lx = localXOrPoint[0];
      ly = localXOrPoint[1];
      lz = localXOrPoint[2];
      target = localYOrOut as V3d | undefined;
    }
    const R = this.orientation;
    const wx = R[0] * lx + R[1] * ly + R[2] * lz + this.position[0];
    const wy = R[3] * lx + R[4] * ly + R[5] * lz + this.position[1];
    const wz = R[6] * lx + R[7] * ly + R[8] * lz + this.z;
    if (target) {
      return target.set(wx, wy, wz);
    }
    return new V3d(wx, wy, wz);
  }

  toLocalFrame3D(point: CompatibleVector3): V3d;
  toLocalFrame3D(worldX: number, worldY: number, worldZ: number): V3d;
  toLocalFrame3D(
    worldXOrPoint: number | CompatibleVector3,
    worldY?: number,
    worldZ?: number,
  ): V3d {
    let wx: number, wy: number, wz: number;
    if (typeof worldXOrPoint === "number") {
      wx = worldXOrPoint;
      wy = worldY!;
      wz = worldZ!;
    } else {
      wx = worldXOrPoint[0];
      wy = worldXOrPoint[1];
      wz = worldXOrPoint[2];
    }
    const R = this.orientation;
    const dx = wx - this.position[0];
    const dy = wy - this.position[1];
    const dz = wz - this.z;
    return new V3d(
      R[0] * dx + R[3] * dy + R[6] * dz,
      R[1] * dx + R[4] * dy + R[7] * dz,
      R[2] * dx + R[5] * dy + R[8] * dz,
    );
  }

  zParallaxX(z: number): number {
    return this.orientation[2] * z;
  }

  zParallaxY(z: number): number {
    return this.orientation[5] * z;
  }

  // ── Legacy-compat convenience getters ────────────────────────────────

  /** True for rigid3d bodies; the solver reads this to pick integration paths. */
  get is6DOF(): boolean {
    return this.shape === "rigid3d";
  }

  /** True for point-mass shapes (pm2d / pm3d): rotation is not simulated. */
  get fixedRotation(): boolean {
    return this.shape === "pm2d" || this.shape === "pm3d";
  }

  /** Inverse Z-axis mass (alias of invZMass). */
  get invMassZ(): number {
    return this.invZMass;
  }

  /** Roll angle extracted from orientation matrix. */
  get roll(): number {
    const R = this.orientation;
    return Math.atan2(-R[7], R[8]);
  }

  /** Pitch angle extracted from orientation matrix. */
  get pitch(): number {
    const R = this.orientation;
    return Math.atan2(R[6], Math.sqrt(R[0] * R[0] + R[3] * R[3]));
  }

  get rollVelocity(): number {
    const R = this.orientation;
    const w = this.angularVelocity3;
    return R[0] * w[0] + R[3] * w[1] + R[6] * w[2];
  }

  get pitchVelocity(): number {
    const R = this.orientation;
    const w = this.angularVelocity3;
    return R[1] * w[0] + R[4] * w[1] + R[7] * w[2];
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

  applyForce3D(force: CompatibleVector3, localPoint: CompatibleVector3): this;
  applyForce3D(
    fx: number,
    fy: number,
    fz: number,
    localX: number,
    localY: number,
    localZ: number,
  ): this;
  applyForce3D(
    fxOrForce: number | CompatibleVector3,
    fyOrLocalPoint: number | CompatibleVector3,
    fz?: number,
    localX?: number,
    localY?: number,
    localZ?: number,
  ): this {
    if (typeof fxOrForce === "number") {
      applyForce3DSystem(
        this,
        fxOrForce,
        fyOrLocalPoint as number,
        fz!,
        localX!,
        localY!,
        localZ!,
      );
    } else {
      applyForce3DSystem(this, fxOrForce, fyOrLocalPoint as CompatibleVector3);
    }
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

  recomputeWorldInertia(): void {
    recomputeWorldInertiaSystem(this);
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
      case "pm3d":
        integrateVelocityPointMass3D(this, dt);
        break;
      case "rigid3d":
        integrateVelocityRigid3D(this, dt);
        break;
    }
  }

  integratePosition(dt: number): void {
    if (this.motion === "static") return;
    if (this.motion === "kinematic") {
      this.position[0] += this.velocity[0] * dt;
      this.position[1] += this.velocity[1] * dt;
      if (this.shape === "rigid2d" || this.shape === "rigid3d") {
        this.angle = this.angle + this.angularVelocity3[2] * dt;
      }
      if (this.shape === "pm3d" || this.shape === "rigid3d") {
        this.z += this.zVelocity * dt;
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
      case "pm3d":
        integratePositionPointMass3D(this, dt, this.world);
        break;
      case "rigid3d":
        integratePositionRigid3D(this, dt, this.world);
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
      case "pm3d":
        applyDampingPointMass3D(this, dt);
        break;
      case "rigid3d":
        applyDampingRigid3D(this, dt);
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

  // ── Private helpers ──────────────────────────────────────────────────

  /** Update the 2D yaw submatrix of the orientation matrix from `_angle`. */
  private _syncOrientationFromAngle(): void {
    const c = Math.cos(this._angle);
    const s = Math.sin(this._angle);
    const R = this.orientation;
    R[0] = c;
    R[1] = -s;
    R[3] = s;
    R[4] = c;
    // z-row/column left as identity for rigid3d; roll/pitch integration writes
    // them later.
  }
}
