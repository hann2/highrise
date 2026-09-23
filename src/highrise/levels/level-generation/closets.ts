import Entity from "../../../core/entity/Entity";
import { seededShuffle } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { CELL_SIZE } from "../../constants/constants";
import FloorText from "../../environment/FloorText";
import KeycardLock from "../../environment/KeycardLock";
import { OverheadLight } from "../../environment/lighting/OverheadLight";
import RepeatingFloor from "../../environment/RepeatingFloor";
import { CARDINAL_DIRECTIONS_VALUES, Direction } from "../../utils/directions";
import LevelTemplate, { PickupMaker } from "../level-templates/LevelTemplate";
import CellGrid, { Closet } from "./CellGrid";
import { wallIDToDoorBuilder } from "./doors";

export function generateClosets(cellGrid: CellGrid): Closet[] {
  const closets: Closet[] = [];
  for (const cell of cellGrid.getCells()) {
    if (cell.content) {
      continue;
    }

    const backCell = cell.position;

    let openDirection;
    let backFound = 0;
    for (const direction of CARDINAL_DIRECTIONS_VALUES) {
      let wall = CellGrid.getWallInDirection(backCell, direction);
      if (!cellGrid.isExisting(wall)) {
        backFound += 1;
        openDirection = direction;
      }
    }
    if (backFound !== 1 || !openDirection) {
      continue;
    }

    const frontCell = backCell.add(openDirection);
    if (cellGrid.cells[frontCell.x][frontCell.y].content) {
      continue;
    }

    let directionFromFrontCellToDoorWall;
    let frontFound = 0;
    for (const direction of CARDINAL_DIRECTIONS_VALUES) {
      let wall = CellGrid.getWallInDirection(frontCell, direction);
      if (
        !cellGrid.isExisting(wall) &&
        !direction.equals(openDirection.negate())
      ) {
        frontFound += 1;
        directionFromFrontCellToDoorWall = direction;
      }
    }
    if (frontFound !== 1 || !directionFromFrontCellToDoorWall) {
      continue;
    }

    const doorWall = CellGrid.getWallInDirection(
      frontCell,
      directionFromFrontCellToDoorWall,
    );
    const right = doorWall[1];
    let doorRestingDirection = right ? Direction.DOWN : Direction.RIGHT;
    const reverseHinge = doorRestingDirection.equals(openDirection);
    if (reverseHinge) {
      doorRestingDirection = doorRestingDirection.negate();
    }
    const door = wallIDToDoorBuilder(doorWall, reverseHinge);
    cellGrid.doors.push(door);

    cellGrid.cells[frontCell.x][frontCell.y].content = "empty";
    const backWall = CellGrid.getWallInDirection(
      backCell,
      openDirection.negate(),
    );
    const closet = {
      backCell,
      frontCell,
      doorWall,
      backWall,
      backWallDirection: openDirection,
      doorDirection: directionFromFrontCellToDoorWall,
      door,
    };

    closets.push(closet);
  }

  return closets;
}

export function fillClosets(
  cellGrid: CellGrid,
  levelTemplate: LevelTemplate,
  seed: number,
): { entities: Entity[]; potentialEnemyLocations: V2d[] } {
  const remaining: Closet[] = seededShuffle(cellGrid.closets, seed);
  const entities: Entity[] = [];
  let closetIndex = 0;

  /** Takes the first remaining closet that `prefer`s, or the first one if none do */
  const takeCloset = (prefer?: (closet: Closet) => boolean) => {
    if (remaining.length === 0) {
      console.warn("Not enough closets in map for all pickups!");
      return undefined;
    }
    const i = prefer ? Math.max(0, remaining.findIndex(prefer)) : 0;
    return remaining.splice(i, 1)[0];
  };

  const fillCloset = (closet: Closet, f: PickupMaker) => {
    closetIndex += 1;
    cellGrid.cells[closet.backCell[0]][closet.backCell[1]].content = "pickup";
    const location = closet.backCell.add(closet.backWallDirection.mul(0.5));
    entities.push(
      new OverheadLight(CellGrid.levelCoordToWorldCoord(location), {
        radius: CELL_SIZE * 3,
        intensity: 0.5,
      }),
    );
    const entity = f(
      CellGrid.levelCoordToWorldCoord(location),
      closet.backWallDirection.rotate90cw(),
    );
    if (entity instanceof Array) {
      entities.push(...entity);
    } else {
      entities.push(entity);
    }

    const dimensions = V(1, 1)
      .add(
        closet.backWallDirection.y === 1 || closet.backWallDirection.y === -1
          ? V(0, 1)
          : V(1, 0),
      )
      .mul(CELL_SIZE);
    const upperLeftCell =
      closet.backWallDirection.x === 1 || closet.backWallDirection.y === 1
        ? closet.backCell
        : closet.frontCell;
    const upperLeftCorner = CellGrid.levelCoordToWorldCoord(
      upperLeftCell.sub(V(0.5, 0.5)),
    );
    entities.push(
      new RepeatingFloor(
        levelTemplate.getClosetFloor(closetIndex),
        upperLeftCorner,
        dimensions,
      ),
    );

    entities.push(...levelTemplate.getClosetDecorations(closetIndex, closet));
  };

  // Locked rooms first, so there's always room for them and the keycard
  const lockedRooms = levelTemplate.getLockedRooms();
  for (const { label, makePickups } of lockedRooms) {
    const closet = takeCloset();
    if (!closet) {
      break;
    }
    entities.push(...lockCloset(closet, label));
    fillCloset(closet, makePickups);
  }

  const makeKeycard = levelTemplate.getKeycardPickup();
  if (lockedRooms.length > 0 && makeKeycard) {
    // Somewhere you have to go looking for it
    const minDistance = (cellGrid.width + cellGrid.height) / 3;
    const closet = takeCloset(
      (c) =>
        Math.abs(c.backCell.x - cellGrid.spawnLocation.x) +
          Math.abs(c.backCell.y - cellGrid.spawnLocation.y) >=
        minDistance,
    );
    if (closet) {
      fillCloset(closet, makeKeycard);
    }
  }

  for (const makePickup of levelTemplate.getPickups()) {
    const closet = takeCloset();
    if (!closet) {
      break;
    }
    fillCloset(closet, makePickup);
  }

  const potentialEnemyLocations: V2d[] = [];
  for (const closet of remaining) {
    fillCloset(closet, (l: V2d) => {
      potentialEnemyLocations.push(l);
      return [];
    });
  }

  return { entities, potentialEnemyLocations };
}

/** Puts a keycard lock on a closet's door, with a label on the floor outside */
function lockCloset(closet: Closet, label: string): Entity[] {
  const outside = CellGrid.levelCoordToWorldCoord(
    closet.frontCell.add(closet.doorDirection.mul(0.85)),
  );
  closet.door.locked = true;
  closet.door.onBuilt = (door) => door.addChild(new KeycardLock(door, outside));
  return [
    new FloorText(
      CellGrid.levelCoordToWorldCoord(
        closet.frontCell.add(closet.doorDirection.mul(1.2)),
      ),
      label,
      { heightMeters: 0.3 },
    ),
  ];
}
