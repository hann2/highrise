import img_chainLinkFence from "../../../../resources/images/environment/chain-link-fence.png";
import Entity from "../../../core/entity/Entity";
import { rBool, rInteger } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { CELL_WIDTH, LEVEL_SIZE } from "../../constants";
import Exit from "../../environment/Exit";
import Wall from "../../environment/Wall";
import { PointLight } from "../../lighting-and-vision/PointLight";
import { DIAGONAL_DIRECTIONS, Direction } from "../../utils/directions";
import LevelTemplate from "../level-templates/LevelTemplate";
import CellGrid, { WallBuilder } from "./CellGrid";
import { fillClosets, generateClosets } from "./closets";
import { buildDoorEntity } from "./doors";
import { buildMaze, findExit } from "./mazeGeneration";
import { fillNubbies } from "./nubbies";
import { addRooms } from "./roomPlacement";

export function generateLevelEntities(
  cellGrid: CellGrid,
  levelTemplate: LevelTemplate,
  seed: number = rInteger(0, 2 ** 32)
): Entity[] {
  const outerWalls = addOuterWalls();
  const roomEntities = addRooms(cellGrid, levelTemplate, seed);
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
    potentialEnemyLocations: potentialClosetEnemyLocations,
  } = fillClosets(cellGrid, levelTemplate, seed);
  const nubbyEntities = fillNubbies(cellGrid);
  const hallwayLights = addHallwayLights(cellGrid);
  const hallwayEnemyLocations = findEnemyLocations(cellGrid);
  const doors = cellGrid.doors.map((d) => buildDoorEntity(cellGrid, d));

  const potentialEnemyLocations = [
    ...potentialClosetEnemyLocations,
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

function addOuterWalls(): Entity[] {
  const max = CELL_WIDTH * LEVEL_SIZE;
  return [
    new Wall([0, 0], [max, 0]),
    new Wall([0, 0], [0, max]),
    new Wall([max, 0], [max, max]),
    new Wall([0, max], [max, max]),
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

function addHallwayLights(cellGrid: CellGrid): Entity[] {
  const entities: Entity[] = [];

  for (let i = 0; i < LEVEL_SIZE; i++) {
    for (let j = 0; j < LEVEL_SIZE; j++) {
      if (cellGrid.cells[i][j].content) {
        continue;
      }
      if ((i + j) % 2 == 0 && rBool(0.95)) {
        entities.push(
          new PointLight({
            radius: 5,
            intensity: 0.3,
            position: CellGrid.levelCoordToWorldCoord(V(i, j)),
          })
        );
      }
    }
  }

  return entities;
}

export function wallBuilderToEntity(wallBuilder: WallBuilder): Entity {
  const [[i, j], right] = wallBuilder.id;
  const [x, y] = CellGrid.levelCoordToWorldCoord(V(i, j));
  if (right) {
    return new Wall(
      [x + CELL_WIDTH / 2, y - CELL_WIDTH / 2],
      [x + CELL_WIDTH / 2, y + CELL_WIDTH / 2],
      0.15,
      0x999999,
      !wallBuilder.chainLink,
      wallBuilder.chainLink ? img_chainLinkFence : undefined
    );
  } else {
    return new Wall(
      [x - CELL_WIDTH / 2, y + CELL_WIDTH / 2],
      [x + CELL_WIDTH / 2, y + CELL_WIDTH / 2],
      0.15,
      0x999999,
      !wallBuilder.chainLink,
      wallBuilder.chainLink ? img_chainLinkFence : undefined
    );
  }
}

function addInnerWalls(cellGrid: CellGrid): Entity[] {
  const wallEntities = [];
  for (let i = 0; i < LEVEL_SIZE; i++) {
    for (let j = 0; j < LEVEL_SIZE; j++) {
      if (cellGrid.cells[i][j].rightWall.exists) {
        wallEntities.push(wallBuilderToEntity(cellGrid.cells[i][j].rightWall));
      }
      if (cellGrid.cells[i][j].bottomWall.exists) {
        wallEntities.push(wallBuilderToEntity(cellGrid.cells[i][j].bottomWall));
      }
    }
  }
  return wallEntities;
}
