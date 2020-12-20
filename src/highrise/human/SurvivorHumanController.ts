import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { rBool } from "../../core/util/Random";
import { getNearestVisibleEnemy } from "../utils/visionUtils";
import Gun from "../weapons/guns/Gun";
import MeleeWeapon from "../weapons/melee/MeleeWeapon";
import { BaseEnemy } from "../enemies/base/Enemy";
import Human from "./Human";
import Interactable from "../environment/Interactable";

const MAX_ATTACK_DISTANCE = 10; // meters
// Controller for a human that is waiting to be found
export default class SurvivorHumanController
  extends BaseEntity
  implements Entity {
  tags = ["survivor_controller"];

  // The human this AI is controlling
  human: Human;
  // The zombie this AI is currently shooting at
  target?: BaseEnemy;

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

  scanForTargets() {
    this.target = getNearestVisibleEnemy(
      this.game!,
      this.human,
      MAX_ATTACK_DISTANCE
    );
  }

  onTick(dt: number) {
    // If our human dies/gets removed, we shouldn't be here anymore
    if (!this.human.game) {
      this.destroy();
      return;
    }

    const weapon = this.human.weapon;
    if (weapon instanceof Gun && weapon.ammo === 0 && !weapon.isReloading) {
      this.human.reload();
    }

    if (this.target?.isDestroyed) {
      this.target = undefined;
    }

    if (rBool(dt * 2.0)) {
      // about twice per second
      this.scanForTargets();
    }

    if (this.target) {
      const displacement = this.target
        .getPosition()
        .isub(this.human.getPosition());

      this.human.setDirection(displacement.angle);

      if (weapon instanceof Gun) {
        if (weapon.canShoot() && rBool(0.4)) {
          this.human.useWeapon();
        }
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
