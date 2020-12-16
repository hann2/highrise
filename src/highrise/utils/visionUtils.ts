import { Ray, RaycastResult } from "p2";
import BaseEntity from "../../core/entity/BaseEntity";
import Game from "../../core/Game";
import CustomWorld from "../../core/physics/CustomWorld";
import { Enemy, isEnemy } from "../enemies/Enemy";
import Human from "../human/Human";
import { CollisionGroups } from "../config/CollisionGroups";

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
    collisionMask: CollisionGroups.Walls,
  });
  const result = new RaycastResult();
  (looker.game!.world as CustomWorld).raycast(result, ray, true);
  return result.body === target.body || result.body == null;
}

// Returns the zombie that is nearest to and visible by a given human
export function getNearestVisibleEnemy(
  game: Game,
  human: Human,
  maxDistance: number = Infinity
): Enemy | undefined {
  const enemies = game.entities.getByFilter(isEnemy);

  let nearestVisibleEnemy: Enemy | undefined;
  let nearestDistance: number = maxDistance;

  for (const enemy of enemies) {
    const distance = enemy.getPosition().sub(human.getPosition()).magnitude;
    if (distance < maxDistance) {
      const isVisible = testLineOfSight(human, enemy);
      if (isVisible) {
        nearestDistance = distance;
        nearestVisibleEnemy = enemy;
      }
    }
  }

  return nearestVisibleEnemy;
}
