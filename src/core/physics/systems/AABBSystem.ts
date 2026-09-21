import { V } from "../../Vector";
import type { Body } from "../body/Body";

/**
 * Recompute the body's AABB from its shapes and stamp `aabbNeedsUpdate = false`.
 * Ported from the legacy `Body.updateAABB` (Body.ts:305-332).
 */
export function updateAABB(body: Body): void {
  const shapes = body.shapes;
  const N = shapes.length;
  const bodyAngle = body.angle;

  for (let i = 0; i !== N; i++) {
    const shape = shapes[i];
    const angle = shape.angle + bodyAngle;

    const offset = V(shape.position);
    offset.irotate(bodyAngle);
    offset.iadd(body.position);

    const aabb = shape.computeAABB(offset, angle);

    if (i === 0) {
      body.aabb.copy(aabb);
    } else {
      body.aabb.extend(aabb);
    }
  }

  body.aabbNeedsUpdate = false;
}
