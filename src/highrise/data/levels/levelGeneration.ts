import { Matrix, Point } from "pixi.js";
import Entity from "../../../core/entity/Entity";
import { identity } from "../../../core/util/FunctionalUtils";
import { choose, rInteger, seededShuffle } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import BaseFloor from "../../BaseFloor";
import SurvivorHumanController from "../../entities/controllers/SurvivorHumanController";
import Door from "../../entities/Door";
import Exit from "../../entities/Exit";
import Glock from "../../entities/guns/Glock";
import M1911 from "../../entities/guns/M1911";
import PumpShotgun from "../../entities/guns/PumpShotgun";
import HealthPickup from "../../entities/HealthPickup";
import Human from "../../entities/Human";
import Axe from "../../entities/meleeWeapons/Axe";
import Katana from "../../entities/meleeWeapons/Katana";
import Wall from "../../entities/Wall";
import WeaponPickup from "../../entities/WeaponPickup";
import Zombie from "../../entities/Zombie";
import Floor from "../../Floor";
import { Level } from "./Level";
import LevelTemplate from "./LevelTemplate";
import RoomTemplate from "./RoomTemplate";

const LEVEL_SIZE = 12;
const WALL_WIDTH = 0.3;
const OPEN_WIDTH = 1.8;
const CELL_WIDTH = WALL_WIDTH + OPEN_WIDTH;

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

const Direction = {
  RIGHT: V(1, 0),
  DOWN: V(0, 1),
  LEFT: V(-1, 0),
  UP: V(0, -1),
};

const DIRECTIONS = Object.values(Direction);

interface Closet {
  backCell: V2d;
  frontCell: V2d;
}
export type WallID = [V2d, boolean];
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

export function pointToV2d(p: Point): V2d {
  return V(p.x, p.y);
}
class LevelBuilder {
  closets: Closet[] = [];
  cells: Cell[][] = [];
  doors: WallID[] = [];

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
    this.cells[i][j][right ? "rightWall" : "bottomWall"].exists = true;
  }

  markIndestructible(id: WallID) {
    const [[i, j], right] = id;
    this.cells[i][j][right ? "rightWall" : "bottomWall"].destructible = false;
  }

  isExisting(id: WallID) {
    const [[i, j], right] = id;
    if (i === -1 || j === -1) {
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
    let newCell = cell;
    if (direction.x === -1 || direction.y === -1) {
      newCell = newCell.add(direction);
    }
    return [newCell, direction.y === 0];
  }

  generateLevel(
    levelTemplate: LevelTemplate,
    seed: number = rInteger(0, 2 ** 32)
  ): Level {
    const spawnLocations = [V(1, 2), V(0, 1), V(1, 1), V(2, 1)].map(
      this.levelCoordToWorldCoord
    );

    const outerWalls = this.addOuterWalls();
    const roomEntities = this.addRooms(levelTemplate, seed);
    const innerWalls = this.addInnerWalls(seed);
    const exits = this.addExits();
    const closetEntities = this.addClosets();
    const pickups = this.fillClosets(seed);
    const enemies = this.addEnemies();
    const doors = this.doors.map(this.wallIdToDoorEntity.bind(this));

    const entities = [
      ...outerWalls,
      ...roomEntities,
      ...innerWalls,
      ...exits,
      ...closetEntities,
      ...enemies,
      ...pickups,
      ...doors,
      new BaseFloor([LEVEL_SIZE * CELL_WIDTH, LEVEL_SIZE * CELL_WIDTH]),
    ];

    return {
      entities,
      spawnLocations,
    };
  }

  levelCoordToWorldCoord(coord: V2d): V2d {
    const firstCellCenter = WALL_WIDTH + OPEN_WIDTH / 2;
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

  wallIdToDoorEntity(id: WallID): Entity {
    const [[i, j], right] = id;
    const [x, y] = this.levelCoordToWorldCoord(V(i, j));

    const countWallsThatExist = (walls: WallID[]) => {
      let count = 0;
      for (const wall of walls) {
        count += 1;
        if (this.isExisting(wall)) {
          break;
        }
      }
      return count;
    };

    if (right) {
      const wallsClockwise: WallID[] = [
        this.getWallInDirection(V(i, j), Direction.UP),
        this.getWallInDirection(V(i, j - 1), Direction.RIGHT),
        this.getWallInDirection(V(i + 1, j), Direction.UP),
      ];
      const wallsCounterClockwise = [...wallsClockwise].reverse();

      return new Door(
        V(x + OPEN_WIDTH / 2 + WALL_WIDTH / 2, y - OPEN_WIDTH / 2),
        OPEN_WIDTH,
        Math.PI / 2,
        (countWallsThatExist(wallsCounterClockwise) * -Math.PI) / 2,
        (countWallsThatExist(wallsClockwise) * Math.PI) / 2
      );
    } else {
      const wallsClockwise: WallID[] = [
        this.getWallInDirection(V(i, j + 1), Direction.LEFT),
        this.getWallInDirection(V(i - 1, j), Direction.DOWN),
        this.getWallInDirection(V(i, j), Direction.LEFT),
      ];
      const wallsCounterClockwise = [...wallsClockwise].reverse();

      return new Door(
        V(x - OPEN_WIDTH / 2, y + OPEN_WIDTH / 2 + WALL_WIDTH / 2),
        OPEN_WIDTH,
        0,
        (countWallsThatExist(wallsCounterClockwise) * -Math.PI) / 2,
        (countWallsThatExist(wallsClockwise) * Math.PI) / 2
      );
    }
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
      const startingPont = V(5, 5);

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
        for (const direction of DIRECTIONS) {
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

    const addRoom = (template: RoomTemplate) => {
      const dimensions = template.dimensions;
      let maybeCorner: V2d | undefined;
      do {
        maybeCorner = shuffledLocations.pop();
      } while (maybeCorner && !isElligibleRoom(maybeCorner, template));
      if (!maybeCorner) {
        console.warn("Couldn't make room!");
        return;
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
        this.doors.push(wall);
      }

      if (template.floor) {
        entities.push(
          new Floor(
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

    // Spawn room
    this.addIndestructibleBox(V(0, 0), V(3, 3));
    this.destroyWall([V(2, 0), true]);
    this.cells[3][0].content = "empty";
    this.doors.push([V(2, 0), true]);

    levelTemplate.chooseRoomTemplates(seed).forEach(addRoom.bind(this));

    return entities;
  }

  addOuterWalls(): Entity[] {
    return [
      new Wall(0, 0, CELL_WIDTH * LEVEL_SIZE + WALL_WIDTH, WALL_WIDTH),
      new Wall(0, 0, WALL_WIDTH, CELL_WIDTH * LEVEL_SIZE + WALL_WIDTH),
      new Wall(
        CELL_WIDTH * LEVEL_SIZE,
        0,
        CELL_WIDTH * LEVEL_SIZE + WALL_WIDTH,
        CELL_WIDTH * LEVEL_SIZE + WALL_WIDTH
      ),
      new Wall(
        0,
        CELL_WIDTH * LEVEL_SIZE,
        CELL_WIDTH * LEVEL_SIZE + WALL_WIDTH,
        CELL_WIDTH * LEVEL_SIZE + WALL_WIDTH
      ),
    ];
  }

  addClosets(): Entity[] {
    const entities: Entity[] = [];
    for (let i = 0; i < LEVEL_SIZE; i++) {
      for (let j = 0; j < LEVEL_SIZE; j++) {
        if (this.cells[i][j].content) {
          continue;
        }

        let [x, y] = [i, j];
        const backRight =
          x < LEVEL_SIZE - 1 && !this.cells[x][y].rightWall.exists;
        const backDown =
          y < LEVEL_SIZE - 1 && !this.cells[x][y].bottomWall.exists;
        const backLeft = x > 0 && !this.cells[x - 1][y].rightWall.exists;
        const backUp = y > 0 && !this.cells[x][y - 1].bottomWall.exists;
        if (+backRight + +backDown + +backLeft + +backUp !== 1) {
          continue;
        }
        x += +backRight + -backLeft;
        y += +backDown + -backUp;
        if (this.cells[x][y].content) {
          continue;
        }
        const frontRight =
          x < LEVEL_SIZE - 1 && !this.cells[x][y].rightWall.exists;
        const frontDown =
          y < LEVEL_SIZE - 1 && !this.cells[x][y].bottomWall.exists;
        const frontLeft = x > 0 && !this.cells[x - 1][y].rightWall.exists;
        const frontUp = y > 0 && !this.cells[x][y - 1].bottomWall.exists;
        if (+frontRight + +frontDown + +frontLeft + +frontUp !== 2) {
          continue;
        }

        let doorWall: WallID;
        if (frontRight && !backLeft) {
          doorWall = [V(x, y), true];
        } else if (frontDown && !backUp) {
          doorWall = [V(x, y), false];
        } else if (frontLeft && !backRight) {
          doorWall = [V(x - 1, y), true];
        } else if (frontUp && !backDown) {
          doorWall = [V(x, y - 1), false];
        } else {
          throw new Error("This should never happen");
        }
        this.doors.push(doorWall);

        this.cells[x][y].content = "empty";
        const closet = {
          backCell: V(i, j),
          frontCell: V(x, y),
        };

        this.closets.push(closet);
      }
    }

    return entities;
  }

  addExits(): Entity[] {
    // Should be near spawn
    const startingPont = V(0, 0);

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
      if (distance > furthestDistance && !this.cells[x][y].content) {
        furthestDistance = distance;
        furthestPointSeen = p;
      }
      for (const direction of DIRECTIONS) {
        const wall = this.getWallInDirection(p, direction);
        if (!this.isExisting(wall)) {
          queue.push([p.add(direction), distance + 1]);
        }
      }
    }

    this.cells[furthestPointSeen[0]][furthestPointSeen[1]].content = "exit";

    const exitWorldCoords = this.levelCoordToWorldCoord(furthestPointSeen);
    return [
      new Exit(
        exitWorldCoords[0] - OPEN_WIDTH / 2,
        exitWorldCoords[1] - OPEN_WIDTH / 2,
        exitWorldCoords[0] + OPEN_WIDTH / 2,
        exitWorldCoords[1] + OPEN_WIDTH / 2
      ),
    ];
  }

  addEnemies(): Entity[] {
    const enemies: Entity[] = [];
    for (let i = 0; i < LEVEL_SIZE; i++) {
      for (let j = 0; j < LEVEL_SIZE; j++) {
        if (!this.cells[i][j].content) {
          this.cells[i][j].content = "zombie";
          enemies.push(new Zombie(this.levelCoordToWorldCoord(V(i, j))));
        }
      }
    }
    return enemies;
  }

  fillClosets(seed: number): Entity[] {
    const locations = [];
    for (const closet of this.closets) {
      locations.push(closet.backCell);
    }
    const shuffledLocations = seededShuffle(locations, seed);

    const entities: Entity[] = [];
    const consumeLocation = (f: (l: V2d) => Entity | Entity[]) => {
      const location = shuffledLocations.pop();
      if (!location) {
        console.warn("Not enough closets in map for all pickups!");
        return;
      }
      this.cells[location[0]][location[1]].content = "pickup";
      const entity = f(this.levelCoordToWorldCoord(location));
      if (entity instanceof Array) {
        entities.push(...entity);
      } else {
        entities.push(entity);
      }
    };

    consumeLocation((l: V2d) => new WeaponPickup(l, new PumpShotgun()));
    consumeLocation((l: V2d) => new WeaponPickup(l, new Axe()));
    consumeLocation((l: V2d) => new WeaponPickup(l, new Katana()));
    consumeLocation((l: V2d) => new HealthPickup(l));
    consumeLocation((l: V2d) => {
      const surv = new Human(l);
      surv.giveWeapon(choose(new Glock(), new M1911()));
      return [surv, new SurvivorHumanController(surv)];
    });
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
              x + OPEN_WIDTH / 2,
              y - (WALL_WIDTH + OPEN_WIDTH / 2),
              x + WALL_WIDTH + OPEN_WIDTH / 2,
              y + WALL_WIDTH + OPEN_WIDTH / 2
            )
          );
        }
        if (this.cells[i][j].bottomWall.exists) {
          wallEntities.push(
            new Wall(
              x - (WALL_WIDTH + OPEN_WIDTH / 2),
              y + OPEN_WIDTH / 2,
              x + WALL_WIDTH + OPEN_WIDTH / 2,
              y + WALL_WIDTH + OPEN_WIDTH / 2
            )
          );
        }
      }
    }

    return wallEntities;
  }
}

export const generateLevel = (
  levelTemplate: LevelTemplate,
  seed: number = rInteger(0, 2 ** 32)
): Level => {
  seed = 3577873334;
  console.log("Generating level with seed " + seed);
  return new LevelBuilder().generateLevel(levelTemplate, seed);
};
