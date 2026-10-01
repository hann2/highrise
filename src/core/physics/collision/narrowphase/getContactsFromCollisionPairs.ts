import { V } from "../../../Vector";
import { Body } from "../../body/Body";
import type { ContactEquation } from "../../equations/ContactEquation";
import { Shape } from "../../shapes/Shape";
import { shapesCanCollide } from "../CollisionHelpers";
import { CollisionContact, releaseCollisionResults } from "../CollisionResult";
import { getShapeCollision } from "./CollisionDetector";

/**
 * Two shapes touching, found by the narrowphase. Like its contacts, it's
 * reused by the next step, so it's only good during the step it's from.
 */
export interface Collision {
  readonly bodyA: Body;
  readonly shapeA: Shape;
  readonly bodyB: Body;
  readonly shapeB: Shape;
  readonly contacts: CollisionContact[];
  /** Its contact equations, once the world has made them */
  contactEquations?: ContactEquation[];
}

type MutableCollision = { -readonly [K in keyof Collision]: Collision[K] };

// Reused from step to step, like the results and contacts
const collisionPool: MutableCollision[] = [];
// Where shapes are in the world, for the pair being tested
const positionA = V();
const positionB = V();

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
  // Last step's are free to reuse
  releaseCollisionResults();
  const collisions: Collision[] = [];
  const sensorOverlaps: SensorOverlap[] = [];

  for (const [bodyA, bodyB] of pairs) {
    for (const shapeA of bodyA.shapes) {
      for (const shapeB of bodyB.shapes) {
        // Check collision groups and masks
        if (!shapesCanCollide(shapeA, shapeB)) {
          continue;
        }

        // Get world position and angle of each shape
        positionA
          .set(shapeA.position)
          .itoGlobalFrame(bodyA.position, bodyA.angle);
        positionB
          .set(shapeB.position)
          .itoGlobalFrame(bodyB.position, bodyB.angle);
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
            let collision = collisionPool[collisions.length];
            if (!collision) {
              collision = { bodyA, shapeA, bodyB, shapeB, contacts: [] };
              collisionPool.push(collision);
            }
            collision.bodyA = bodyA;
            collision.shapeA = shapeA;
            collision.bodyB = bodyB;
            collision.shapeB = shapeB;
            collision.contacts = collisionResult.contacts;
            collision.contactEquations = undefined;
            collisions.push(collision);
          }
        }
      }
    }
  }

  return { collisions, sensorOverlaps };
}
