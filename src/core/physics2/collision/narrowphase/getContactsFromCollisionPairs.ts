import { Body } from "../../body/Body";
import { Shape } from "../../shapes/Shape";
import { shapesCanCollide } from "../CollisionHelpers";
import { CollisionContact } from "../CollisionResult";
import { getShapeCollision } from "./CollisionDetector";

export interface Collision {
  readonly bodyA: Body;
  readonly shapeA: Shape;
  readonly bodyB: Body;
  readonly shapeB: Shape;
  readonly contacts: CollisionContact[];
}

export interface SensorOverlap {
  readonly bodyA: Body;
  readonly shapeA: Shape;
  readonly bodyB: Body;
  readonly shapeB: Shape;
}

/**
 * Narrowphase collision detection.
 */
export function getContactsFromPairs(pairs: [Body, Body][]): {
  collisions: Collision[];
  sensorOverlaps: SensorOverlap[];
} {
  const collisions = [];
  const sensorOverlaps = [];

  for (const [bodyA, bodyB] of pairs) {
    for (const shapeA of bodyA.shapes) {
      for (const shapeB of bodyB.shapes) {
        // Check collision groups and masks
        if (!shapesCanCollide(shapeA, shapeB)) {
          continue;
        }

        // Get world position and angle of each shape
        const positionA = bodyA.toWorldFrame(shapeA.position);
        const positionB = bodyB.toWorldFrame(shapeB.position);
        const angleA = shapeA.angle + bodyA.angle;
        const angleB = shapeB.angle + bodyB.angle;

        const isSensor = shapeA.sensor || shapeB.sensor;

        const collisionResult = getShapeCollision(
          bodyA,
          shapeA,
          positionA,
          angleA,
          bodyB,
          shapeB,
          positionB,
          angleB,
          isSensor, // justTest = false, we want full collision data
        );

        if (collisionResult) {
          if (isSensor) {
            sensorOverlaps.push({ bodyA, shapeA, bodyB, shapeB });
          } else {
            collisions.push({
              bodyA,
              shapeA,
              bodyB,
              shapeB,
              ...collisionResult,
            });
          }
        }
      }
    }
  }

  return { collisions, sensorOverlaps };
}
