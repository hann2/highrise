import { V, V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Circle } from "../../../shapes/Circle";
import { Plane } from "../../../shapes/Plane";
import { CollisionResult, createCollisionResult } from "../../CollisionResult";

const yAxis = V(0, 1);

// Scratch vectors to avoid per-call allocations
const _circleToPlane = V();
const _planeNormal = V();
const _contactOnCircle = V();
const _projectionOffset = V();
const _contactOnPlane = V();

/** Circle/Plane collision */
export function circlePlane(
  bodyA: Body,
  shapeA: Circle,
  offsetA: V2d,
  _angleA: number,
  bodyB: Body,
  _shapeB: Plane,
  offsetB: V2d,
  angleB: number,
  justTest: boolean,
): CollisionResult | null {
  // Note: bodyA is circle, bodyB is plane
  const circleShape = shapeA as Circle;
  const circleRadius = circleShape.radius;

  _circleToPlane.set(offsetA).isub(offsetB);
  _planeNormal.set(yAxis).irotate(angleB);

  const distance = _circleToPlane.dot(_planeNormal);

  if (distance > circleRadius) {
    return null;
  }

  if (justTest) {
    return createCollisionResult();
  }

  // Contact point on circle surface (towards plane)
  _contactOnCircle.set(_planeNormal).imul(-circleRadius).iadd(offsetA);
  // Contact point on plane
  _projectionOffset.set(_planeNormal).imul(distance);
  _contactOnPlane.set(_circleToPlane).isub(_projectionOffset).iadd(offsetB);

  const result = createCollisionResult();
  result.contacts.push({
    worldContactA: V(_contactOnCircle).isub(bodyA.position),
    worldContactB: V(_contactOnPlane).isub(bodyB.position),
    normal: V(_planeNormal).imul(-1), // Normal from circle towards plane
    depth: circleRadius - distance,
  });

  return result;
}
