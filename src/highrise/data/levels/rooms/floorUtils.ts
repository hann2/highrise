import { V, V2d } from "../../../../core/Vector";
import { Tiles } from "../../../entities/environment/TiledFloor";
import {
  CARDINAL_DIRECTIONS,
  decomposeDiagonal,
  DIAGONAL_DIRECTIONS,
  Direction,
  isCardinal,
  opposite,
} from "../../../utils/directions";
import { DecorationSprite } from "../../../view/DecorationSprite";
import { DirectionalSprite } from "../../../view/DirectionalSprite";

export type FloorMask = (boolean | undefined)[][];

function isMasked(floorMask: FloorMask, p: V2d): boolean {
  const row = floorMask[p.x];
  return row ? !!row[p.y] : false;
}

export function doubleResolution(original: FloorMask): FloorMask {
  const floorMask: FloorMask = [];
  for (let i = 0; i < original.length; i++) {
    floorMask[i * 2] = [];
    floorMask[i * 2 + 1] = [];
    for (let j = 0; j < original[i].length; j++) {
      floorMask[i * 2][j * 2] = original[i][j];
      floorMask[i * 2 + 1][j * 2] = original[i][j];
      floorMask[i * 2][j * 2 + 1] = original[i][j];
      floorMask[i * 2 + 1][j * 2 + 1] = original[i][j];
    }
  }
  return floorMask;
}

export function fillTile(
  floorMask: FloorMask,
  directionalSprite: DirectionalSprite,
  p: V2d
): DecorationSprite | undefined {
  if (!isMasked(floorMask, p)) {
    return;
  }
  // Corners
  for (const openDirection of DIAGONAL_DIRECTIONS) {
    const cardinalDirections = decomposeDiagonal(openDirection);
    if (
      cardinalDirections.every((d) => {
        return !isMasked(floorMask, p.add(Direction[d]));
      })
    ) {
      return directionalSprite.baseSprites[openDirection];
    }
  }
  // Edges
  for (const openDirection of CARDINAL_DIRECTIONS) {
    const openV = Direction[openDirection];
    if (!isMasked(floorMask, p.add(openV))) {
      return directionalSprite.baseSprites[openDirection];
    }
  }
  // Inside corners
  for (const openDirection of DIAGONAL_DIRECTIONS) {
    const openV = Direction[openDirection];
    if (!isMasked(floorMask, p.add(openV))) {
      return directionalSprite.insideCorners[openDirection];
    }
  }

  // Center
  return directionalSprite.baseSprites.CENTER;
}

export function fillFloorWithBorders(
  floorMask: FloorMask,
  directionalSprite: DirectionalSprite
): Tiles {
  const tiles: Tiles = [];
  for (let i = 0; i < floorMask.length; i++) {
    tiles[i] = [];
    for (let j = 0; j < floorMask[i].length; j++) {
      tiles[i][j] = fillTile(floorMask, directionalSprite, V(i, j));
    }
  }
  return tiles;
}

export function insetTile(
  originalSprite: DecorationSprite | undefined,
  directionalSprite: DirectionalSprite,
  subDirection: keyof typeof Direction
): DecorationSprite | undefined {
  if (!originalSprite) {
    return;
  }
  let maybeOriginalDirection: keyof typeof Direction | undefined;
  for (const baseDirection of Object.keys(directionalSprite.baseSprites)) {
    if (directionalSprite.baseSprites[baseDirection] === originalSprite) {
      maybeOriginalDirection = baseDirection;
    }
  }
  const isInnerCorner = !maybeOriginalDirection;
  if (isInnerCorner) {
    for (const innerDirection of Object.keys(directionalSprite.insideCorners)) {
      if (directionalSprite.insideCorners[innerDirection] === originalSprite) {
        maybeOriginalDirection = opposite(innerDirection);
      }
    }
  }

  const originalDirection: keyof typeof Direction = maybeOriginalDirection!;

  const originalV = Direction[originalDirection];
  const subV = Direction[subDirection];
  if (originalDirection === "CENTER") {
    return directionalSprite.baseSprites.CENTER;
  } else if (isCardinal(originalDirection)) {
    if (subV.x === originalV.x || subV.y === originalV.y) {
      return directionalSprite.baseSprites[opposite(originalDirection)];
    } else {
      return directionalSprite.baseSprites[originalDirection];
    }
  } else {
    if (subDirection === originalDirection) {
      return directionalSprite.insideCorners[opposite(originalDirection)];
    } else if (subDirection === opposite(originalDirection)) {
      return directionalSprite.baseSprites[originalDirection];
    } else {
      const [horizontalComponent, verticalComponent] = decomposeDiagonal(
        originalDirection
      );
      if (subV.x === originalV.x) {
        return directionalSprite.baseSprites[opposite(horizontalComponent)];
      } else {
        return directionalSprite.baseSprites[opposite(verticalComponent)];
      }
    }
  }
}

/**
 * Takes bordered tiles and insets them, creating a grid at twice the resolution.
 * This make cool looking carpet borders.
 *
 * Instead of having an edge that looks like
 *
 *   \ ∧ /
 *   < X >
 *   / ∨ \
 *
 *
 *   \ ∨ ∨ ∨ ∨ /
 *   > \ ∧ ∧ / <
 *   > < X X > <
 *   > < X X > <
 *   > / ∨ ∨ \ <
 *   / ∧ ∧ ∧ ∧ \
 *
 * @param oldTiles Tiles returned from fillFloorWithBorders
 * @param directionalSprite
 * @returns New tiles at twice the resolution of oldTiles with inset borders.
 */
export function insetBorders(
  oldTiles: Tiles,
  directionalSprite: DirectionalSprite
): Tiles {
  const tiles: Tiles = [];
  for (let i = 0; i < oldTiles.length; i++) {
    tiles[i * 2] = [];
    tiles[i * 2 + 1] = [];
    for (let j = 0; j < oldTiles[i].length; j++) {
      tiles[i * 2][j * 2] = insetTile(
        oldTiles[i][j],
        directionalSprite,
        "LEFTUP"
      );
      tiles[i * 2 + 1][j * 2] = insetTile(
        oldTiles[i][j],
        directionalSprite,
        "RIGHTUP"
      );
      tiles[i * 2][j * 2 + 1] = insetTile(
        oldTiles[i][j],
        directionalSprite,
        "LEFTDOWN"
      );
      tiles[i * 2 + 1][j * 2 + 1] = insetTile(
        oldTiles[i][j],
        directionalSprite,
        "RIGHTDOWN"
      );
    }
  }
  return tiles;
}
