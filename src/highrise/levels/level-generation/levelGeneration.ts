import { Matrix, Point } from "pixi.js";
import Entity from "../../../core/entity/Entity";
import { identity } from "../../../core/util/FunctionalUtils";
import {
  choose,
  rBool,
  rInteger,
  seededShuffle,
} from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import Crawler from "../../enemies/Crawler";
import Heavy from "../../enemies/Heavy";
import Spitter from "../../enemies/Spitter";
import Zombie from "../../enemies/Zombie";
import Decoration from "../../environment/Decoration";
import {
  bookcase1,
  bookcase2,
  boxPile1,
  boxPile2,
  boxShelf1,
  boxShelf2,
  cementFloor,
  sack,
  waterCooler,
} from "../../environment/decorations/decorations";
import Door from "../../environment/Door";
import Exit from "../../environment/Exit";
import HealthPickup from "../../environment/HealthPickup";
import { OverheadLight } from "../../environment/OverheadLight";
import RepeatingFloor from "../../environment/RepeatingFloor";
import VendingMachine from "../../environment/VendingMachine";
import Wall from "../../environment/Wall";
import WeaponPickup from "../../environment/WeaponPickup";
import Human from "../../human/Human";
import SurvivorHumanController from "../../human/SurvivorHumanController";
import { PointLight } from "../../lighting-and-vision/PointLight";
import {
  CARDINAL_DIRECTIONS_VALUES,
  DIAGONAL_DIRECTIONS,
  Direction,
} from "../../utils/directions";
import Gun from "../../weapons/Gun";
import { FiveSeven } from "../../weapons/guns/FiveSeven";
import { Glock } from "../../weapons/guns/Glock";
import { GUNS } from "../../weapons/guns/guns";
import { M1911 } from "../../weapons/guns/M1911";
import { MELEE_WEAPONS } from "../../weapons/melee-weapons/meleeWeapons";
import MeleeWeapon from "../../weapons/MeleeWeapon";
import { Level } from "../Level";
import BathroomLevel from "../level-templates/BathroomLevel";
import ChapelLevel from "../level-templates/ChapelLevel";
import GeneratorLevel from "../level-templates/GeneratorLevel";
import LevelTemplate from "../level-templates/LevelTemplate";
import LobbyLevel from "../level-templates/LobbyLevel";
import MaintenanceLevel from "../level-templates/MaintenanceLevel";
import ShopLevel from "../level-templates/ShopLevel";
import LevelGridMap from "../LevelGridMap";
import RoomTemplate from "../rooms/RoomTemplate";
import SpawnRoom from "../rooms/SpawnRoom";

export const LEVEL_SIZE = 14;
export const CELL_WIDTH = 2;

// 1 means every possible slot is filled with a zombie
// const ZOMBIE_CONCENTRATION = 0.1;
const ZOMBIE_CONCENTRATION = 0.0;
const CRAWLER_PERCENTAGE = 0.05;

// List of all possible reflections/rotations
export const POSSIBLE_ORIENTATIONS: Matrix[] = [
  new Matrix(1, 0, 0, 1),
  new Matrix(1, 0, 0, -1),
  new Matrix(-1, 0, 0, 1),
  new Matrix(-1, 0, 0, -1),
  new Matrix(0, 1, 1, 0),
  new Matrix(0, 1, -1, 0),
  new Matrix(0, -1, 1, 0),
  new Matrix(0, -1, -1, 0),
];

interface Closet {
  backCell: V2d;
  frontCell: V2d;
  backWall: WallID;
  doorWall: WallID;
  backWallDirection: V2d;
}
export type WallID = [V2d, boolean];
export type DoorID = [V2d, V2d];
interface WallBuilder {
  exists: boolean;
  destructible: boolean;
  id: WallID;
}
interface Cell {
  content?: string;
  rightWall: WallBuilder;
  bottomWall: WallBuilder;
}

export function getWallInDirection(cell: V2d, direction: V2d): WallID {
  let newCell = cell;
  if (direction.x === -1 || direction.y === -1) {
    newCell = newCell.add(direction);
  }
  return [newCell, direction.y === 0];
}

export function pointToV2d(p: Point): V2d {
  return V(p.x, p.y);
}
class LevelBuilder {
  closets: Closet[] = [];
  cells: Cell[][] = [];
  doors: DoorID[] = [];
  spawnLocation?: V2d;

  constructor() {
    for (let i = 0; i < LEVEL_SIZE; i++) {
      this.cells[i] = [];
      for (let j = 0; j < LEVEL_SIZE; j++) {
        this.cells[i][j] = {
          rightWall: {
            id: [V(i, j), true],
            exists: true,
            destructible: i < LEVEL_SIZE - 1,
          },
          bottomWall: {
            id: [V(i, j), false],
            exists: true,
            destructible: j < LEVEL_SIZE - 1,
          },
        };
      }
    }
  }

  destroyWall(id: WallID) {
    const [[i, j], right] = id;
    this.cells[i][j][right ? "rightWall" : "bottomWall"].exists = false;
    this.cells[i][j][right ? "rightWall" : "bottomWall"].destructible = true;
  }

  undestroyWall(id: WallID) {
    const [[i, j], right] = id;
    if (i < 0 || j < 0) {
      return;
    }
    this.cells[i][j][right ? "rightWall" : "bottomWall"].exists = true;
  }

  markIndestructible(id: WallID) {
    const [[i, j], right] = id;
    if (i < 0 || j < 0) {
      return;
    }
    this.cells[i][j][right ? "rightWall" : "bottomWall"].destructible = false;
  }

  isExisting(id: WallID) {
    const [[i, j], right] = id;
    if (i < 0 || j < 0 || i >= LEVEL_SIZE || j >= LEVEL_SIZE) {
      return true;
    }
    return this.cells[i][j][right ? "rightWall" : "bottomWall"].exists;
  }

  isDestructible(id: WallID) {
    const [[i, j], right] = id;
    if (i === -1 || j === -1) {
      return false;
    }
    return this.cells[i][j][right ? "rightWall" : "bottomWall"].destructible;
  }

  wallIdsEqual(a: WallID, b: WallID): boolean {
    return a[0].x === b[0].x && a[0].y === b[0].y && a[1] === b[1];
  }

  getWallInDirection(cell: V2d, direction: V2d): WallID {
    return getWallInDirection(cell, direction);
  }

  // Grid points are where walls intersect. Grid coordinate x & y values always end in .5
  getWallInDirectionFromGridPoint(gridPoint: V2d, direction: V2d): WallID {
    const perpDirection = direction.rotate90cw();
    const cell = gridPoint.add(direction.add(perpDirection).mul(0.5));
    return getWallInDirection(cell, perpDirection.mul(-1));
  }

  generateLevel(
    levelTemplate: LevelTemplate,
    seed: number = rInteger(0, 2 ** 32)
  ): Level {
    const outerWalls = this.addOuterWalls();
    const roomEntities = this.addRooms(levelTemplate, seed);
    const innerWalls = this.addInnerWalls(seed);
    const exits = this.addExits();
    const closetEntities = this.addClosets();
    const pickups = this.fillClosets(seed);
    const nubbyEntities = this.fillNubbies();
    const hallwayLights = this.addHallwayLights();
    const enemies = this.addEnemies();
    const doors = this.doors.map(this.buildDoorEntity.bind(this));

    const subFloor = levelTemplate.makeSubfloor([
      LEVEL_SIZE * CELL_WIDTH,
      LEVEL_SIZE * CELL_WIDTH,
    ]);

    const entities = [
      subFloor,
      this.makeLevelGridMap(),
      ...outerWalls,
      ...roomEntities,
      ...innerWalls,
      ...exits,
      ...closetEntities,
      ...enemies,
      ...pickups,
      ...nubbyEntities,
      ...hallwayLights,
      ...doors,
    ];

    return {
      entities,
    };
  }

  makeLevelGridMap(): LevelGridMap {
    const levelGriMap = new LevelGridMap(LEVEL_SIZE, LEVEL_SIZE, CELL_WIDTH);
    return levelGriMap;
  }

  levelCoordToWorldCoord(coord: V2d): V2d {
    const firstCellCenter = CELL_WIDTH / 2;
    return coord.mul(CELL_WIDTH).add(V(firstCellCenter, firstCellCenter));
  }

  addIndestructibleBox(upperRightCorner: V2d, dimensions: V2d) {
    if (upperRightCorner.y > 0) {
      for (let i = 0; i < dimensions.x; i++) {
        this.markIndestructible([upperRightCorner.add([i, -1]), false]);
      }
    }
    if (upperRightCorner.x > 0) {
      for (let j = 0; j < dimensions.y; j++) {
        this.markIndestructible([upperRightCorner.add([-1, j]), true]);
      }
    }
    for (let i = 0; i < dimensions[0]; i++) {
      for (let j = 0; j < dimensions[1]; j++) {
        const [x, y] = upperRightCorner.add([i, j]);
        const cell = this.cells[x][y];
        cell.content = "empty";
        if (i === dimensions[0] - 1) {
          this.markIndestructible([V(x, y), true]);
        } else {
          this.destroyWall([V(x, y), true]);
        }
        if (j === dimensions[1] - 1) {
          this.markIndestructible([V(x, y), false]);
        } else {
          this.destroyWall([V(x, y), false]);
        }
      }
    }
  }

  buildDoorEntity([cell, doorDirection]: DoorID): Entity {
    // Used to determine how far a door can swing before it will hit a wall.
    const countConsecutiveWallsThatExist = (walls: WallID[]) => {
      let count = 0;
      for (const wall of walls) {
        count += 1;
        if (this.isExisting(wall)) {
          break;
        }
      }
      return count;
    };

    const directionsClockwise = [
      Direction.DOWN,
      Direction.LEFT,
      Direction.UP,
      Direction.RIGHT,
    ];

    const hingeDirection = doorDirection
      .mul(-1)
      .add(!!doorDirection.y ? Direction.RIGHT : Direction.DOWN);
    const hingePoint = cell.add(hingeDirection.mul(0.5));

    const dIndex = directionsClockwise.findIndex(
      (dir) => dir.x === doorDirection.x && dir.y === doorDirection.y
    );

    const wallsClockwiseFromHingePoint: WallID[] = [];
    for (let i = 0; i < 3; i++) {
      const wall = this.getWallInDirectionFromGridPoint(
        hingePoint,
        directionsClockwise[(i + dIndex + 1) % 4]
      );
      wallsClockwiseFromHingePoint.push(wall);
    }

    const wallsCounterClockwiseFromHingePoint = [
      ...wallsClockwiseFromHingePoint,
    ].reverse();
    const ccwWallCount = countConsecutiveWallsThatExist(
      wallsCounterClockwiseFromHingePoint
    );
    const cwWallCount = countConsecutiveWallsThatExist(
      wallsClockwiseFromHingePoint
    );
    const minAngle = (ccwWallCount - 0.1) * -(Math.PI / 2);
    const maxAngle = (cwWallCount - 0.1) * (Math.PI / 2);

    return new Door(
      this.levelCoordToWorldCoord(hingePoint),
      CELL_WIDTH,
      doorDirection.angle,
      minAngle,
      maxAngle
    );
  }

  getCellOnOtherSideOfWall(cell: V2d, wall: WallID): V2d {
    if (cell.equals(wall[0])) {
      return cell.add(wall[1] ? V(1, 0) : V(0, 1));
    } else {
      return cell.sub(cell[1] === wall[0][1] ? V(1, 0) : V(0, 1));
    }
  }

  addRooms(levelTemplate: LevelTemplate, seed: number): Entity[] {
    const entities: Entity[] = [];

    const allLocations = [];
    for (let i = 0; i < LEVEL_SIZE; i++) {
      for (let j = 0; j < LEVEL_SIZE; j++) {
        allLocations.push(V(i, j));
      }
    }
    const shuffledLocations = seededShuffle(allLocations, seed);

    const isElligibleCell = ([x, y]: V2d): boolean => {
      return (
        x < LEVEL_SIZE &&
        y < LEVEL_SIZE &&
        x >= 0 &&
        y >= 0 &&
        !this.cells[x][y].content
      );
    };

    const isWallInRoomIndestructible = (
      upperRightCorner: V2d,
      template: RoomTemplate,
      wall: WallID
    ): boolean => {
      const [[wx, wy], wr] = wall;
      const matchDoor = template.doors
        .map(
          ([doorP, doorR]: WallID): WallID => [
            doorP.add(upperRightCorner),
            doorR,
          ]
        )
        .some((doorWall: WallID) => this.wallIdsEqual(doorWall, wall));
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
    };

    const doesRoomCutoffPartOfMap = (
      upperRightCorner: V2d,
      template: RoomTemplate
    ): boolean => {
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
          const wall = this.getWallInDirection(p, direction);
          if (
            this.isDestructible(wall) &&
            !isWallInRoomIndestructible(upperRightCorner, template, wall)
          ) {
            queue.push(p.add(direction));
          }
        }
      }

      return seenCount === LEVEL_SIZE * LEVEL_SIZE;
    };

    const isElligibleRoom = (
      upperRightCorner: V2d,
      template: RoomTemplate
    ): boolean => {
      const dimensions = template.dimensions;
      for (let i = 0; i < dimensions[0]; i++) {
        for (let j = 0; j < dimensions[1]; j++) {
          if (!isElligibleCell(V(i, j).add(upperRightCorner))) {
            return false;
          }
        }
      }
      for (const [relativeCell, right] of template.doors) {
        const cell = relativeCell.add(upperRightCorner);
        const wall: WallID = [cell, right];
        const farCell = this.getCellOnOtherSideOfWall(cell, wall);
        if (!isElligibleCell(farCell) || !isElligibleCell(cell)) {
          return false;
        }
      }
      return doesRoomCutoffPartOfMap(upperRightCorner, template);
    };

    const addRoom = (template: RoomTemplate, locationOverride?: V2d) => {
      const dimensions = template.dimensions;
      let maybeCorner: V2d | undefined;
      if (locationOverride) {
        maybeCorner = locationOverride;
      } else {
        do {
          maybeCorner = shuffledLocations.pop();
        } while (maybeCorner && !isElligibleRoom(maybeCorner, template));
        if (!maybeCorner) {
          console.warn("Couldn't make room!");
          return;
        }
      }
      const corner = maybeCorner!;
      this.addIndestructibleBox(maybeCorner, dimensions);

      for (const [relativeCell, right] of template.doors) {
        const cell = relativeCell.add(corner);
        const wall: WallID = [cell, right];
        const farCell = this.getCellOnOtherSideOfWall(cell, wall);

        this.cells[cell.x][cell.y].content = "empty";
        this.cells[farCell.x][farCell.y].content = "empty";
        this.destroyWall(wall);
        this.doors.push([cell, right ? Direction.DOWN : Direction.RIGHT]);
      }

      if (template.floor) {
        entities.push(
          new RepeatingFloor(
            template.floor,
            this.levelCoordToWorldCoord(corner.sub(V(0.5, 0.5))),
            dimensions.mul(CELL_WIDTH)
          )
        );
      }

      entities.push(
        ...template.generateEntities(
          (p) => this.levelCoordToWorldCoord(p.add(corner)),
          identity
        )
      );

      template
        .generateWalls(([p, r]) => [p.add(corner), r])
        .forEach((w) => {
          this.undestroyWall(w);
          this.markIndestructible(w);
        });
    };

    this.spawnLocation = V(0, 0);
    addRoom(new SpawnRoom(), this.spawnLocation);
    levelTemplate.chooseRoomTemplates(seed).forEach((t) => addRoom(t));

    return entities;
  }

  addOuterWalls(): Entity[] {
    const max = CELL_WIDTH * LEVEL_SIZE;
    return [
      new Wall([0, 0], [max, 0]),
      new Wall([0, 0], [0, max]),
      new Wall([max, 0], [max, max]),
      new Wall([0, max], [max, max]),
    ];
  }

  addClosets(): Entity[] {
    const entities: Entity[] = [];
    for (let i = 0; i < LEVEL_SIZE; i++) {
      for (let j = 0; j < LEVEL_SIZE; j++) {
        if (this.cells[i][j].content) {
          continue;
        }

        const backCell = V(i, j);

        let openDirection;
        let backFound = 0;
        for (const direction of CARDINAL_DIRECTIONS_VALUES) {
          let wall = this.getWallInDirection(backCell, direction);
          if (!this.isExisting(wall)) {
            backFound += 1;
            openDirection = direction;
          }
        }
        if (backFound !== 1 || !openDirection) {
          continue;
        }

        const frontCell = backCell.add(openDirection);
        if (this.cells[frontCell.x][frontCell.y].content) {
          continue;
        }

        let directionFromFrontCellToDoorWall;
        let frontFound = 0;
        for (const direction of CARDINAL_DIRECTIONS_VALUES) {
          let wall = this.getWallInDirection(frontCell, direction);
          if (
            !this.isExisting(wall) &&
            (direction.x !== -openDirection.x ||
              direction.y != -openDirection.y)
          ) {
            frontFound += 1;
            directionFromFrontCellToDoorWall = direction;
          }
        }
        if (frontFound !== 1 || !directionFromFrontCellToDoorWall) {
          continue;
        }

        const doorWall = this.getWallInDirection(
          frontCell,
          directionFromFrontCellToDoorWall
        );
        const [cell, right] = doorWall;
        let doorRestingDirection = right ? Direction.DOWN : Direction.RIGHT;
        const reverseHinge =
          doorRestingDirection.x === openDirection.x &&
          doorRestingDirection.y === openDirection.y;
        if (reverseHinge) {
          doorRestingDirection = doorRestingDirection.mul(-1);
        }
        this.doors.push([cell, doorRestingDirection]);

        this.cells[frontCell.x][frontCell.y].content = "empty";
        const backWall = this.getWallInDirection(
          backCell,
          openDirection.mul(-1)
        );
        const closet = {
          backCell,
          frontCell,
          doorWall,
          backWall,
          backWallDirection: openDirection,
        };

        this.closets.push(closet);
      }
    }

    return entities;
  }

  isANubby(cell: V2d): boolean {
    let found = 0;
    for (const direction of CARDINAL_DIRECTIONS_VALUES) {
      let wall = this.getWallInDirection(cell, direction);
      if (!this.isExisting(wall)) {
        found += 1;
      }
    }
    return found === 1;
  }

  addExits(): Entity[] {
    const startingPont = this.spawnLocation!;

    let furthestPointSeen: V2d = startingPont;
    let furthestDistance = 0;

    const seen: boolean[][] = [];
    for (let i = 0; i < LEVEL_SIZE; i++) {
      seen[i] = [];
    }

    // BFS
    type QueueElement = [V2d, number];
    const queue: QueueElement[] = [[startingPont, 0]];
    while (queue.length) {
      const [p, distance] = queue.shift()!;
      const [x, y] = p;
      if (seen[x][y]) {
        continue;
      }
      seen[x][y] = true;
      if (
        distance > furthestDistance &&
        !this.cells[x][y].content &&
        this.isANubby(V(x, y))
      ) {
        furthestDistance = distance;
        furthestPointSeen = p;
      }
      for (const direction of CARDINAL_DIRECTIONS_VALUES) {
        const wall = this.getWallInDirection(p, direction);
        if (!this.isExisting(wall)) {
          queue.push([p.add(direction), distance + 1]);
        }
      }
    }

    this.cells[furthestPointSeen[0]][furthestPointSeen[1]].content = "exit";

    let openDirection: V2d;
    for (const direction of CARDINAL_DIRECTIONS_VALUES) {
      let wall = this.getWallInDirection(furthestPointSeen, direction);
      if (!this.isExisting(wall)) {
        openDirection = direction;
      }
    }

    const exitWorldCoords = this.levelCoordToWorldCoord(furthestPointSeen);
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

  addEnemies(): Entity[] {
    const enemies: Entity[] = [];
    for (let i = 0; i < LEVEL_SIZE; i++) {
      for (let j = 0; j < LEVEL_SIZE; j++) {
        if (!this.cells[i][j].content) {
          this.cells[i][j].content = "zombie";
          for (const direction of DIAGONAL_DIRECTIONS) {
            if (rBool(ZOMBIE_CONCENTRATION)) {
              const p = this.levelCoordToWorldCoord(
                V(i, j).add(Direction[direction].mul(0.25))
              );
              const r = Math.random();
              if (r < 0.05) {
                enemies.push(new Crawler(p));
              } else if (r < 0.15) {
                enemies.push(new Spitter(p));
              } else if (r < 0.25) {
                enemies.push(new Heavy(p));
              } else {
                enemies.push(new Zombie(p));
              }
            }
          }
        }
      }
    }
    return enemies;
  }

  addHallwayLights(): Entity[] {
    const entities: Entity[] = [];

    for (let i = 0; i < LEVEL_SIZE; i++) {
      for (let j = 0; j < LEVEL_SIZE; j++) {
        if (this.cells[i][j].content) {
          continue;
        }
        if ((i + j) % 2 == 0 && rBool(0.95)) {
          entities.push(
            new PointLight({
              radius: 5,
              intensity: 0.3,
              position: this.levelCoordToWorldCoord(V(i, j)),
            })
          );
        }
      }
    }

    return entities;
  }

  fillNubbies(): Entity[] {
    const entities: Entity[] = [];

    for (let i = 0; i < LEVEL_SIZE; i++) {
      for (let j = 0; j < LEVEL_SIZE; j++) {
        if (this.cells[i][j].content) {
          continue;
        }
        const cell = V(i, j);

        let openDirection: V2d;
        let found = 0;
        for (const direction of CARDINAL_DIRECTIONS_VALUES) {
          let wall = this.getWallInDirection(cell, direction);
          if (!this.isExisting(wall)) {
            found += 1;
            openDirection = direction;
          }
        }
        const isANubby = found === 1;
        if (!isANubby) {
          continue;
        }

        if (isANubby) {
          const content = choose("vending", "water-cooler");
          this.cells[i][j].content = content;
          const wallDirection = openDirection!;

          if (rBool(0.5)) {
            entities.push(
              new OverheadLight(this.levelCoordToWorldCoord(cell), {
                intensity: 0.2,
              })
            );
          }

          if (content === "vending") {
            // Fill with vending machine
            const machinePosition = cell.sub(wallDirection.mul(0.1));

            entities.push(
              new VendingMachine(
                this.levelCoordToWorldCoord(machinePosition),
                wallDirection.angle + Math.PI / 2
              )
            );
          } else if (content === "water-cooler") {
            const machinePosition = cell.sub(wallDirection.mul(0.13));
            entities.push(
              new Decoration(
                this.levelCoordToWorldCoord(machinePosition),
                waterCooler,
                wallDirection.angle
              )
            );
          }
        }
      }
    }
    return entities;
  }

  fillClosets(seed: number): Entity[] {
    const shuffledClosets: Closet[] = seededShuffle(this.closets, seed);

    let counter = 0;
    const entities: Entity[] = [];
    const consumeLocation = (f: (l: V2d) => Entity | Entity[]) => {
      const closet = shuffledClosets[counter];
      counter += 1;
      if (!closet) {
        console.warn("Not enough closets in map for all pickups!");
        return;
      }
      this.cells[closet.backCell[0]][closet.backCell[1]].content = "pickup";
      const location = closet.backCell.add(closet.backWallDirection.mul(0.5));
      entities.push(
        new PointLight({
          radius: CELL_WIDTH * 3,
          intensity: 0.5,
          color: 0xffffff,
          shadowsEnabled: true,
          position: this.levelCoordToWorldCoord(location),
        })
      );
      const entity = f(this.levelCoordToWorldCoord(location));
      if (entity instanceof Array) {
        entities.push(...entity);
      } else {
        entities.push(entity);
      }

      const dimensions = V(1, 1)
        .add(
          closet.backWallDirection.y === 1 || closet.backWallDirection.y === -1
            ? V(0, 1)
            : V(1, 0)
        )
        .mul(CELL_WIDTH);
      const upperLeftCell =
        closet.backWallDirection.x === 1 || closet.backWallDirection.y === 1
          ? closet.backCell
          : closet.frontCell;
      const upperLeftCorner = this.levelCoordToWorldCoord(
        upperLeftCell.sub(V(0.5, 0.5))
      );
      entities.push(
        new RepeatingFloor(cementFloor, upperLeftCorner, dimensions)
      );

      if (counter % 4 === 0) {
        entities.push(
          new Decoration(
            this.levelCoordToWorldCoord(
              closet.backCell
                .add(closet.backWallDirection.mul(-0.2))
                .add(closet.backWallDirection.rotate90cw().mul(-0.15))
            ),
            sack
          )
        );
      } else if (counter % 4 === 1) {
        entities.push(
          new Decoration(
            this.levelCoordToWorldCoord(
              closet.backCell.add(closet.backWallDirection.mul(-0.2))
            ),
            choose(boxPile1, boxPile2),
            closet.backWallDirection.angle + Math.PI
          )
        );
      } else if (counter % 4 === 2) {
        entities.push(
          new Decoration(
            this.levelCoordToWorldCoord(
              closet.backCell.add(
                closet.backWallDirection
                  .mul(-0.25)
                  .add(
                    closet.backWallDirection
                      .rotate90cw()
                      .mul(choose(-0.1, 0, 0.1))
                  )
              )
            ),
            choose(boxShelf1, boxShelf2),
            closet.backWallDirection.angle + Math.PI
          )
        );
      } else {
        entities.push(
          new Decoration(
            this.levelCoordToWorldCoord(
              closet.backCell.add(closet.backWallDirection.mul(-0.22))
            ),
            choose(bookcase1, bookcase2),
            closet.backWallDirection.angle + Math.PI
          )
        );
      }
    };

    consumeLocation((l: V2d) => new WeaponPickup(l, new Gun(choose(...GUNS))));
    consumeLocation(
      (l: V2d) => new WeaponPickup(l, new MeleeWeapon(choose(...MELEE_WEAPONS)))
    );
    consumeLocation((l: V2d) => new HealthPickup(l));
    consumeLocation((l: V2d) => {
      const surv = new Human(l);
      surv.giveWeapon(new Gun(choose(Glock, M1911, FiveSeven)), false);
      return [surv, new SurvivorHumanController(surv)];
    });

    for (let i = counter; i < shuffledClosets.length; i++) {
      consumeLocation((l: V2d) => new Zombie(l));
    }

    return entities;
  }

  addInnerWalls(seed: number): Entity[] {
    type UpTree = (number[] | null)[][];

    const upTree: UpTree = [];
    // const isDestroyed: boolean[][][] = [];

    const getRoot = (cell: number[]): number[] => {
      const parent = upTree[cell[0]][cell[1]];
      if (parent === null) {
        return cell;
      }

      const root = getRoot(parent);
      upTree[cell[0]][cell[1]] = root;
      return root;
    };

    const destroyWall = (id: WallID) => {
      const [cell1, isRight] = id;
      const cell2 = isRight ? cell1.add(V(1, 0)) : cell1.add(V(0, 1));
      const root1 = getRoot(cell1);
      const root2 = getRoot(cell2);

      if (root1[0] !== root2[0] || root1[1] !== root2[1]) {
        upTree[root1[0]][root1[1]] = root2;
        this.destroyWall(id);
      }
    };

    for (let i = 0; i < LEVEL_SIZE; i++) {
      upTree[i] = [];
      for (let j = 0; j < LEVEL_SIZE; j++) {
        upTree[i][j] = null;
      }
    }

    const destroyableWalls: WallID[] = [];
    for (let i = 0; i < LEVEL_SIZE; i++) {
      for (let j = 0; j < LEVEL_SIZE; j++) {
        const cell = this.cells[i][j];
        const rightWall = cell.rightWall;
        const bottomWall = cell.bottomWall;
        if (rightWall.destructible) {
          destroyableWalls.push(rightWall.id);
        }
        if (bottomWall.destructible) {
          destroyableWalls.push(bottomWall.id);
        }
      }
    }

    const shuffledWalls = seededShuffle(destroyableWalls, seed);
    for (const wall of shuffledWalls) {
      destroyWall(wall);
    }

    const wallEntities = [];
    for (let i = 0; i < LEVEL_SIZE; i++) {
      for (let j = 0; j < LEVEL_SIZE; j++) {
        const [x, y] = this.levelCoordToWorldCoord(V(i, j));
        if (this.cells[i][j].rightWall.exists) {
          wallEntities.push(
            new Wall(
              [x + CELL_WIDTH / 2, y - CELL_WIDTH / 2],
              [x + CELL_WIDTH / 2, y + CELL_WIDTH / 2]
            )
          );
        }
        if (this.cells[i][j].bottomWall.exists) {
          wallEntities.push(
            new Wall(
              [x - CELL_WIDTH / 2, y + CELL_WIDTH / 2],
              [x + CELL_WIDTH / 2, y + CELL_WIDTH / 2]
            )
          );
        }
      }
    }

    return wallEntities;
  }
}

export function chooseTemplate(level: number): LevelTemplate {
  switch (level) {
    // case 1:
    //   return new LobbyLevel(level);
    // case 2:
    //   return new ShopLevel(level);
    // case 3:
    //   return new MaintenanceLevel(level);
    // case 4:
    //   return new GeneratorLevel(level);
    // case 5:
    //   return new ChapelLevel(level);
    default:
      return choose(new BathroomLevel(level));
  }
}

export const generateLevel = (
  levelTemplate: LevelTemplate,
  seed: number = rInteger(0, 2 ** 32)
): Level => {
  console.log("Generating level with seed " + seed);
  return new LevelBuilder().generateLevel(levelTemplate, seed);
};
