import Entity from "../../../core/entity/Entity";
import { rInteger, seededShuffle } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
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

type Closet = { backCell: V2d; frontCell: V2d };
type WallID = [V2d, boolean];
type WallBuilder = { exists: boolean; destructible: boolean; id: WallID };
type Cell = {
  content?: string;
  rightWall: WallBuilder;
  bottomWall: WallBuilder;
};

class LevelBuilder {
  closets: Closet[] = [];
  cells: Cell[][] = [];

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
    const roomEntities = this.addRooms();
    const innerWalls = this.addInnerWalls(seed);
    const exits = this.addExits();
    const closetEntities = this.addClosets();
    const pickups = this.addPickups(seed);
    const enemies = this.addEnemies();
    // addSurvivors();

    const entities = [
      ...outerWalls,
      ...roomEntities,
      ...innerWalls,
      ...exits,
      ...enemies,
      ...pickups,
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
    for (let i = 0; i < dimensions[0]; i++) {
      for (let j = 0; j < dimensions[1]; j++) {
        const cell = this.cells[i][j];
        cell.content = "empty";
        const [x, y] = upperRightCorner.add([i, j]);
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

  addRooms(): Entity[] {
    // Spawn room
    this.addIndestructibleBox(V(0, 0), V(3, 3));
    this.destroyWall([V(2, 0), true]);
    this.cells[3][0].content = "empty";

    return [];
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
    for (let i = 0; i < LEVEL_SIZE; i++) {
      for (let j = 0; j < LEVEL_SIZE; j++) {
        if (this.cells[i][j].content) {
          continue;
        }

        let [x, y] = [i, j];
        let right = x < LEVEL_SIZE - 1 && !this.cells[x][y].rightWall.exists;
        let down = y < LEVEL_SIZE - 1 && !this.cells[x][y].bottomWall.exists;
        let left = x > 0 && !this.cells[x - 1][y].rightWall.exists;
        let up = y > 0 && !this.cells[x][y - 1].bottomWall.exists;
        if (+right + +down + +left + +up !== 1) {
          continue;
        }
        x += +right + -left;
        y += +down + -up;
        if (this.cells[x][y].content) {
          continue;
        }
        right = x < LEVEL_SIZE - 1 && !this.cells[x][y].rightWall.exists;
        down = y < LEVEL_SIZE - 1 && !this.cells[x][y].bottomWall.exists;
        left = x > 0 && !this.cells[x - 1][y].rightWall.exists;
        up = y > 0 && !this.cells[x][y - 1].bottomWall.exists;
        if (+right + +down + +left + +up !== 2) {
          continue;
        }

        this.cells[x][y].content = "empty";
        const closet = {
          backCell: V(i, j),
          frontCell: V(x, y),
        };

        this.closets.push(closet);
      }
    }
    console.log(this.closets);

    return [];
  }

  addExits(): Entity[] {
    let furthestPointSeen = V(0, 0);
    let furthestDistance = 0;

    const seen: boolean[][] = [];
    for (let i = 0; i < LEVEL_SIZE; i++) {
      seen[i] = [];
    }

    const traverse = (p: V2d, distance: number) => {
      const [x, y] = p;
      if (seen[x][y]) {
        return;
      }
      seen[x][y] = true;
      if (distance > furthestDistance) {
        furthestDistance = distance;
        furthestPointSeen = p;
      }
      if (x < LEVEL_SIZE - 1 && !this.cells[x][y].rightWall.exists) {
        traverse(V(x + 1, y), distance + 1);
      }
      if (y < LEVEL_SIZE - 1 && !this.cells[x][y].bottomWall.exists) {
        traverse(V(x, y + 1), distance + 1);
      }
      if (x > 0 && !this.cells[x - 1][y].rightWall.exists) {
        traverse(V(x - 1, y), distance + 1);
      }
      if (y > 0 && !this.cells[x][y - 1].bottomWall.exists) {
        traverse(V(x, y - 1), distance + 1);
      }
    };

    traverse(furthestPointSeen, 0);

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
    const consumeLocation = () => {
      const location = shuffledLocations.pop()!;
      this.cells[location[0]][location[1]].content = "pickup";
      return this.levelCoordToWorldCoord(location);
    };

    return [
      new WeaponPickup(consumeLocation(), new Shotgun()),
      new WeaponPickup(consumeLocation(), new Rifle()),
      new WeaponPickup(consumeLocation(), new Axe()),
      new WeaponPickup(consumeLocation(), new Katana()),
      new HealthPickup(consumeLocation()),
    ];
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
          const startEarly =
            j > 0 &&
            i < LEVEL_SIZE - 1 &&
            this.cells[i + 1][j - 1].bottomWall.exists;
          const longWall =
            (j < LEVEL_SIZE - 1 && this.cells[i][j + 1].rightWall.exists) ||
            (i < LEVEL_SIZE - 1 && this.cells[i + 1][j].bottomWall.exists) ||
            this.cells[i][j].bottomWall.exists;
          wallEntities.push(
            new Wall(
              x + OPEN_WIDTH / 2,
              y - (startEarly ? WALL_WIDTH + OPEN_WIDTH / 2 : OPEN_WIDTH / 2),
              x + WALL_WIDTH + OPEN_WIDTH / 2,
              y + (longWall ? WALL_WIDTH + OPEN_WIDTH / 2 : OPEN_WIDTH / 2)
            )
          );
        }
        if (this.cells[i][j].bottomWall.exists) {
          const longWall =
            (j < LEVEL_SIZE - 1 && this.cells[i][j + 1].rightWall.exists) ||
            (i < LEVEL_SIZE - 1 && this.cells[i + 1][j].bottomWall.exists);
          wallEntities.push(
            new Wall(
              x - OPEN_WIDTH / 2,
              y + OPEN_WIDTH / 2,
              x + (longWall ? WALL_WIDTH + OPEN_WIDTH / 2 : OPEN_WIDTH / 2),
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
