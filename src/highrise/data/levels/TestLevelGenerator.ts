import Entity from "../../../core/entity/Entity";
import { seededShuffle } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import Exit from "../../entities/Exit";
import Party from "../../entities/Party";
import Wall from "../../entities/Wall";
import Zombie from "../../entities/Zombie";
import Level from "./Level";

const LEVEL_SIZE = 10;

export default class TestLevelGenerator {
  constructor() {}

  generateLevel(party: Party, seed: number): Level {
    const spawnLocations = [V(0, 1), V(1, 1), V(2, 1), V(1, 2)].map(
      this.levelCoordToWorldCoord
    );

    const outerWalls = this.addOuterWalls();
    const innerWalls = this.addInnerWalls(seed);
    const exits = this.addExits();
    const enemies = this.addEnemies();
    // addPickups();
    // addSurvivors();

    const entities = [...outerWalls, ...innerWalls, ...exits, ...enemies];

    const level = new Level(1);
    level.placeParty(spawnLocations, entities, party);
    return level;
  }

  levelCoordToWorldCoord(coord: V2d): V2d {
    return coord.mul(4).add(V(2.5, 2.5));
  }

  addOuterWalls(): Entity[] {
    return [
      new Wall(0, 0, 4 * LEVEL_SIZE + 1, 1),
      new Wall(0, 0, 1, 4 * LEVEL_SIZE + 1),
      new Wall(4 * LEVEL_SIZE, 0, 4 * LEVEL_SIZE + 1, 4 * LEVEL_SIZE + 1),
      new Wall(0, 4 * LEVEL_SIZE, 4 * LEVEL_SIZE + 1, 4 * LEVEL_SIZE + 1),
    ];
  }

  addExits(): Entity[] {
    return [new Exit(1, 1, 3, 3)];
  }

  addEnemies(): Entity[] {
    const enemies = [];
    for (let i = 0; i < LEVEL_SIZE; i++) {
      for (let j = 0; j < LEVEL_SIZE; j++) {
        if (i <= 2 && j <= 2) {
          continue;
        }
        enemies.push(new Zombie(this.levelCoordToWorldCoord(V(i, j))));
      }
    }
    return enemies;
  }

  addInnerWalls(seed: number): Entity[] {
    type UpTree = (number[] | null)[][];
    type WallI = { i: number; j: number; right: boolean };

    const upTree: UpTree = [];
    const isDestroyed: boolean[][][] = [];

    const getRoot = (cell: number[]): number[] => {
      const parent = upTree[cell[0]][cell[1]];
      if (parent === null) {
        return cell;
      }

      const root = getRoot(parent);
      upTree[cell[0]][cell[1]] = root;
      return root;
    };

    const destroyWall = (wall: WallI, maze: boolean) => {
      const cell1 = [wall.i, wall.j];
      const cell2 = wall.right ? [wall.i + 1, wall.j] : [wall.i, wall.j + 1];
      const root1 = getRoot(cell1);
      const root2 = getRoot(cell2);

      if (root1[0] !== root2[0] || root1[1] !== root2[1]) {
        upTree[root1[0]][root1[1]] = root2;
        isDestroyed[cell1[0]][cell1[1]][wall.right ? 0 : 1] = true;
      } else if (!maze) {
        isDestroyed[cell1[0]][cell1[1]][wall.right ? 0 : 1] = true;
      }
    };
    for (let i = 0; i < LEVEL_SIZE; i++) {
      upTree[i] = [];
      for (let j = 0; j < LEVEL_SIZE; j++) {
        upTree[i][j] = null;
      }
    }

    const destroyableWalls: WallI[] = [];
    for (let i = 0; i < LEVEL_SIZE; i++) {
      isDestroyed[i] = [];
      for (let j = 0; j < LEVEL_SIZE; j++) {
        isDestroyed[i][j] = [false, false];
        if (i <= 2 && j <= 2) {
          continue;
        }
        if (i < LEVEL_SIZE - 1) {
          destroyableWalls.push({ i, j, right: true });
        }
        if (j < LEVEL_SIZE - 1) {
          destroyableWalls.push({ i, j, right: false });
        }
      }
    }

    // Spawning area
    destroyWall({ i: 0, j: 0, right: true }, false);
    destroyWall({ i: 0, j: 0, right: false }, false);
    destroyWall({ i: 1, j: 0, right: true }, false);
    destroyWall({ i: 1, j: 0, right: false }, false);
    destroyWall({ i: 2, j: 0, right: true }, false);
    destroyWall({ i: 2, j: 0, right: false }, false);
    destroyWall({ i: 0, j: 1, right: true }, false);
    destroyWall({ i: 0, j: 1, right: false }, false);
    destroyWall({ i: 1, j: 1, right: true }, false);
    destroyWall({ i: 1, j: 1, right: false }, false);
    destroyWall({ i: 0, j: 2, right: true }, false);
    destroyWall({ i: 1, j: 2, right: true }, false);
    destroyWall({ i: 2, j: 1, right: false }, false);

    const shuffledWalls = seededShuffle(destroyableWalls, seed);
    for (const wall of shuffledWalls) {
      destroyWall(wall, true);
    }

    const wallEntities = [];
    for (let i = 0; i < LEVEL_SIZE; i++) {
      for (let j = 0; j < LEVEL_SIZE; j++) {
        const [x, y] = this.levelCoordToWorldCoord(V(i, j));
        if (!isDestroyed[i][j][0]) {
          const startEarly =
            j > 0 && i < LEVEL_SIZE - 1 && !isDestroyed[i + 1][j - 1][1];
          const longWall =
            (j < LEVEL_SIZE - 1 && !isDestroyed[i][j + 1][0]) ||
            (i < LEVEL_SIZE - 1 && !isDestroyed[i + 1][j][1]) ||
            !isDestroyed[i][j][1];
          wallEntities.push(
            new Wall(
              x + 1.5,
              y - (startEarly ? 2.5 : 1.5),
              x + 2.5,
              y + (longWall ? 2.5 : 1.5)
            )
          );
        }
        if (!isDestroyed[i][j][1]) {
          const longWall =
            (j < LEVEL_SIZE - 1 && !isDestroyed[i][j + 1][0]) ||
            (i < LEVEL_SIZE - 1 && !isDestroyed[i + 1][j][1]);
          wallEntities.push(
            new Wall(x - 1.5, y + 1.5, x + (longWall ? 2.5 : 1.5), y + 2.5)
          );
        }
      }
    }

    return wallEntities;
  }
}