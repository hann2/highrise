import { V, V2d, CompatibleVector } from "../../Vector";

/** Minimal ray interface for AABB overlap testing and spatial queries. */
export interface RayLike {
  from: CompatibleVector;
  to: CompatibleVector;
  direction: CompatibleVector;
}

export interface AABBOptions {
  upperBound?: CompatibleVector;
  lowerBound?: CompatibleVector;
}

/** Axis aligned bounding box class. */
export class AABB {
  lowerBound: V2d;
  upperBound: V2d;

  constructor(options: AABBOptions = {}) {
    this.lowerBound = V();
    if (options.lowerBound) {
      this.lowerBound.set(options.lowerBound);
    }

    this.upperBound = V();
    if (options.upperBound) {
      this.upperBound.set(options.upperBound);
    }
  }

  /** Set the AABB bounds from a set of points, transformed by the given position and angle. */
  setFromPoints(
    points: CompatibleVector[],
    position?: CompatibleVector,
    angle: number = 0,
    skinSize: number = 0,
  ): this {
    const l = this.lowerBound;
    const u = this.upperBound;

    // Set to the first point
    if (angle !== 0) {
      l.set(points[0]).irotate(angle);
    } else {
      l.set(points[0]);
    }
    u.set(l);

    // Compute cosines and sines just once
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    for (let i = 1; i < points.length; i++) {
      let p: CompatibleVector = points[i];

      if (angle !== 0) {
        const x = p[0];
        const y = p[1];
        const rotated = V(
          cosAngle * x - sinAngle * y,
          sinAngle * x + cosAngle * y,
        );
        p = rotated;
      }

      if (p[0] > u[0]) u[0] = p[0];
      if (p[1] > u[1]) u[1] = p[1];
      if (p[0] < l[0]) l[0] = p[0];
      if (p[1] < l[1]) l[1] = p[1];
    }

    // Add offset
    if (position) {
      this.lowerBound.iadd(position);
      this.upperBound.iadd(position);
    }

    if (skinSize) {
      this.lowerBound[0] -= skinSize;
      this.lowerBound[1] -= skinSize;
      this.upperBound[0] += skinSize;
      this.upperBound[1] += skinSize;
    }
    return this;
  }

  /** Copy bounds from an AABB to this AABB */
  copy(aabb: AABB): this {
    this.lowerBound.set(aabb.lowerBound);
    this.upperBound.set(aabb.upperBound);
    return this;
  }

  /** Extend this AABB so that it covers the given AABB too. */
  extend(aabb: AABB): this {
    for (let i = 1; i >= 0; i--) {
      // Extend lower bound
      const l = aabb.lowerBound[i];
      if (this.lowerBound[i] > l) {
        this.lowerBound[i] = l;
      }

      // Upper
      const u = aabb.upperBound[i];
      if (this.upperBound[i] < u) {
        this.upperBound[i] = u;
      }
    }
    return this;
  }

  /** Returns true if the given AABB overlaps this AABB. */
  overlaps(aabb: AABB): boolean {
    const l1 = this.lowerBound;
    const u1 = this.upperBound;
    const l2 = aabb.lowerBound;
    const u2 = aabb.upperBound;

    return (
      ((l2[0] <= u1[0] && u1[0] <= u2[0]) ||
        (l1[0] <= u2[0] && u2[0] <= u1[0])) &&
      ((l2[1] <= u1[1] && u1[1] <= u2[1]) || (l1[1] <= u2[1] && u2[1] <= u1[1]))
    );
  }

  /** Check if this AABB contains the given point */
  containsPoint(point: CompatibleVector): boolean {
    const l = this.lowerBound;
    const u = this.upperBound;
    return (
      l[0] <= point[0] &&
      point[0] <= u[0] &&
      l[1] <= point[1] &&
      point[1] <= u[1]
    );
  }

  /**
   * Check if the AABB is hit by a ray.
   * @returns -1 if no hit, a number between 0 and 1 if hit.
   */
  overlapsRay(ray: RayLike): number {
    // ray.direction is unit direction vector of ray
    const dirFracX = 1 / ray.direction[0];
    const dirFracY = 1 / ray.direction[1];

    // this.lowerBound is the corner of AABB with minimal coordinates - left bottom, rt is maximal corner
    const t1 = (this.lowerBound[0] - ray.from[0]) * dirFracX;
    const t2 = (this.upperBound[0] - ray.from[0]) * dirFracX;
    const t3 = (this.lowerBound[1] - ray.from[1]) * dirFracY;
    const t4 = (this.upperBound[1] - ray.from[1]) * dirFracY;

    const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
    const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

    // if tmax < 0, ray (line) is intersecting AABB, but whole AABB is behind us
    if (tmax < 0) {
      return -1;
    }

    // if tmin > tmax, ray doesn't intersect AABB
    if (tmin > tmax) {
      return -1;
    }

    return tmin;
  }
}
