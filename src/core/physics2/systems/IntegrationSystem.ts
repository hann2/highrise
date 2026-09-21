import { integrateToTimeOfImpact, type CCDConfig } from "../body/ccdUtils";
import type { Body } from "../body/Body";
import type { World } from "../world/World";
import { updateAABB } from "./AABBSystem";
import { setZeroForce } from "./ForceSystem";

// Module-level scratch CCD config so `integratePosition` doesn't allocate an
// options object on every body every substep when CCD is enabled. CCD runs
// synchronously within a single body's integration; reuse is safe.
const ccdConfigScratch: CCDConfig & {
  set(threshold: number, iterations: number): CCDConfig;
} = {
  ccdSpeedThreshold: 0,
  ccdIterations: 0,
  set(threshold: number, iterations: number) {
    this.ccdSpeedThreshold = threshold;
    this.ccdIterations = iterations;
    return this;
  },
};

// Adapter shim so the existing `integrateToTimeOfImpact` helper — which
// expects a CCDBodyState with `fixedRotation` and `updateAABB()` — can run
// against a Body. Shape "pm2d" / "pm3d" are treated as fixedRotation.
const ccdBodyAdapter: {
  body: Body | null;
  readonly velocity: { x: number; y: number; squaredMagnitude: number };
  readonly angularVelocity: number;
  position: Body["position"] | null;
  angle: number;
  readonly fixedRotation: boolean;
  readonly aabb: Body["aabb"] | null;
  updateAABB(): void;
} = {
  body: null,
  get velocity() {
    return this.body!.velocity;
  },
  get angularVelocity() {
    return this.body!.angularVelocity;
  },
  get position() {
    return this.body!.position;
  },
  set position(_v) {
    /* never assigned whole — positions are mutated in place */
  },
  get angle() {
    return this.body!.angle;
  },
  set angle(v: number) {
    this.body!.angle = v;
  },
  get fixedRotation() {
    const s = this.body!.shape;
    return s === "pm2d" || s === "pm3d";
  },
  get aabb() {
    return this.body!.aabb;
  },
  updateAABB() {
    updateAABB(this.body!);
  },
};

// ─── Velocity integration ─────────────────────────────────────────────────

/** 2D point mass: linear only. */
export function integrateVelocityPointMass2D(body: Body, dt: number): void {
  const f = body.force;
  const v = body.velocity;
  body._skipPositionThisStep = false;

  if (!isFinite(f.x) || !isFinite(f.y)) {
    f.x = 0;
    f.y = 0;
    v.x = 0;
    v.y = 0;
    body._skipPositionThisStep = true;
    return;
  }

  const minv = body.invMass;
  v.x += f.x * minv * dt;
  v.y += f.y * minv * dt;

  if (!isFinite(v.x) || !isFinite(v.y)) {
    console.error(`Body "${body.id}": NaN in integrate, resetting.`);
    v.x = 0;
    v.y = 0;
    body._skipPositionThisStep = true;
    return;
  }

  setZeroForce(body);
}

/** 2D rigid: linear + scalar yaw. */
export function integrateVelocityRigid2D(body: Body, dt: number): void {
  const f = body.force;
  const v = body.velocity;
  body._skipPositionThisStep = false;

  if (!isFinite(f.x) || !isFinite(f.y)) {
    f.x = 0;
    f.y = 0;
    v.x = 0;
    v.y = 0;
    body.angularVelocity3[2] = 0;
    body.angularForce3[2] = 0;
    body._skipPositionThisStep = true;
    return;
  }

  const minv = body.invMass;
  v.x += f.x * minv * dt;
  v.y += f.y * minv * dt;

  body.angularVelocity3[2] += body.angularForce3[2] * body.invInertia * dt;

  if (!isFinite(v.x) || !isFinite(v.y) || !isFinite(body.angularVelocity3[2])) {
    console.error(`Body "${body.id}": NaN in integrate, resetting.`);
    v.x = 0;
    v.y = 0;
    body.angularVelocity3[2] = 0;
    body._skipPositionThisStep = true;
    return;
  }

  setZeroForce(body);
}

/** 3D point mass: linear XY + z. */
export function integrateVelocityPointMass3D(body: Body, dt: number): void {
  const f = body.force;
  const v = body.velocity;
  body._skipPositionThisStep = false;

  if (!isFinite(f.x) || !isFinite(f.y) || !isFinite(body.zForce)) {
    f.x = 0;
    f.y = 0;
    v.x = 0;
    v.y = 0;
    body.zForce = 0;
    body.zVelocity = 0;
    body._skipPositionThisStep = true;
    return;
  }

  const minv = body.invMass;
  v.x += f.x * minv * dt;
  v.y += f.y * minv * dt;
  body.zVelocity += body.zForce * body.invZMass * dt;

  if (!isFinite(v.x) || !isFinite(v.y) || !isFinite(body.zVelocity)) {
    console.error(`Body "${body.id}": NaN in integrate, resetting.`);
    v.x = 0;
    v.y = 0;
    body.zVelocity = 0;
    body._skipPositionThisStep = true;
    return;
  }

  setZeroForce(body);
}

/** 3D rigid: linear XYZ + full 3D angular via world-inertia tensor. */
export function integrateVelocityRigid3D(body: Body, dt: number): void {
  const f = body.force;
  const v = body.velocity;
  body._skipPositionThisStep = false;

  if (!isFinite(f.x) || !isFinite(f.y)) {
    f.x = 0;
    f.y = 0;
    v.x = 0;
    v.y = 0;
    body.angularVelocity3[0] = 0;
    body.angularVelocity3[1] = 0;
    body.angularVelocity3[2] = 0;
    body.zVelocity = 0;
    body.zForce = 0;
    body.angularForce3[0] = 0;
    body.angularForce3[1] = 0;
    body.angularForce3[2] = 0;
    body._skipPositionThisStep = true;
    return;
  }

  const minv = body.invMass;
  v.x += f.x * minv * dt;
  v.y += f.y * minv * dt;

  const iI = body.invWorldInertia;
  const tf = body.angularForce3;
  body.angularVelocity3[0] +=
    (iI[0] * tf[0] + iI[1] * tf[1] + iI[2] * tf[2]) * dt;
  body.angularVelocity3[1] +=
    (iI[3] * tf[0] + iI[4] * tf[1] + iI[5] * tf[2]) * dt;
  body.angularVelocity3[2] +=
    (iI[6] * tf[0] + iI[7] * tf[1] + iI[8] * tf[2]) * dt;

  body.zVelocity += body.zForce * body.invZMass * dt;

  if (
    !isFinite(v.x) ||
    !isFinite(v.y) ||
    !isFinite(body.zVelocity) ||
    !isFinite(body.angularVelocity3[0]) ||
    !isFinite(body.angularVelocity3[1]) ||
    !isFinite(body.angularVelocity3[2])
  ) {
    console.error(`Body "${body.id}": NaN in integrate, resetting.`);
    v.x = 0;
    v.y = 0;
    body.zVelocity = 0;
    body.angularVelocity3[0] = 0;
    body.angularVelocity3[1] = 0;
    body.angularVelocity3[2] = 0;
    body._skipPositionThisStep = true;
    return;
  }

  setZeroForce(body);
}

/**
 * Top-level velocity integration driver. Iterates any bag of bodies and
 * dispatches to the shape-specialized inner loop. Only dynamic bodies
 * integrate velocity; static/kinematic are skipped.
 */
export function integrateVelocities(bodies: Iterable<Body>, dt: number): void {
  for (const body of bodies) {
    if (body.motion !== "dynamic") continue;
    switch (body.shape) {
      case "pm2d":
        integrateVelocityPointMass2D(body, dt);
        break;
      case "rigid2d":
        integrateVelocityRigid2D(body, dt);
        break;
      case "pm3d":
        integrateVelocityPointMass3D(body, dt);
        break;
      case "rigid3d":
        integrateVelocityRigid3D(body, dt);
        break;
    }
  }
}

// ─── Position integration ─────────────────────────────────────────────────

/** Attempt CCD for a 2D-moving body; returns true if CCD consumed the step. */
function tryCCD(body: Body, world: World | null, dt: number): boolean {
  if (!world || body.ccdSpeedThreshold < 0) return false;
  ccdBodyAdapter.body = body;
  const applied = integrateToTimeOfImpact(
    ccdBodyAdapter as unknown as import("../body/ccdUtils").CCDBodyState,
    body,
    ccdConfigScratch.set(body.ccdSpeedThreshold, body.ccdIterations),
    world,
    dt,
  );
  ccdBodyAdapter.body = null;
  return applied;
}

export function integratePositionPointMass2D(
  body: Body,
  dt: number,
  world: World | null,
): void {
  if (body._skipPositionThisStep) {
    body._skipPositionThisStep = false;
    return;
  }
  if (!tryCCD(body, world, dt)) {
    body.position[0] += body.velocity[0] * dt;
    body.position[1] += body.velocity[1] * dt;
  }
  body.aabbNeedsUpdate = true;
}

export function integratePositionRigid2D(
  body: Body,
  dt: number,
  world: World | null,
): void {
  if (body._skipPositionThisStep) {
    body._skipPositionThisStep = false;
    return;
  }
  if (!tryCCD(body, world, dt)) {
    body.position[0] += body.velocity[0] * dt;
    body.position[1] += body.velocity[1] * dt;
    body.angle = body.angle + body.angularVelocity3[2] * dt;
  }
  body.aabbNeedsUpdate = true;
}

export function integratePositionPointMass3D(
  body: Body,
  dt: number,
  world: World | null,
): void {
  if (body._skipPositionThisStep) {
    body._skipPositionThisStep = false;
    return;
  }
  if (!tryCCD(body, world, dt)) {
    body.position[0] += body.velocity[0] * dt;
    body.position[1] += body.velocity[1] * dt;
    body.z += body.zVelocity * dt;
  }
  body.aabbNeedsUpdate = true;
}

export function integratePositionRigid3D(
  body: Body,
  dt: number,
  world: World | null,
): void {
  if (body._skipPositionThisStep) {
    body._skipPositionThisStep = false;
    return;
  }
  if (!tryCCD(body, world, dt)) {
    body.position[0] += body.velocity[0] * dt;
    body.position[1] += body.velocity[1] * dt;
    body.z += body.zVelocity * dt;
    integrateOrientation(body, dt);
    // Extract yaw directly; _angle is the backing field via the setter, but
    // writing to `angle` would re-sync the matrix we just integrated. Use
    // the backing field on Body.
    body._angle = Math.atan2(body.orientation[3], body.orientation[0]);
  }
  body.aabbNeedsUpdate = true;
}

/** Kinematic bodies advance their position using externally-set velocity. */
function integratePositionKinematic(body: Body, dt: number): void {
  body.position[0] += body.velocity[0] * dt;
  body.position[1] += body.velocity[1] * dt;
  if (body.shape === "rigid2d" || body.shape === "rigid3d") {
    body.angle = body.angle + body.angularVelocity3[2] * dt;
  }
  if (body.shape === "pm3d" || body.shape === "rigid3d") {
    body.z += body.zVelocity * dt;
  }
  body.aabbNeedsUpdate = true;
}

/**
 * Top-level position integration driver. Iterates any bag of bodies and
 * dispatches per shape. Dynamic bodies use force-driven velocity (with CCD);
 * kinematic bodies use externally-set velocity; static bodies skip.
 */
export function integratePositions(
  bodies: Iterable<Body>,
  dt: number,
  world: World | null,
): void {
  for (const body of bodies) {
    if (body.motion === "static") continue;
    if (body.motion === "kinematic") {
      integratePositionKinematic(body, dt);
      continue;
    }
    switch (body.shape) {
      case "pm2d":
        integratePositionPointMass2D(body, dt, world);
        break;
      case "rigid2d":
        integratePositionRigid2D(body, dt, world);
        break;
      case "pm3d":
        integratePositionPointMass3D(body, dt, world);
        break;
      case "rigid3d":
        integratePositionRigid3D(body, dt, world);
        break;
    }
  }
}

// ─── Rigid3D orientation helpers ──────────────────────────────────────────

/**
 * Advance the 3x3 rotation matrix via Rodrigues exponential map:
 * R_new = exp(skew(ω·dt)) · R_old. Exact for constant ω over the step.
 */
function integrateOrientation(body: Body, dt: number): void {
  const R = body.orientation;
  const vx = body.angularVelocity3[0] * dt;
  const vy = body.angularVelocity3[1] * dt;
  const vz = body.angularVelocity3[2] * dt;
  const theta2 = vx * vx + vy * vy + vz * vz;

  let s: number;
  let c: number;
  if (theta2 < 1e-8) {
    s = 1 - theta2 / 6;
    c = 0.5 - theta2 / 24;
  } else {
    const theta = Math.sqrt(theta2);
    s = Math.sin(theta) / theta;
    c = (1 - Math.cos(theta)) / theta2;
  }

  const e00 = 1 + c * (-vy * vy - vz * vz);
  const e01 = -s * vz + c * vx * vy;
  const e02 = s * vy + c * vx * vz;
  const e10 = s * vz + c * vx * vy;
  const e11 = 1 + c * (-vx * vx - vz * vz);
  const e12 = -s * vx + c * vy * vz;
  const e20 = -s * vy + c * vx * vz;
  const e21 = s * vx + c * vy * vz;
  const e22 = 1 + c * (-vx * vx - vy * vy);

  const r00 = R[0],
    r01 = R[1],
    r02 = R[2];
  const r10 = R[3],
    r11 = R[4],
    r12 = R[5];
  const r20 = R[6],
    r21 = R[7],
    r22 = R[8];

  R[0] = e00 * r00 + e01 * r10 + e02 * r20;
  R[1] = e00 * r01 + e01 * r11 + e02 * r21;
  R[2] = e00 * r02 + e01 * r12 + e02 * r22;
  R[3] = e10 * r00 + e11 * r10 + e12 * r20;
  R[4] = e10 * r01 + e11 * r11 + e12 * r21;
  R[5] = e10 * r02 + e11 * r12 + e12 * r22;
  R[6] = e20 * r00 + e21 * r10 + e22 * r20;
  R[7] = e20 * r01 + e21 * r11 + e22 * r21;
  R[8] = e20 * r02 + e21 * r12 + e22 * r22;

  orthogonalizeOrientation(R);
}

/**
 * Gram-Schmidt re-orthogonalization of a rotation matrix (row-major).
 * Guards against long-term numerical drift.
 */
function orthogonalizeOrientation(R: Float64Array): void {
  let len = Math.sqrt(R[0] * R[0] + R[1] * R[1] + R[2] * R[2]);
  if (len > 0) {
    R[0] /= len;
    R[1] /= len;
    R[2] /= len;
  }
  let dot = R[3] * R[0] + R[4] * R[1] + R[5] * R[2];
  R[3] -= dot * R[0];
  R[4] -= dot * R[1];
  R[5] -= dot * R[2];
  len = Math.sqrt(R[3] * R[3] + R[4] * R[4] + R[5] * R[5]);
  if (len > 0) {
    R[3] /= len;
    R[4] /= len;
    R[5] /= len;
  }
  R[6] = R[1] * R[5] - R[2] * R[4];
  R[7] = R[2] * R[3] - R[0] * R[5];
  R[8] = R[0] * R[4] - R[1] * R[3];
}
