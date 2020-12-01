import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Human from "./Human";
import Zombie from "./Zombie";
import { V2d } from "../../core/Vector";
import { testLineOfSight } from "../utils/visionUtils";
import Interactable from "./Interactable";

const FOLLOW_DISTANCE = 2; // meters

export default class AIHumanController
  extends BaseEntity
  implements Entity, Interactable {
  human: Human;
  following?: Human;
  lastSeenPositionOfFollowing?: V2d;

  constructor(human: Human, following?: Human) {
    super();
    this.human = human;
    this.following = following;
  }

  getPosition() {
    return this.human.getPosition();
  }

  interact(player: Human): boolean {
    if (this.following) {
      return false;
    }

    this.following = player;
    const party = player.parent as BaseEntity;
    party.addChild(this, true);
    party.addChild(this.human, true);

    return true;
  }

  onTick() {
    const zombies = this.game!.entities.getTagged("zombie") as Zombie[];

    let nearestVisibleZombie: Zombie | undefined;
    let nearestDistance: number = Infinity;

    for (const zombie of zombies) {
      const isVisible = testLineOfSight(this.human, zombie);
      const distance = zombie.getPosition().sub(this.human.getPosition())
        .magnitude;
      if (isVisible && distance < nearestDistance) {
        nearestDistance = distance;
        nearestVisibleZombie = zombie;
      }
    }

    if (nearestVisibleZombie) {
      const direction = nearestVisibleZombie
        .getPosition()
        .sub(this.human.getPosition()).angle;

      this.human.setDirection(direction);
      this.human.pullTrigger();
    } else if (this.following) {
      if (testLineOfSight(this.human, this.following)) {
        this.lastSeenPositionOfFollowing = this.following.getPosition();
        const direction = this.lastSeenPositionOfFollowing.sub(
          this.human.getPosition()
        );
        const distance = direction.magnitude;
        if (distance > FOLLOW_DISTANCE) {
          this.human.walk(direction.normalize());
        }
      } else if (this.lastSeenPositionOfFollowing) {
        const direction = this.lastSeenPositionOfFollowing.sub(
          this.human.getPosition()
        );
        this.human.walk(direction.normalize());
      }
    }

    if (this.human.hp <= 0) {
      this.human.destroy();
      this.destroy();
      // should gun drop???
    }
  }
}
