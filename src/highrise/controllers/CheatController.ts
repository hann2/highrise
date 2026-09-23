import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { on } from "../../core/entity/handler";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import { lerp } from "../../core/util/MathUtil";
import { Persistence } from "../constants/constants";
import { getPartyManager } from "../environment/PartyManager";
import WeaponPickup from "../environment/WeaponPickup";
import { isHuman } from "../human/Human";
import VisionController from "../lighting-and-vision/VisionController";
import { Flashbang } from "../weapons/consumables/consumable-stats/Flashbang";
import { FragGrenade } from "../weapons/consumables/consumable-stats/FragGrenade";
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
      case "KeyU": {
        const leader = getPartyManager(this.game)?.leader;
        for (const ammoClass of LIMITED_AMMO_CLASSES) {
          leader?.addReserve(ammoClass, MAX_RESERVE[ammoClass]);
        }
        break;
      }
    }
  }

  @on("tick")
  onTick() {
    const io = this.game.io;
    if (io.usingGamepad) {
      const t = io.getButton(ControllerButton.LT);
      this.game.slowMo = lerp(1.0, 0.5, t);
    } else {
      this.game.slowMo = io.isKeyDown("ShiftLeft") ? 0.2 : 1.0;
    }
  }
}
