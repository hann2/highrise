import { V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Capsule } from "../../../shapes/Capsule";
import { Circle } from "../../../shapes/Circle";
import { CollisionResult } from "../../CollisionResult";
import { circleLineOrCapsule } from "./circleLineOrCapsule";

/** Circle/Capsule collision */
export function circleCapsule(
  bodyA: Body,
  shapeA: Circle,
  offsetA: V2d,
  angleA: number,
  bodyB: Body,
  shapeB: Capsule,
  offsetB: V2d,
  angleB: number,
  justTest: boolean,
): CollisionResult | null {
  const capsuleShape = shapeB;
  return circleLineOrCapsule(
    bodyA,
    shapeA,
    offsetA,
    angleA,
    bodyB,
    shapeB,
    offsetB,
    angleB,
    justTest,
    capsuleShape.radius,
  );
}
