import Entity from "../../../core/entity/Entity";
import { identity } from "../../../core/util/FunctionalUtils";
import { seededShuffle } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { CELL_SIZE } from "../../constants/constants";
import { CARDINAL_DIRECTIONS_VALUES, Direction } from "../../utils/directions";
import LevelTemplate from "../level-templates/LevelTemplate";
import { RoomTransformer } from "../rooms/ElementTransformer";
import ExitStairwell from "../rooms/ExitStairwell";
import RoomTemplate from "../rooms/RoomTemplate";
import SpawnRoom from "../rooms/SpawnRoom";
import TransformedRoomTemplate, {
  ROTATED_ORIENTATIONS,
} from "../rooms/TransformedRoomTemplate";
import CellGrid, { DoorBuilder, WallBuilder, WallID } from "./CellGrid";

function isEligibleCell(cellGrid: CellGrid, [x, y]: V2d): boolean {
  return (
    x < cellGrid.width &&
    y < cellGrid.height &&
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
  potentialWallIDsLevelCoords: WallID[],
): boolean {
  const startingPont = V(0, 0);

  let seenCount = 0;
  const seen: boolean[][] = [];
  for (let i = 0; i < cellGrid.width; i++) {
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
          CellGrid.wallIdsEqual(roomWall, potentialWall),
        )
      ) {
        queue.push(p.add(direction));
      }
    }
  }

  return seenCount === cellGrid.width * cellGrid.height;
}

function isEligibleRoom(
  cellGrid: CellGrid,
  potentialWallIDsLevelCoords: WallID[],
  occupiedCellsLevelCoords: V2d[],
): boolean {
  return occupiedCellsLevelCoords.every(
    (cell) =>
      isEligibleCell(cellGrid, cell) &&
      doesRoomCutoffPartOfMap(cellGrid, potentialWallIDsLevelCoords),
  );
}

function findEligibleLocation(
  cellGrid: CellGrid,
  seed: number,
  wallIDsRoomCoords: WallID[],
  occupiedCellsRoomCoords: V2d[],
): V2d | undefined {
  const allLocations = [...cellGrid.getPositions()].map(V);
  const shuffledLocations = seededShuffle(allLocations, seed);
  for (const location of shuffledLocations) {
    const wallIDsLevelCoords = wallIDsRoomCoords.map((w) =>
      translateWallID(w, location),
    );
    const occupiedCellsLevelCoords = occupiedCellsRoomCoords.map((c) =>
      c.add(location),
    );
    if (
      isEligibleRoom(cellGrid, wallIDsLevelCoords, occupiedCellsLevelCoords)
    ) {
      return location;
    }
  }
}

/**
 * Puts a room in the grid at `locationOverride`, or wherever it fits, and
 * makes its entities.
 */
export function addRoom(
  cellGrid: CellGrid,
  template: RoomTemplate,
  seed: number,
  locationOverride?: V2d,
): AddedRoomInfo {
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
      occupiedCellsRoomCoordinates,
    );
    if (!maybeLocation) {
      console.warn(
        "Couldn't find a spot for room " + template.constructor.name + "!",
      );
      return { entities: [], enemyPositions: [], itemPositions: [] };
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
    c.add(location),
  );
  for (const cell of occupiedCellsLevelCoords) {
    const [i, j] = cell;
    cellGrid.cells[i][j].content = "room";
    for (const d of [Direction.RIGHT, Direction.DOWN]) {
      const wall = CellGrid.getWallInDirection(cell, d);
      const farCell = CellGrid.getCellOnOtherSideOfWall(cell, wall);
      // TODO: hella slow, put in indexed format
      for (const c of occupiedCellsLevelCoords) {
        if (c.equals(farCell)) {
          cellGrid.destroyWall(wall);
        }
      }
    }
  }

  for (const wallBuilder of wallsLevelCoords) {
    // If your chain link fence is on the edge of the level, its going to be a
    //    normal wall.  Is that ok?  Maybe those rooms could specify a constraint that those walls can't be at edge of level
    if (cellGrid.isDestructible(wallBuilder.id)) {
      const [[i, j], right] = wallBuilder.id;
      cellGrid.cells[i][j][right ? "rightWall" : "bottomWall"] = wallBuilder;
    }
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

  const transformer: RoomTransformer = {
    roomToWorldPosition: (p) =>
      CellGrid.levelCoordToWorldCoord(p.add(location)),
    // roomToWorldVector: VectorTransformer
    roomToWorldVector: (v) => v.mul(CELL_SIZE),
    // roomToWorldAngle: AngleTransformer
    roomToWorldAngle: identity,
    // roomToLevelWall: WallTransformer
    roomToLevelWall: ([p, r]) => [p.add(location), r],
    // roomToWorldDimensions: DimensionsTransformer
    roomToWorldDimensions: (d) => d.mul(CELL_SIZE),
  };

  return {
    entities: template.generateEntities(transformer),
    enemyPositions: template.getEnemyPositions?.(transformer) ?? [],
    itemPositions: template.getItemPositions?.(transformer) ?? [],
  };
}

/**
 * Adds a room as far from `from` as it fits, trying each of `templates` (e.g.
 * the same room in different orientations). Picks randomly among the spots
 * that are nearly the furthest, so it isn't always in the same corner.
 */
function addRoomFarFrom(
  cellGrid: CellGrid,
  templates: RoomTemplate[],
  from: V2d,
  seed: number,
): AddedRoomInfo {
  const candidates: {
    template: RoomTemplate;
    location: V2d;
    distance: number;
  }[] = [];
  const locations = [...cellGrid.getPositions()].map(V);
  for (const template of templates) {
    const wallIDs = template.generateWalls().map((w) => w.id);
    const cells = template.getOccupiedCells();
    for (const location of locations) {
      const cellsLevelCoords = cells.map((c) => c.add(location));
      if (
        cellsLevelCoords.every((c) => isEligibleCell(cellGrid, c)) &&
        doesRoomCutoffPartOfMap(
          cellGrid,
          wallIDs.map((w) => translateWallID(w, location)),
        )
      ) {
        const center = cellsLevelCoords
          .reduce((sum, c) => sum.iadd(c), V(0, 0))
          .imul(1 / cellsLevelCoords.length);
        const distance = center.sub(from).magnitude;
        candidates.push({ template, location, distance });
      }
    }
  }

  if (candidates.length === 0) {
    console.warn("Couldn't find a spot for the exit stairwell!");
    return { entities: [], enemyPositions: [], itemPositions: [] };
  }

  const maxDistance = Math.max(...candidates.map((c) => c.distance));
  const furthest = candidates.filter((c) => c.distance > maxDistance - 1.5);
  const { template, location } = seededShuffle(furthest, seed)[0];
  return addRoom(cellGrid, template, seed, location);
}

export function addRooms(
  cellGrid: CellGrid,
  levelTemplate: LevelTemplate,
  seed: number,
  levelIndex: number,
): AddedRoomInfo {
  const roomInfos: AddedRoomInfo[] = [];
  roomInfos.push(
    addRoom(
      cellGrid,
      new SpawnRoom(levelIndex, levelTemplate.difficulty),
      seed,
      cellGrid.spawnLocation,
    ),
  );
  if (levelTemplate.hasExitStairwell()) {
    const orientations = ROTATED_ORIENTATIONS.map(
      (orientation) =>
        new TransformedRoomTemplate(new ExitStairwell(), orientation),
    );
    roomInfos.push(
      addRoomFarFrom(cellGrid, orientations, cellGrid.spawnLocation, seed),
    );
  }
  for (const roomTemplate of levelTemplate.chooseRoomTemplates(seed)) {
    roomInfos.push(addRoom(cellGrid, roomTemplate, seed));
  }

  return {
    entities: roomInfos.flatMap((roomInfo) => roomInfo.entities),
    enemyPositions: roomInfos.flatMap((roomInfo) => roomInfo.enemyPositions),
    itemPositions: roomInfos.flatMap((roomInfo) => roomInfo.itemPositions),
  };
}

export type AddedRoomInfo = {
  entities: Entity[];
  enemyPositions: V2d[];
  itemPositions: V2d[];
};
