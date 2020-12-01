import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Human from "./Human";
import Zombie from "./Zombie";
import { V2d } from "../../core/Vector";

const FOLLOW_DISTANCE = 2;

export default class AIHumanController
  extends BaseEntity
  implements Entity {
  human: Human;
  player: Human;
  lastSeenPositionOfPlayer?: V2d;

  constructor(human: Human, player: Human) {
    super();
    this.human = human;
    this.player = player;
  }

  onTick() {
    const zombies = this.game!.entities.getTagged("zombie") as Zombie[];

    let nearestVisibleZombie: Zombie | undefined;
    let nearestDistance: number = Infinity;

    for (const zombie of zombies) {
      const isVisible = this.human.hasVisionOf(zombie);
      const distance = zombie.getPosition().sub(this.human.getPosition()).magnitude;
      if (isVisible && distance < nearestDistance) {
        nearestDistance = distance;
        nearestVisibleZombie = zombie;
      }
    }

    if (nearestVisibleZombie) {
      const direction = nearestVisibleZombie
        .getPosition()
        .sub(this.human.getPosition())
        .inormalize();
        
      this.human.firing = true;
      this.human.direction = direction;
    } else {
      this.human.firing = false;

      if (this.human.hasVisionOf(this.player)) {
        this.lastSeenPositionOfPlayer = this.player.getPosition();
        const direction = this.lastSeenPositionOfPlayer.sub(this.human.getPosition());
        const distance = direction.magnitude;
        if (distance > FOLLOW_DISTANCE) {
          this.human.walk(direction.normalize());
        }
      } else if (this.lastSeenPositionOfPlayer) {
        const direction = this.lastSeenPositionOfPlayer.sub(this.human.getPosition());
        this.human.walk(direction.normalize());
      }
    }
    
  }
}
