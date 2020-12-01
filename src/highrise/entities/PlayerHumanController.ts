import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Human from "./Human";
import { V } from "../../core/Vector";

// Maps keyboard/mouse/gamepad input to human actions
export default class PlayerHumanController
  extends BaseEntity
  implements Entity {
  human: Human;

  constructor(human: Human) {
    super();
    this.human = human;
  }

  onTick() {
    this.human.firing = !!this.game?.io.lmb;
    
    const direction = V(0, 0);
    if (this.game?.io.keyIsDown("KeyW")) {
      direction[1] += -1;
    }
    if (this.game?.io.keyIsDown("KeyS")) {
      direction[1] += 1;
    }
    if (this.game?.io.keyIsDown("KeyA")) {
      direction[0] += -1;
    }
    if (this.game?.io.keyIsDown("KeyD")) {
      direction[0] += 1;
    }

    this.human.walk(direction);
  }
}
