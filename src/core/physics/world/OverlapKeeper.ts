import type { Body } from "../body/Body";
import type { Shape } from "../shapes/Shape";

/** Two shapes (and their bodies) touching */
export interface ShapePair {
  bodyA: Body;
  shapeA: Shape;
  bodyB: Body;
  shapeB: Shape;
}

/** Input: one of this step's overlapping shape pairs (a collision or a sensor overlap) */
export type ShapeOverlap = ShapePair;

/** Output for new overlaps: the input pair itself, so it's only good during the step */
export type NewOverlap = ShapeOverlap;

/** Output for ended overlaps: the pair as it was when the overlap began */
export type EndedOverlap = ShapePair;

export interface OverlapChanges {
  newOverlaps: NewOverlap[];
  endedOverlaps: EndedOverlap[];
  /** Body pairs that just started overlapping (for firstImpact flag), by `bodyKey` */
  newlyOverlappingBodies: ReadonlySet<PairKey>;
}

/** A key for an unordered pair of ids (see `tupleToInt`) */
export type PairKey = number | string;

/** Below this, `lo * 2^32 + hi` is an exact number (2^21: it has to fit in 53 bits) */
const MAX_NUMERIC_LO = 2 ** 21;
const HI_FACTOR = 2 ** 32;

/**
 * A unique key for a pair of ids, ignoring their order: a number (cheap to
 * make and to look up) as long as the smaller id is below 2^21, else a
 * string.
 */
export function tupleToInt(a: number, b: number): PairKey {
  const lo = a < b ? a : b;
  const hi = a < b ? b : a;
  return lo < MAX_NUMERIC_LO && hi < HI_FACTOR
    ? lo * HI_FACTOR + hi
    : `${lo}:${hi}`;
}

/** Generates a unique key for a shape pair (order-independent) */
export function shapeKey(shapeA: Shape, shapeB: Shape): PairKey {
  return tupleToInt(shapeA.id, shapeB.id);
}

/** Generates a unique key for a body pair (order-independent) */
export function bodyKey(bodyA: Body, bodyB: Body): PairKey {
  return tupleToInt(bodyA.id, bodyB.id);
}

/**
 * Tracks shape overlaps between frames to detect begin/end contact events.
 * Also tracks body-level overlaps for bodiesAreOverlapping() queries.
 *
 * Its maps and sets are reused from step to step, and an overlap that goes on
 * keeps the record it was given when it began, so a steady pile of contacts
 * makes no garbage.
 */
export class OverlapKeeper {
  /** Last step's shape overlaps, then (while updating) the ones not seen again yet */
  private previousShapeOverlaps = new Map<PairKey, ShapePair>();
  private currentShapeOverlaps = new Map<PairKey, ShapePair>();
  private previousBodyOverlaps = new Set<PairKey>();
  private currentBodyOverlaps = new Set<PairKey>();
  private newlyOverlappingBodies = new Set<PairKey>();

  /**
   * Update with this step's overlaps and return what changed. What it returns
   * is only good until the next update.
   */
  updateOverlaps(
    ...overlapLists: ReadonlyArray<readonly ShapeOverlap[]>
  ): OverlapChanges {
    const previous = this.previousShapeOverlaps;
    const current = this.currentShapeOverlaps;
    current.clear();
    // Last step's body overlaps become the previous ones
    const previousBodies = this.currentBodyOverlaps;
    const currentBodies = this.previousBodyOverlaps;
    currentBodies.clear();
    const newlyOverlappingBodies = this.newlyOverlappingBodies;
    newlyOverlappingBodies.clear();

    const newOverlaps: NewOverlap[] = [];
    for (const overlaps of overlapLists) {
      for (const overlap of overlaps) {
        const key = shapeKey(overlap.shapeA, overlap.shapeB);
        if (current.has(key)) {
          continue;
        }
        const ongoing = previous.get(key);
        if (ongoing) {
          // What's left in `previous` at the end has ended
          previous.delete(key);
          current.set(key, ongoing);
        } else {
          const { bodyA, shapeA, bodyB, shapeB } = overlap;
          current.set(key, { bodyA, shapeA, bodyB, shapeB });
          newOverlaps.push(overlap);
        }

        const pair = bodyKey(overlap.bodyA, overlap.bodyB);
        currentBodies.add(pair);
        if (!previousBodies.has(pair)) {
          newlyOverlappingBodies.add(pair);
        }
      }
    }

    const endedOverlaps: EndedOverlap[] = [...previous.values()];

    // This step's become the previous ones
    this.previousShapeOverlaps = current;
    this.currentShapeOverlaps = previous;
    this.previousBodyOverlaps = previousBodies;
    this.currentBodyOverlaps = currentBodies;

    return { newOverlaps, endedOverlaps, newlyOverlappingBodies };
  }

  /** Check if two bodies are currently overlapping (any of their shapes). */
  bodiesAreOverlapping(bodyA: Body, bodyB: Body): boolean {
    return this.currentBodyOverlaps.has(bodyKey(bodyA, bodyB));
  }
}
