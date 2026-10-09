import { V, V2d } from "../../../core/Vector";
import { CELL_SIZE } from "../../constants/constants";
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
} from "../../environment/decorations/decorations";
import { DirectionalSprite } from "../../environment/decorations/DirectionalSprite";
import TiledFloor, { Tiles } from "../../environment/TiledFloor";
import {
  doubleResolution,
  fillFloorWithBorders,
  FloorMask,
  insetBorders,
} from "../../levels/rooms/floorUtils";

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

/** A red carpet with a border, `cells` across (`CELL_SIZE` meters each) from its upper left corner `corner` (meters) */
export function redCarpet(corner: V2d, cells: V2d): TiledFloor {
  const lowResolution: FloorMask = [];
  for (let i = 0; i < cells.x; i++) {
    lowResolution[i] = [];
    for (let j = 0; j < cells.y; j++) {
      lowResolution[i][j] = true;
    }
  }
  const mask = doubleResolution(doubleResolution(lowResolution));
  const tiles: Tiles = insetBorders(
    fillFloorWithBorders(mask, directionalCarpet),
    directionalCarpet,
  );
  const tileSize = redCarpetUpperLeft.heightMeters;
  return new TiledFloor(corner, V(tileSize, tileSize), tiles);
}
