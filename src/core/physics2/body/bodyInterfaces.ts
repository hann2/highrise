import type Entity from "../../entity/Entity";
import type { V2d } from "../../Vector";
import type { AABB } from "../collision/AABB";
import type { PhysicsEventMap } from "../events/PhysicsEvents";
import type { Shape } from "../shapes/Shape";
import type { World } from "../world/World";
import type { SleepState } from "./Body";

/** Discriminant tag for the shape (DOF layout) axis. */
export type BodyShape = "pm2d" | "rigid2d" | "pm3d" | "rigid3d";

/** Discriminant tag for the motion (integration role) axis. */
export type MotionMode = "static" | "kinematic" | "dynamic";

/**
 * Fields and pure-transform methods common to every body, independent of
 * shape or motion. Every shape interface extends this.
 */
export interface BodyBase {
  readonly id: number;
  world: World | null;
  owner?: Entity;
  shapes: Shape[];
  concavePath: V2d[] | null;
  aabb: AABB;
  aabbNeedsUpdate: boolean;
  boundingRadius: number;
  collisionResponse: boolean;
  motion: MotionMode;

  /** @internal */
  _wakeUpAfterNarrowphase: boolean;

  // Pure-transform methods (stay on the runtime class, not in systems).
  toLocalFrame(worldPoint: V2d): V2d;
  toWorldFrame(localPoint: V2d): V2d;
  vectorToLocalFrame(worldVector: V2d): V2d;
  vectorToWorldFrame(localVector: V2d): V2d;
  getVelocityAtPoint(localPoint: V2d): V2d;
  getVelocityAtWorldPoint(worldPoint: V2d): V2d;

  // EventEmitter surface (subset — just what's typed externally).
  emit(event: PhysicsEventMap[keyof PhysicsEventMap]): unknown;
}

// ─────────────────────────────────────────────────────────────────────────
// Shape axis — DOF layout
// ─────────────────────────────────────────────────────────────────────────

/** 2D particle: position + velocity + linear force, no rotation. */
export interface PointMass2D extends BodyBase {
  readonly shape: "pm2d";
  position: V2d;
  velocity: V2d;
  force: V2d;
}

/** 2D rigid body: particle fields plus scalar yaw state. */
export interface Rigid2D extends BodyBase {
  readonly shape: "rigid2d";
  position: V2d;
  velocity: V2d;
  force: V2d;
  angle: number;
  angularVelocity: number;
  angularForce: number;
  inertia: number;
  invInertia: number;
}

/** 3D particle: 2D position plus z, matching velocity/force fields, no rotation. */
export interface PointMass3D extends BodyBase {
  readonly shape: "pm3d";
  position: V2d;
  z: number;
  velocity: V2d;
  zVelocity: number;
  force: V2d;
  zForce: number;
}

/** 3D rigid body: full 6DOF position + orientation matrix + 3D angular state. */
export interface Rigid3D extends BodyBase {
  readonly shape: "rigid3d";
  position: V2d;
  z: number;
  velocity: V2d;
  zVelocity: number;
  force: V2d;
  zForce: number;
  orientation: Float64Array;
  angularVelocity3: Float64Array;
  angularForce3: Float64Array;
  invWorldInertia: Float64Array;
  // Scalar yaw accessors for convenience (backed by orientation / angularVelocity3[2]).
  angle: number;
  angularVelocity: number;
  angularForce: number;
  inertia: number;
  invInertia: number;
}

// ─────────────────────────────────────────────────────────────────────────
// Motion axis — integration role
// ─────────────────────────────────────────────────────────────────────────

/** Static bodies never move. Mass/force fields are not read. */
export interface StaticBodyView {
  readonly motion: "static";
}

/** Kinematic bodies have externally-driven velocity but ignore forces. */
export interface KinematicBodyView {
  readonly motion: "kinematic";
  velocity: V2d;
}

/** Dynamic bodies respond to forces, have mass, and can sleep. */
export interface DynamicBodyView {
  readonly motion: "dynamic";
  mass: number;
  invMass: number;
  damping: number;
  angularDamping: number;
  // Sleep state (only meaningful on dynamic bodies).
  sleepState: SleepState;
  allowSleep: boolean;
  sleepSpeedLimit: number;
  wantsToSleep: boolean;
  idleTime: number;
  timeLastSleepy: number;
  isSleeping(): boolean;
  isAwake(): boolean;
  wakeUp(): unknown;
  sleep(): unknown;
}

// ─────────────────────────────────────────────────────────────────────────
// Shape unions
// ─────────────────────────────────────────────────────────────────────────

export type Body2D = PointMass2D | Rigid2D;
export type Body3D = PointMass3D | Rigid3D;
export type AnyBody = Body2D | Body3D;

// ─────────────────────────────────────────────────────────────────────────
// Combined shape × motion aliases (the 12 product interfaces factories return)
// ─────────────────────────────────────────────────────────────────────────

export type DynamicPointMass2D = PointMass2D & DynamicBodyView;
export type KinematicPointMass2D = PointMass2D & KinematicBodyView;
export type StaticPointMass2D = PointMass2D & StaticBodyView;

export type DynamicRigid2D = Rigid2D & DynamicBodyView;
export type KinematicRigid2D = Rigid2D & KinematicBodyView;
export type StaticRigid2D = Rigid2D & StaticBodyView;

export type DynamicPointMass3D = PointMass3D & DynamicBodyView;
export type KinematicPointMass3D = PointMass3D & KinematicBodyView;
export type StaticPointMass3D = PointMass3D & StaticBodyView;

export type DynamicRigid3D = Rigid3D & DynamicBodyView;
export type KinematicRigid3D = Rigid3D & KinematicBodyView;
export type StaticRigid3D = Rigid3D & StaticBodyView;

/** Helper used by factory return types: maps a MotionMode literal to its view. */
export type MotionView<M extends MotionMode> = M extends "dynamic"
  ? DynamicBodyView
  : M extends "kinematic"
    ? KinematicBodyView
    : StaticBodyView;
