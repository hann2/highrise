import { V, V2d } from "../../../../Vector";
import { Body } from "../../../body/Body";
import { Convex } from "../../../shapes/Convex";
import { Heightfield } from "../../../shapes/Heightfield";
import { Shape } from "../../../shapes/Shape";
import { CollisionResult, createCollisionResult } from "../../CollisionResult";
import { convexConvex } from "./convexConvex";

// Reusable convex for heightfield tiles
const heightfieldTileConvex = new Convex({
  vertices: [V(), V(), V(), V()],
});

// Scratch vectors to avoid per-call allocations
const _v0 = V();
const _v1 = V();
const _tilePos = V();

/**
 * Convex/Heightfield collision
 */
export function convexHeightfield(
  bodyA: Body,
  shapeA: Shape,
  offsetA: V2d,
  angleA: number,
  bodyB: Body,
  shapeB: Shape,
  offsetB: V2d,
  _angleB: number,
  justTest: boolean,
): CollisionResult | null {
  const convexShape = shapeA as Convex;
  const hfShape = shapeB as Heightfield;

  const data = hfShape.heights;
  const w = hfShape.elementWidth;

  // Use body's AABB to get index range
  const aabb = bodyA.aabb;
  let idxA = Math.floor((aabb.lowerBound[0] - offsetB[0]) / w);
  let idxB = Math.ceil((aabb.upperBound[0] - offsetB[0]) / w);

  if (idxA < 0) idxA = 0;
  if (idxB >= data.length) idxB = data.length - 1;

  // Get max height in range
  let max = data[idxA];
  for (let i = idxA; i < idxB; i++) {
    if (data[i] > max) max = data[i];
  }

  if (aabb.lowerBound[1] > max + offsetB[1]) {
    return null;
  }

  const result = createCollisionResult();

  // Loop over all edges
  for (let i = idxA; i < idxB; i++) {
    _v0.set(i * w + offsetB[0], data[i] + offsetB[1]);
    _v1.set((i + 1) * w + offsetB[0], data[i + 1] + offsetB[1]);

    // Construct a convex tile
    const tileHeight = 100;
    _tilePos.set((_v1[0] + _v0[0]) * 0.5, (_v1[1] + _v0[1] - tileHeight) * 0.5);

    heightfieldTileConvex.vertices[0].set(_v1).isub(_tilePos);
    heightfieldTileConvex.vertices[1].set(_v0).isub(_tilePos);
    heightfieldTileConvex.vertices[2].set(heightfieldTileConvex.vertices[1]);
    heightfieldTileConvex.vertices[3].set(heightfieldTileConvex.vertices[0]);
    heightfieldTileConvex.vertices[2][1] -= tileHeight;
    heightfieldTileConvex.vertices[3][1] -= tileHeight;

    // Update normals for the tile
    for (let j = 0; j < 4; j++) {
      const v0j = heightfieldTileConvex.vertices[j];
      const v1j = heightfieldTileConvex.vertices[(j + 1) % 4];
      heightfieldTileConvex.axes[j].set(v1j).isub(v0j);
      heightfieldTileConvex.axes[j].irotate90cw();
      heightfieldTileConvex.axes[j].inormalize();
    }

    // Do convex collision
    const tileResult = convexConvex(
      bodyA,
      convexShape,
      offsetA,
      angleA,
      bodyB,
      heightfieldTileConvex,
      _tilePos,
      0,
      justTest,
    );

    if (justTest && tileResult) {
      return createCollisionResult();
    }

    if (tileResult) {
      result.contacts.push(...tileResult.contacts);
    }
  }

  if (result.contacts.length === 0) {
    return null;
  }

  return result;
}
