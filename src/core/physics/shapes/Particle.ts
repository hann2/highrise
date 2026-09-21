import { ShapeOptions, Shape } from "./Shape";
import { V2d } from "../../Vector";
import { AABB } from "../collision/AABB";
import type { ShapeRaycastHit } from "../collision/raycast/RaycastHit";

/**
 * Particle shape class.
 */
export class Particle extends Shape {
  constructor(options: ShapeOptions = {}) {
    super(options);
    this.updateBoundingRadius();
    this.updateArea();
  }

  computeMomentOfInertia(_mass: number): number {
    return 0; // Can't rotate a particle
  }

  updateBoundingRadius(): void {
    this.boundingRadius = 0;
  }

  updateArea(): void {
    this.area = 0;
  }

  computeAABB(position: V2d, _angle: number): AABB {
    const out = new AABB();
    out.lowerBound.set(position);
    out.upperBound.set(position);
    return out;
  }

  raycast(
    _from: V2d,
    _to: V2d,
    _position: V2d,
    _angle: number,
    _skipBackfaces: boolean,
  ): ShapeRaycastHit | null {
    return null;
  }
}
