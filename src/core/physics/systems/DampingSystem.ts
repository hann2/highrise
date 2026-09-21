import type { Body } from "../body/Body";

/**
 * Compute `(1 - damping) ^ dt` with damping clamped to [0, 1].
 *
 * Unclamped damping is a NaN risk: `Math.pow(negative, non-integer)` is NaN,
 * so a rogue `body.damping = 1.5` would produce NaN velocities on the very
 * next step. Clamping here makes damping robust against bad game-code input
 * without silently hiding the bug elsewhere.
 */
function dampingFactor(damping: number, dt: number): number {
  if (damping <= 0) return 1;
  if (damping >= 1) return 0;
  return Math.pow(1 - damping, dt);
}

/** Apply linear damping to a 2D point mass. */
export function applyDampingPointMass2D(body: Body, dt: number): void {
  const f = dampingFactor(body.damping, dt);
  body.velocity.x *= f;
  body.velocity.y *= f;
}

/** Apply linear + angular damping to a 2D rigid body. */
export function applyDampingRigid2D(body: Body, dt: number): void {
  const lf = dampingFactor(body.damping, dt);
  body.velocity.x *= lf;
  body.velocity.y *= lf;
  body.angularVelocity *= dampingFactor(body.angularDamping, dt);
}

/**
 * Top-level driver. Iterate an arbitrary bag of bodies and dispatch damping
 * by shape. Filters to dynamic bodies; static and kinematic bodies never
 * damp.
 */
export function applyDamping(bodies: Iterable<Body>, dt: number): void {
  for (const body of bodies) {
    if (body.motion !== "dynamic") continue;
    switch (body.shape) {
      case "pm2d":
        applyDampingPointMass2D(body, dt);
        break;
      case "rigid2d":
        applyDampingRigid2D(body, dt);
        break;
    }
  }
}
