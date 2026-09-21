import { V, V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Capsule } from "../../../shapes/Capsule";
import { Circle } from "../../../shapes/Circle";
import { Line } from "../../../shapes/Line";
import { Shape } from "../../../shapes/Shape";
import { CollisionResult, createCollisionResult } from "../../CollisionResult";

// Scratch vectors to avoid per-call allocations
const _lineStart = V();
const _lineEnd = V();
const _lineEdge = V();
const _lineEdgeUnit = V();
const _lineTangent = V();
const _circleToLineStart = V();
const _orthoDist = V();
const _projectedPoint = V();
const _lineToCircle = V();
const _lineToCircleOrtho = V();
const _normal = V();
const _contactOnCircle = V();
const _contactOnLine = V();
const _dist = V();

/** Circle/Line collision (also used for capsules via lineRadius parameter) */
export function circleLineOrCapsule(
  bodyA: Body,
  shapeA: Circle,
  offsetA: V2d,
  _angleA: number,
  bodyB: Body,
  shapeB: Line | Capsule,
  offsetB: V2d,
  angleB: number,
  justTest: boolean,
  lineRadius?: number,
  circleRadius?: number,
): CollisionResult | null {
  const circleShape = shapeA as Circle;
  const lineShape = shapeB as Line | Capsule;
  const lr = lineRadius ?? 0;
  const cr = circleRadius ?? circleShape.radius;

  const halfLineLength = lineShape.length / 2;

  // Get line endpoints in world space
  _lineStart.set(-halfLineLength, 0).itoGlobalFrame(offsetB, angleB);
  _lineEnd.set(halfLineLength, 0).itoGlobalFrame(offsetB, angleB);

  // Get vector along the line
  _lineEdge.set(_lineEnd).isub(_lineStart);
  _lineEdgeUnit.set(_lineEdge).inormalize();

  // Get tangent to the edge (perpendicular, pointing away from line)
  _lineTangent.set(_lineEdgeUnit).irotate90cw();

  // Check distance from the plane spanned by the edge vs the circle
  _circleToLineStart.set(offsetA).isub(_lineStart);
  const perpDistance = _circleToLineStart.dot(_lineTangent);
  const radiusSum = cr + lr;

  if (Math.abs(perpDistance) < radiusSum) {
    // Project circle center onto the line
    _orthoDist.set(_lineTangent).imul(perpDistance);
    _projectedPoint.set(offsetA).isub(_orthoDist);

    // Add the line radius offset
    _lineToCircle.set(offsetA).isub(offsetB);
    _lineToCircleOrtho.set(_lineTangent).imul(_lineTangent.dot(_lineToCircle));
    _lineToCircleOrtho.inormalize().imul(lr);
    _projectedPoint.iadd(_lineToCircleOrtho);

    // Check if the point is within the edge span
    const pos = _lineEdgeUnit.dot(_projectedPoint);
    const pos0 = _lineEdgeUnit.dot(_lineStart);
    const pos1 = _lineEdgeUnit.dot(_lineEnd);

    if (pos > pos0 && pos < pos1) {
      if (justTest) {
        return createCollisionResult();
      }

      _normal.set(_orthoDist).imul(-1).inormalize();

      // Contact point on circle
      _contactOnCircle.set(_normal).imul(cr).iadd(offsetA);
      // Contact point on line
      _contactOnLine.set(_projectedPoint);

      const result = createCollisionResult();
      result.contacts.push({
        worldContactA: V(_contactOnCircle).isub(bodyA.position),
        worldContactB: V(_contactOnLine).isub(bodyB.position),
        normal: V(_normal),
        depth: radiusSum - Math.abs(perpDistance),
      });

      return result;
    }
  }

  // Check corners (line endpoints)
  const endpoints = [_lineStart, _lineEnd];

  for (const endpoint of endpoints) {
    _dist.set(endpoint).isub(offsetA);

    if (_dist.squaredMagnitude < radiusSum * radiusSum) {
      if (justTest) {
        return createCollisionResult();
      }

      _normal.set(_dist).inormalize();

      // Contact point on circle
      _contactOnCircle.set(_normal).imul(cr).iadd(offsetA);
      // Contact point on line endpoint (with line radius offset)
      _contactOnLine.set(endpoint).iadd(V(_normal).imul(-lr));

      const result = createCollisionResult();
      result.contacts.push({
        worldContactA: V(_contactOnCircle).isub(bodyA.position),
        worldContactB: V(_contactOnLine).isub(bodyB.position),
        normal: V(_normal),
        depth: radiusSum - _dist.magnitude,
      });

      return result;
    }
  }

  return null;
}
