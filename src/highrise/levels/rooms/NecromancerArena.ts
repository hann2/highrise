import Entity from "../../../core/entity/Entity";
import { V } from "../../../core/Vector";
import Decoration from "../../environment/Decoration";
import Necromancer from "../../enemies/Necromancer";
import TiledFloor, { Tiles } from "../../environment/TiledFloor";
import { PointLight } from "../../lighting-and-vision/PointLight";
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
import { CELL_WIDTH } from "../level-generation/levelGeneration";
import { CellTransformer } from "./ElementTransformer";
import {
  doubleResolution,
  fillFloorWithBorders,
  FloorMask,
  insetBorders,
} from "./floorUtils";
import RoomTemplate from "./RoomTemplate";

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

export default class NecromancerArena extends RoomTemplate {
  constructor() {
    super(V(6, 4), [
      [V(-1, 1), true],
      [V(5, 1), true],
    ]);
  }

  generateFloorMask(): FloorMask {
    const lowResolutionFloorMask: FloorMask = [];
    for (let i = 0; i < this.dimensions.x; i++) {
      lowResolutionFloorMask[i] = [];
      for (let j = 0; j < this.dimensions.y; j++) {
        lowResolutionFloorMask[i][j] = true;
      }
    }
    return doubleResolution(doubleResolution(lowResolutionFloorMask));
  }

  generateEntities(transformCell: CellTransformer): Entity[] {
    const entities: Entity[] = [];

    const carpetScale = redCarpetUpperLeft.heightMeters / CELL_WIDTH;
    const floorMask = this.generateFloorMask();

    const mainTiles: Tiles = insetBorders(
      fillFloorWithBorders(floorMask, directionalCarpet),
      directionalCarpet
    );

    const tileScale = V(carpetScale * CELL_WIDTH, carpetScale * CELL_WIDTH);

    entities.push(
      new TiledFloor(transformCell(V(-0.5, -0.5)), tileScale, mainTiles)
    );

    entities.push(
      new Necromancer(
        transformCell(V(2.5, 2)),
        transformCell(V(-0.5, -0.5)),
        this.dimensions.mul(CELL_WIDTH)
      )
    );
    entities.push(new Decoration(transformCell(V(2.5, 2)), rug));

    entities.push(
      new PointLight({
        radius: 10,
        shadowsEnabled: true,
        position: transformCell(V(1, 1.5)),
      })
    );

    entities.push(
      new PointLight({
        radius: 10,
        shadowsEnabled: true,
        position: transformCell(V(4, 1.5)),
      })
    );

    return entities;
  }
}
