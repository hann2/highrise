import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { getNearestVisibleZombie } from "../../utils/visionUtils";
import Human from "../Human";
import Interactable from "../Interactable";

// Controller for a human that is waiting to be found
export default class SurvivorHumanController
  extends BaseEntity
  implements Entity {
  tags = ["survivor_controller"];

  // The human this AI is controlling
  human: Human;

  // The interaction target to make this human follow the player
  interactable: Interactable;

  constructor(human: Human) {
    super();
    this.human = human;
    this.interactable = this.addChild(
      new Interactable(this.human.getPosition(), (interacter) => {
        this.game?.dispatch({
          type: "addToParty",
          human: this.human,
          survivorController: this,
        });
      })
    );
  }

  onTick() {
    // If our human dies/gets removed, we shouldn't be here anymore
    if (!this.human.game) {
      this.destroy();
      return;
    }

    const nearestVisibleZombie = getNearestVisibleZombie(
      this.game!,
      this.human
    );

    if (nearestVisibleZombie) {
      const direction = nearestVisibleZombie
        .getPosition()
        .isub(this.human.getPosition()).angle;

      this.human.setDirection(direction);
      this.human.pullTrigger();
    }

    this.interactable.position = this.human.getPosition();
  }
}
