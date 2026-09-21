import { V, V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Convex } from "../../../shapes/Convex";
import { Shape } from "../../../shapes/Shape";
import { CollisionResult, createCollisionResult } from "../../CollisionResult";

const yAxis = V(0, 1);

// Scratch vectors to avoid per-call allocations
const _planeNormal = V();
const _localPlaneNormal = V();
const _localPlaneOffset = V();
const _localDist = V();
const _worldVertex = V();
const _dist = V();
const _projectionOffset = V();
const _contactOnPlane = V();

/** Plane/Convex collision */
export function planeConvex(
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
  // Note: bodyA is plane, bodyB is convex
  const convexShape = shapeB as Convex;
  _planeNormal.set(yAxis).irotate(angleA);

  // Get convex-local plane offset and normal
  _localPlaneNormal.set(_planeNormal).irotate(-angleB);
  _localPlaneOffset.set(offsetA).itoLocalFrame(offsetB, angleB);

  const result = createCollisionResult();
  const vertices = convexShape.vertices;

  for (const v of vertices) {
    _localDist.set(v).isub(_localPlaneOffset);

    if (_localDist.dot(_localPlaneNormal) <= 0) {
      if (justTest) {
        return createCollisionResult();
      }

      _worldVertex.set(v).itoGlobalFrame(offsetB, angleB);
      _dist.set(_worldVertex).isub(offsetA);
      const d = _dist.dot(_planeNormal);
      _projectionOffset.set(_planeNormal).imul(d);
      _contactOnPlane.set(_worldVertex).isub(_projectionOffset);

      result.contacts.push({
        worldContactA: V(_contactOnPlane).isub(bodyA.position),
        worldContactB: V(_worldVertex).isub(bodyB.position),
        normal: V(_planeNormal),
        depth: -d,
      });
    }
  }

  if (result.contacts.length === 0) {
    return null;
  }

  return result;
}
