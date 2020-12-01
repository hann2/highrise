import BaseEntity from "../../core/entity/BaseEntity";
import { Ray, RaycastResult } from "p2";

// Returns true if there is an unobstructed line-of-sight from the looker to the target
export function testLineOfSight(
  looker: BaseEntity,
  target: BaseEntity
): boolean {
  const ray = new Ray({
    mode: Ray.CLOSEST,
    from: looker.getPosition(),
    to: target.getPosition(),
    skipBackfaces: true,
  });
  const result = new RaycastResult();
  looker.game!.world.raycast(result, ray);
  return result.body === target.body;
}
