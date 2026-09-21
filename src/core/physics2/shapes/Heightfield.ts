import { V, V2d } from "../../Vector";
import { AABB } from "../collision/AABB";
import type { ShapeRaycastHit } from "../collision/raycast/RaycastHit";
import { ShapeOptions, Shape } from "./Shape";

export interface HeightfieldOptions extends ShapeOptions {
  heights?: number[];
  minValue?: number;
  maxValue?: number;
  elementWidth?: number;
}

/**
 * Heightfield shape class.
 * Height data is given as an array of Y values spread out evenly with a distance "elementWidth".
 */
export class Heightfield extends Shape {
  heights: number[];
  maxValue: number;
  minValue: number;
  elementWidth: number;

  constructor(options: HeightfieldOptions = {}) {
    super(options);

    this.heights = options.heights ? options.heights.slice(0) : [];
    this.elementWidth = options.elementWidth ?? 0.1;
    this.maxValue = options.maxValue ?? 0;
    this.minValue = options.minValue ?? 0;

    if (options.maxValue === undefined || options.minValue === undefined) {
      this.updateMaxMinValues();
    }

    this.updateBoundingRadius();
    this.updateArea();
  }

  updateMaxMinValues(): void {
    const data = this.heights;
    if (data.length === 0) {
      this.maxValue = 0;
      this.minValue = 0;
      return;
    }

    let maxValue = data[0];
    let minValue = data[0];
    for (let i = 0; i < data.length; i++) {
      const v = data[i];
      if (v > maxValue) {
        maxValue = v;
      }
      if (v < minValue) {
        minValue = v;
      }
    }
    this.maxValue = maxValue;
    this.minValue = minValue;
  }

  computeMomentOfInertia(_mass: number): number {
    return Number.MAX_VALUE;
  }

  updateBoundingRadius(): void {
    this.boundingRadius = Number.MAX_VALUE;
  }

  updateArea(): void {
    const data = this.heights;
    let area = 0;
    for (let i = 0; i < data.length - 1; i++) {
      area += ((data[i] + data[i + 1]) / 2) * this.elementWidth;
    }
    this.area = area;
  }

  computeAABB(position: V2d, angle: number): AABB {
    const out = new AABB();
    const points = [
      V(0, this.maxValue),
      V(this.elementWidth * this.heights.length, this.maxValue),
      V(this.elementWidth * this.heights.length, this.minValue),
      V(0, this.minValue),
    ];
    out.setFromPoints(points, position, angle, 0);
    return out;
  }

  /**
   * Get a line segment in the heightfield.
   * @param i Index of the segment
   * @returns Start and end points of the segment
   */
  getLineSegment(i: number): [V2d, V2d] {
    const data = this.heights;
    const width = this.elementWidth;
    const start = V(i * width, data[i]);
    const end = V((i + 1) * width, data[i + 1]);
    return [start, end];
  }

  /**
   * Get height at a specific index
   */
  getHeightAtIndex(i: number): number {
    return this.heights[i] ?? 0;
  }

  raycast(
    from: V2d,
    to: V2d,
    position: V2d,
    angle: number,
    _skipBackfaces: boolean,
  ): ShapeRaycastHit | null {
    // Transform ray to local space
    const localFrom = V(from).itoLocalFrame(position, angle);
    const localTo = V(to).itoLocalFrame(position, angle);

    // Find which segments the ray might intersect
    const x0 = localFrom.x;
    const x1 = localTo.x;
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);

    const idxStart = Math.max(0, Math.floor(minX / this.elementWidth));
    const idxEnd = Math.min(
      this.heights.length - 2,
      Math.ceil(maxX / this.elementWidth),
    );

    let closestHit: ShapeRaycastHit | null = null;
    let closestFraction = Infinity;
    const rayLength = from.distanceTo(to);

    for (let i = idxStart; i <= idxEnd; i++) {
      const [segStart, segEnd] = this.getLineSegment(i);

      // Check intersection with this segment
      const fraction = V2d.lineSegmentsIntersectionFraction(
        localFrom,
        localTo,
        segStart,
        segEnd,
      );

      if (fraction >= 0 && fraction < closestFraction) {
        closestFraction = fraction;
        // Compute normal (perpendicular to segment, pointing up)
        const normal = V(segEnd).isub(segStart);
        normal.irotate(-Math.PI / 2);
        normal.inormalize();
        // Transform normal to world space
        normal.irotate(angle);

        const point = V(from).ilerp(to, fraction);
        closestHit = {
          point,
          normal,
          distance: rayLength * fraction,
          fraction,
        };
      }
    }

    return closestHit;
  }
}
