import { V, V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Circle } from "../../../shapes/Circle";
import { Particle } from "../../../shapes/Particle";
import { Shape } from "../../../shapes/Shape";
import { CollisionResult, createCollisionResult } from "../../CollisionResult";

// Scratch vectors to avoid per-call allocations
const _particleToCircle = V();
const _normal = V();
const _contactOnCircle = V();

/** Circle/Particle collision */
export function circleParticle(
  bodyA: Body,
  shapeA: Circle,
  offsetA: V2d,
  _angleA: number,
  bodyB: Body,
  _shapeB: Particle,
  offsetB: V2d,
  _angleB: number,
  justTest: boolean,
): CollisionResult | null {
  const circleShape = shapeA as Circle;
  const circleRadius = circleShape.radius;

  _particleToCircle.set(offsetB).isub(offsetA);
  if (_particleToCircle.squaredMagnitude > circleRadius * circleRadius) {
    return null;
  }

  if (justTest) {
    return createCollisionResult();
  }

  _normal.set(_particleToCircle).inormalize();

  // Contact point on circle surface
  _contactOnCircle.set(_normal).imul(circleRadius).iadd(offsetA);

  const result = createCollisionResult();
  result.contacts.push({
    worldContactA: V(_contactOnCircle).isub(bodyA.position),
    worldContactB: V(offsetB).isub(bodyB.position),
    normal: V(_normal),
    depth: circleRadius - _particleToCircle.magnitude,
  });

  return result;
}
