import Entity from "../../../core/entity/Entity";
import { V, V2d } from "../../../core/Vector";
import { CELL_SIZE } from "../../constants/constants";
import Necromancer from "../../enemies/necromancer/Necromancer";
import Decoration from "../../environment/Decoration";
import {
  redCarpetBottom,
  redCarpetCenter,
  redCarpetInnerBottomLeft,
  redCarpetInnerBottomRight,
  redCarpetInnerTopLeft,
  redCarpetInnerTopRight,
  redCarpetLeft,
  redCarpetLowerLeft,
  redCarpetLowerRight,
  redCarpetRight,
  redCarpetTop,
  redCarpetUpperLeft,
  redCarpetUpperRight,
  rug,
} from "../../environment/decorations/decorations";
import { DirectionalSprite } from "../../environment/decorations/DirectionalSprite";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import TiledFloor, { Tiles } from "../../environment/TiledFloor";
import { DoorBuilder, WallBuilder, WallID } from "../level-generation/CellGrid";
import { RoomTransformer } from "./ElementTransformer";
import {
  doubleResolution,
  fillFloorWithBorders,
  FloorMask,
  insetBorders,
} from "./floorUtils";
import RoomTemplate from "./RoomTemplate";
import { defaultDoors, defaultOccupiedCells, defaultWalls } from "./roomUtils";

const directionalCarpet: DirectionalSprite = {
  baseSprites: {
    RIGHT: redCarpetRight,
    DOWN: redCarpetBottom,
    LEFT: redCarpetLeft,
    UP: redCarpetTop,
    RIGHTUP: redCarpetUpperRight,
    RIGHTDOWN: redCarpetLowerRight,
    LEFTUP: redCarpetUpperLeft,
    LEFTDOWN: redCarpetLowerLeft,
    CENTER: redCarpetCenter,
  },
  insideCorners: {
    RIGHTUP: redCarpetInnerTopRight,
    RIGHTDOWN: redCarpetInnerBottomRight,
    LEFTUP: redCarpetInnerTopLeft,
    LEFTDOWN: redCarpetInnerBottomLeft,
  },
};

const DIMENSIONS = V(6, 4);
const DOORS: WallID[] = [
  [V(-1, 1), true],
  [V(5, 1), true],
];

export default class NecromancerArena implements RoomTemplate {
  getOccupiedCells(): V2d[] {
    return defaultOccupiedCells(DIMENSIONS, DOORS);
  }

  generateWalls(): WallBuilder[] {
    return defaultWalls(DIMENSIONS, DOORS);
  }

  generateDoors(): DoorBuilder[] {
    return defaultDoors(DOORS);
  }

  generateFloorMask(): FloorMask {
    const lowResolutionFloorMask: FloorMask = [];
    for (let i = 0; i < DIMENSIONS.x; i++) {
      lowResolutionFloorMask[i] = [];
      for (let j = 0; j < DIMENSIONS.y; j++) {
        lowResolutionFloorMask[i][j] = true;
      }
    }
    return doubleResolution(doubleResolution(lowResolutionFloorMask));
  }

  generateEntities({
    roomToWorldPosition,
    roomToWorldDimensions,
  }: RoomTransformer): Entity[] {
    const entities: Entity[] = [];

    const carpetScale = redCarpetUpperLeft.heightMeters / CELL_SIZE;
    const floorMask = this.generateFloorMask();

    const mainTiles: Tiles = insetBorders(
      fillFloorWithBorders(floorMask, directionalCarpet),
      directionalCarpet
    );

    const tileScale = V(carpetScale * CELL_SIZE, carpetScale * CELL_SIZE);

    entities.push(
      new TiledFloor(roomToWorldPosition(V(-0.5, -0.5)), tileScale, mainTiles)
    );

    entities.push(
      new Necromancer(
        roomToWorldPosition(V(2.5, 2)),
        roomToWorldPosition(V(-0.5, -0.5)),
        roomToWorldDimensions(DIMENSIONS)
      )
    );
    entities.push(new Decoration(roomToWorldPosition(V(2.5, 2)), rug));

    entities.push(
      new OverheadLight(roomToWorldPosition(V(1, 1.5)), { radius: 10 }),
      new OverheadLight(roomToWorldPosition(V(4, 1.5)), { radius: 10 })
    );

    return entities;
  }
}
