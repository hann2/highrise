import Entity from "../../../core/entity/Entity";
import { hsvToRgb, rgbToHex } from "../../../core/util/ColorUtils";
import { choose, rUniform, seededShuffle } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import Heavy from "../../enemies/heavy/Heavy";
import Spitter from "../../enemies/spitter/Spitter";
import Zombie from "../../enemies/zombie/Zombie";
import { DecorationInfo } from "../../environment/decorations/DecorationInfo";
import {
  carpetFloor1,
  carpetFloor2,
  cementFloor,
} from "../../environment/decorations/decorations";
import HealthPickup from "../../environment/HealthPickup";
import RepeatingFloor from "../../environment/RepeatingFloor";
import WeaponPickup from "../../environment/WeaponPickup";
import Human from "../../human/Human";
import SurvivorHumanController from "../../human/SurvivorHumanController";
import { AmbientLight } from "../../lighting-and-vision/AmbientLight";
import Gun from "../../weapons/guns/Gun";
import { FiveSeven } from "../../weapons/guns/gun-stats/FiveSeven";
import { Glock } from "../../weapons/guns/gun-stats/Glock";
import { GUNS } from "../../weapons/guns/gun-stats/gunStats";
import { M1911 } from "../../weapons/guns/gun-stats/M1911";
import { MELEE_WEAPONS } from "../../weapons/melee/melee-weapons/meleeWeapons";
import MeleeWeapon from "../../weapons/melee/MeleeWeapon";
import { Closet } from "../level-generation/CellGrid";
import RoomTemplate from "../rooms/RoomTemplate";
import { closetDecorators } from "./helpers/closetHelpers";

export default class LevelTemplate {
  constructor(public levelIndex: number) {}

  // Returns a list of the rooms we want to try to fit on this floor
  chooseRoomTemplates(seed: number): RoomTemplate[] {
    return [];
  }

  // Returns the type of floor used for closets
  getClosetFloor(closetIndex: number): DecorationInfo {
    return cementFloor;
  }

  // Returns a list of entities to put in a closet
  getClosetDecorations(counter: number, closet: Closet): Entity[] {
    return closetDecorators[counter % closetDecorators.length](closet);
  }

  // Creates the base floor entity for this level
  makeSubfloor(size: [number, number]): Entity {
    const color = rgbToHex(hsvToRgb({ h: rUniform(0, 1), s: 0.4, v: 0.8 }));
    const decorationInfo = choose(carpetFloor1, carpetFloor2);
    const floor = new RepeatingFloor(decorationInfo, [0, 0], size);
    floor.sprite.tint = color;
    return floor;
  }

  // Puts enemies at the places they might go
  generateEnemies(locations: V2d[], seed: number): Entity[] {
    const entities: Entity[] = [];
    const shuffled = seededShuffle(locations, seed);

    for (let i = 0; i < 20; i++) {
      entities.push(new Zombie(shuffled[i]));
    }

    entities.push(new Spitter(shuffled[20]));
    entities.push(new Spitter(shuffled[21]));
    entities.push(new Spitter(shuffled[22]));
    entities.push(new Heavy(shuffled[23]));

    return entities;
  }

  getAmbientLight(): AmbientLight {
    return new AmbientLight(0x060606);
  }

  getPickups(): ((location: V2d) => Entity | Entity[])[] {
    return [
      (l) => new HealthPickup(l),
      (l) => new WeaponPickup(l, new Gun(choose(...GUNS))),
      (l) => new WeaponPickup(l, new MeleeWeapon(choose(...MELEE_WEAPONS))),
      (l) => {
        const surv = new Human(l);
        surv.giveWeapon(new Gun(choose(Glock, M1911, FiveSeven)), false);
        return [surv, new SurvivorHumanController(surv)];
      },
    ];
  }
}
