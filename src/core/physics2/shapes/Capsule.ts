import { ShapeOptions, Shape } from "./Shape";
import { V, V2d } from "../../Vector";
import { AABB } from "../collision/AABB";
import type { ShapeRaycastHit } from "../collision/raycast/RaycastHit";

/** Options for creating a Capsule. */
export interface CapsuleOptions extends ShapeOptions {
  /** Distance between circle centers. Default 1. */
  length?: number;
  /** Radius of the end caps. Default 1. */
  radius?: number;
}

const r = V();

/** A capsule shape (rectangle with semicircular end caps). Also called a stadium. */
export class Capsule extends Shape {
  /** Distance between the two circle centers. */
  length: number;
  /** Radius of the semicircular end caps. */
  radius: number;

  constructor(options: CapsuleOptions = {}) {
    super(options);
    this.length = options.length ?? 1;
    this.radius = options.radius ?? 1;
    this.updateBoundingRadius();
    this.updateArea();
  }

  computeMomentOfInertia(mass: number): number {
    // Approximate with rectangle
    const rad = this.radius;
    const w = this.length + rad;
    const h = rad * 2;
    return (mass * (h * h + w * w)) / 12;
  }

  updateBoundingRadius(): void {
    this.boundingRadius = this.radius + this.length / 2;
  }

  updateArea(): void {
    this.area =
      Math.PI * this.radius * this.radius + this.radius * 2 * this.length;
  }

  computeAABB(position: V2d, angle: number): AABB {
    const radius = this.radius;

    r.set(this.length / 2, 0);
    if (angle !== 0) {
      r.irotate(angle);
    }

    const out = new AABB();
    out.upperBound.set(
      Math.max(r[0] + radius, -r[0] + radius),
      Math.max(r[1] + radius, -r[1] + radius),
    );
    out.lowerBound.set(
      Math.min(r[0] - radius, -r[0] - radius),
      Math.min(r[1] - radius, -r[1] - radius),
    );

    out.lowerBound.iadd(position);
    out.upperBound.iadd(position);
    return out;
  }

  raycast(
    from: V2d,
    to: V2d,
    position: V2d,
    angle: number,
    _skipBackfaces: boolean,
  ): ShapeRaycastHit | null {
    let closestHit: ShapeRaycastHit | null = null;
    let closestFraction = Infinity;
    const rayLength = from.distanceTo(to);

    const halfLen = this.length / 2;

    // The sides
    for (let i = 0; i < 2; i++) {
      const y = this.radius * (i * 2 - 1);
      const l0 = V(-halfLen, y).itoGlobalFrame(position, angle);
      const l1 = V(halfLen, y).itoGlobalFrame(position, angle);

      const fraction = V2d.lineSegmentsIntersectionFraction(from, to, l0, l1);
      if (fraction >= 0 && fraction < closestFraction) {
        closestFraction = fraction;
        const normal = V(0, 1)
          .irotate(angle)
          .imul(i * 2 - 1);
        const point = V(from).ilerp(to, fraction);
        closestHit = {
          point,
          normal,
          distance: rayLength * fraction,
          fraction,
        };
      }
    }

    // End cap circles
    const diagonalLengthSquared =
      Math.pow(this.radius, 2) + Math.pow(halfLen, 2);

    for (let i = 0; i < 2; i++) {
      const circleCenter = V(halfLen * (i * 2 - 1), 0).itoGlobalFrame(
        position,
        angle,
      );

      const a = Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2);
      const b =
        2 *
        ((to[0] - from[0]) * (from[0] - circleCenter[0]) +
          (to[1] - from[1]) * (from[1] - circleCenter[1]));
      const c =
        Math.pow(from[0] - circleCenter[0], 2) +
        Math.pow(from[1] - circleCenter[1], 2) -
        Math.pow(this.radius, 2);
      const delta = Math.pow(b, 2) - 4 * a * c;

      if (delta < 0) {
        continue;
      }

      const sqrtDelta = Math.sqrt(delta);
      const inv2a = 1 / (2 * a);
      const d1 = (-b - sqrtDelta) * inv2a;
      const d2 = (-b + sqrtDelta) * inv2a;

      // Check both intersection points
      for (const fraction of [d1, d2]) {
        if (fraction >= 0 && fraction <= 1 && fraction < closestFraction) {
          const hitPoint = V(from).ilerp(to, fraction);
          // Only count hits on the end caps (outside the rectangular part)
          if (hitPoint.squaredDistanceTo(position) > diagonalLengthSquared) {
            closestFraction = fraction;
            const normal = V(hitPoint).isub(circleCenter).inormalize();
            closestHit = {
              point: hitPoint,
              normal,
              distance: rayLength * fraction,
              fraction,
            };
          }
        }
      }
    }

    return closestHit;
  }
}
