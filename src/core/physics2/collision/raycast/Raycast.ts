import { CompatibleVector, V, V2d } from "../../../Vector";
import type { Body } from "../../body/Body";
import type { World } from "../../world/World";
import { AABB } from "../AABB";
import { RaycastHit, RaycastOptions } from "./RaycastHit";

/** Internal ray data for intersection calculations. */
interface RayData {
  from: V2d;
  to: V2d;
  direction: V2d;
  length: number;
}

/** Create ray data from two points. */
function createRay(from: CompatibleVector, to: CompatibleVector): RayData {
  const fromV = V(from[0], from[1]);
  const toV = V(to[0], to[1]);
  const direction = V(toV).isub(fromV);
  const length = direction.magnitude;
  direction.inormalize();
  return { from: fromV, to: toV, direction, length };
}

/** Get AABB containing the ray. */
function getRayAABB(ray: RayData): AABB {
  const aabb = new AABB();
  aabb.lowerBound.set(
    Math.min(ray.from[0], ray.to[0]),
    Math.min(ray.from[1], ray.to[1]),
  );
  aabb.upperBound.set(
    Math.max(ray.from[0], ray.to[0]),
    Math.max(ray.from[1], ray.to[1]),
  );
  return aabb;
}

/** Check if ray potentially intersects a body's AABB. */
function rayMayHitBody(ray: RayData, body: Body): boolean {
  const aabb = body.getAABB();
  return aabb.overlapsRay(ray) >= 0 || aabb.containsPoint(ray.from);
}

/**
 * Cast a ray and return the closest hit, or null if nothing was hit.
 *
 * @param world - The physics world to cast in
 * @param from - Start point of the ray
 * @param to - End point of the ray
 * @param options - Optional raycast configuration
 * @returns The closest hit, or null if nothing was hit
 */
export function raycast(
  world: World,
  from: CompatibleVector,
  to: CompatibleVector,
  options?: RaycastOptions,
): RaycastHit | null {
  const ray = createRay(from, to);
  const aabb = getRayAABB(ray);

  // Get candidate bodies from broadphase
  const candidates = world.broadphase.aabbQuery(world, aabb, true);

  let closestHit: RaycastHit | null = null;
  let closestFraction = Infinity;

  for (const body of candidates) {
    // Skip bodies that don't respond to collisions (if checking)
    if (!body.collisionResponse) {
      continue;
    }

    // Check AABB first
    if (!rayMayHitBody(ray, body)) {
      continue;
    }

    // Apply custom filter
    if (options?.filter && !options.filter(body, body.shapes[0])) {
      continue;
    }

    // Test each shape
    for (const shape of body.shapes) {
      if (!shape.collisionResponse) {
        continue;
      }

      // Check collision mask
      if (options?.collisionMask !== undefined) {
        if ((shape.collisionGroup & options.collisionMask) === 0) {
          continue;
        }
      }

      // Apply filter for this specific shape
      if (options?.filter && !options.filter(body, shape)) {
        continue;
      }

      // Get world position and angle of the shape
      const worldPosition = V(shape.position)
        .irotate(body.angle)
        .iadd(body.position);
      const worldAngle = shape.angle + body.angle;

      // Perform shape-specific raycast
      const hit = shape.raycast(
        ray.from,
        ray.to,
        worldPosition,
        worldAngle,
        options?.skipBackfaces ?? false,
      );

      if (hit && hit.fraction < closestFraction) {
        closestFraction = hit.fraction;
        closestHit = {
          body,
          shape,
          point: hit.point,
          normal: hit.normal,
          distance: hit.distance,
          fraction: hit.fraction,
        };
      }
    }
  }

  return closestHit;
}

/**
 * Cast a ray and return all hits, sorted by distance (closest first).
 *
 * @param world - The physics world to cast in
 * @param from - Start point of the ray
 * @param to - End point of the ray
 * @param options - Optional raycast configuration
 * @returns Array of all hits, sorted by distance
 */
export function raycastAll(
  world: World,
  from: CompatibleVector,
  to: CompatibleVector,
  options?: RaycastOptions,
): RaycastHit[] {
  const ray = createRay(from, to);
  const aabb = getRayAABB(ray);

  // Get candidate bodies from broadphase
  const candidates = world.broadphase.aabbQuery(world, aabb, true);

  const hits: RaycastHit[] = [];

  for (const body of candidates) {
    if (!body.collisionResponse) {
      continue;
    }

    if (!rayMayHitBody(ray, body)) {
      continue;
    }

    if (options?.filter && !options.filter(body, body.shapes[0])) {
      continue;
    }

    for (const shape of body.shapes) {
      if (!shape.collisionResponse) {
        continue;
      }

      if (options?.collisionMask !== undefined) {
        if ((shape.collisionGroup & options.collisionMask) === 0) {
          continue;
        }
      }

      if (options?.filter && !options.filter(body, shape)) {
        continue;
      }

      const worldPosition = V(shape.position)
        .irotate(body.angle)
        .iadd(body.position);
      const worldAngle = shape.angle + body.angle;

      const hit = shape.raycast(
        ray.from,
        ray.to,
        worldPosition,
        worldAngle,
        options?.skipBackfaces ?? false,
      );

      if (hit) {
        hits.push({
          body,
          shape,
          point: hit.point,
          normal: hit.normal,
          distance: hit.distance,
          fraction: hit.fraction,
        });
      }
    }
  }

  // Sort by distance (closest first)
  hits.sort((a, b) => a.distance - b.distance);

  return hits;
}
