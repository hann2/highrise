import { BLEND_MODES, Text } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { choose, rBool } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { Layer } from "../../config/layers";
import { cementFloor } from "../../environment/decorations/decorations";
import HealthPickup from "../../environment/HealthPickup";
import RepeatingFloor from "../../environment/RepeatingFloor";
import SpawnLocation from "../../environment/SpawnLocation";
import WeaponPickup from "../../environment/WeaponPickup";
import { PointLight } from "../../lighting-and-vision/PointLight";
import Gun from "../../weapons/guns/Gun";
import { GUN_TIERS } from "../../weapons/guns/gun-stats/gunStats";
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
  constructor(private levelIndex: number) {}

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

    let starterWeapon = rBool(0.5)
      ? new MeleeWeapon(choose(...MELEE_WEAPONS))
      : new Gun(choose(...GUN_TIERS[0]));
    entities.push(
      new WeaponPickup(roomToWorldPosition(V(0.5, 0.25)), starterWeapon)
    );

    // Better guns on future levels
    switch (this.levelIndex) {
      case 1:
        // Only starter
        break;
      case 2:
        entities.push(
          new WeaponPickup(
            roomToWorldPosition(V(1.5, 0.25)),
            new Gun(choose(...GUN_TIERS[1]))
          )
        );
        break;
      case 3:
        entities.push(
          new WeaponPickup(
            roomToWorldPosition(V(1.5, 0.25)),
            new Gun(choose(...GUN_TIERS[1], ...GUN_TIERS[2]))
          )
        );
        break;
      case 4:
        entities.push(
          new WeaponPickup(
            roomToWorldPosition(V(1.5, 0.25)),
            new Gun(choose(...GUN_TIERS[2]))
          )
        );
        break;
      case 5:
        entities.push(
          new WeaponPickup(
            roomToWorldPosition(V(1.5, 0.25)),
            new Gun(choose(...GUN_TIERS[3]))
          )
        );
      default:
    }

    if (this.levelIndex > 1) {
      entities.push(new HealthPickup(roomToWorldPosition(V(0.75, 1.25))));
    }

    entities.push(
      new SpawnRoomFloorPaint(roomToWorldPosition(V(1, 1)), this.levelIndex)
    );

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

// The text on the ground that says what level it is
class SpawnRoomFloorPaint extends BaseEntity implements Entity {
  sprite: Text & GameSprite;

  constructor([x, y]: [number, number], levelIndex: number) {
    super();

    this.sprite = new Text(`Level ${levelIndex}`, {
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
}
