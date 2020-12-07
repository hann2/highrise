import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { getNearestVisibleZombie } from "../../utils/visionUtils";
import Gun from "../../weapons/Gun";
import Human from "../human/Human";
import Interactable from "../Interactable";
import MeleeWeapon from "../../weapons/MeleeWeapon";

const MAX_ATTACK_DISTANCE = 10; // meters
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
      this.human,
      MAX_ATTACK_DISTANCE
    );

    const weapon = this.human.weapon;
    if (weapon instanceof Gun && weapon.ammo === 0 && !weapon.isReloading) {
      this.human.reload();
    }

    if (nearestVisibleZombie) {
      const displacement = nearestVisibleZombie
        .getPosition()
        .isub(this.human.getPosition());

      this.human.setDirection(displacement.angle);

      if (weapon instanceof Gun && !weapon.isReloading) {
        this.human.useWeapon();
      } else if (weapon instanceof MeleeWeapon) {
        const maxReach = weapon.stats.size[1] + weapon.swing.maxExtension;
        if (displacement.magnitude < maxReach) {
          this.human.useWeapon();
        }
      }
    }

    this.interactable.position = this.human.getPosition();
  }
}
