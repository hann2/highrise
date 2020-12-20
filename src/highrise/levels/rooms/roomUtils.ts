import { V, V2d } from "../../../core/Vector";
import { Direction } from "../../utils/directions";
import CellGrid, {
  DoorBuilder,
  WallBuilder,
  WallID,
} from "../level-generation/CellGrid";
import { wallIDToDoorBuilder } from "../level-generation/doors";

export function defaultOccupiedCells(dimensions: V2d, doors: WallID[]): V2d[] {
  const cells: V2d[] = [];
  for (let i = 0; i < dimensions.x; i++) {
    for (let j = 0; j < dimensions.y; j++) {
      cells.push(V(i, j));
    }
  }
  for (const [cell, right] of doors) {
    if (cell.x === -1 || cell.y === -1) {
      cells.push(cell);
    } else if (right) {
      cells.push(cell.add(Direction.RIGHT));
    } else {
      cells.push(cell.add(Direction.DOWN));
    }
  }
  return cells;
}

const DEFAULT_WALL = {
  exists: true,
  destructible: false,
  chainLink: false,
};

export function defaultWalls(dimensions: V2d, doors: WallID[]): WallBuilder[] {
  const walls: WallBuilder[] = [];
  for (let i = 0; i < dimensions.x; i++) {
    // top
    walls.push({
      id: [V(i, -1), false],
      ...DEFAULT_WALL,
    });
    // bottom
    walls.push({
      id: [V(i, dimensions.y - 1), false],
      ...DEFAULT_WALL,
    });
  }
  for (let j = 0; j < dimensions.y; j++) {
    // left
    walls.push({
      id: [V(-1, j), true],
      ...DEFAULT_WALL,
    });
    // right
    walls.push({
      id: [V(dimensions.x - 1, j), true],
      ...DEFAULT_WALL,
    });
  }
  return walls.filter(
    (w) => !doors.some((d) => CellGrid.wallIdsEqual(d, w.id))
  );
}

export function defaultDoors(doors: WallID[]): DoorBuilder[] {
  return doors.map((d) => wallIDToDoorBuilder(d));
}
