import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { KeyCode } from "../../core/io/Keys";
import { CHARACTERS } from "../characters/Character";
import { Persistence } from "../constants/constants";
import { isEnemy } from "../enemies/base/Enemy";
import { getPartyManager } from "../environment/PartyManager";
import WeaponPickup from "../environment/WeaponPickup";
import { ignite } from "../fire/Burning";
import { getFireGrid } from "../fire/FireGrid";
import { isHuman } from "../human/Human";
import VisionController from "../lighting-and-vision/VisionController";
import {
  resetUnlockedCharacters,
  unlockCharacters,
} from "../persistence/SaveData";
import { Flashbang } from "../weapons/consumables/consumable-stats/Flashbang";
import { FragGrenade } from "../weapons/consumables/consumable-stats/FragGrenade";
import { Molotov } from "../weapons/consumables/consumable-stats/Molotov";
import { LIMITED_AMMO_CLASSES, MAX_RESERVE } from "../weapons/guns/ammo";
import Gun from "../weapons/guns/Gun";
import { AR15 } from "../weapons/guns/gun-stats/AR-15";

// Put stuff in here that we want to disable on actual release
export default class CheatController extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Permanent;

  @on("keyDown")
  onKeyDown({ key }: { key: KeyCode }) {
    switch (key) {
      case "KeyL":
        this.game.dispatch("levelComplete", undefined);
        break;
      case "KeyV":
        for (const visionController of this.game.entities.getByFilter(
          (e): e is VisionController => e instanceof VisionController,
        )) {
          visionController.enabled = !visionController.enabled;
        }
        break;
      case "KeyK": // Quarters, for trying out vending machines
        getPartyManager(this.game)?.addQuarters(5);
        break;
      case "KeyU": // Unlock every character; with shift, back to the defaults
        if (
          this.game.io.isKeyDown("ShiftLeft") ||
          this.game.io.isKeyDown("ShiftRight")
        ) {
          resetUnlockedCharacters();
        } else {
          unlockCharacters(CHARACTERS.map((character) => character.name));
        }
        break;
      case "KeyH":
        for (const human of this.game.entities.getByFilter(isHuman)) {
          human.heal(100);
        }
        break;
      case "KeyJ": {
        // A primary gun at the leader's feet
        const leader = getPartyManager(this.game)?.leader;
        if (leader) {
          this.game.addEntity(
            new WeaponPickup(leader.getPosition().clone(), new Gun(AR15)),
          );
        }
        break;
      }
      case "KeyN":
        getPartyManager(this.game)?.leader.giveConsumable(FragGrenade, 3);
        break;
      case "KeyB":
        getPartyManager(this.game)?.leader.giveConsumable(Flashbang, 3);
        break;
      case "KeyX":
        getPartyManager(this.game)?.leader.giveConsumable(Molotov, 3);
        break;
      case "KeyT": {
        // Set fire to the enemies near the cursor, and to any fuel there
        const cursor = this.game.camera.toWorld(this.game.io.mousePosition);
        for (const enemy of this.game.entities.getByFilter(isEnemy)) {
          if (enemy.getPosition().distanceTo(cursor) < 2) {
            ignite(enemy);
          }
        }
        getFireGrid(this.game)?.igniteAt(cursor);
        break;
      }
      case "KeyY": {
        // A puddle of fuel at the cursor; with shift, a trail of it from the
        // leader to the cursor
        const grid = getFireGrid(this.game);
        const leader = getPartyManager(this.game)?.leader;
        const cursor = this.game.camera.toWorld(this.game.io.mousePosition);
        if (
          this.game.io.isKeyDown("ShiftLeft") ||
          this.game.io.isKeyDown("ShiftRight")
        ) {
          if (leader) {
            grid?.addFuelAlong(leader.getPosition(), cursor, 3);
          }
        } else {
          grid?.spillFuel(cursor, 1.5, 6);
        }
        break;
      }
      case "KeyI": {
        const leader = getPartyManager(this.game)?.leader;
        for (const ammoClass of LIMITED_AMMO_CLASSES) {
          leader?.addReserve(ammoClass, MAX_RESERVE[ammoClass]);
        }
        break;
      }
    }
  }
}
