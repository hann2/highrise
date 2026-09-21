import { ShapeOptions, Shape } from "./Shape";
import { V, V2d } from "../../Vector";
import { AABB } from "../collision/AABB";
import type { ShapeRaycastHit } from "../collision/raycast/RaycastHit";

/** Options for creating a Circle. */
export interface CircleOptions extends ShapeOptions {
  /** Circle radius. Default 1. */
  radius?: number;
}

/** A circular collision shape. */
export class Circle extends Shape {
  /** The circle's radius. */
  radius: number;

  constructor(options: CircleOptions = {}) {
    super(options);
    this.radius = options.radius ?? 1;
    this.updateBoundingRadius();
    this.updateArea();
  }

  computeMomentOfInertia(mass: number): number {
    const r = this.radius;
    return (mass * r * r) / 2;
  }

  updateBoundingRadius(): void {
    this.boundingRadius = this.radius;
  }

  updateArea(): void {
    this.area = Math.PI * this.radius * this.radius;
  }

  computeAABB(position: V2d, _angle: number): AABB {
    const r = this.radius;
    const out = new AABB();
    out.upperBound.set(r, r);
    out.lowerBound.set(-r, -r);
    if (position) {
      out.lowerBound.iadd(position);
      out.upperBound.iadd(position);
    }
    return out;
  }

  raycast(
    from: V2d,
    to: V2d,
    position: V2d,
    _angle: number,
    _skipBackfaces: boolean,
  ): ShapeRaycastHit | null {
    const r = this.radius;

    const a = Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2);
    const b =
      2 *
      ((to[0] - from[0]) * (from[0] - position[0]) +
        (to[1] - from[1]) * (from[1] - position[1]));
    const c =
      Math.pow(from[0] - position[0], 2) +
      Math.pow(from[1] - position[1], 2) -
      Math.pow(r, 2);
    const delta = Math.pow(b, 2) - 4 * a * c;

    if (delta < 0) {
      // No intersection
      return null;
    }

    // Find the closest valid intersection
    let fraction: number;
    if (delta === 0) {
      fraction = -b / (2 * a);
    } else {
      const sqrtDelta = Math.sqrt(delta);
      const inv2a = 1 / (2 * a);
      const d1 = (-b - sqrtDelta) * inv2a;
      const d2 = (-b + sqrtDelta) * inv2a;

      // Pick the closest intersection that's within the ray segment
      if (d1 >= 0 && d1 <= 1) {
        fraction = d1;
      } else if (d2 >= 0 && d2 <= 1) {
        fraction = d2;
      } else {
        return null;
      }
    }

    if (fraction < 0 || fraction > 1) {
      return null;
    }

    const point = V(from).ilerp(to, fraction);
    const normal = V(point).isub(position).inormalize();
    const distance = from.distanceTo(to) * fraction;

    return { point, normal, distance, fraction };
  }
}
