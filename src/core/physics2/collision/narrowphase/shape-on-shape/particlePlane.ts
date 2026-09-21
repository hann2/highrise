import { V, V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Shape } from "../../../shapes/Shape";
import { CollisionResult, createCollisionResult } from "../../CollisionResult";

const yAxis = V(0, 1);

// Scratch vectors to avoid per-call allocations
const _particleToPlane = V();
const _planeNormal = V();
const _projectionOffset = V();
const _contactOnPlane = V();

/** Particle/Plane collision */
export function particlePlane(
  bodyA: Body,
  _shapeA: Shape,
  offsetA: V2d,
  _angleA: number,
  bodyB: Body,
  _shapeB: Shape,
  offsetB: V2d,
  angleB: number,
  justTest: boolean,
): CollisionResult | null {
  // Note: bodyA is particle, bodyB is plane
  _particleToPlane.set(offsetA).isub(offsetB);
  _planeNormal.set(yAxis).irotate(angleB);

  const distance = _particleToPlane.dot(_planeNormal);

  if (distance > 0) {
    return null;
  }

  if (justTest) {
    return createCollisionResult();
  }

  // Project particle onto plane
  _projectionOffset.set(_planeNormal).imul(distance);
  _contactOnPlane.set(offsetA).isub(_projectionOffset);

  const result = createCollisionResult();
  // Note: Normal points out of plane (bodyB), so we need to flip for bodyA
  result.contacts.push({
    worldContactA: V(offsetA).isub(bodyA.position),
    worldContactB: V(_contactOnPlane).isub(bodyB.position),
    normal: V(_planeNormal).imul(-1), // Normal from particle towards plane
    depth: -distance,
  });

  return result;
}
