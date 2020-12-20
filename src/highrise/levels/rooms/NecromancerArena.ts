import Entity from "../../../core/entity/Entity";
import { V, V2d } from "../../../core/Vector";
import { CELL_WIDTH } from "../../constants";
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
import TiledFloor, { Tiles } from "../../environment/TiledFloor";
import { PointLight } from "../../lighting-and-vision/PointLight";
import { DoorBuilder, WallBuilder, WallID } from "../level-generation/CellGrid";
import {
  AngleTransformer,
  DimensionsTransformer,
  PositionTransformer,
  VectorTransformer,
  WallTransformer,
} from "./ElementTransformer";
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

  generateEntities(
    roomToWorldPosition: PositionTransformer,
    roomToWorldVector: VectorTransformer,
    roomToWorldAngle: AngleTransformer,
    roomToLevelWall: WallTransformer,
    roomToWorldDimensions: DimensionsTransformer
  ): Entity[] {
    const entities: Entity[] = [];

    const carpetScale = redCarpetUpperLeft.heightMeters / CELL_WIDTH;
    const floorMask = this.generateFloorMask();

    const mainTiles: Tiles = insetBorders(
      fillFloorWithBorders(floorMask, directionalCarpet),
      directionalCarpet
    );

    const tileScale = V(carpetScale * CELL_WIDTH, carpetScale * CELL_WIDTH);

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
      new PointLight({
        radius: 10,
        shadowsEnabled: true,
        position: roomToWorldPosition(V(1, 1.5)),
      })
    );

    entities.push(
      new PointLight({
        radius: 10,
        shadowsEnabled: true,
        position: roomToWorldPosition(V(4, 1.5)),
      })
    );

    return entities;
  }
}
