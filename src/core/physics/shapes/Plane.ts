import { V, V2d } from "../../Vector";
import { AABB } from "../collision/AABB";
import type { ShapeRaycastHit } from "../collision/raycast/RaycastHit";
import { ShapeOptions, Shape } from "./Shape";

/**
 * Infinite plane shape class.
 * The plane is oriented along the local X axis, with normal pointing in +Y direction.
 */
export class Plane extends Shape {
  constructor(options: ShapeOptions = {}) {
    super(options);
    this.updateBoundingRadius();
    this.updateArea();
  }

  computeMomentOfInertia(_mass: number): number {
    return 0; // Infinite plane has infinite moment of inertia (static)
  }

  updateBoundingRadius(): void {
    this.boundingRadius = Number.MAX_VALUE;
  }

  updateArea(): void {
    this.area = Number.MAX_VALUE;
  }

  computeAABB(_position: V2d, _angle: number): AABB {
    const out = new AABB();
    const max = Number.MAX_VALUE;
    out.lowerBound.set(-max, -max);
    out.upperBound.set(max, max);
    return out;
  }

  raycast(
    from: V2d,
    to: V2d,
    position: V2d,
    angle: number,
    _skipBackfaces: boolean,
  ): ShapeRaycastHit | null {
    // World normal of plane (rotated +Y)
    const worldNormal = V(0, 1).irotate(angle);

    // Direction from ray start to plane position
    const planeToRay = V(from).isub(position);

    // Distance from ray start to plane along plane normal
    const d1 = worldNormal.dot(planeToRay);

    // Ray direction projected onto plane normal
    const rayDir = V(to).isub(from);
    const d2 = worldNormal.dot(rayDir);

    // Ray is parallel to plane or pointing away
    if (d2 >= 0) {
      return null;
    }

    // Compute intersection fraction
    const fraction = d1 / -d2;

    if (fraction >= 0 && fraction <= 1) {
      const point = V(from).ilerp(to, fraction);
      const distance = from.distanceTo(to) * fraction;
      return { point, normal: worldNormal, distance, fraction };
    }
    return null;
  }
}
