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
 * Only checks fields appropriate to the body's shape — roll/pitch/z fields
 * are ignored for 2D shapes.
 */
export function assertBodyFinite(body: Body, stage: string): void {
  const v = body.velocity;
  const f = body.force;
  const p = body.position;
  const av = body.angularVelocity3;
  const af = body.angularForce3;

  let bad: string | null = null;

  if (!isFinite(p[0]) || !isFinite(p[1])) bad = `position [${p[0]}, ${p[1]}]`;
  else if (!isFinite(v.x) || !isFinite(v.y)) bad = `velocity [${v.x}, ${v.y}]`;
  else if (!isFinite(f.x) || !isFinite(f.y)) bad = `force [${f.x}, ${f.y}]`;
  else if (!isFinite(body._angle)) bad = `angle ${body._angle}`;

  if (!bad && (body.shape === "pm3d" || body.shape === "rigid3d")) {
    if (!isFinite(body.z)) bad = `z ${body.z}`;
    else if (!isFinite(body.zVelocity)) bad = `zVelocity ${body.zVelocity}`;
    else if (!isFinite(body.zForce)) bad = `zForce ${body.zForce}`;
  }

  if (!bad && (body.shape === "rigid2d" || body.shape === "rigid3d")) {
    if (!isFinite(av[2]) || !isFinite(af[2])) {
      bad = `angularVelocity/Force z [${av[2]}, ${af[2]}]`;
    }
  }

  if (!bad && body.shape === "rigid3d") {
    if (!isFinite(av[0]) || !isFinite(av[1])) {
      bad = `angularVelocity roll/pitch [${av[0]}, ${av[1]}]`;
    } else if (!isFinite(af[0]) || !isFinite(af[1])) {
      bad = `angularForce roll/pitch [${af[0]}, ${af[1]}]`;
    } else {
      const R = body.orientation;
      for (let i = 0; i < 9; i++) {
        if (!isFinite(R[i])) {
          bad = `orientation[${i}] ${R[i]}`;
          break;
        }
      }
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
