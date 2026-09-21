import { V, V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Capsule } from "../../../shapes/Capsule";
import { Circle } from "../../../shapes/Circle";
import { Shape } from "../../../shapes/Shape";
import { CollisionResult, createCollisionResult } from "../../CollisionResult";
import { circlePlane } from "./circlePlane";

const tempCircle = new Circle({ radius: 1 });

// Scratch vectors to avoid per-call allocations
const _end1 = V();
const _end2 = V();

/** Plane/Capsule collision */
export function planeCapsule(
  bodyA: Body,
  shapeA: Shape,
  offsetA: V2d,
  angleA: number,
  bodyB: Body,
  shapeB: Shape,
  offsetB: V2d,
  angleB: number,
  justTest: boolean,
): CollisionResult | null {
  // Note: bodyA is plane, bodyB is capsule
  const capsuleShape = shapeB as Capsule;
  const halfLength = capsuleShape.length / 2;

  // Compute world end positions
  _end1.set(-halfLength, 0).itoGlobalFrame(offsetB, angleB);
  _end2.set(halfLength, 0).itoGlobalFrame(offsetB, angleB);

  tempCircle.radius = capsuleShape.radius;

  // Check both ends against the plane
  const result1 = circlePlane(
    bodyB,
    tempCircle,
    _end1,
    0,
    bodyA,
    shapeA,
    offsetA,
    angleA,
    justTest,
  );

  const result2 = circlePlane(
    bodyB,
    tempCircle,
    _end2,
    0,
    bodyA,
    shapeA,
    offsetA,
    angleA,
    justTest,
  );

  if (!result1 && !result2) {
    return null;
  }

  if (justTest) {
    return createCollisionResult();
  }

  // Combine results, swapping A and B since we called with swapped order
  const result = createCollisionResult();
  if (result1) {
    for (const contact of result1.contacts) {
      result.contacts.push({
        worldContactA: contact.worldContactB,
        worldContactB: contact.worldContactA,
        normal: V(contact.normal).imul(-1),
        depth: contact.depth,
      });
    }
  }
  if (result2) {
    for (const contact of result2.contacts) {
      result.contacts.push({
        worldContactA: contact.worldContactB,
        worldContactB: contact.worldContactA,
        normal: V(contact.normal).imul(-1),
        depth: contact.depth,
      });
    }
  }

  return result;
}
