import Entity from "../../../core/entity/Entity";
import { hsvToRgb, rgbToHex } from "../../../core/util/ColorUtils";
import {
  choose,
  rBool,
  rUniform,
  seededShuffle,
} from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import Crawler from "../../enemies/crawler/Crawler";
import Heavy from "../../enemies/heavy/Heavy";
import Sprinter from "../../enemies/runner/Sprinter";
import Spitter from "../../enemies/spitter/Spitter";
import Zombie from "../../enemies/zombie/Zombie";
import { DecorationInfo } from "../../environment/decorations/DecorationInfo";
import {
  carpetFloor1,
  carpetFloor2,
  cementFloor,
} from "../../environment/decorations/decorations";
import HealthPickup from "../../environment/HealthPickup";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import RepeatingFloor from "../../environment/RepeatingFloor";
import WeaponPickup from "../../environment/WeaponPickup";
import Human from "../../human/Human";
import SurvivorHumanController from "../../human/SurvivorHumanController";
import { AmbientLight } from "../../lighting-and-vision/AmbientLight";
import Gun from "../../weapons/guns/Gun";
import { FiveSeven } from "../../weapons/guns/gun-stats/FiveSeven";
import { Glock } from "../../weapons/guns/gun-stats/Glock";
import { GUN_TIERS } from "../../weapons/guns/gun-stats/gunStats";
import { M1911 } from "../../weapons/guns/gun-stats/M1911";
import { MELEE_WEAPONS } from "../../weapons/melee/melee-weapons/meleeWeapons";
import MeleeWeapon from "../../weapons/melee/MeleeWeapon";
import CellGrid, { Closet } from "../level-generation/CellGrid";
import RoomTemplate from "../rooms/RoomTemplate";
import { CLOSET_DECORATORS } from "./helpers/closetHelpers";
import { NUBBY_DECORATORS } from "./helpers/nubbyHelpers";

type PickupMaker = (location: V2d) => Entity | Entity[];
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
  getClosetDecorations(closetIndex: number, closet: Closet): Entity[] {
    return CLOSET_DECORATORS[closetIndex % CLOSET_DECORATORS.length](closet);
  }

  getNubbyDecorations(cell: V2d, wallDirection: V2d): Entity[] {
    const entities = [];

    if (rBool(0.5)) {
      entities.push(
        new OverheadLight(CellGrid.levelCoordToWorldCoord(cell), {
          intensity: 0.2,
        })
      );
    }

    if (rBool(0.8)) {
      entities.push(...choose(...NUBBY_DECORATORS)(cell, wallDirection));
    }

    return entities;
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
    const shuffled = [...seededShuffle(locations, seed)];

    function nextLocation() {
      const result = shuffled.pop();
      if (!result) {
        throw new Error("Not enough room for all the enemies");
      }
      return result;
    }

    const numZombies = 20 + this.levelIndex * 10;
    for (let i = 0; i < numZombies && shuffled.length > 0; i++) {
      if (rBool(0.75)) {
        entities.push(new Zombie(nextLocation()));
      } else {
        entities.push(new Crawler(nextLocation()));
      }
    }

    if (this.levelIndex > 1) {
      const numSprinters = 5;
      for (let i = 0; i < numSprinters; i++) {
        entities.push(new Sprinter(nextLocation()));
      }
    }
    if (this.levelIndex > 2) {
      entities.push(new Spitter(nextLocation()));
      entities.push(new Spitter(nextLocation()));
    }
    if (this.levelIndex > 3) {
      entities.push(new Spitter(nextLocation()));
      entities.push(new Heavy(nextLocation()));
    }

    return entities;
  }

  getAmbientLight(): AmbientLight {
    return new AmbientLight(0x060606);
  }

  getPickups() {
    const pickups: PickupMaker[] = [
      (l) => new HealthPickup(l),
      (l) => new WeaponPickup(l, new Gun(choose(...GUN_TIERS[0]))),
      (l) => new WeaponPickup(l, new MeleeWeapon(choose(...MELEE_WEAPONS))),
      (l) => {
        const survivor = new Human(l);
        survivor.giveWeapon(new Gun(choose(Glock, M1911, FiveSeven)), false);
        return [survivor, new SurvivorHumanController(survivor)];
      },
    ];

    if (this.levelIndex >= 2) {
      pickups.push(
        (l) => new WeaponPickup(l, new Gun(choose(...GUN_TIERS[1])))
      );
    }
    if (this.levelIndex >= 4) {
      pickups.push(
        (l) => new WeaponPickup(l, new Gun(choose(...GUN_TIERS[2])))
      );
    }
    if (this.levelIndex >= 5) {
      pickups.push(
        (l) => new WeaponPickup(l, new Gun(choose(...GUN_TIERS[3])))
      );
    }

    return pickups;
  }

  generateHallwayLight(positionLevelCoords: V2d): OverheadLight | undefined {
    const [i, j] = positionLevelCoords;
    if ((i + j) % 2 == 0 && rBool(0.95)) {
      return new OverheadLight(
        CellGrid.levelCoordToWorldCoord(positionLevelCoords),
        {
          radius: 5,
          intensity: 0.3,
        }
      );
    }
  }
}
