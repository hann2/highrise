import type { Body } from "../body/Body";
import type { ContactEquation } from "../equations/ContactEquation";
import type { Shape } from "../shapes/Shape";

/** Input: current frame's overlapping shape pairs with their contact equations */
export interface ShapeOverlap {
  bodyA: Body;
  shapeA: Shape;
  bodyB: Body;
  shapeB: Shape;
  contactEquations: ContactEquation[]; // empty for sensors
}

/** Output for new overlaps - includes contact equations for beginContact event */
export interface NewOverlap {
  bodyA: Body;
  shapeA: Shape;
  bodyB: Body;
  shapeB: Shape;
  contactEquations: ContactEquation[];
}

/** Output for ended overlaps - just body/shape refs for endContact event */
export interface EndedOverlap {
  bodyA: Body;
  shapeA: Shape;
  bodyB: Body;
  shapeB: Shape;
}

export interface OverlapChanges {
  newOverlaps: NewOverlap[];
  endedOverlaps: EndedOverlap[];
  /** Body pairs that just started overlapping (for firstImpact flag) */
  newlyOverlappingBodies: Set<string>;
}

/** Returns a unique id for a tuple of two numbers, ignoring number order */
export function tupleToInt(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/** Generates a unique key for a shape pair (order-independent) */
export function shapeKey(shapeA: Shape, shapeB: Shape): string {
  return tupleToInt(shapeA.id, shapeB.id);
}

/** Generates a unique key for a body pair (order-independent) */
export function bodyKey(bodyA: Body, bodyB: Body): string {
  return tupleToInt(bodyA.id, bodyB.id);
}

/**
 * Tracks shape overlaps between frames to detect begin/end contact events.
 * Also tracks body-level overlaps for bodiesAreOverlapping() queries.
 */
export class OverlapKeeper {
  private previousShapeOverlaps = new Map<string, EndedOverlap>();
  private previousBodyOverlaps = new Set<string>();
  private currentBodyOverlaps = new Set<string>();

  /** Update with current frame's overlaps and return what changed. */
  updateOverlaps(currentOverlaps: readonly ShapeOverlap[]): OverlapChanges {
    // Build map of current shape overlaps and set of body overlaps
    const currentShapeMap = new Map<string, ShapeOverlap>();
    const currentBodySet = new Set<string>();

    for (const overlap of currentOverlaps) {
      currentShapeMap.set(shapeKey(overlap.shapeA, overlap.shapeB), overlap);
      currentBodySet.add(bodyKey(overlap.bodyA, overlap.bodyB));
    }

    // New overlaps: in current but not in previous
    const newOverlaps: NewOverlap[] = [];
    for (const [key, overlap] of currentShapeMap) {
      if (!this.previousShapeOverlaps.has(key)) {
        newOverlaps.push(overlap);
      }
    }

    // Ended overlaps: in previous but not in current
    const endedOverlaps: EndedOverlap[] = [];
    for (const [key, overlap] of this.previousShapeOverlaps) {
      if (!currentShapeMap.has(key)) {
        endedOverlaps.push(overlap);
      }
    }

    // Body pairs that just started overlapping
    const newlyOverlappingBodies = new Set<string>();
    for (const key of currentBodySet) {
      if (!this.previousBodyOverlaps.has(key)) {
        newlyOverlappingBodies.add(key);
      }
    }

    // Store current as previous for next frame
    this.previousShapeOverlaps = new Map();
    for (const [key, overlap] of currentShapeMap) {
      this.previousShapeOverlaps.set(key, {
        bodyA: overlap.bodyA,
        shapeA: overlap.shapeA,
        bodyB: overlap.bodyB,
        shapeB: overlap.shapeB,
      });
    }
    this.previousBodyOverlaps = this.currentBodyOverlaps;
    this.currentBodyOverlaps = currentBodySet;

    return { newOverlaps, endedOverlaps, newlyOverlappingBodies };
  }

  /** Check if two bodies are currently overlapping (any of their shapes). */
  bodiesAreOverlapping(bodyA: Body, bodyB: Body): boolean {
    return this.currentBodyOverlaps.has(bodyKey(bodyA, bodyB));
  }
}
