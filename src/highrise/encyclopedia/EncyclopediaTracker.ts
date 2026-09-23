import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { Persistence } from "../constants/constants";
import { BaseEnemy, isEnemy } from "../enemies/base/Enemy";
import PartyManager from "../environment/PartyManager";
import VisionController from "../lighting-and-vision/VisionController";
import {
  loadSaveData,
  markSeen,
  SeenFlags,
  SeenKind,
} from "../persistence/SaveData";
import { enemyTypeName } from "../run/enemyTypeName";
import Gun from "../weapons/guns/Gun";
import MeleeWeapon from "../weapons/melee/MeleeWeapon";

/**
 * Records what the player comes across during a run for the encyclopedia:
 * weapons the party holds, enemies the player sees or kills. Upgrades are
 * recorded where they're offered and taken.
 */
export default class EncyclopediaTracker extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;

  /** What's already saved, so that checking every tick doesn't touch storage */
  private seen: SeenFlags = loadSaveData().seen;

  mark(kind: SeenKind, name: string) {
    if (!this.seen[kind].includes(name)) {
      this.seen[kind].push(name);
      markSeen(kind, name);
    }
  }

  @on("zombieDied")
  onZombieDied({ zombie }: { zombie: BaseEnemy }) {
    this.mark("enemies", enemyTypeName(zombie));
  }

  @on("tick")
  onTick() {
    const party = this.game.entities.getSingleton(PartyManager);
    for (const human of party.partyMembers) {
      const weapon = human.weapon;
      if (weapon instanceof Gun) {
        this.mark("guns", weapon.stats.name);
      } else if (weapon instanceof MeleeWeapon) {
        this.mark("melee", weapon.stats.name);
      }
    }

    // Enemies count as seen once they're in the player's view. Only types that
    // haven't been seen are checked, and each check is a binary search.
    const vision = this.game.entities.getSingleton(VisionController);
    for (const enemy of this.game.entities.getByFilter(isEnemy)) {
      const name = enemyTypeName(enemy);
      if (
        !this.seen.enemies.includes(name) &&
        vision.visibilityOf(enemy.getPosition()) > 0
      ) {
        this.mark("enemies", name);
      }
    }
  }
}
