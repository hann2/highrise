import { V, V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Circle } from "../../../shapes/Circle";
import { CollisionResult, createCollisionResult } from "../../CollisionResult";

// Scratch vectors to avoid per-call allocations
const _centerDiff = V();
const _normal = V();
const _contactOnA = V();
const _contactOnB = V();

/** Circle/Circle collision */
export function circleCircle(
  bodyA: Body,
  shapeA: Circle,
  offsetA: V2d,
  _angleA: number,
  bodyB: Body,
  shapeB: Circle,
  offsetB: V2d,
  _angleB: number,
  justTest: boolean,
  radiusA?: number,
  radiusB?: number,
): CollisionResult | null {
  const circleA = shapeA as Circle;
  const circleB = shapeB as Circle;
  const rA = radiusA ?? circleA.radius;
  const rB = radiusB ?? circleB.radius;

  _centerDiff.set(offsetA).isub(offsetB);
  const radiusSum = rA + rB;

  if (_centerDiff.squaredMagnitude > radiusSum * radiusSum) {
    return null;
  }

  if (justTest) {
    return createCollisionResult();
  }

  // Compute normal from A to B
  _normal.set(offsetB).isub(offsetA).inormalize();

  // Contact point on circle A surface (world space)
  _contactOnA.set(_normal).imul(rA).iadd(offsetA);
  // Contact point on circle B surface (world space)
  _contactOnB.set(_normal).imul(-rB).iadd(offsetB);

  const result = createCollisionResult();
  result.contacts.push({
    worldContactA: V(_contactOnA).isub(bodyA.position),
    worldContactB: V(_contactOnB).isub(bodyB.position),
    normal: V(_normal),
    depth: radiusSum - _centerDiff.magnitude,
  });

  return result;
}
