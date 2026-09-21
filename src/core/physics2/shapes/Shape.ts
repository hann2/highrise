import type Entity from "../../entity/Entity";
import { CompatibleVector, V, V2d } from "../../Vector";
import type { Body } from "../body/Body";
import { AABB } from "../collision/AABB";
import type { ShapeRaycastHit } from "../collision/raycast/RaycastHit";
import type { Material } from "../material/Material";

/** Options for creating a Shape. */
export interface ShapeOptions {
  /** Offset from body center. */
  position?: CompatibleVector;
  /** Local rotation in radians. */
  angle?: number;
  /** Collision group bit mask (what group this belongs to). Default 1. */
  collisionGroup?: number;
  /** Collision mask bit mask (what groups this collides with). Default 1. */
  collisionMask?: number;
  /** If true, detects overlaps but doesn't create contact forces. */
  sensor?: boolean;
  /** Whether to produce contact forces. Default true. */
  collisionResponse?: boolean;
  /** Material for friction/restitution lookup. */
  material?: Material;
}

/**
 * Abstract base class for collision shapes. Attach to a Body using body.addShape().
 * Concrete implementations: Circle, Box, Convex, Capsule, Line, Plane, Particle, Heightfield.
 */
export abstract class Shape {
  /** @internal */
  static idCounter = 0;

  /** The body this shape is attached to, or null. */
  body: Body | null = null;
  /** The Entity that owns this shape, set by Game.addEntity(). */
  owner?: Entity;

  /** Offset from body center in body-local coordinates. */
  position: V2d;

  /** Local rotation angle in radians. */
  angle: number;

  /** Unique identifier for this shape. */
  id: number;

  /** Bounding circle radius for broad-phase collision. */
  boundingRadius: number = 0;

  /** Bit mask defining what collision group this shape belongs to. */
  collisionGroup: number;

  /** Whether this shape produces contact forces on collision. */
  collisionResponse: boolean;

  /** Bit mask defining what collision groups this shape interacts with. */
  collisionMask: number;

  /** Material for friction/restitution lookup. */
  material?: Material;

  /** Surface area of this shape. */
  area: number = 0;

  /** If true, detects overlaps but doesn't generate contact forces. */
  sensor: boolean;

  constructor(options: ShapeOptions = {}) {
    this.position = V();
    if (options.position) {
      this.position.set(options.position);
    }

    this.angle = options.angle ?? 0;
    this.id = Shape.idCounter++;
    this.collisionGroup = options.collisionGroup ?? 1;
    this.collisionResponse = options.collisionResponse ?? true;
    this.collisionMask = options.collisionMask ?? 1;
    this.material = options.material;
    this.sensor = options.sensor ?? false;

    // Note: updateBoundingRadius() and updateArea() are NOT called here
    // because subclasses need to initialize their shape-specific properties first.
    // Each subclass (Circle, Convex, etc.) calls these methods in their own constructor.
  }

  /** Compute moment of inertia for the given mass. Override in subclasses. */
  computeMomentOfInertia(_mass: number): number {
    return 0;
  }

  /** Recalculate the bounding radius. Called after shape properties change. */
  abstract updateBoundingRadius(): void;

  /** Recalculate the area. Called after shape properties change. */
  abstract updateArea(): void;

  /** Compute the axis-aligned bounding box at the given world position and angle. */
  abstract computeAABB(position: V2d, angle: number): AABB;

  /** Cast a ray against this shape. Returns hit info or null if no hit. */
  abstract raycast(
    from: V2d,
    to: V2d,
    position: V2d,
    angle: number,
    skipBackfaces: boolean,
  ): ShapeRaycastHit | null;
}
