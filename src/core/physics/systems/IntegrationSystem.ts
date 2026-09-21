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
// against a Body. Point masses ("pm2d") are treated as fixedRotation.
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
    return this.body!.shape === "pm2d";
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

/** 2D rigid: linear + angular. */
export function integrateVelocityRigid2D(body: Body, dt: number): void {
  const f = body.force;
  const v = body.velocity;
  body._skipPositionThisStep = false;

  if (!isFinite(f.x) || !isFinite(f.y)) {
    f.x = 0;
    f.y = 0;
    v.x = 0;
    v.y = 0;
    body.angularVelocity = 0;
    body.angularForce = 0;
    body._skipPositionThisStep = true;
    return;
  }

  const minv = body.invMass;
  v.x += f.x * minv * dt;
  v.y += f.y * minv * dt;

  body.angularVelocity += body.angularForce * body.invInertia * dt;

  if (!isFinite(v.x) || !isFinite(v.y) || !isFinite(body.angularVelocity)) {
    console.error(`Body "${body.id}": NaN in integrate, resetting.`);
    v.x = 0;
    v.y = 0;
    body.angularVelocity = 0;
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
    }
  }
}

// ─── Position integration ─────────────────────────────────────────────────

/** Attempt CCD for a moving body; returns true if CCD consumed the step. */
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
    body.angle += body.angularVelocity * dt;
  }
  body.aabbNeedsUpdate = true;
}

/** Kinematic bodies advance their position using externally-set velocity. */
function integratePositionKinematic(body: Body, dt: number): void {
  body.position[0] += body.velocity[0] * dt;
  body.position[1] += body.velocity[1] * dt;
  if (body.shape === "rigid2d") {
    body.angle += body.angularVelocity * dt;
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
    }
  }
}
