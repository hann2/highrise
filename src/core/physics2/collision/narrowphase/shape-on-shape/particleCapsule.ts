import { V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Capsule } from "../../../shapes/Capsule";
import { Circle } from "../../../shapes/Circle";
import { Shape } from "../../../shapes/Shape";
import { CollisionResult } from "../../CollisionResult";
import { circleLineOrCapsule } from "./circleLineOrCapsule";

/** Particle/Capsule collision */
export function particleCapsule(
  bodyA: Body,
  shapeA: Shape,
  offsetA: V2d,
  angleA: number,
  bodyB: Body,
  shapeB: Capsule,
  offsetB: V2d,
  angleB: number,
  justTest: boolean,
): CollisionResult | null {
  const capsuleShape = shapeB as Capsule;
  return circleLineOrCapsule(
    bodyA,
    shapeA as Circle, // pretend particle is a circle of radius 0
    offsetA,
    angleA,
    bodyB,
    shapeB,
    offsetB,
    angleB,
    justTest,
    capsuleShape.radius,
    0,
  );
}
