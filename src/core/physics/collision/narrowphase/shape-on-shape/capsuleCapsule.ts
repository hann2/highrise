import { V, V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Box } from "../../../shapes/Box";
import { Capsule } from "../../../shapes/Capsule";
import { Shape } from "../../../shapes/Shape";
import { setCapsuleMiddleRect } from "../../CollisionHelpers";
import { CollisionResult, createCollisionResult } from "../../CollisionResult";
import { circleCircle } from "./circleCircle";
import { convexCapsule } from "./convexCapsule";

const capsuleMiddleRect = new Box({ width: 1, height: 1 });
const capsuleMiddleRect2 = new Box({ width: 1, height: 1 });

// Scratch vectors to avoid per-call allocations
const _circlePosA = V();
const _circlePosB = V();

/**
 * Capsule/Capsule collision
 */
export function capsuleCapsule(
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
  const capsuleA = shapeA as Capsule;
  const capsuleB = shapeB as Capsule;

  const result = createCollisionResult();

  // Need 4 circle checks between all endpoints
  for (let i = 0; i < 2; i++) {
    _circlePosA
      .set((i === 0 ? -1 : 1) * (capsuleA.length / 2), 0)
      .itoGlobalFrame(offsetA, angleA);

    for (let j = 0; j < 2; j++) {
      _circlePosB
        .set((j === 0 ? -1 : 1) * (capsuleB.length / 2), 0)
        .itoGlobalFrame(offsetB, angleB);

      const circleResult = circleCircle(
        bodyA,
        capsuleA,
        _circlePosA,
        angleA,
        bodyB,
        capsuleB,
        _circlePosB,
        angleB,
        justTest,
        capsuleA.radius,
        capsuleB.radius,
      );

      if (justTest && circleResult) {
        return createCollisionResult();
      }

      if (circleResult) {
        result.contacts.push(...circleResult.contacts);
      }
    }
  }

  // Check circles against center boxes
  setCapsuleMiddleRect(capsuleMiddleRect, capsuleA);
  const rect1Result = convexCapsule(
    bodyA,
    capsuleMiddleRect,
    offsetA,
    angleA,
    bodyB,
    capsuleB,
    offsetB,
    angleB,
    justTest,
  );

  if (justTest && rect1Result) {
    return createCollisionResult();
  }

  if (rect1Result) {
    result.contacts.push(...rect1Result.contacts);
  }

  setCapsuleMiddleRect(capsuleMiddleRect2, capsuleB);
  const rect2Result = convexCapsule(
    bodyB,
    capsuleMiddleRect2,
    offsetB,
    angleB,
    bodyA,
    capsuleA,
    offsetA,
    angleA,
    justTest,
  );

  if (justTest && rect2Result) {
    return createCollisionResult();
  }

  if (rect2Result) {
    // Swap contacts since we called with swapped bodies
    for (const contact of rect2Result.contacts) {
      result.contacts.push({
        worldContactA: contact.worldContactB,
        worldContactB: contact.worldContactA,
        normal: V(contact.normal).imul(-1),
        depth: contact.depth,
      });
    }
  }

  if (result.contacts.length === 0) {
    return null;
  }

  return result;
}
