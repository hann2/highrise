import { V2d } from "../../../Vector";
import type { Body } from "../../body/Body";
import type { Shape } from "../../shapes/Shape";

/**
 * Result of a shape-level raycast.
 * Returned by Shape.raycast() without body information.
 */
export interface ShapeRaycastHit {
  /** The hit point in world coordinates */
  point: V2d;
  /** The surface normal at the hit point */
  normal: V2d;
  /** The distance from the ray origin to the hit point */
  distance: number;
  /** The hit fraction (0 = ray start, 1 = ray end) */
  fraction: number;
}

/**
 * Result of a world-level raycast hit.
 * Contains pre-computed values for convenience.
 */
export interface RaycastHit extends ShapeRaycastHit {
  /** The body that was hit */
  body: Body;
  /** The shape that was hit */
  shape: Shape;
}

/**
 * Options for raycast queries.
 */
export interface RaycastOptions {
  /** Collision group mask to filter bodies */
  collisionMask?: number;
  /** Skip hits on the back side of shapes */
  skipBackfaces?: boolean;
  /** Custom filter function to exclude specific bodies/shapes */
  filter?: (body: Body, shape: Shape) => boolean;
}
