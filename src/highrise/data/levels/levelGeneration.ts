import Entity from "../../../core/entity/Entity";
import { rInteger, seededShuffle } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import Door from "../../entities/Door";
import Exit from "../../entities/Exit";
import Rifle from "../../entities/guns/Rifle";
import Shotgun from "../../entities/guns/Shotgun";
import HealthPickup from "../../entities/HealthPickup";
import Axe from "../../entities/meleeWeapons/Axe";
import Katana from "../../entities/meleeWeapons/Katana";
import Wall from "../../entities/Wall";
import WeaponPickup from "../../entities/WeaponPickup";
import Zombie from "../../entities/Zombie";
import Floor from "../../Floor";
import { Level } from "./Level";

const LEVEL_SIZE = 10;
const WALL_WIDTH = 0.3;
const OPEN_WIDTH = 1.8;
const CELL_WIDTH = WALL_WIDTH + OPEN_WIDTH;

interface RoomTemplate {
  dimensions: V2d;
  doors: WallID[];
}
interface Closet {
  backCell: V2d;
  frontCell: V2d;
}
type WallID = [V2d, boolean];
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

const testRoomTemplate: RoomTemplate = {
  dimensions: V(3, 2),
  doors: [
    [V(-1, 1), true],
    [V(2, -1), false],
  ],
};

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
  }

  markIndestructible(id: WallID) {
    const [[i, j], right] = id;
    this.cells[i][j][right ? "rightWall" : "bottomWall"].destructible = false;
  }

  generateLevel(seed: number = rInteger(0, 2 ** 32)): Level {
    const spawnLocations = [V(1, 2), V(0, 1), V(1, 1), V(2, 1)].map(
      this.levelCoordToWorldCoord
    );

    const outerWalls = this.addOuterWalls();
    const roomEntities = this.addRooms(seed);
    const innerWalls = this.addInnerWalls(seed);
    const exits = this.addExits();
    const closetEntities = this.addClosets();
    const pickups = this.addPickups(seed);
    const enemies = this.addEnemies();
    const doors = this.doors.map(this.wallIdToDoorEntity.bind(this));
    // addSurvivors();

    const entities = [
      ...outerWalls,
      ...roomEntities,
      ...innerWalls,
      ...exits,
      ...closetEntities,
      ...enemies,
      ...pickups,
      ...doors,
      new Floor([LEVEL_SIZE * CELL_WIDTH, LEVEL_SIZE * CELL_WIDTH]),
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
    if (right) {
      return new Door(
        V(x + OPEN_WIDTH / 2 + WALL_WIDTH / 2, y - OPEN_WIDTH / 2),
        OPEN_WIDTH,
        Math.PI / 2,
        j === 0 || this.cells[i + 1][j - 1].bottomWall.exists
          ? -Math.PI / 2
          : -Math.PI,
        j === 0 || this.cells[i][j - 1].bottomWall.exists
          ? Math.PI / 2
          : Math.PI
      );
    } else {
      return new Door(
        V(x - OPEN_WIDTH / 2, y + OPEN_WIDTH / 2 + WALL_WIDTH / 2),
        OPEN_WIDTH,
        0,
        i === 0 || this.cells[i - 1][j].rightWall.exists
          ? -Math.PI / 2
          : -Math.PI,
        i === 0 || this.cells[i - 1][j + 1].rightWall.exists
          ? Math.PI / 2
          : Math.PI
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

  addRooms(seed: number): Entity[] {
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
      return true;
    };

    const addRoom = (template: RoomTemplate) => {
      const dimensions = template.dimensions;
      let corner;
      while (!isElligibleRoom((corner = shuffledLocations.pop()!), template));
      this.addIndestructibleBox(corner, dimensions);

      for (const [relativeCell, right] of template.doors) {
        const cell = relativeCell.add(corner);
        const wall: WallID = [cell, right];
        const farCell = this.getCellOnOtherSideOfWall(cell, wall);

        this.cells[farCell.x][farCell.y].content = "empty";
        this.destroyWall(wall);
        this.doors.push(wall);
      }
    };

    // Spawn room
    this.addIndestructibleBox(V(0, 0), V(3, 3));
    this.destroyWall([V(2, 0), true]);
    this.cells[3][0].content = "empty";
    this.doors.push([V(2, 0), true]);

    addRoom(testRoomTemplate);
    addRoom(testRoomTemplate);

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
      if (distance > furthestDistance) {
        furthestDistance = distance;
        furthestPointSeen = p;
      }
      if (x < LEVEL_SIZE - 1 && !this.cells[x][y].rightWall.exists) {
        queue.push([V(x + 1, y), distance + 1]);
      }
      if (y < LEVEL_SIZE - 1 && !this.cells[x][y].bottomWall.exists) {
        queue.push([V(x, y + 1), distance + 1]);
      }
      if (x > 0 && !this.cells[x - 1][y].rightWall.exists) {
        queue.push([V(x - 1, y), distance + 1]);
      }
      if (y > 0 && !this.cells[x][y - 1].bottomWall.exists) {
        queue.push([V(x, y - 1), distance + 1]);
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
    const enemies = [];
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

  addPickups(seed: number): Entity[] {
    const locations = [];
    for (const closet of this.closets) {
      locations.push(closet.backCell);
    }
    const shuffledLocations = seededShuffle(locations, seed);

    const entities: Entity[] = [];
    const consumeLocation = (f: (l: V2d) => Entity) => {
      const location = shuffledLocations.pop();
      if (!location) {
        console.warn("Not enough closets in map for all pickups!");
        return;
      }
      this.cells[location[0]][location[1]].content = "pickup";
      entities.push(f(this.levelCoordToWorldCoord(location)));
    };

    consumeLocation((l: V2d) => new WeaponPickup(l, new Shotgun()));
    consumeLocation((l: V2d) => new WeaponPickup(l, new Rifle()));
    consumeLocation((l: V2d) => new WeaponPickup(l, new Axe()));
    consumeLocation((l: V2d) => new WeaponPickup(l, new Katana()));
    consumeLocation((l: V2d) => new HealthPickup(l));
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

export const generateLevel = (seed: number = rInteger(0, 2 ** 32)): Level => {
  return new LevelBuilder().generateLevel(seed);
};
