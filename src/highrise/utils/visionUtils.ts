import { Ray, RaycastResult } from "p2";
import BaseEntity from "../../core/entity/BaseEntity";
import Game from "../../core/Game";
import CustomWorld from "../../core/physics/CustomWorld";
import { CollisionGroups } from "../Collision";
import Human from "../entities/human/Human";
import Zombie from "../entities/Zombie";

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
    collisionMask: CollisionGroups.World,
  });
  const result = new RaycastResult();
  (looker.game!.world as CustomWorld).raycast(result, ray, false);
  return result.body === target.body || result.body == null;
}

// Returns the zombie that is nearest to and visible by a given human
export function getNearestVisibleZombie(
  game: Game,
  human: Human
): Zombie | undefined {
  const zombies = game.entities.getTagged("zombie") as Zombie[];

  let nearestVisibleZombie: Zombie | undefined;
  let nearestDistance: number = Infinity;

  for (const zombie of zombies) {
    const isVisible = testLineOfSight(human, zombie);
    const distance = zombie.getPosition().sub(human.getPosition()).magnitude;
    if (isVisible && distance < nearestDistance) {
      nearestDistance = distance;
      nearestVisibleZombie = zombie;
    }
  }

  return nearestVisibleZombie;
}
