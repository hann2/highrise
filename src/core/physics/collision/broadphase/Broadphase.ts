import type { Body } from "../../body/Body";
import type { World } from "../../world/World";
import type { AABB } from "../AABB";

/**
 * Abstract base class for broadphase collision detection.
 * Broadphase algorithms quickly cull pairs of bodies that cannot possibly collide,
 * reducing the number of expensive narrow-phase checks needed.
 * Implementations: SpatialHashingBroadphase, SAPBroadphase.
 */
export abstract class Broadphase {
  /** @internal Reusable result array for collision pairs. */
  result: [Body, Body][];
  /** The world this broadphase is attached to. */
  world: World | null;

  constructor(world?: World) {
    this.result = [];
    this.world = world ?? null;
  }

  /** Get all potential intersecting body pairs. */
  abstract getCollisionPairs(_world: World): [Body, Body][];

  /**
   * Returns all the bodies within an AABB.
   * @param includeMoving If false, only static bodies (SpatialHashingBroadphase only)
   */
  abstract aabbQuery(
    _world: World,
    _aabb: AABB,
    _includeMoving?: boolean,
  ): Iterable<Body>;

  /** Called when a body in the world gains or loses a shape, which changes its AABB */
  bodyShapesChanged(_body: Body): void {}

  /** Set the world that we are searching for collision pairs in. */
  setWorld(world: World): void {
    this.world = world;
  }

  /** Check whether the AABBs of two bodies overlap. */
  boundingVolumeCheck(bodyA: Body, bodyB: Body): boolean {
    return bodyA.getAABB().overlaps(bodyB.getAABB());
  }
}
