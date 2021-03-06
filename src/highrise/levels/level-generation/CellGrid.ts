import { V, V2d } from "../../../core/Vector";
import { CELL_SIZE, DEFAULT_LEVEL_SIZE } from "../../constants/constants";
import Wall from "../../environment/Wall";

export interface Closet {
  backCell: V2d;
  frontCell: V2d;
  backWall: WallID;
  doorWall: WallID;
  backWallDirection: V2d;
}
export type WallID = [V2d, boolean];
export interface DoorBuilder {
  wallID: WallID;
  hingePoint: V2d;
  restingDirection: V2d;
  chainLink: boolean;
}
export interface WallBuilder {
  exists: boolean;
  destructible: boolean;
  id: WallID;
  chainLink: boolean;
}
interface CellBuilder {
  /** Column and Row index that this cell is in */
  readonly position: V2d;
  content?: string;
  rightWall: WallBuilder;
  bottomWall: WallBuilder;
}

export default class CellGrid {
  cells: CellBuilder[][] = [];
  closets: Closet[] = [];
  doors: DoorBuilder[] = [];
  spawnLocation: V2d;

  constructor(width: number, height: number) {
    // Can be changed easily.  Represents upper left corner of spawn room.  If you change
    // this make sure to leave space for the dimensions of the room and allow the door to open!
    this.spawnLocation = V(0, 0);

    for (let i = 0; i < width; i++) {
      this.cells[i] = [];
      for (let j = 0; j < height; j++) {
        this.cells[i][j] = {
          position: V(i, j),
          rightWall: {
            id: [V(i, j), true],
            exists: true,
            destructible: i < width - 1,
            chainLink: false,
          },
          bottomWall: {
            id: [V(i, j), false],
            exists: true,
            destructible: j < height - 1,
            chainLink: false,
          },
        };
      }
    }
  }

  get width() {
    return this.cells.length;
  }

  get height() {
    return this.cells[0].length;
  }

  /** Iterates through all the valid positions in the grid */
  *getPositions(): Iterable<[number, number]> {
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        yield [i, j];
      }
    }
  }

  *getCells(): Iterable<CellBuilder> {
    for (const [i, j] of this.getPositions()) {
      yield this.cells[i][j];
    }
  }

  getWallBuilder(id: WallID) {
    const [[i, j], right] = id;
    return this.cells[i][j][right ? "rightWall" : "bottomWall"];
  }

  destroyWall(id: WallID) {
    const wallBuilder = this.getWallBuilder(id);
    wallBuilder.exists = false;
    wallBuilder.destructible = true;
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
    if (i < 0 || j < 0 || i >= this.width || j >= this.height) {
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

  static wallIdsEqual(a: WallID, b: WallID): boolean {
    return a[0].x === b[0].x && a[0].y === b[0].y && a[1] === b[1];
  }

  static getWallInDirection(cell: V2d, direction: V2d): WallID {
    let newCell = cell;
    if (direction.x === -1 || direction.y === -1) {
      newCell = newCell.add(direction);
    }
    return [newCell, direction.y === 0];
  }

  // Grid points are where walls intersect. Grid coordinate x & y values always end in .5
  static getWallInDirectionFromGridPoint(
    gridPoint: V2d,
    direction: V2d
  ): WallID {
    const perpDirection = direction.rotate90cw();
    const cell = gridPoint.add(direction.add(perpDirection).mul(0.5));
    return CellGrid.getWallInDirection(cell, perpDirection.mul(-1));
  }

  static levelCoordToWorldCoord(coord: V2d): V2d {
    const firstCellCenter = CELL_SIZE / 2;
    return coord.mul(CELL_SIZE).add(V(firstCellCenter, firstCellCenter));
  }

  addIndestructibleBox(
    upperRightCorner: V2d,
    [width, height]: [number, number]
  ) {
    if (upperRightCorner.y > 0) {
      for (let i = 0; i < width; i++) {
        this.markIndestructible([upperRightCorner.add([i, -1]), false]);
      }
    }
    if (upperRightCorner.x > 0) {
      for (let j = 0; j < height; j++) {
        this.markIndestructible([upperRightCorner.add([-1, j]), true]);
      }
    }
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        const [x, y] = upperRightCorner.add([i, j]);
        const cell = this.cells[x][y];
        cell.content = "empty";
        if (i === width - 1) {
          this.markIndestructible([V(x, y), true]);
        } else {
          this.destroyWall([V(x, y), true]);
        }
        if (j === height - 1) {
          this.markIndestructible([V(x, y), false]);
        } else {
          this.destroyWall([V(x, y), false]);
        }
      }
    }
  }

  static getCellOnOtherSideOfWall(cell: V2d, wall: WallID): V2d {
    if (cell.equals(wall[0])) {
      return cell.add(wall[1] ? V(1, 0) : V(0, 1));
    } else {
      return cell.sub(cell[1] === wall[0][1] ? V(1, 0) : V(0, 1));
    }
  }
}
