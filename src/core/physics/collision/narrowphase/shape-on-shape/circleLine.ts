import { V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Circle } from "../../../shapes/Circle";
import { Line } from "../../../shapes/Line";
import { CollisionResult } from "../../CollisionResult";
import { circleLineOrCapsule } from "./circleLineOrCapsule";

/** Circle/Capsule collision */
export function circleLine(
  bodyA: Body,
  shapeA: Circle,
  offsetA: V2d,
  angleA: number,
  bodyB: Body,
  shapeB: Line,
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
  );
}
