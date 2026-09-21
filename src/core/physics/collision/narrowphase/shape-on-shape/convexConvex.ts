import { V, V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Convex } from "../../../shapes/Convex";
import { Shape } from "../../../shapes/Shape";
import {
  clipSegmentToLine,
  findIncidentEdge,
  findMaxSeparation,
} from "../../CollisionHelpers";
import { CollisionResult, createCollisionResult } from "../../CollisionResult";

// Scratch arrays for polygon clipping
const clipPoints1 = [V(), V()];
const clipPoints2 = [V(), V()];
const incidentEdgePoints = [V(), V()];
const maxManifoldPoints = 2;

// Scratch vectors to avoid per-call allocations
const _separationA_out = V();
const _separationB_out = V();
const _v11 = V();
const _v12 = V();
const _localTangent = V();
const _tangent = V();
const _normal = V();
const _negativeTangent = V();
const _contactPointOnPoly2 = V();
const _dist = V();
const _contactPointOnPoly1 = V();

/**
 * Convex/Convex collision (SAT with edge clipping)
 */
export function convexConvex(
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
  const polyA = shapeA as Convex;
  const polyB = shapeB as Convex;
  const totalRadius = 0;

  const edgeA = findMaxSeparation(
    _separationA_out,
    polyA,
    offsetA,
    angleA,
    polyB,
    offsetB,
    angleB,
  );
  const separationA = _separationA_out[0];
  if (separationA > totalRadius) {
    return null;
  }

  const edgeB = findMaxSeparation(
    _separationB_out,
    polyB,
    offsetB,
    angleB,
    polyA,
    offsetA,
    angleA,
  );
  const separationB = _separationB_out[0];
  if (separationB > totalRadius) {
    return null;
  }

  let poly1: Convex;
  let poly2: Convex;
  let position1: V2d;
  let position2: V2d;
  let angle1: number;
  let angle2: number;
  let body1: Body;
  let body2: Body;
  let edge1: number;

  if (separationB > separationA) {
    poly1 = polyB;
    poly2 = polyA;
    body1 = bodyB;
    body2 = bodyA;
    position1 = offsetB;
    angle1 = angleB;
    position2 = offsetA;
    angle2 = angleA;
    edge1 = edgeB;
  } else {
    poly1 = polyA;
    poly2 = polyB;
    body1 = bodyA;
    body2 = bodyB;
    position1 = offsetA;
    angle1 = angleA;
    position2 = offsetB;
    angle2 = angleB;
    edge1 = edgeA;
  }

  findIncidentEdge(
    incidentEdgePoints,
    poly1,
    position1,
    angle1,
    edge1,
    poly2,
    position2,
    angle2,
  );

  const count1 = poly1.vertices.length;
  const vertices1 = poly1.vertices;

  const iv1 = edge1;
  const iv2 = edge1 + 1 < count1 ? edge1 + 1 : 0;

  _v11.set(vertices1[iv1]);
  _v12.set(vertices1[iv2]);

  _localTangent.set(_v12).isub(_v11).inormalize();

  _tangent.set(_localTangent).irotate(angle1);
  _normal.set(_tangent).icrossVZ(1.0);

  _v11.itoGlobalFrame(position1, angle1);
  _v12.itoGlobalFrame(position1, angle1);

  // Face offset
  const frontOffset = _normal.dot(_v11);

  // Side offsets
  const sideOffset1 = -_tangent.dot(_v11) + totalRadius;
  const sideOffset2 = _tangent.dot(_v12) + totalRadius;

  // Clip incident edge
  _negativeTangent.set(_tangent).imul(-1);
  let np = clipSegmentToLine(
    clipPoints1,
    incidentEdgePoints,
    _negativeTangent,
    sideOffset1,
  );

  if (np < 2) {
    return null;
  }

  np = clipSegmentToLine(clipPoints2, clipPoints1, _tangent, sideOffset2);

  if (np < 2) {
    return null;
  }

  const result = createCollisionResult();

  for (let i = 0; i < maxManifoldPoints; i++) {
    const separation = _normal.dot(clipPoints2[i]) - frontOffset;

    if (separation <= totalRadius) {
      if (justTest) {
        return createCollisionResult();
      }

      _contactPointOnPoly2.set(clipPoints2[i]);
      _dist.set(_normal).imul(-separation);
      _contactPointOnPoly1.set(clipPoints2[i]).iadd(_dist);

      result.contacts.push({
        worldContactA: V(_contactPointOnPoly1).isub(body1.position),
        worldContactB: V(_contactPointOnPoly2).isub(body2.position),
        normal: V(_normal),
        depth: -separation,
      });
    }
  }

  if (result.contacts.length === 0) {
    return null;
  }

  // If bodies were swapped, swap the result back
  if (separationB > separationA) {
    for (const contact of result.contacts) {
      const temp = contact.worldContactA;
      contact.worldContactA = contact.worldContactB;
      contact.worldContactB = temp;
      contact.normal.imul(-1);
    }
  }

  return result;
}
