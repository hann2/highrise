import { Matrix } from "pixi.js";
import Entity from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";
import { CELL_SIZE } from "../constants/constants";
import CellGrid from "../levels/level-generation/CellGrid";
import { buildDoorEntity } from "../levels/level-generation/doors";
import {
  addInnerWalls,
  addOuterWalls,
} from "../levels/level-generation/generateWalls";
import {
  addRoom,
  AddedRoomInfo,
} from "../levels/level-generation/roomPlacement";
import { Level } from "../levels/Level";
import ExitStairwell from "../levels/rooms/ExitStairwell";
import RoomTemplate from "../levels/rooms/RoomTemplate";
import SpawnRoom from "../levels/rooms/SpawnRoom";
import TransformedRoomTemplate from "../levels/rooms/TransformedRoomTemplate";

/** The hall a boss level made with `addHall` is fought in */
export interface Hall {
  /** Its upper left cell, and its size in cells */
  min: V2d;
  size: V2d;
  /** Its rectangle in meters */
  world: WorldRect;
  /** A point in the hall's own cell coordinates ((0, 0) its upper left cell's middle) in meters */
  at(cell: V2d): V2d;
}

/** Which side of a room its door is on */
export type Side = "left" | "right" | "up" | "down";

/** A rectangle of the level, in meters */
export interface WorldRect {
  /** Upper left corner */
  min: V2d;
  /** Lower right corner */
  max: V2d;
}

/**
 * The exit stairwell turned so its door is on `side`, and where its upper left
 * cell is relative to where it's placed. Its door is below its lower left
 * cell (down), left of its upper left cell (left), above its upper right cell
 * (up) or right of its lower right cell (right).
 */
const STAIRWELL_ORIENTATIONS: Record<Side, [Matrix, V2d]> = {
  down: [new Matrix(1, 0, 0, 1), V(0, 0)],
  left: [new Matrix(0, 1, -1, 0), V(-1, 0)],
  up: [new Matrix(-1, 0, 0, -1), V(-1, -1)],
  right: [new Matrix(0, -1, 1, 0), V(0, -1)],
};

/**
 * Lays out a boss level by hand on a grid of cells (`CELL_SIZE` meters
 * square), the way the lobby is: rooms go exactly where they're put, areas are
 * opened up into one space, and `build` adds the walls (between every pair of
 * cells that haven't been joined) and the doors. Nothing is random unless the
 * boss level makes it so.
 *
 * Cells are numbered from (0, 0) in the upper left; a cell's middle is at
 * `cellToWorld(cell)`.
 */
export default class BossLevelBuilder {
  readonly grid: CellGrid;
  readonly entities: Entity[] = [];

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.grid = new CellGrid(width, height);
  }

  /** The middle of a cell (or any point in cell coordinates), in meters */
  cellToWorld(cell: V2d): V2d {
    return CellGrid.levelCoordToWorldCoord(cell);
  }

  /** The rectangle of `size` cells from `min`, in meters */
  cellsToWorld(min: V2d, size: V2d): WorldRect {
    return {
      min: min.mul(CELL_SIZE),
      max: min.add(size).mul(CELL_SIZE),
    };
  }

  /** Every cell in the rectangle of `size` cells from `min` */
  static cellsIn(min: V2d, size: V2d): V2d[] {
    const cells: V2d[] = [];
    for (let i = 0; i < size.x; i++) {
      for (let j = 0; j < size.y; j++) {
        cells.push(min.add(V(i, j)));
      }
    }
    return cells;
  }

  /**
   * Joins `cells` into one space: no walls between any two of them. Open an
   * area before putting rooms in it, since a room puts its own walls back.
   */
  open(cells: V2d[]) {
    const inArea = new Set(cells.map(([x, y]) => `${x},${y}`));
    for (const [x, y] of cells) {
      this.grid.cells[x][y].content = "boss";
      if (x < this.width - 1 && inArea.has(`${x + 1},${y}`)) {
        this.grid.destroyWall([V(x, y), true]);
      }
      if (y < this.height - 1 && inArea.has(`${x},${y + 1}`)) {
        this.grid.destroyWall([V(x, y), false]);
      }
    }
  }

  /** Puts a room with its upper left cell at `at` (in its own coordinates, (0, 0) there) */
  addRoom(template: RoomTemplate, at: V2d): AddedRoomInfo {
    const added = addRoom(this.grid, template, 0, at);
    this.entities.push(...added.entities);
    return added;
  }

  /**
   * The arrival room, with the floor's store, and its upper left cell at
   * `at`. It's 3 by 3, and its door is on the right of its upper right cell:
   * the cell outside it, `at` + (3, 0), is where it lets you out.
   */
  addArrivalRoom(arrivalRoom: SpawnRoom, at: V2d) {
    this.addRoom(arrivalRoom, at);
  }

  /**
   * The exit stairwell: 2 by 2 cells from `at`, with its door on `side` (see
   * `STAIRWELL_ORIENTATIONS` for which cell it's next to), barred until the
   * fight's won (see `BossFight`)
   */
  addExitStairwell(at: V2d, side: Side) {
    const [orientation, offset] = STAIRWELL_ORIENTATIONS[side];
    this.addRoom(
      new TransformedRoomTemplate(new ExitStairwell(), orientation),
      at.sub(offset),
    );
  }

  /** The level size (in cells) `addHall` needs for a hall of `hall` cells */
  static hallLevelSize(hall: V2d): [number, number] {
    return [hall.x + 5, Math.max(hall.y, 3)];
  }

  /**
   * The usual boss level: a hall of `size` cells, with the arrival room
   * against its left wall and the stairwell against its right, both half way
   * down, and the corners beside them solid. The level must be
   * `hallLevelSize(size)`. `pillars` are cells of the hall (in its own
   * coordinates) left solid, a cell's worth of wall each, joined into bigger
   * blocks where they touch.
   */
  addHall(arrivalRoom: SpawnRoom, size: V2d, pillars: V2d[] = []): Hall {
    const cells = BossLevelBuilder.cellsIn;
    const min = V(3, 0);
    const isPillar = (cell: V2d) =>
      pillars.some((pillar) => pillar.add(min).equals(cell));
    // The hall first, so the rooms' walls go back up around it
    this.open(cells(min, size).filter((cell) => !isPillar(cell)));
    this.open(pillars.map((pillar) => pillar.add(min)));

    const arrivalY = Math.floor((size.y - 3) / 2);
    this.addArrivalRoom(arrivalRoom, V(0, arrivalY));
    const stairwellY = Math.floor((size.y - 2) / 2);
    const right = min.x + size.x;
    this.addExitStairwell(V(right, stairwellY), "left");

    // The corners nobody goes in are solid, rather than rooms of their own
    for (const [x, width, from, to] of [
      [0, 3, arrivalY, arrivalY + 3],
      [right, 2, stairwellY, stairwellY + 2],
    ]) {
      if (from > 0) {
        this.open(cells(V(x, 0), V(width, from)));
      }
      if (to < size.y) {
        this.open(cells(V(x, to), V(width, size.y - to)));
      }
    }

    return {
      min,
      size,
      world: this.cellsToWorld(min, size),
      at: (cell) => this.cellToWorld(min.add(cell)),
    };
  }

  add(...entities: Entity[]) {
    this.entities.push(...entities);
  }

  /** The level: everything added, with the walls and doors */
  build(): Level {
    const grid = this.grid;
    return {
      entities: [
        ...this.entities,
        ...addOuterWalls([this.width, this.height]),
        ...addInnerWalls(grid),
        ...grid.doors.map((door) => buildDoorEntity(grid, door)),
      ],
      width: this.width * CELL_SIZE,
      height: this.height * CELL_SIZE,
    };
  }
}
