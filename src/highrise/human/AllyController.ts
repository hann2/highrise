import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { rBool, rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import HealthPickup from "../environment/HealthPickup";
import WeaponPickup from "../environment/WeaponPickup";
import { getNearestVisibleEnemy, testLineOfSight } from "../utils/visionUtils";
import Gun from "../weapons/guns/Gun";
import { getGunTier } from "../weapons/guns/gun-stats/gunStats";
import { FireMode } from "../weapons/guns/GunStats";
import MeleeWeapon from "../weapons/melee/MeleeWeapon";
import { Weapon } from "../weapons/weapons";
import Human, { PUSH_RANGE } from "./Human";

const FOLLOW_DISTANCE = 2; // meters
const MAX_SHOOT_DISTANCE = 10; // meters

const MIN_TRIGGER_COOLDOWN = 0.0;
const MAX_TRIGGER_COOLDOWN = 0.4;
const AVG_BURST_AMOUNT = 6;

// Controller for a human that is in the party
export default class AllyHumanController extends BaseEntity implements Entity {
  tags = ["ally_controller"];
  persistenceLevel = Persistence.Game;

  triggerOnCooldown: boolean = false;
  lastSeenPositionOfLeader?: V2d;

  constructor(public human: Human, public getLeader: () => Human) {
    super();
  }

  onTick() {
    const human = this.human;
    const leader = this.getLeader();
    // If our human dies/gets removed, we shouldn't be here anymore
    if (!human.game) {
      this.destroy();
      return;
    }

    if (human === leader) {
      return;
    }

    const weapon = human.weapon;

    // pick stuff up if possible
    const nearestInteractable = human.getNearbyInteractables()[0];
    if (nearestInteractable) {
      if (nearestInteractable.parent instanceof HealthPickup) {
        if (leader.hp < human.hp) {
          // make sure leader gets healing priority
          human.voice.speak("lookHere");
        } else if (human.hp < human.maxHp) {
          human.interactWithNearest();
        }
      } else if (nearestInteractable.parent instanceof WeaponPickup) {
        const otherWeapon = nearestInteractable.parent.weapon;
        if (weaponIsMoreDesirable(leader.weapon, otherWeapon)) {
          // Make sure player gets gun priority
          human.voice.speak("lookHere");
        } else if (weaponIsMoreDesirable(weapon, otherWeapon)) {
          human.interactWithNearest();
        }
      }
    }

    const nearestVisibleZombie = getNearestVisibleEnemy(
      this.game!,
      human,
      MAX_SHOOT_DISTANCE
    );

    if (weapon instanceof Gun && weapon.ammo === 0 && !weapon.isReloading) {
      human.reload();
    }

    if (nearestVisibleZombie) {
      const displacement = nearestVisibleZombie
        .getPosition()
        .isub(human.getPosition());
      const direction = displacement.angle;
      const distance = displacement.magnitude;

      human.setDirection(direction);

      if (distance < PUSH_RANGE && human.canPush()) {
        human.push();
      }

      if (weapon instanceof Gun) {
        if (weapon.canShoot() && !this.triggerOnCooldown) {
          human.useWeapon();
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
      } else {
        human.useWeapon();
      }
    } else if (leader) {
      if (testLineOfSight(human, leader)) {
        this.lastSeenPositionOfLeader = leader.getPosition();
        const direction = this.lastSeenPositionOfLeader.sub(
          human.getPosition()
        );
        human.setDirection(direction.angle);
        const distance = direction.magnitude;
        if (distance > FOLLOW_DISTANCE) {
          human.walk(direction.inormalize());
        }
      } else if (this.lastSeenPositionOfLeader) {
        const direction = this.lastSeenPositionOfLeader.sub(
          human.getPosition()
        );
        human.walk(direction.inormalize());
      }
    }
  }
}

export function isAllyController(e: Entity): e is AllyHumanController {
  return e instanceof AllyHumanController;
}

function weaponIsMoreDesirable(
  currentWeapon: Weapon | undefined,
  otherWeapon: Weapon
): boolean {
  if (!currentWeapon) {
    // We should always pick up a weapon if we don't have one
    return true;
  } else if (otherWeapon instanceof MeleeWeapon) {
    // We should never swap from a gun to a melee weapon
    return false;
  } else if (currentWeapon instanceof MeleeWeapon) {
    // We should always swap our melee weapon for a gun
    return true;
  } else if (getGunTier(currentWeapon) < getGunTier(otherWeapon)) {
    // We should swap our gun for a better gun
    return true;
  } else {
    // Otherwise we shouldn't swap
    return false;
  }
}
