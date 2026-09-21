import { V, V2d } from "../../Vector";
import type { AABB } from "../collision/AABB";
import type {
  RaycastHit,
  RaycastOptions,
} from "../collision/raycast/RaycastHit";
import type { Body } from "./Body";

/** Configuration for CCD integration. */
export interface CCDConfig {
  /** Speed threshold for enabling CCD. -1 disables CCD. */
  ccdSpeedThreshold: number;
  /** Number of binary search iterations for CCD. */
  ccdIterations: number;
}

/** Mutable body state needed by CCD integration. */
export interface CCDBodyState {
  readonly velocity: V2d;
  readonly angularVelocity: number;
  position: V2d;
  angle: number;
  readonly fixedRotation: boolean;
  readonly aabb: AABB;
  updateAABB(): void;
}

/** World context needed for CCD raycasting and overlap checks. */
export interface CCDWorldContext {
  raycast(from: V2d, to: V2d, options?: RaycastOptions): RaycastHit | null;
  overlapKeeper: {
    bodiesAreOverlapping(bodyA: Body, bodyB: Body): boolean;
  };
}

/**
 * Continuous collision detection integration.
 * Moves the body forward in time, detecting tunneling via raycast and
 * binary searching to find the time of impact.
 *
 * @param body - The body state to integrate (position/angle will be modified)
 * @param self - The body itself (for raycast filtering and overlap checks)
 * @param config - CCD configuration (thresholds, iterations)
 * @param world - World context for raycasting and overlap queries
 * @param dt - Time step
 * @returns true if CCD was applied, false if regular integration should be used
 */
export function integrateToTimeOfImpact(
  body: CCDBodyState,
  self: Body,
  config: CCDConfig,
  world: CCDWorldContext,
  dt: number,
): boolean {
  // Early exit if CCD disabled or velocity below threshold
  if (
    config.ccdSpeedThreshold < 0 ||
    body.velocity.squaredMagnitude < Math.pow(config.ccdSpeedThreshold, 2)
  ) {
    return false;
  }

  const direction = V(body.velocity);
  direction.inormalize();

  const end = V(body.velocity);
  end.imul(dt);
  end.iadd(body.position);

  const startToEnd = V(end);
  startToEnd.isub(body.position);
  const startToEndAngle = body.angularVelocity * dt;
  const len = startToEnd.magnitude;

  // Degenerate case: start == end (zero travel distance despite velocity
  // above threshold — e.g. dt is 0). Nothing to detect, skip CCD.
  if (len === 0) {
    return false;
  }

  let timeOfImpact = 1;

  // Raycast to find potential collision (exclude self)
  const raycastHit = world.raycast(body.position, end, {
    filter: (b) => b !== self,
  });

  if (!raycastHit) {
    return false;
  }

  // Update end point and time of impact based on hit
  end.set(raycastHit.point);
  startToEnd.set(end).isub(body.position);
  timeOfImpact = startToEnd.magnitude / len;

  const hitBody: Body = raycastHit.body;

  const rememberAngle = body.angle;
  const rememberPosition = V(body.position);

  // Binary search for time of impact
  let iter = 0;
  let tmin = 0;
  let tmid = 0;
  let tmax = timeOfImpact;

  while (tmax >= tmin && iter < config.ccdIterations) {
    iter++;

    tmid = (tmax + tmin) / 2;

    const velodt = V(startToEnd);
    velodt.imul(tmid);
    body.position.set(rememberPosition).iadd(velodt);
    body.angle = rememberAngle + startToEndAngle * tmid;
    body.updateAABB();

    const overlaps =
      body.aabb.overlaps(hitBody.aabb) &&
      world.overlapKeeper.bodiesAreOverlapping(self, hitBody);

    if (overlaps) {
      tmin = tmid;
    } else {
      tmax = tmid;
    }
  }

  timeOfImpact = tmid;

  // Restore position/angle
  body.position.set(rememberPosition);
  body.angle = rememberAngle;

  // Move to TOI
  const velodt = V(startToEnd);
  velodt.imul(timeOfImpact);
  body.position.iadd(velodt);
  if (!body.fixedRotation) {
    body.angle += startToEndAngle * timeOfImpact;
  }

  return true;
}
