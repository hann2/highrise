import { V, V2d } from "../../Vector";
import { ConvexOptions, Convex } from "./Convex";
import { AABB } from "../collision/AABB";

/** Options for creating a Box. */
export interface BoxOptions extends ConvexOptions {
  /** Box width. Default 1. */
  width?: number;
  /** Box height. Default 1. */
  height?: number;
}

/** An axis-aligned rectangular collision shape. Extends Convex. */
export class Box extends Convex {
  /** The box width. */
  width: number;
  /** The box height. */
  height: number;

  constructor(options: BoxOptions = {}) {
    const width = options.width ?? 1;
    const height = options.height ?? 1;

    const verts = [
      V(-width / 2, -height / 2),
      V(width / 2, -height / 2),
      V(width / 2, height / 2),
      V(-width / 2, height / 2),
    ];
    // Need 4 axes (one per edge) for circleConvex collision to work correctly
    const axes = [V(0, -1), V(1, 0), V(0, 1), V(-1, 0)];

    const opts = {
      ...options,
      vertices: verts,
      axes: axes,
    };
    super(opts);

    this.width = width;
    this.height = height;

    // Re-calculate with correct width/height (Convex uses vertex-based calculation)
    this.updateBoundingRadius();
    this.updateArea();
  }

  computeMomentOfInertia(mass: number): number {
    const w = this.width;
    const h = this.height;
    return (mass * (h * h + w * w)) / 12;
  }

  updateBoundingRadius(): void {
    const w = this.width;
    const h = this.height;
    this.boundingRadius = Math.sqrt(w * w + h * h) / 2;
  }

  computeAABB(position: V2d, angle: number): AABB {
    const out = new AABB();
    out.setFromPoints(this.vertices, position, angle, 0);
    return out;
  }

  updateArea(): void {
    this.area = this.width * this.height;
  }
}
