import { V2d } from "../../Vector";

/**
 * Result of a collision detection between two shapes.
 * Contains the raw collision data (contact points, normals, depths)
 * before equation generation.
 */
export interface CollisionContact {
  /** Contact point on shape A in world space */
  worldContactA: V2d;
  /** Contact point on shape B in world space */
  worldContactB: V2d;
  /** Contact normal (pointing from shape A to shape B) */
  normal: V2d;
  /** Penetration depth (positive = overlapping) */
  depth: number;
}

/**
 * Result from collision detection.
 * Null means no collision.
 */
export interface CollisionResult {
  /** Individual contacts found */
  contacts: CollisionContact[];
}

/**
 * Creates an empty collision result
 */
export function createCollisionResult(): CollisionResult {
  return {
    contacts: [],
  };
}
