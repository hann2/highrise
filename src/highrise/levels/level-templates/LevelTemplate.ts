import Entity from "../../../core/entity/Entity";
import { hsvToRgb, rgbToHex } from "../../../core/util/ColorUtils";
import { choose, rUniform, seededShuffle } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import Zombie from "../../enemies/Zombie";
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
import Gun from "../../weapons/Gun";
import { FiveSeven } from "../../weapons/guns/FiveSeven";
import { Glock } from "../../weapons/guns/Glock";
import { GUNS } from "../../weapons/guns/guns";
import { M1911 } from "../../weapons/guns/M1911";
import { MELEE_WEAPONS } from "../../weapons/melee-weapons/meleeWeapons";
import MeleeWeapon from "../../weapons/MeleeWeapon";
import RoomTemplate from "../rooms/RoomTemplate";

export default class LevelTemplate {
  constructor(public levelIndex: number) {}

  chooseRoomTemplates(seed: number): RoomTemplate[] {
    return [];
  }

  getClosetFloor(): DecorationInfo {
    return cementFloor;
  }

  makeSubfloor(size: [number, number]): Entity {
    const color = rgbToHex(hsvToRgb({ h: rUniform(0, 1), s: 0.4, v: 0.8 }));
    const decorationInfo = choose(carpetFloor1, carpetFloor2);
    const floor = new RepeatingFloor(decorationInfo, [0, 0], size);
    floor.sprite.tint = color;
    return floor;
  }

  generateEnemies(locations: V2d[], seed: number): Entity[] {
    const entities: Entity[] = [];
    const shuffled = seededShuffle(locations, seed);

    for (let i = 0; i < 20; i++) {
      entities.push(new Zombie(shuffled[i]));
    }

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
