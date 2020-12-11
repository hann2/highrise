import { Matrix, Point } from "pixi.js";
import Entity from "../../../core/entity/Entity";
import { identity } from "../../../core/util/FunctionalUtils";
import { choose, rInteger, seededShuffle } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import Decoration from "../../entities/Decoration";
import Door from "../../entities/Door";
import Exit from "../../entities/Exit";
import HealthPickup from "../../entities/HealthPickup";
import Wall from "../../entities/Wall";
import WeaponPickup from "../../entities/WeaponPickup";
import Zombie from "../../entities/zombie/Zombie";
import Floor from "../../Floor";
import { PointLight } from "../../lighting/PointLight";
import SubFloor from "../../SubFloor";
import { CARDINAL_DIRECTIONS_VALUES, Direction } from "../../utils/directions";
import {
  boxes,
  garbageCan,
  sack,
  shelfEmpty,
} from "../../view/DecorationSprite";
import Gun from "../../weapons/Gun";
import { GUNS } from "../../weapons/guns";
import { MELEE_WEAPONS } from "../../weapons/melee-weapons";
import MeleeWeapon from "../../weapons/MeleeWeapon";
import { Level } from "./Level";
import LevelTemplate from "./LevelTemplate";
import LobbyLevel from "./LobbyLevel";
import RoomTemplate from "./rooms/RoomTemplate";
import SpawnRoom from "./rooms/SpawnRoom";
import ShopLevel from "./ShopLevel";

export const LEVEL_SIZE = 14;
export const WALL_WIDTH = 0.3;
export const OPEN_WIDTH = 1.8;
export const CELL_WIDTH = WALL_WIDTH + OPEN_WIDTH;

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
  doors: WallID[] = [];
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
    return getWallInDirection(cell, direction);
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
      ...nubbyEntities,
      ...doors,
      new SubFloor([LEVEL_SIZE * CELL_WIDTH, LEVEL_SIZE * CELL_WIDTH]),
    ];

    return {
      entities,
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

    this.spawnLocation = V(0, 0);
    addRoom(new SpawnRoom(), this.spawnLocation);
    levelTemplate.chooseRoomTemplates(seed).forEach((t) => addRoom(t));

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

        let doorDirection;
        let frontFound = 0;
        for (const direction of CARDINAL_DIRECTIONS_VALUES) {
          let wall = this.getWallInDirection(frontCell, direction);
          if (
            !this.isExisting(wall) &&
            (direction.x !== -openDirection.x ||
              direction.y != -openDirection.y)
          ) {
            frontFound += 1;
            doorDirection = direction;
          }
        }
        if (frontFound !== 1 || !doorDirection) {
          continue;
        }

        const doorWall = this.getWallInDirection(frontCell, doorDirection);
        this.doors.push(doorWall);

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
        exitWorldCoords[0] - OPEN_WIDTH / 2,
        exitWorldCoords[1] - OPEN_WIDTH / 2,
        exitWorldCoords[0] + OPEN_WIDTH / 2,
        exitWorldCoords[1] + OPEN_WIDTH / 2,
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
          // enemies.push(new Zombie(this.levelCoordToWorldCoord(V(i, j))));
        }
      }
    }
    return enemies;
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
          const wallDirection = openDirection!;
          const machinePosition = cell.sub(wallDirection.mul(0.2));
          const machineDimensions = wallDirection.x ? V(0.3, 0.5) : V(0.5, 0.3);

          const light = new PointLight();
          light.setIntensity(0.3);
          light.setColor(0xadff2f);
          light.setPosition(this.levelCoordToWorldCoord(machinePosition));
          entities.push(light);

          const corner1 = this.levelCoordToWorldCoord(
            machinePosition.sub(machineDimensions.mul(0.5))
          );
          const corner2 = this.levelCoordToWorldCoord(
            machinePosition.add(machineDimensions.mul(0.5))
          );
          entities.push(new Wall(corner1.x, corner1.y, corner2.x, corner2.y));
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
      const light = new PointLight(CELL_WIDTH * 3, 0.5, 0xffffff, true);
      light.setPosition(this.levelCoordToWorldCoord(location));
      entities.push(light);
      const entity = f(this.levelCoordToWorldCoord(location));
      if (entity instanceof Array) {
        entities.push(...entity);
      } else {
        entities.push(entity);
      }

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
              closet.backCell.add(
                closet.backWallDirection
                  .mul(-0.25)
                  .add(closet.backWallDirection.rotate90cw().mul(0.1))
              )
            ),
            boxes
          )
        );
      } else if (counter % 4 === 2) {
        entities.push(
          new Decoration(
            this.levelCoordToWorldCoord(
              closet.backCell.add(
                closet.backWallDirection
                  .mul(-0.2)
                  .add(closet.backWallDirection.rotate90cw().mul(0.2))
              )
            ),
            garbageCan
          )
        );
      } else {
        entities.push(
          new Decoration(
            this.levelCoordToWorldCoord(
              closet.backCell.add(closet.backWallDirection.mul(-0.15))
            ),
            shelfEmpty
          )
        );
      }
    };

    consumeLocation((l: V2d) => new WeaponPickup(l, new Gun(choose(...GUNS))));
    consumeLocation(
      (l: V2d) => new WeaponPickup(l, new MeleeWeapon(choose(...MELEE_WEAPONS)))
    );
    consumeLocation((l: V2d) => new HealthPickup(l));
    // consumeLocation((l: V2d) => {
    //   const surv = new Human(l);
    //   surv.giveWeapon(new Gun(choose(Glock, M1911, FiveSeven)), false);
    //   return [surv, new SurvivorHumanController(surv)];
    // });

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

export function chooseTemplate(level: number): LevelTemplate {
  return level === 1 ? new LobbyLevel() : new ShopLevel();
}

export const generateLevel = (
  levelTemplate: LevelTemplate,
  seed: number = rInteger(0, 2 ** 32)
): Level => {
  console.log("Generating level with seed " + seed);
  return new LevelBuilder().generateLevel(levelTemplate, seed);
};
