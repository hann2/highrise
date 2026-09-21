import { V, V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Convex } from "../../../shapes/Convex";
import { Shape } from "../../../shapes/Shape";
import { pointInConvex } from "../../CollisionHelpers";
import { CollisionResult, createCollisionResult } from "../../CollisionResult";

// Scratch vectors to avoid per-call allocations
const _closestPoint = V();
const _closestNormal = V();
const _worldV0 = V();
const _worldV1 = V();
const _edge = V();
const _edgeUnit = V();
const _tangent = V();
const _vertToParticle = V();

/** Particle/Convex collision */
export function particleConvex(
  bodyA: Body,
  _shapeA: Shape,
  offsetA: V2d,
  _angleA: number,
  bodyB: Body,
  shapeB: Shape,
  offsetB: V2d,
  angleB: number,
  justTest: boolean,
): CollisionResult | null {
  // Note: bodyA is particle, bodyB is convex
  const convexShape = shapeB as Convex;
  const verts = convexShape.vertices;

  // Check if particle is inside polygon
  if (!pointInConvex(offsetA, convexShape, offsetB, angleB)) {
    return null;
  }

  if (justTest) {
    return createCollisionResult();
  }

  // Find closest edge
  let minDistance = Number.MAX_VALUE;

  for (let i = 0; i < verts.length; i++) {
    const v0 = verts[i];
    const v1 = verts[(i + 1) % verts.length];

    // Transform vertices to world
    _worldV0.set(v0).irotate(angleB).iadd(offsetB);
    _worldV1.set(v1).irotate(angleB).iadd(offsetB);

    // Get world edge
    _edge.set(_worldV1).isub(_worldV0);
    _edgeUnit.set(_edge).inormalize();

    // Get tangent (points out of the convex)
    _tangent.set(_edgeUnit).irotate90cw();

    _vertToParticle.set(_worldV0).isub(offsetA);
    const distance = Math.abs(_vertToParticle.dot(_tangent));

    if (distance < minDistance) {
      minDistance = distance;
      _closestPoint.set(_tangent).imul(distance).iadd(offsetA);
      _closestNormal.set(_tangent);
    }
  }

  const result = createCollisionResult();
  result.contacts.push({
    worldContactA: V(offsetA).isub(bodyA.position),
    worldContactB: V(_closestPoint).isub(bodyB.position),
    normal: V(_closestNormal).imul(-1),
    depth: minDistance,
  });

  return result;
}
