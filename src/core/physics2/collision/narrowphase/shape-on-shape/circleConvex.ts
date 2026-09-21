import { V, V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Circle } from "../../../shapes/Circle";
import { Convex } from "../../../shapes/Convex";
import { Shape } from "../../../shapes/Shape";
import { pointInConvexLocal } from "../../CollisionHelpers";
import { CollisionResult, createCollisionResult } from "../../CollisionResult";

// Scratch vectors to avoid per-call allocations
const _localCirclePos = V();
const _r = V();
const _candidate = V();
const _candidateDist = V();
const _worldV0 = V();
const _worldV1 = V();
const _edge = V();
const _edgeUnit = V();
const _normal = V();
const _closestEdgePoint = V();
const _dist = V();
const _worldVertex = V();
const _worldDist = V();

/** Circle/Convex collision */
export function circleConvex(
  bodyA: Body,
  shapeA: Shape,
  offsetA: V2d,
  _angleA: number,
  bodyB: Body,
  shapeB: Shape,
  offsetB: V2d,
  angleB: number,
  justTest: boolean,
  circleRadius?: number,
): CollisionResult | null {
  const circleShape = shapeA as Circle;
  const convexShape = shapeB as Convex;
  const cr = circleRadius ?? circleShape.radius;

  _localCirclePos.set(offsetA).itoLocalFrame(offsetB, angleB);

  const vertices = convexShape.vertices;
  const normals = convexShape.axes;
  const numVertices = vertices.length;
  let normalIndex = -1;

  // Find the min separating edge
  let separation = -Number.MAX_VALUE;
  const radius = convexShape.boundingRadius + cr;

  for (let i = 0; i < numVertices; i++) {
    _r.set(_localCirclePos).isub(vertices[i]);
    const s = normals[i].dot(_r);

    if (s > radius) {
      return null; // Early out
    }

    if (s > separation) {
      separation = s;
      normalIndex = i;
    }
  }

  // Check edges first
  let found = -1;
  let minCandidateDistance = Number.MAX_VALUE;

  for (
    let i = normalIndex + numVertices - 1;
    i < normalIndex + numVertices + 2;
    i++
  ) {
    const v0 = vertices[i % numVertices];
    const n = normals[i % numVertices];

    // Get point on circle closest to the convex
    _candidate.set(n).imul(-cr).iadd(_localCirclePos);

    if (pointInConvexLocal(_candidate, convexShape)) {
      _candidateDist.set(v0).isub(_candidate);
      const candidateDistance = Math.abs(_candidateDist.dot(n));

      if (candidateDistance < minCandidateDistance) {
        minCandidateDistance = candidateDistance;
        found = i;
      }
    }
  }

  if (found !== -1) {
    if (justTest) {
      return createCollisionResult();
    }

    const v0 = vertices[found % numVertices];
    const v1 = vertices[(found + 1) % numVertices];

    _worldV0.set(v0).itoGlobalFrame(offsetB, angleB);
    _worldV1.set(v1).itoGlobalFrame(offsetB, angleB);

    _edge.set(_worldV1).isub(_worldV0);
    _edgeUnit.set(_edge).inormalize();

    // Get tangent (points out of the convex)
    _normal.set(_edgeUnit).irotate90cw();

    // Get point on circle closest to convex
    _candidate.set(_normal).imul(-cr).iadd(offsetA);
    _closestEdgePoint.set(_normal).imul(minCandidateDistance).iadd(_candidate);

    const result = createCollisionResult();
    result.contacts.push({
      worldContactA: V(_candidate).isub(bodyA.position),
      worldContactB: V(_closestEdgePoint).isub(bodyB.position),
      normal: V(_candidate).isub(offsetA).inormalize(),
      depth: minCandidateDistance,
    });

    return result;
  }

  // Check closest vertices
  if (cr > 0 && normalIndex !== -1) {
    for (
      let i = normalIndex + numVertices;
      i < normalIndex + numVertices + 2;
      i++
    ) {
      const localVertex = vertices[i % numVertices];
      _dist.set(localVertex).isub(_localCirclePos);

      if (_dist.squaredMagnitude < cr * cr) {
        if (justTest) {
          return createCollisionResult();
        }

        _worldVertex.set(localVertex).itoGlobalFrame(offsetB, angleB);
        _worldDist.set(_worldVertex).isub(offsetA);

        _normal.set(_worldDist).inormalize();

        const result = createCollisionResult();
        result.contacts.push({
          worldContactA: V(_normal).imul(cr).isub(bodyA.position).iadd(offsetA),
          worldContactB: V(_worldVertex).isub(bodyB.position),
          normal: V(_normal),
          depth: cr - _worldDist.magnitude,
        });

        return result;
      }
    }
  }

  return null;
}
