import { V } from "../../Vector";
import type { Body } from "../body/Body";
import { AABB } from "../collision/AABB";

// Scratch space, so updating an AABB allocates nothing
const offset = V();
const shapeAABB = new AABB();

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

    offset.set(shape.position);
    offset.irotate(bodyAngle);
    offset.iadd(body.position);

    if (i === 0) {
      shape.computeAABB(offset, angle, body.aabb);
    } else {
      body.aabb.extend(shape.computeAABB(offset, angle, shapeAABB));
    }
  }

  body.aabbNeedsUpdate = false;
}
