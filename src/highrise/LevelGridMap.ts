import BaseEntity from "../core/entity/BaseEntity";
import Entity from "../core/entity/Entity";
import Grid from "../core/util/Grid";
import { V2d } from "../core/Vector";

interface CellInfo {
  connections: [boolean, boolean, boolean, boolean];
}

class Cell {
  constructor(private grid: LevelGridMap) {}
}

export default class LevelGridMap extends BaseEntity implements Entity {
  id = "level_grid_map";

  private cells = new Grid<Cell>();

  /**
   *
   * @param width Number of cells wide
   * @param height Number of cells tall
   * @param cellSize Width and Height of a cell in meters
   */
  constructor(width: number, height: number, private cellSize: number) {
    super();

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < width; y++) {
        this.cells.set([x, y], new Cell(this));
      }
    }
  }

  worldToGrid([x, y]: [number, number]): [number, number] {
    return [Math.floor(x / this.cellSize), Math.floor(y / this.cellSize)];
  }

  getCellFromWorldPoint(worldPoint: [number, number]): Cell | undefined {
    const cellCoords = this.worldToGrid(worldPoint);
    return this.cells.get(cellCoords);
  }

  addWall() {}
}
