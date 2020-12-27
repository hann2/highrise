import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { rBool, rUniform } from "../../core/util/Random";
import { BaseEnemy } from "../enemies/base/Enemy";
import Interactable from "../environment/Interactable";
import { getPartyLeader } from "../environment/PartyManager";
import { getNearestVisibleEnemy, testLineOfSight } from "../utils/visionUtils";
import Gun from "../weapons/guns/Gun";
import { FireMode } from "../weapons/guns/GunStats";
import MeleeWeapon from "../weapons/melee/MeleeWeapon";
import Human, { isHuman, PUSH_RANGE } from "./Human";

const MAX_ATTACK_DISTANCE = 10; // meters

const MIN_TRIGGER_COOLDOWN = 0.0;
const MAX_TRIGGER_COOLDOWN = 0.4;
const AVG_BURST_AMOUNT = 6;

const JOIN_DISTANCE = 2; // meters

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
  triggerOnCooldown: boolean = false;

  constructor(human: Human) {
    super();
    this.human = human;
  }

  joinParty() {
    this.game?.dispatch({
      type: "addToParty",
      human: this.human,
      survivorController: this,
    });
  }

  scanForTargets() {
    this.target = getNearestVisibleEnemy(
      this.game!,
      this.human,
      MAX_ATTACK_DISTANCE
    );
  }

  canSeeLeader() {
    // TODO: This is hacky
    const leader = getPartyLeader(this.game);

    if (!leader) {
      return false;
    }

    const distance = this.human.getPosition().isub(leader.body.position)
      .magnitude;

    if (distance < JOIN_DISTANCE && testLineOfSight(this.human, leader)) {
      return true;
    }
  }

  onTick(dt: number) {
    // If our human dies/gets removed, we shouldn't be here anymore
    if (!this.human.game) {
      this.destroy();
      return;
    }

    if (this.canSeeLeader()) {
      this.joinParty();
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

      const direction = displacement.angle;
      const distance = displacement.magnitude;

      this.human.setDirection(direction, dt);

      if (distance < PUSH_RANGE && this.human.canPush()) {
        this.human.push();
      }

      if (weapon instanceof Gun) {
        if (weapon.canShoot() && !this.triggerOnCooldown) {
          this.human.useWeapon();
          if (
            weapon.stats.fireMode != FireMode.FULL_AUTO ||
            rBool(1 / AVG_BURST_AMOUNT)
          ) {
            this.triggerOnCooldown = true;
            this.wait(
              rUniform(MIN_TRIGGER_COOLDOWN, MAX_TRIGGER_COOLDOWN)
            ).then(() => {
              this.triggerOnCooldown = false;
            });
          }
        }
      } else if (weapon instanceof MeleeWeapon) {
        const maxReach = weapon.stats.size[1] + weapon.swing.maxExtension;
        if (displacement.magnitude < maxReach) {
          this.human.useWeapon();
        }
      }
    }
  }
}
