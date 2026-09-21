import { V, V2d } from "../../Vector";
import { Body } from "../body/Body";
import { Box } from "../shapes/Box";
import { Capsule } from "../shapes/Capsule";
import { Convex } from "../shapes/Convex";
import { Shape } from "../shapes/Shape";

/**
 * Check if a point is inside a convex polygon (world space)
 */
export function pointInConvex(
  worldPoint: V2d,
  convexShape: Convex,
  convexOffset: V2d,
  convexAngle: number,
): boolean {
  const localPoint = V(worldPoint).itoLocalFrame(convexOffset, convexAngle);
  return pointInConvexLocal(localPoint, convexShape);
}

/**
 * Check if a point is inside a convex polygon (local space)
 */
export function pointInConvexLocal(
  localPoint: V2d,
  convexShape: Convex,
): boolean {
  const verts = convexShape.vertices;
  const numVerts = verts.length;
  let lastCross: number | null = null;

  const r0 = V();
  const r1 = V();

  for (let i = 0; i < numVerts + 1; i++) {
    const v0 = verts[i % numVerts];
    const v1 = verts[(i + 1) % numVerts];

    r0.set(v0).isub(localPoint);
    r1.set(v1).isub(localPoint);

    const cross = r0.crossLength(r1);

    if (lastCross === null) {
      lastCross = cross;
    }

    // If we got a different sign, the point is outside
    if (cross * lastCross < 0) {
      return false;
    }
    lastCross = cross;
  }
  return true;
}

/**
 * Find the max separation between two polygons using edge normals from poly1.
 * Returns the best edge index and stores the max separation in separationOut[0].
 */
export function findMaxSeparation(
  separationOut: V2d,
  poly1: Convex,
  position1: V2d,
  angle1: number,
  poly2: Convex,
  position2: V2d,
  angle2: number,
): number {
  const count1 = poly1.vertices.length;
  const count2 = poly2.vertices.length;
  const normals1 = poly1.axes;
  const vertices1 = poly1.vertices;
  const vertices2 = poly2.vertices;

  const rotatedNormal = V();
  const transformedVertex = V();
  const vertexDiff = V();
  const tempVec = V();

  const angle = angle1 - angle2;

  let bestIndex = 0;
  let maxSeparation = -Number.MAX_VALUE;

  for (let i = 0; i < count1; i++) {
    // Get poly1 normal in frame2
    rotatedNormal.set(normals1[i]).irotate(angle);

    // Get poly1 vertex in frame2
    tempVec.set(vertices1[i]).itoGlobalFrame(position1, angle1);
    transformedVertex.set(tempVec).itoLocalFrame(position2, angle2);

    // Find deepest point for normal i
    let minSeparation = Number.MAX_VALUE;
    for (let j = 0; j < count2; j++) {
      vertexDiff.set(vertices2[j]).isub(transformedVertex);
      const separation = rotatedNormal.dot(vertexDiff);
      if (separation < minSeparation) {
        minSeparation = separation;
      }
    }

    if (minSeparation > maxSeparation) {
      maxSeparation = minSeparation;
      bestIndex = i;
    }
  }

  separationOut[0] = maxSeparation;
  return bestIndex;
}

/**
 * Find incident edge for polygon clipping
 */
export function findIncidentEdge(
  clipVerticesOut: V2d[],
  poly1: Convex,
  position1: V2d,
  angle1: number,
  edge1: number,
  poly2: Convex,
  position2: V2d,
  angle2: number,
): void {
  const normals1 = poly1.axes;
  const count2 = poly2.vertices.length;
  const vertices2 = poly2.vertices;
  const normals2 = poly2.axes;

  // Get the normal of the reference edge in poly2's frame
  const referenceNormal = V(normals1[edge1]).irotate(angle1 - angle2);

  // Find the incident edge on poly2
  let incidentIndex = 0;
  let minDot = Number.MAX_VALUE;
  for (let i = 0; i < count2; i++) {
    const d = referenceNormal.dot(normals2[i]);
    if (d < minDot) {
      minDot = d;
      incidentIndex = i;
    }
  }

  // Build the clip vertices for the incident edge
  const i1 = incidentIndex;
  const i2 = i1 + 1 < count2 ? i1 + 1 : 0;

  clipVerticesOut[0].set(vertices2[i1]).itoGlobalFrame(position2, angle2);
  clipVerticesOut[1].set(vertices2[i2]).itoGlobalFrame(position2, angle2);
}

/**
 * Clip segment to line (Sutherland-Hodgman)
 */
export function clipSegmentToLine(
  vOut: V2d[],
  vIn: V2d[],
  normal: V2d,
  offset: number,
): number {
  let numOut = 0;

  // Calculate distance of end points to the line
  const distance0 = normal.dot(vIn[0]) - offset;
  const distance1 = normal.dot(vIn[1]) - offset;

  // If the points are behind the plane
  if (distance0 <= 0.0) {
    vOut[numOut++].set(vIn[0]);
  }
  if (distance1 <= 0.0) {
    vOut[numOut++].set(vIn[1]);
  }

  // If the points are on different sides of the plane
  if (distance0 * distance1 < 0.0) {
    // Find intersection point
    const interp = distance0 / (distance0 - distance1);
    const v = vOut[numOut];
    v.set(vIn[1]).isub(vIn[0]).imul(interp).iadd(vIn[0]);
    numOut++;
  }

  return numOut;
}

/**
 * Set convex to capsule middle rectangle
 */
export function setCapsuleMiddleRect(
  convexShape: Box,
  capsuleShape: Capsule,
): void {
  const capsuleRadius = capsuleShape.radius;
  const halfCapsuleLength = capsuleShape.length * 0.5;
  const verts = convexShape.vertices;
  verts[0].set(-halfCapsuleLength, -capsuleRadius);
  verts[1].set(halfCapsuleLength, -capsuleRadius);
  verts[2].set(halfCapsuleLength, capsuleRadius);
  verts[3].set(-halfCapsuleLength, capsuleRadius);
}

/** Check whether two bodies are allowed to collide at all. */
export function bodiesCanCollide(bodyA: Body, bodyB: Body): boolean {
  // Static and kinematic bodies cannot collide with each other
  if (bodyA.motion !== "dynamic" && bodyB.motion !== "dynamic") {
    return false;
  }

  // Check if bodies are sleeping (only dynamic bodies can sleep)
  const aSleeping = bodyA.motion === "dynamic" && bodyA.isSleeping();
  const bSleeping = bodyB.motion === "dynamic" && bodyB.isSleeping();

  // Cannot collide if both sleeping
  if (aSleeping && bSleeping) {
    return false;
  }

  // Cannot collide if one is sleeping and the other is static
  if (
    (aSleeping && bodyB.motion === "static") ||
    (bSleeping && bodyA.motion === "static")
  ) {
    return false;
  }

  return true;
}

export function shapesCanCollide(shapeA: Shape, shapeB: Shape): boolean {
  return (
    (shapeA.collisionGroup & shapeB.collisionMask) !== 0 &&
    (shapeB.collisionGroup & shapeA.collisionMask) !== 0
  );
}
