import { V, V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Circle } from "../../../shapes/Circle";
import { Heightfield } from "../../../shapes/Heightfield";
import { Shape } from "../../../shapes/Shape";
import { CollisionResult, createCollisionResult } from "../../CollisionResult";

// Scratch vectors to avoid per-call allocations
const _v0 = V();
const _v1 = V();
const _edgeNormal = V();
const _candidate = V();
const _dist = V();
const _projectedPoint = V();
const _normal = V();

/** Circle/Heightfield collision */
export function circleHeightfield(
  bodyA: Body,
  shapeA: Shape,
  offsetA: V2d,
  _angleA: number,
  bodyB: Body,
  shapeB: Shape,
  offsetB: V2d,
  _angleB: number,
  justTest: boolean,
  radius?: number,
): CollisionResult | null {
  const circleShape = shapeA as Circle;
  const hfShape = shapeB as Heightfield;

  const data = hfShape.heights;
  const r = radius ?? circleShape.radius;
  const w = hfShape.elementWidth;

  // Get the index of the points to test against
  let idxA = Math.floor((offsetA[0] - r - offsetB[0]) / w);
  let idxB = Math.ceil((offsetA[0] + r - offsetB[0]) / w);

  if (idxA < 0) idxA = 0;
  if (idxB >= data.length) idxB = data.length - 1;

  // Get max height in range
  let max = data[idxA];
  for (let i = idxA; i < idxB; i++) {
    if (data[i] > max) max = data[i];
  }

  if (offsetA[1] - r > max + offsetB[1]) {
    return null;
  }

  const result = createCollisionResult();

  // Check all edges
  for (let i = idxA; i < idxB; i++) {
    _v0.set(i * w + offsetB[0], data[i] + offsetB[1]);
    _v1.set((i + 1) * w + offsetB[0], data[i + 1] + offsetB[1]);

    // Get normal (perpendicular to edge, pointing up/out)
    _edgeNormal
      .set(_v1)
      .isub(_v0)
      .irotate(Math.PI / 2)
      .inormalize();

    // Get point on circle closest to the edge
    _candidate.set(_edgeNormal).imul(-r).iadd(offsetA);

    // Distance from v0 to candidate point
    _dist.set(_candidate).isub(_v0);

    // Check if it is in the element "stick"
    const d = _dist.dot(_edgeNormal);
    if (_candidate[0] >= _v0[0] && _candidate[0] < _v1[0] && d <= 0) {
      if (justTest) {
        return createCollisionResult();
      }

      // Project candidate to edge
      _projectedPoint.set(_edgeNormal).imul(-d).iadd(_candidate);

      result.contacts.push({
        worldContactA: V(_edgeNormal)
          .imul(-r)
          .isub(bodyA.position)
          .iadd(offsetA),
        worldContactB: V(_projectedPoint).isub(bodyB.position),
        normal: V(_edgeNormal),
        depth: -d,
      });
    }
  }

  // Check all vertices
  if (r > 0) {
    for (let i = idxA; i <= idxB; i++) {
      _v0.set(i * w + offsetB[0], data[i] + offsetB[1]);
      _dist.set(offsetA).isub(_v0);

      if (_dist.squaredMagnitude < r * r) {
        if (justTest) {
          return createCollisionResult();
        }

        _normal.set(_dist).inormalize();

        result.contacts.push({
          worldContactA: V(_normal).imul(-r).isub(bodyA.position).iadd(offsetA),
          worldContactB: V(_v0).isub(bodyB.position),
          normal: V(_normal),
          depth: r - _dist.magnitude,
        });
      }
    }
  }

  if (result.contacts.length === 0) {
    return null;
  }

  return result;
}
