import Entity from "../../../core/entity/Entity";
import { rInteger } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { CELL_WIDTH, LEVEL_SIZE } from "../../constants/constants";
import Exit from "../../environment/Exit";
import { DIAGONAL_DIRECTIONS, Direction } from "../../utils/directions";
import LevelTemplate from "../level-templates/LevelTemplate";
import CellGrid from "./CellGrid";
import { fillClosets, generateClosets } from "./closets";
import { buildDoorEntity } from "./doors";
import { addInnerWalls, addOuterWalls } from "./generateWalls";
import { buildMaze, findExit } from "./mazeGeneration";
import { fillNubbies } from "./nubbies";
import { addRooms } from "./roomPlacement";

export function generateLevelEntities(
  cellGrid: CellGrid,
  levelTemplate: LevelTemplate,
  seed: number = rInteger(0, 2 ** 32)
): Entity[] {
  const outerWalls = addOuterWalls();
  const {
    entities: roomEntities,
    enemyPositions: roomEnemyPositions,
    itemPositions: roomItemPositions,
  } = addRooms(cellGrid, levelTemplate, seed, levelTemplate.levelIndex);
  buildMaze(cellGrid, seed);
  const innerWalls = addInnerWalls(cellGrid);
  const [exitPoint, exitOpenDirection] = findExit(
    cellGrid,
    cellGrid.spawnLocation
  );
  const exits = addExit(exitPoint, exitOpenDirection);
  cellGrid.closets = generateClosets(cellGrid);
  const {
    entities: closetEntities,
    potentialEnemyLocations: closetEnemyLocations,
  } = fillClosets(cellGrid, levelTemplate, seed);
  const nubbyEntities = fillNubbies(cellGrid, levelTemplate);
  const hallwayLights = addHallwayLights(cellGrid, levelTemplate);
  const hallwayEnemyLocations = findEnemyLocations(cellGrid);
  const doors = cellGrid.doors.map((d) => buildDoorEntity(cellGrid, d));

  const potentialEnemyLocations = [
    ...roomEnemyPositions,
    ...closetEnemyLocations,
    ...hallwayEnemyLocations,
  ];

  const enemies = levelTemplate.generateEnemies(potentialEnemyLocations, seed);

  const subFloor = levelTemplate.makeSubfloor([
    LEVEL_SIZE * CELL_WIDTH,
    LEVEL_SIZE * CELL_WIDTH,
  ]);
  const ambientLight = levelTemplate.getAmbientLight();

  const entities = [
    subFloor,
    ambientLight,
    ...outerWalls,
    ...roomEntities,
    ...innerWalls,
    ...exits,
    ...closetEntities,
    ...nubbyEntities,
    ...hallwayLights,
    ...doors,
    ...enemies,
  ];

  return entities;
}

function addExit(exitPoint: V2d, openDirection: V2d): Entity[] {
  const exitWorldCoords = CellGrid.levelCoordToWorldCoord(exitPoint);
  return [
    new Exit(
      exitWorldCoords[0] - CELL_WIDTH / 2,
      exitWorldCoords[1] - CELL_WIDTH / 2,
      exitWorldCoords[0] + CELL_WIDTH / 2,
      exitWorldCoords[1] + CELL_WIDTH / 2,
      openDirection!.angle + Math.PI
    ),
  ];
}

function findEnemyLocations(cellGrid: CellGrid): V2d[] {
  const locations: V2d[] = [];
  for (let i = 0; i < LEVEL_SIZE; i++) {
    for (let j = 0; j < LEVEL_SIZE; j++) {
      if (!cellGrid.cells[i][j].content) {
        cellGrid.cells[i][j].content = "zombie";
        for (const direction of DIAGONAL_DIRECTIONS) {
          const p = CellGrid.levelCoordToWorldCoord(
            V(i, j).add(Direction[direction].mul(0.25))
          );
          locations.push(p);
        }
      }
    }
  }
  return locations;
}

function addHallwayLights(
  cellGrid: CellGrid,
  levelTemplate: LevelTemplate
): Entity[] {
  const entities: Entity[] = [];

  for (let i = 0; i < LEVEL_SIZE; i++) {
    for (let j = 0; j < LEVEL_SIZE; j++) {
      if (cellGrid.cells[i][j].content) {
        continue;
      }
      const l = levelTemplate.generateHallwayLight(V(i, j));
      if (l) {
        entities.push(l);
      }
    }
  }

  return entities;
}
