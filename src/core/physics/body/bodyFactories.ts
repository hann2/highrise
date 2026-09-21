import type { CompatibleVector } from "../../Vector";
import type {
  DynamicPointMass2D,
  DynamicRigid2D,
  KinematicPointMass2D,
  KinematicRigid2D,
  MotionMode,
  MotionView,
  PointMass2D,
  Rigid2D,
  StaticPointMass2D,
  StaticRigid2D,
} from "./bodyInterfaces";
import { Body } from "./Body";

// ─────────────────────────────────────────────────────────────────────────
// Per-shape option types, narrowed by a `motion` discriminant
// ─────────────────────────────────────────────────────────────────────────

interface BaseOpts {
  position?: CompatibleVector;
  id?: number;
  collisionResponse?: boolean;
}

interface DynamicCommonOpts extends BaseOpts {
  motion: "dynamic";
  mass: number;
  velocity?: CompatibleVector;
  damping?: number;
  allowSleep?: boolean;
  sleepSpeedLimit?: number;
  sleepTimeLimit?: number;
  ccdSpeedThreshold?: number;
  ccdIterations?: number;
}

interface KinematicCommonOpts extends BaseOpts {
  motion: "kinematic";
  velocity?: CompatibleVector;
}

interface StaticCommonOpts extends BaseOpts {
  motion: "static";
}

// ── PointMass2D ──────────────────────────────────────────────────────────

export type PointMass2DOptions<M extends MotionMode = MotionMode> =
  M extends "dynamic"
    ? DynamicCommonOpts
    : M extends "kinematic"
      ? KinematicCommonOpts
      : StaticCommonOpts;

export function createPointMass2D(
  opts: DynamicCommonOpts,
): Body & DynamicPointMass2D;
export function createPointMass2D(
  opts: KinematicCommonOpts,
): Body & KinematicPointMass2D;
export function createPointMass2D(
  opts: StaticCommonOpts,
): Body & StaticPointMass2D;
export function createPointMass2D(
  opts: PointMass2DOptions,
): Body & PointMass2D & MotionView<MotionMode> {
  return new Body({
    shape: "pm2d",
    ...opts,
  } as ConstructorParameters<typeof Body>[0]) as unknown as Body &
    PointMass2D &
    MotionView<MotionMode>;
}

// ── Rigid2D ──────────────────────────────────────────────────────────────

interface Rigid2DDynamicOpts extends DynamicCommonOpts {
  angle?: number;
  angularVelocity?: number;
  angularDamping?: number;
}
interface Rigid2DKinematicOpts extends KinematicCommonOpts {
  angle?: number;
  angularVelocity?: number;
}
interface Rigid2DStaticOpts extends StaticCommonOpts {
  angle?: number;
}

export type Rigid2DOptions<M extends MotionMode = MotionMode> =
  M extends "dynamic"
    ? Rigid2DDynamicOpts
    : M extends "kinematic"
      ? Rigid2DKinematicOpts
      : Rigid2DStaticOpts;

export function createRigid2D(opts: Rigid2DDynamicOpts): Body & DynamicRigid2D;
export function createRigid2D(
  opts: Rigid2DKinematicOpts,
): Body & KinematicRigid2D;
export function createRigid2D(opts: Rigid2DStaticOpts): Body & StaticRigid2D;
export function createRigid2D(
  opts: Rigid2DOptions,
): Body & Rigid2D & MotionView<MotionMode> {
  return new Body({
    shape: "rigid2d",
    ...opts,
  } as ConstructorParameters<typeof Body>[0]) as unknown as Body &
    Rigid2D &
    MotionView<MotionMode>;
}

// ─────────────────────────────────────────────────────────────────────────
// Convenience aliases for callers that prefer the combined type names
// ─────────────────────────────────────────────────────────────────────────

export type {
  DynamicPointMass2D,
  DynamicRigid2D,
  KinematicPointMass2D,
  KinematicRigid2D,
  StaticPointMass2D,
  StaticRigid2D,
};
