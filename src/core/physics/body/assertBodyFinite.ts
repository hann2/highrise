import type { Body } from "./Body";

/**
 * When true, the physics World calls `assertBodyFinite` at each phase of
 * `step()` to catch NaN/Infinity values as soon as they appear on a body.
 * Set to `false` to skip the checks entirely in production builds where
 * the overhead (a handful of comparisons per body per substep) is unwanted.
 *
 * The checks are cheap — turn them off only after the physics system has
 * been stable for a long time.
 */
export let PHYSICS_VALIDATE_BODIES = true;

export function setPhysicsValidateBodies(enabled: boolean): void {
  PHYSICS_VALIDATE_BODIES = enabled;
}

/**
 * Throw immediately if any numeric state on `body` is NaN or Infinity.
 * `stage` is included in the error message so the caller can localise
 * which phase of the step introduced the bad value (e.g. "after applyForces").
 *
 * Angular fields are only checked for rigid bodies.
 */
export function assertBodyFinite(body: Body, stage: string): void {
  const v = body.velocity;
  const f = body.force;
  const p = body.position;

  let bad: string | null = null;

  if (!isFinite(p[0]) || !isFinite(p[1])) bad = `position [${p[0]}, ${p[1]}]`;
  else if (!isFinite(v.x) || !isFinite(v.y)) bad = `velocity [${v.x}, ${v.y}]`;
  else if (!isFinite(f.x) || !isFinite(f.y)) bad = `force [${f.x}, ${f.y}]`;
  else if (!isFinite(body.angle)) bad = `angle ${body.angle}`;

  if (!bad && body.shape === "rigid2d") {
    const av = body.angularVelocity;
    const af = body.angularForce;
    if (!isFinite(av) || !isFinite(af)) {
      bad = `angularVelocity/Force [${av}, ${af}]`;
    }
  }

  if (bad !== null) {
    throw new Error(
      `[physics] NaN/Infinity detected on body "${body.id}" (${body.shape}/${body.motion}) ${stage}: ${bad}`,
    );
  }
}

/** Run `assertBodyFinite` over every body in `bodies`. */
export function assertAllBodiesFinite(
  bodies: Iterable<Body>,
  stage: string,
): void {
  if (!PHYSICS_VALIDATE_BODIES) return;
  for (const body of bodies) {
    assertBodyFinite(body, stage);
  }
}
