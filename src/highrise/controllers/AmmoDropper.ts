import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { choose, rBool } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import { BaseEnemy } from "../enemies/base/Enemy";
import AmmoPickup from "../environment/AmmoPickup";
import Human from "../human/Human";
import {
  AMMO_DROP_CHANCE,
  isLimitedAmmo,
  LIMITED_AMMO_CLASSES,
  LimitedAmmoClass,
} from "../weapons/guns/ammo";

/** Makes dead enemies occasionally drop a box of ammo (more often with Scavenger). */
export default class AmmoDropper extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;

  @on("zombieDied")
  async onZombieDied({
    zombie,
    killer,
  }: {
    zombie: BaseEnemy;
    killer?: Human;
  }) {
    const chance = AMMO_DROP_CHANCE + (killer?.stats.killAmmoDropChance ?? 0);
    if (rBool(chance)) {
      const position = zombie.getPosition().clone();
      const ammoClass = ammoClassFor(killer);
      // Melee kills happen in the middle of a physics step, which is no time
      // to be adding bodies
      await this.wait();
      this.dropAmmo(position, ammoClass);
    }
  }

  dropAmmo(position: V2d, ammoClass: LimitedAmmoClass) {
    return this.game.addEntity(
      new AmmoPickup(position, ammoClass, undefined, true),
    );
  }
}

/** Ammo for the killer's primary if they have one, so drops are useful */
function ammoClassFor(killer?: Human): LimitedAmmoClass {
  const ammoClass = killer?.primary?.stats.ammoClass;
  if (ammoClass && isLimitedAmmo(ammoClass)) {
    return ammoClass;
  }
  return choose(...LIMITED_AMMO_CLASSES);
}
