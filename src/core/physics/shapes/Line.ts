import { ShapeOptions, Shape } from "./Shape";
import { V, V2d } from "../../Vector";
import { AABB } from "../collision/AABB";
import type { ShapeRaycastHit } from "../collision/raycast/RaycastHit";

export interface LineOptions extends ShapeOptions {
  length?: number;
}

const points = [V(), V()];

/**
 * Line shape class. The line shape is along the x direction, and stretches from [-length/2, 0] to [length/2,0].
 */
export class Line extends Shape {
  length: number;

  constructor(options: LineOptions = {}) {
    super(options);
    this.length = options.length ?? 1;
    this.updateBoundingRadius();
    this.updateArea();
  }

  computeMomentOfInertia(mass: number): number {
    return (mass * Math.pow(this.length, 2)) / 12;
  }

  updateBoundingRadius(): void {
    this.boundingRadius = this.length / 2;
  }

  updateArea(): void {
    this.area = 0;
  }

  computeAABB(position: V2d, angle: number): AABB {
    const l2 = this.length / 2;
    points[0].set(-l2, 0);
    points[1].set(l2, 0);
    const out = new AABB();
    out.setFromPoints(points, position, angle, 0);
    return out;
  }

  raycast(
    from: V2d,
    to: V2d,
    position: V2d,
    angle: number,
    _skipBackfaces: boolean,
  ): ShapeRaycastHit | null {
    // Get start and end of the line in world space
    const halfLen = this.length / 2;
    const l0 = V(-halfLen, 0).itoGlobalFrame(position, angle);
    const l1 = V(halfLen, 0).itoGlobalFrame(position, angle);

    const fraction = V2d.lineSegmentsIntersectionFraction(l0, l1, from, to);
    if (fraction >= 0) {
      const normal = V(0, 1).irotate(angle);
      const point = V(from).ilerp(to, fraction);
      const distance = from.distanceTo(to) * fraction;
      return { point, normal, distance, fraction };
    }
    return null;
  }
}
