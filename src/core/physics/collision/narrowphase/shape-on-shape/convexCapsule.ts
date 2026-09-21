import { V, V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Box } from "../../../shapes/Box";
import { Capsule } from "../../../shapes/Capsule";
import { Convex } from "../../../shapes/Convex";
import { Shape } from "../../../shapes/Shape";
import { setCapsuleMiddleRect } from "../../CollisionHelpers";
import { CollisionResult, createCollisionResult } from "../../CollisionResult";
import { circleConvex } from "./circleConvex";
import { convexConvex } from "./convexConvex";

const capsuleMiddleRect = new Box({ width: 1, height: 1 });

// Scratch vectors to avoid per-call allocations
const _circlePos1 = V();
const _circlePos2 = V();

/**
 * Convex/Capsule collision
 */
export function convexCapsule(
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
  const convexShape = shapeA as Convex;
  const capsuleShape = shapeB as Capsule;
  const halfLength = capsuleShape.length / 2;

  // Check the end circles
  _circlePos1.set(halfLength, 0).itoGlobalFrame(offsetB, angleB);
  const result1 = circleConvex(
    bodyB,
    capsuleShape,
    _circlePos1,
    angleB,
    bodyA,
    convexShape,
    offsetA,
    angleA,
    justTest,
    capsuleShape.radius,
  );

  _circlePos2.set(-halfLength, 0).itoGlobalFrame(offsetB, angleB);
  const result2 = circleConvex(
    bodyB,
    capsuleShape,
    _circlePos2,
    angleB,
    bodyA,
    convexShape,
    offsetA,
    angleA,
    justTest,
    capsuleShape.radius,
  );

  if (justTest && (result1 || result2)) {
    return createCollisionResult();
  }

  // Check center rect
  setCapsuleMiddleRect(capsuleMiddleRect, capsuleShape);
  const result3 = convexConvex(
    bodyA,
    convexShape,
    offsetA,
    angleA,
    bodyB,
    capsuleMiddleRect,
    offsetB,
    angleB,
    justTest,
  );

  if (!result1 && !result2 && !result3) {
    return null;
  }

  if (justTest) {
    return createCollisionResult();
  }

  // Combine results, swapping contacts from circle-convex tests
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
  if (result3) {
    result.contacts.push(...result3.contacts);
  }

  return result;
}
