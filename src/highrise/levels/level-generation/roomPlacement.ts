import Entity from "../../../core/entity/Entity";
import { identity } from "../../../core/util/FunctionalUtils";
import { seededShuffle } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import RepeatingFloor from "../../environment/RepeatingFloor";
import { CARDINAL_DIRECTIONS_VALUES, Direction } from "../../utils/directions";
import LevelTemplate from "../level-templates/LevelTemplate";
import RoomTemplate from "../rooms/RoomTemplate";
import SpawnRoom from "../rooms/SpawnRoom";
import CellGrid, { CELL_WIDTH, LEVEL_SIZE, WallID } from "./CellGrid";

function isElligibleCell(cellGrid: CellGrid, [x, y]: V2d): boolean {
  return (
    x < LEVEL_SIZE &&
    y < LEVEL_SIZE &&
    x >= 0 &&
    y >= 0 &&
    !cellGrid.cells[x][y].content
  );
}

/**
 * Given a potential room, the potential placement of that room, and a wallId, determines if that wall
 * will be made indestructible by the room if we actually added it in the grid.
 *
 * Probably could be refactored to be less confusing.
 */
function isWallInRoomIndestructible(
  upperRightCorner: V2d,
  template: RoomTemplate,
  wall: WallID
): boolean {
  const [[wx, wy], wr] = wall;
  const matchDoor = template.doors
    .map(
      ([doorP, doorR]: WallID): WallID => [doorP.add(upperRightCorner), doorR]
    )
    .some((doorWall: WallID) => CellGrid.wallIdsEqual(doorWall, wall));
  if (matchDoor) {
    return false;
  } else if (wr) {
    return (
      (wx === upperRightCorner.x - 1 ||
        wx === upperRightCorner.x + template.dimensions.x - 1) &&
      wy >= upperRightCorner.y &&
      wy <= upperRightCorner.y + template.dimensions.y - 1
    );
  }
  return (
    (wy === upperRightCorner.y - 1 ||
      wy === upperRightCorner.y + template.dimensions.y - 1) &&
    wx >= upperRightCorner.x &&
    wx <= upperRightCorner.x + template.dimensions.x - 1
  );
}

function doesRoomCutoffPartOfMap(
  cellGrid: CellGrid,
  upperRightCorner: V2d,
  template: RoomTemplate
): boolean {
  const startingPont = V(0, 0);

  let seenCount = 0;
  const seen: boolean[][] = [];
  for (let i = 0; i < LEVEL_SIZE; i++) {
    seen[i] = [];
  }

  // BFS
  const queue: V2d[] = [startingPont];
  while (queue.length) {
    const p = queue.shift()!;
    const [x, y] = p;
    if (seen[x][y]) {
      continue;
    }
    seen[x][y] = true;
    seenCount += 1;
    for (const direction of CARDINAL_DIRECTIONS_VALUES) {
      const wall = CellGrid.getWallInDirection(p, direction);
      if (
        cellGrid.isDestructible(wall) &&
        !isWallInRoomIndestructible(upperRightCorner, template, wall)
      ) {
        queue.push(p.add(direction));
      }
    }
  }

  return seenCount === LEVEL_SIZE * LEVEL_SIZE;
}

function isElligibleRoom(
  cellGrid: CellGrid,
  upperRightCorner: V2d,
  template: RoomTemplate
): boolean {
  const dimensions = template.dimensions;
  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      if (!isElligibleCell(cellGrid, V(i, j).add(upperRightCorner))) {
        return false;
      }
    }
  }
  for (const [relativeCell, right] of template.doors) {
    const cell = relativeCell.add(upperRightCorner);
    const wall: WallID = [cell, right];
    const farCell = CellGrid.getCellOnOtherSideOfWall(cell, wall);
    if (
      !isElligibleCell(cellGrid, farCell) ||
      !isElligibleCell(cellGrid, cell)
    ) {
      return false;
    }
  }
  return doesRoomCutoffPartOfMap(cellGrid, upperRightCorner, template);
}

function addRoom(
  cellGrid: CellGrid,
  shuffledLocations: V2d[],
  template: RoomTemplate,
  locationOverride?: V2d
): Entity[] {
  const entities: Entity[] = [];

  const dimensions = template.dimensions;
  let maybeCorner: V2d | undefined;
  if (locationOverride) {
    maybeCorner = locationOverride;
  } else {
    do {
      maybeCorner = shuffledLocations.pop();
    } while (maybeCorner && !isElligibleRoom(cellGrid, maybeCorner, template));
    if (!maybeCorner) {
      console.warn("Couldn't make room!");
      return entities;
    }
  }
  const corner = maybeCorner!;
  cellGrid.addIndestructibleBox(maybeCorner, dimensions);

  for (const [relativeCell, right] of template.doors) {
    const cell = relativeCell.add(corner);
    const wall: WallID = [cell, right];
    const farCell = CellGrid.getCellOnOtherSideOfWall(cell, wall);

    cellGrid.cells[cell.x][cell.y].content = "empty";
    cellGrid.cells[farCell.x][farCell.y].content = "empty";
    cellGrid.destroyWall(wall);
    cellGrid.doors.push([cell, right ? Direction.DOWN : Direction.RIGHT]);
  }

  if (template.floor) {
    entities.push(
      new RepeatingFloor(
        template.floor,
        cellGrid.levelCoordToWorldCoord(corner.sub(V(0.5, 0.5))),
        dimensions.mul(CELL_WIDTH)
      )
    );
  }

  entities.push(
    ...template.generateEntities(
      (p) => cellGrid.levelCoordToWorldCoord(p.add(corner)),
      identity
    )
  );

  template
    .generateWalls(([p, r]) => [p.add(corner), r])
    .forEach((w) => {
      cellGrid.undestroyWall(w);
      cellGrid.markIndestructible(w);
    });
  return entities;
}

export function addRooms(
  cellGrid: CellGrid,
  levelTemplate: LevelTemplate,
  seed: number
): Entity[] {
  const allLocations = [];
  for (let i = 0; i < LEVEL_SIZE; i++) {
    for (let j = 0; j < LEVEL_SIZE; j++) {
      allLocations.push(V(i, j));
    }
  }
  const shuffledLocations = seededShuffle(allLocations, seed);

  const spawnEntities = addRoom(
    cellGrid,
    shuffledLocations,
    new SpawnRoom(),
    cellGrid.spawnLocation
  );
  const allRoomEntities = levelTemplate
    .chooseRoomTemplates(seed)
    .flatMap((t) => addRoom(cellGrid, shuffledLocations, t));

  return [...allRoomEntities, ...spawnEntities];
}
