import type { V2d } from "../../Vector";
import type { Body } from "../body/Body";

/**
 * Apply a world-frame force at an optional world-frame relative point.
 * For rigid bodies, the tangential component contributes torque via the
 * scalar cross product. Point masses ignore the relativePoint.
 */
export function applyForce(
  body: Body,
  force: V2d,
  relativeWorldPoint?: V2d,
): void {
  if (!isFinite(force.x) || !isFinite(force.y)) {
    console.trace(`applyForce NaN on body "${body.id}":`, force.x, force.y);
    return;
  }
  body.force.iadd(force);

  if (relativeWorldPoint && body.shape === "rigid2d") {
    const rotForce = relativeWorldPoint.crossLength(force);
    body.angularForce += rotForce;
  }
}

/**
 * Apply a body-local force at an optional body-local point; transforms to
 * world frame then delegates to {@link applyForce}.
 */
export function applyForceLocal(
  body: Body,
  localForce: V2d,
  localPoint?: V2d,
): void {
  const worldForce = body.vectorToWorldFrame(localForce);
  const worldPoint = localPoint
    ? body.vectorToWorldFrame(localPoint)
    : undefined;
  applyForce(body, worldForce, worldPoint);
}

/**
 * Apply an impulse (instantaneous velocity change). For rigid bodies, an
 * optional relative world-frame point contributes angular velocity.
 */
export function applyImpulse(
  body: Body,
  impulse: V2d,
  relativeWorldPoint?: V2d,
): void {
  body.velocity.x += impulse.x * body.invMass;
  body.velocity.y += impulse.y * body.invMass;

  if (relativeWorldPoint && body.shape === "rigid2d") {
    const rotVelo = relativeWorldPoint.crossLength(impulse) * body.invInertia;
    body.angularVelocity += rotVelo;
  }
}

/**
 * Apply an impulse in body-local frame at a body-local point.
 */
export function applyImpulseLocal(
  body: Body,
  localImpulse: V2d,
  localPoint?: V2d,
): void {
  const worldImpulse = body.vectorToWorldFrame(localImpulse);
  const worldPoint = localPoint
    ? body.vectorToWorldFrame(localPoint)
    : undefined;
  applyImpulse(body, worldImpulse, worldPoint);
}

/** Zero out the force and torque accumulators. */
export function setZeroForce(body: Body): void {
  body.force.x = 0;
  body.force.y = 0;
  body.angularForce = 0;
}
