import { V, V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Line } from "../../../shapes/Line";
import { Shape } from "../../../shapes/Shape";
import {
  CollisionResult,
  createCollisionResult,
  addContact,
} from "../../CollisionResult";

const yAxis = V(0, 1);

// Scratch vectors to avoid per-call allocations
const _lineStart = V();
const _lineEnd = V();
const _planeNormal = V();
const _dist = V();
const _projectionOffset = V();
const _contactOnPlane = V();

/** Plane/Line collision */
export function planeLine(
  bodyA: Body,
  _shapeA: Shape,
  offsetA: V2d,
  angleA: number,
  bodyB: Body,
  shapeB: Shape,
  offsetB: V2d,
  angleB: number,
  justTest: boolean,
): CollisionResult | null {
  // Note: bodyA is plane, bodyB is line
  const lineShape = shapeB as Line;
  const halfLength = lineShape.length / 2;

  // Get line endpoints
  _lineStart.set(-halfLength, 0).itoGlobalFrame(offsetB, angleB);
  _lineEnd.set(halfLength, 0).itoGlobalFrame(offsetB, angleB);

  _planeNormal.set(yAxis).irotate(angleA);

  const result = createCollisionResult();

  // Check line endpoints against plane
  const endpoints = [_lineStart, _lineEnd];
  for (const endpoint of endpoints) {
    _dist.set(endpoint).isub(offsetA);
    const distance = _dist.dot(_planeNormal);

    if (distance < 0) {
      if (justTest) {
        return createCollisionResult();
      }

      // Project endpoint onto plane
      _projectionOffset.set(_planeNormal).imul(distance);
      _contactOnPlane.set(endpoint).isub(_projectionOffset);

      const added = addContact(result);
      added.worldContactA.set(_contactOnPlane).isub(bodyA.position);
      added.worldContactB.set(endpoint).isub(bodyB.position);
      added.normal.set(_planeNormal);
      added.depth = -distance;
    }
  }

  if (result.contacts.length === 0) {
    return null;
  }

  return result;
}
