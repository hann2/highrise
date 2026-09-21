/**
 * Shared 2D queries against pre-computed hull boundary outlines.
 *
 * These helpers were originally private to `DeckContactConstraint` and have
 * been hoisted here so that other constraints (like the rope wrap constraint)
 * can reuse them without duplicating the flat-array traversal math.
 *
 * All routines are zero-allocation and operate on the `HullBoundaryLevel`
 * shape built by `buildBoundaryLevel()`.
 */

import type {
  HullBoundaryData,
  HullBoundaryLevel,
} from "../constraints/DeckContactConstraint";

/** Point-in-polygon test (ray-casting) on flat vertex arrays. */
export function pointInPolygon(
  level: HullBoundaryLevel,
  px: number,
  py: number,
): boolean {
  const n = level.count;
  const vx = level.vx;
  const vy = level.vy;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const yi = vy[i];
    const yj = vy[j];
    if (
      yi > py !== yj > py &&
      px < ((vx[j] - vx[i]) * (py - yi)) / (yj - yi) + vx[i]
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/** Find the nearest point on the hull polygon boundary at a given z-level. */
export function findNearestEdge(
  level: HullBoundaryLevel,
  px: number,
  py: number,
): { edgeIndex: number; cx: number; cy: number; distSq: number } {
  const n = level.count;
  const vx = level.vx;
  const vy = level.vy;

  let bestDistSq = Infinity;
  let bestIdx = 0;
  let bestCx = 0;
  let bestCy = 0;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const ax = vx[i];
    const ay = vy[i];
    const ex = vx[j] - ax;
    const ey = vy[j] - ay;
    const lenSq = ex * ex + ey * ey;

    // Project point onto edge, clamped to [0, 1]
    let t: number;
    if (lenSq < 1e-16) {
      t = 0;
    } else {
      t = ((px - ax) * ex + (py - ay) * ey) / lenSq;
      if (t < 0) t = 0;
      else if (t > 1) t = 1;
    }

    const cx = ax + t * ex;
    const cy = ay + t * ey;
    const dx = px - cx;
    const dy = py - cy;
    const dSq = dx * dx + dy * dy;

    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestIdx = i;
      bestCx = cx;
      bestCy = cy;
    }
  }

  return { edgeIndex: bestIdx, cx: bestCx, cy: bestCy, distSq: bestDistSq };
}

/**
 * Find the hull outline level at or just below the given z-height
 * (conservative: narrower).
 */
export function findLevelForZ(
  boundary: HullBoundaryData,
  z: number,
): HullBoundaryLevel | null {
  const levels = boundary.levels;
  if (levels.length === 0) return null;

  // Below everything → use bottom level
  if (z <= levels[0].z) return levels[0];

  // Walk down to find the level at or just below z
  for (let i = levels.length - 1; i >= 0; i--) {
    if (levels[i].z <= z) return levels[i];
  }
  return levels[0];
}

// ── Chord/hull intersection for the wrap peg ───────────────────────────────

/** Result of `findChordHullCrossing` — a hull-local 3D point. */
export interface ChordCrossingResult {
  px: number;
  py: number;
  pz: number;
}

// Scratch object reused across calls — callers must read before the next call.
const CROSSING_SCRATCH: ChordCrossingResult = { px: 0, py: 0, pz: 0 };

/**
 * Find the point where the chord between two hull-local points crosses the
 * deck-level hull outline. Used by the rope wrap constraint to place the peg
 * when adjacent rope particles end up on opposite sides of the gunwale.
 *
 * The chord is clipped against the topmost (deck-level) outline, which is
 * the surface a rope drapes over when it hangs off the edge of the cockpit.
 * If multiple edges are crossed, the crossing nearest the "outside" particle
 * along the chord is returned — that is the edge the rope is physically
 * wrapped around.
 *
 * Returns `null` if there is no crossing, or if the hull boundary has no
 * deck-level outline yet. When the chord straddles the outline (one endpoint
 * inside, one outside) there will always be at least one crossing for a
 * closed polygon, so `null` is primarily a degenerate-geometry guard.
 *
 * @param aLocalX hull-local X of particle A
 * @param aLocalY hull-local Y of particle A
 * @param aInside whether particle A is inside the deck outline (for picking
 *                the crossing closest to the *outside* particle)
 * @param bLocalX hull-local X of particle B
 * @param bLocalY hull-local Y of particle B
 * @returns a mutated scratch point (valid until the next call), or `null`
 */
export function findChordHullCrossing(
  boundary: HullBoundaryData,
  aLocalX: number,
  aLocalY: number,
  aInside: boolean,
  bLocalX: number,
  bLocalY: number,
): ChordCrossingResult | null {
  const levels = boundary.levels;
  if (levels.length === 0) return null;
  const deckLevel = levels[levels.length - 1];

  const n = deckLevel.count;
  const vx = deckLevel.vx;
  const vy = deckLevel.vy;

  // Chord direction (A → B in hull-local XY).
  const dx = bLocalX - aLocalX;
  const dy = bLocalY - aLocalY;

  // We want the crossing closest to whichever endpoint is *outside* the
  // hull. If A is inside, outside = B (t → 1); otherwise outside = A (t → 0).
  // Track the best t accordingly.
  const preferLargeT = aInside;
  let bestT = preferLargeT ? -Infinity : Infinity;
  let bestX = 0;
  let bestY = 0;
  let found = false;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const ex = vx[j] - vx[i];
    const ey = vy[j] - vy[i];

    // Solve: aLocal + t*(b-a) = v_i + u*e,  with t,u ∈ [0,1].
    // Cramer's rule on the 2x2 system:
    //   [ dx  -ex ] [ t ]   [ vx[i] - aLocalX ]
    //   [ dy  -ey ] [ u ] = [ vy[i] - aLocalY ]
    const denom = dx * -ey - dy * -ex; // = -dx*ey + dy*ex
    if (denom === 0) continue; // parallel

    const rx = vx[i] - aLocalX;
    const ry = vy[i] - aLocalY;
    const t = (rx * -ey - ry * -ex) / denom;
    if (t < 0 || t > 1) continue;
    const u = (dx * ry - dy * rx) / denom;
    if (u < 0 || u > 1) continue;

    if (preferLargeT ? t > bestT : t < bestT) {
      bestT = t;
      bestX = aLocalX + t * dx;
      bestY = aLocalY + t * dy;
      found = true;
    }
  }

  if (!found) return null;

  CROSSING_SCRATCH.px = bestX;
  CROSSING_SCRATCH.py = bestY;
  CROSSING_SCRATCH.pz = boundary.deckHeight;
  return CROSSING_SCRATCH;
}
