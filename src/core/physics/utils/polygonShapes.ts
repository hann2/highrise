import { decomp, makeCCW, quickDecomp } from "poly-decomp-es";
import { Convex } from "../shapes/Convex";
import { V } from "../../Vector";

/**
 * Makes convex shapes that together cover a (possibly concave) polygon.
 * Useful because the physics engine can only collide convex shapes.
 *
 * @param points The outline of a simple polygon, in the body's local coordinates
 * @param optimal Use the slower decomposition that makes the fewest shapes
 */
export function convexShapesFromPolygon(
  points: ReadonlyArray<readonly [number, number]>,
  optimal: boolean = true,
): Convex[] {
  const polygon = points.map(([x, y]): [number, number] => [x, y]);
  makeCCW(polygon);

  const pieces = (optimal && decomp(polygon)) || quickDecomp(polygon);

  return pieces.map(
    (piece) => new Convex({ vertices: piece.map(([x, y]) => V(x, y)) }),
  );
}
