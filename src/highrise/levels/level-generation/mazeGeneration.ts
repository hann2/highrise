import { seededShuffle } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { CARDINAL_DIRECTIONS_VALUES } from "../../utils/directions";
import CellGrid, { WallID } from "./CellGrid";

/**
 * Given a levelBuilder with all walls existing, randomly destroys destructible walls until all cells are reachable.
 * It will not destroy the wall if the opposing cells can already reach one another.  This makes it so every cell can be
 * reached by exactly one path.  Rooms mess this up because we don't properly initialize all room cells as "connected",
 * but it's cool to allow multiple paths in some cases so I'm leaving it.
 *
 * It makes a pretty good maze.
 */
export function buildMaze(
  cellGrid: CellGrid,
  seed: number,
  maziness: number = 1
) {
  type UpTree = (number[] | null)[][];

  const upTree: UpTree = [];
  for (let i = 0; i < cellGrid.cells.length; i++) {
    upTree[i] = [];
    for (let j = 0; j < cellGrid.cells[i].length; j++) {
      // Here we could initialize all the room cells to point at the same cell and be considered connected, but we choose
      // not to.  See comment above this function.
      upTree[i][j] = null;
    }
  }

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
      cellGrid.destroyWall(id);
    }
  };

  const destroyableWalls: WallID[] = [];
  for (let i = 0; i < cellGrid.cells.length; i++) {
    for (let j = 0; j < cellGrid.cells[i].length; j++) {
      const cell = cellGrid.cells[i][j];
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
}

// I think we do this work twice, and this logic should be inlined in findExit
function isANubby(cellGrid: CellGrid, cell: V2d): boolean {
  let found = 0;
  for (const direction of CARDINAL_DIRECTIONS_VALUES) {
    let wall = CellGrid.getWallInDirection(cell, direction);
    if (!cellGrid.isExisting(wall)) {
      found += 1;
    }
  }
  return found === 1;
}

/**
 * Given a cell grid, explores the map and finds the unoccupied nubby that's furthest from the spawn location
 */
export function findExit(cellGrid: CellGrid, startingPont: V2d): [V2d, V2d] {
  let furthestPointSeen: V2d = startingPont;
  let furthestDistance = 0;

  const seen: boolean[][] = [];
  for (let i = 0; i < cellGrid.cells.length; i++) {
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
      !cellGrid.cells[x][y].content &&
      isANubby(cellGrid, V(x, y))
    ) {
      furthestDistance = distance;
      furthestPointSeen = p;
    }
    for (const direction of CARDINAL_DIRECTIONS_VALUES) {
      const wall = CellGrid.getWallInDirection(p, direction);
      if (!cellGrid.isExisting(wall)) {
        queue.push([p.add(direction), distance + 1]);
      }
    }
  }

  cellGrid.cells[furthestPointSeen[0]][furthestPointSeen[1]].content = "exit";

  let openDirection: V2d;
  for (const direction of CARDINAL_DIRECTIONS_VALUES) {
    let wall = CellGrid.getWallInDirection(furthestPointSeen, direction);
    if (!cellGrid.isExisting(wall)) {
      openDirection = direction;
    }
  }

  return [furthestPointSeen, openDirection!];
}
