import Entity from "../../../core/entity/Entity";
import { identity } from "../../../core/util/FunctionalUtils";
import { seededShuffle } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { CELL_WIDTH, LEVEL_SIZE } from "../../constants/constants";
import { CARDINAL_DIRECTIONS_VALUES, Direction } from "../../utils/directions";
import LevelTemplate from "../level-templates/LevelTemplate";
import RoomTemplate from "../rooms/RoomTemplate";
import SpawnRoom from "../rooms/SpawnRoom";
import CellGrid, { DoorBuilder, WallBuilder, WallID } from "./CellGrid";

function isEligibleCell(cellGrid: CellGrid, [x, y]: V2d): boolean {
  return (
    x < LEVEL_SIZE &&
    y < LEVEL_SIZE &&
    x >= 0 &&
    y >= 0 &&
    !cellGrid.cells[x][y].content
  );
}

function translateWallID(wallID: WallID, translation: V2d): WallID {
  return [wallID[0].add(translation), wallID[1]];
}

function doesRoomCutoffPartOfMap(
  cellGrid: CellGrid,
  potentialWallIDsLevelCoords: WallID[]
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
      const potentialWall = CellGrid.getWallInDirection(p, direction);
      if (
        cellGrid.isDestructible(potentialWall) &&
        !potentialWallIDsLevelCoords.some((roomWall: WallID) =>
          CellGrid.wallIdsEqual(roomWall, potentialWall)
        )
      ) {
        queue.push(p.add(direction));
      }
    }
  }

  return seenCount === LEVEL_SIZE * LEVEL_SIZE;
}

function isEligibleRoom(
  cellGrid: CellGrid,
  potentialWallIDsLevelCoords: WallID[],
  occupiedCellsLevelCoords: V2d[]
): boolean {
  return occupiedCellsLevelCoords.every(
    (cell) =>
      isEligibleCell(cellGrid, cell) &&
      doesRoomCutoffPartOfMap(cellGrid, potentialWallIDsLevelCoords)
  );
}

function findEligibleLocation(
  cellGrid: CellGrid,
  seed: number,
  wallIDsRoomCoords: WallID[],
  occupiedCellsRoomCoords: V2d[]
): V2d | undefined {
  const allLocations = [];
  for (let i = 0; i < LEVEL_SIZE; i++) {
    for (let j = 0; j < LEVEL_SIZE; j++) {
      allLocations.push(V(i, j));
    }
  }
  const shuffledLocations = seededShuffle(allLocations, seed);
  for (const location of shuffledLocations) {
    const wallIDsLevelCoords = wallIDsRoomCoords.map((w) =>
      translateWallID(w, location)
    );
    const occupiedCellsLevelCoords = occupiedCellsRoomCoords.map((c) =>
      c.add(location)
    );
    if (
      isEligibleRoom(cellGrid, wallIDsLevelCoords, occupiedCellsLevelCoords)
    ) {
      return location;
    }
  }
}

function addRoom(
  cellGrid: CellGrid,
  template: RoomTemplate,
  seed: number,
  locationOverride?: V2d
): Entity[] {
  const wallsRoomCoordinates: WallBuilder[] = template.generateWalls();
  const occupiedCellsRoomCoordinates: V2d[] = template.getOccupiedCells();
  const wallIDsRoomCoordinates = wallsRoomCoordinates.map((w) => w.id);

  let maybeLocation: V2d | undefined;
  if (locationOverride) {
    maybeLocation = locationOverride;
  } else {
    maybeLocation = findEligibleLocation(
      cellGrid,
      seed,
      wallIDsRoomCoordinates,
      occupiedCellsRoomCoordinates
    );
    if (!maybeLocation) {
      console.warn(
        "Couldn't find a spot for room " + template.constructor.name + "!"
      );
      return [];
    }
  }
  const location = maybeLocation!;
  const wallsLevelCoords: WallBuilder[] = wallsRoomCoordinates.map((w) => {
    return {
      ...w,
      id: translateWallID(w.id, location),
    };
  });

  const occupiedCellsLevelCoords = occupiedCellsRoomCoordinates.map((c) =>
    c.add(location)
  );
  for (const cell of occupiedCellsLevelCoords) {
    const [i, j] = cell;
    cellGrid.cells[i][j].content = "room";
    for (const d of [Direction.RIGHT, Direction.DOWN]) {
      const wall = CellGrid.getWallInDirection(cell, d);
      const farCell = CellGrid.getCellOnOtherSideOfWall(cell, wall);
      // TODO: hella slow, put in indexed format
      for (const c of occupiedCellsLevelCoords) {
        if (c.x === farCell.x && c.y === farCell.y) {
          cellGrid.destroyWall(wall);
        }
      }
    }
  }

  for (const wallBuilder of wallsLevelCoords) {
    // If your chain link fence is on the edge of the level, its going to be a
    //    normal wall.  Is that ok?  Maybe those rooms could specify a constraint that those walls can't be at edge of level
    const [[i, j], right] = wallBuilder.id;
    if (right && (i === LEVEL_SIZE - 1 || i === -1)) {
      continue;
    } else if (!right && (j === LEVEL_SIZE - 1 || j === -1)) {
      continue;
    }
    cellGrid.cells[i][j][right ? "rightWall" : "bottomWall"] = wallBuilder;
  }

  const doorsLevelCoordinates: DoorBuilder[] = template
    .generateDoors()
    .map((d) => {
      return {
        ...d,
        wallID: translateWallID(d.wallID, location),
        hingePoint: d.hingePoint.add(location),
      };
    });

  for (const doorBuilder of doorsLevelCoordinates) {
    cellGrid.destroyWall(doorBuilder.wallID);
    cellGrid.doors.push(doorBuilder);
  }

  return template.generateEntities(
    // roomToWorldPosition: PositionTransformer
    (p) => CellGrid.levelCoordToWorldCoord(p.add(location)),
    // roomToWorldVector: VectorTransformer
    (v) => v.mul(CELL_WIDTH),
    // roomToWorldAngle: AngleTransformer
    identity,
    // roomToLevelWall: WallTransformer
    ([p, r]) => [p.add(location), r],
    // roomToWorldDimensions: DimensionsTransformer
    (d) => d.mul(CELL_WIDTH)
  );
}

export function addRooms(
  cellGrid: CellGrid,
  levelTemplate: LevelTemplate,
  seed: number
): Entity[] {
  const spawnEntities = addRoom(
    cellGrid,
    new SpawnRoom(),
    seed,
    cellGrid.spawnLocation
  );
  const allRoomEntities = levelTemplate
    .chooseRoomTemplates(seed)
    .flatMap((t) => addRoom(cellGrid, t, seed));

  return [...allRoomEntities, ...spawnEntities];
}
