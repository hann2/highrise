import { CollisionGroups } from "../../config/CollisionGroups";
import BaseEntity from "../../core/entity/BaseEntity";
import Game from "../../core/Game";
import { BaseEnemy, isEnemy } from "../enemies/base/Enemy";
import Human from "../human/Human";

// Returns true if there is an unobstructed line-of-sight from the looker to the target
export function testLineOfSight(
  looker: BaseEntity,
  target: BaseEntity,
): boolean {
  const hit = looker.game!.world.raycast(
    looker.getPosition(),
    target.getPosition(),
    { skipBackfaces: true, collisionMask: CollisionGroups.CastsShadow },
  );
  return hit == null || hit.body === target.body;
}

// Returns the zombie that is nearest to and visible by a given human
export function getNearestVisibleEnemy(
  game: Game,
  human: Human,
  maxDistance: number = Infinity,
): BaseEnemy | undefined {
  const enemies = game.entities.getByFilter(isEnemy);

  let nearestVisibleEnemy: BaseEnemy | undefined;
  let nearestDistance: number = maxDistance;

  for (const enemy of enemies) {
    const distance = enemy.getPosition().distanceTo(human.getPosition());
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
