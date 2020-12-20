import { BLEND_MODES, Text } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { choose } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { Layer } from "../../config/layers";
import { getCurrentLevelNumber } from "../../controllers/LevelController";
import { cementFloor } from "../../environment/decorations/decorations";
import RepeatingFloor from "../../environment/RepeatingFloor";
import SpawnLocation from "../../environment/SpawnLocation";
import WeaponPickup from "../../environment/WeaponPickup";
import { PointLight } from "../../lighting-and-vision/PointLight";
import Gun from "../../weapons/guns/Gun";
import { AK47 } from "../../weapons/guns/gun-stats/AK-47";
import { AR15 } from "../../weapons/guns/gun-stats/AR-15";
import { DoubleBarrelShotgun } from "../../weapons/guns/gun-stats/DoubleBarrelShotgun";
import { FiveSeven } from "../../weapons/guns/gun-stats/FiveSeven";
import { Glock } from "../../weapons/guns/gun-stats/Glock";
import { P90 } from "../../weapons/guns/gun-stats/P90";
import { PumpShotgun } from "../../weapons/guns/gun-stats/PumpShotgun";
import { Revolver } from "../../weapons/guns/gun-stats/Revolver";
import { MELEE_WEAPONS } from "../../weapons/melee/melee-weapons/meleeWeapons";
import MeleeWeapon from "../../weapons/melee/MeleeWeapon";
import { DoorBuilder, WallBuilder, WallID } from "../level-generation/CellGrid";
import {
  AngleTransformer,
  DimensionsTransformer,
  PositionTransformer,
  VectorTransformer,
  WallTransformer,
} from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";
import { defaultDoors, defaultOccupiedCells, defaultWalls } from "./roomUtils";

const DIMENSIONS = V(3, 3);
const DOORS: WallID[] = [[V(2, 0), true]];

export default class SpawnRoom implements RoomTemplate {
  getOccupiedCells(): V2d[] {
    return defaultOccupiedCells(DIMENSIONS, DOORS);
  }

  generateWalls(): WallBuilder[] {
    return defaultWalls(DIMENSIONS, DOORS);
  }

  generateDoors(): DoorBuilder[] {
    return defaultDoors(DOORS);
  }

  generateEntities(
    roomToWorldPosition: PositionTransformer,
    roomToWorldVector: VectorTransformer,
    roomToWorldAngle: AngleTransformer,
    roomToLevelWall: WallTransformer,
    roomToWorldDimensions: DimensionsTransformer
  ): Entity[] {
    const entities: Entity[] = [];

    entities.push(
      new PointLight({
        radius: 6,
        intensity: 1.0,
        shadowsEnabled: true,
        position: roomToWorldPosition(V(1, 1)),
      })
    );

    entities.push(new SpawnLocation(roomToWorldPosition(V(1, 2))));
    entities.push(new SpawnLocation(roomToWorldPosition(V(0, 1))));
    entities.push(new SpawnLocation(roomToWorldPosition(V(1, 1))));
    entities.push(new SpawnLocation(roomToWorldPosition(V(2, 1))));

    const meleeWeapon = new MeleeWeapon(choose(...MELEE_WEAPONS));
    entities.push(new WeaponPickup(roomToWorldPosition(V(2, 0)), meleeWeapon));

    entities.push(
      new WeaponPickup(roomToWorldPosition(V(0, 0)), new Gun(AK47))
    );
    entities.push(new WeaponPickup(roomToWorldPosition(V(0, 1)), new Gun(P90)));
    entities.push(
      new WeaponPickup(roomToWorldPosition(V(0, 2)), new Gun(PumpShotgun))
    );

    entities.push(
      new WeaponPickup(roomToWorldPosition(V(2, 1)), new Gun(Glock))
    );
    entities.push(
      new WeaponPickup(roomToWorldPosition(V(2, 2)), new Gun(FiveSeven))
    );

    entities.push(
      new WeaponPickup(roomToWorldPosition(V(1, 0)), new Gun(AR15))
    );
    entities.push(
      new WeaponPickup(roomToWorldPosition(V(1, 1)), new Gun(Revolver))
    );

    entities.push(
      new WeaponPickup(
        roomToWorldPosition(V(1, 2)),
        new Gun(DoubleBarrelShotgun)
      )
    );

    entities.push(new SpawnRoomFloor(roomToWorldPosition(V(1, 1))));

    const centerWorldCoords = roomToWorldPosition(
      DIMENSIONS.sub(V(1, 1)).mul(0.5)
    );
    const dimensionsWorldCoords = roomToWorldDimensions(DIMENSIONS);
    entities.push(
      new RepeatingFloor(
        cementFloor,
        centerWorldCoords.sub(dimensionsWorldCoords.mul(0.5)),
        dimensionsWorldCoords
      )
    );

    return entities;
  }
}

class SpawnRoomFloor extends BaseEntity implements Entity {
  sprite: Text & GameSprite;

  constructor([x, y]: [number, number]) {
    super();

    this.sprite = new Text(``, {
      fontSize: 64,
      fontFamily: "Capture It",
      fill: "red",
      align: "center",
    });
    this.sprite.blendMode = BLEND_MODES.MULTIPLY;
    this.sprite.position.set(x, y);
    this.sprite.scale.set(1 / 64);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.layerName = Layer.FLOOR_DECALS;
  }

  onAdd(game: Game) {
    const level = getCurrentLevelNumber(game);
    this.sprite.text = `Level ${level}`;
  }
}
