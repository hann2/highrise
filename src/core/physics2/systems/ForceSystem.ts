import type { V2d } from "../../Vector";
import type { CompatibleVector3 } from "../../Vector3";
import type { Body } from "../body/Body";

/**
 * Apply a world-frame force at an optional world-frame relative point.
 * For rigid bodies, the tangential component contributes yaw torque (2D)
 * via the scalar cross product. Point masses ignore the relativePoint.
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

  if (
    relativeWorldPoint &&
    (body.shape === "rigid2d" || body.shape === "rigid3d")
  ) {
    const rotForce = relativeWorldPoint.crossLength(force);
    body.angularForce3[2] += rotForce;
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
 * Apply a 3D force at a body-local 3D point. Only meaningful for rigid3d
 * bodies — other shapes silently ignore the Z and roll/pitch components.
 */
export function applyForce3D(
  body: Body,
  force: CompatibleVector3,
  localPoint: CompatibleVector3,
): void;
export function applyForce3D(
  body: Body,
  fx: number,
  fy: number,
  fz: number,
  localX: number,
  localY: number,
  localZ: number,
): void;
export function applyForce3D(
  body: Body,
  fxOrForce: number | CompatibleVector3,
  fyOrLocalPoint: number | CompatibleVector3,
  fzArg?: number,
  localXArg?: number,
  localYArg?: number,
  localZArg?: number,
): void {
  let fx: number, fy: number, fz: number;
  let localX: number, localY: number, localZ: number;
  if (typeof fxOrForce === "number") {
    fx = fxOrForce;
    fy = fyOrLocalPoint as number;
    fz = fzArg!;
    localX = localXArg!;
    localY = localYArg!;
    localZ = localZArg!;
  } else {
    fx = fxOrForce[0];
    fy = fxOrForce[1];
    fz = fxOrForce[2];
    const lp = fyOrLocalPoint as CompatibleVector3;
    localX = lp[0];
    localY = lp[1];
    localZ = lp[2];
  }
  if (
    !isFinite(fx) ||
    !isFinite(fy) ||
    !isFinite(fz) ||
    !isFinite(localX) ||
    !isFinite(localY) ||
    !isFinite(localZ)
  ) {
    console.trace(`applyForce3D NaN on body "${body.id}":`, {
      fx,
      fy,
      fz,
      localX,
      localY,
      localZ,
    });
    return;
  }

  body.force.x += fx;
  body.force.y += fy;
  body.zForce += fz;

  const R = body.orientation;
  const rx = R[0] * localX + R[1] * localY + R[2] * localZ;
  const ry = R[3] * localX + R[4] * localY + R[5] * localZ;
  const rz = R[6] * localX + R[7] * localY + R[8] * localZ;

  // τ = r × F (world frame)
  body.angularForce3[0] += ry * fz - rz * fy;
  body.angularForce3[1] += rz * fx - rx * fz;
  body.angularForce3[2] += rx * fy - ry * fx;
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

  if (
    relativeWorldPoint &&
    (body.shape === "rigid2d" || body.shape === "rigid3d")
  ) {
    const rotVelo = relativeWorldPoint.crossLength(impulse) * body.invInertia;
    body.angularVelocity3[2] += rotVelo;
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

/**
 * Zero out force, torque (all 3 axes), and z-force accumulators. Safe on any
 * shape — fields it doesn't use are harmless.
 */
export function setZeroForce(body: Body): void {
  body.force.x = 0;
  body.force.y = 0;
  body.angularForce3[0] = 0;
  body.angularForce3[1] = 0;
  body.angularForce3[2] = 0;
  body.zForce = 0;
}
