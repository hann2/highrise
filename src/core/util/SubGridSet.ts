import { SubGrid } from "./SubGrid";
import { TilePos } from "./TilePos";

/**
 * A union of rectangular grid sections that provides iteration over all
 * unique coordinate positions across multiple SubGrid rectangles.
 * Handles overlapping regions by ensuring each coordinate is only yielded once.
 */
export default class SubGridSet implements Iterable<TilePos> {
  data: SubGrid[] = [];

  add(subGrid: SubGrid): void {
    this.data.push(subGrid);
  }

  has(cell: TilePos): boolean {
    return this.data.some((subGrid) => subGrid.has(cell));
  }

  [Symbol.iterator](): Iterator<TilePos> {
    return this.values();
  }

  *cellGenerator(): Generator<TilePos> {
    for (let i = 0; i < this.data.length; i++) {
      const subGrid = this.data[i];
      for (let x = subGrid.x; x < subGrid.x + subGrid.width; x++) {
        for (let y = subGrid.y; y < subGrid.y + subGrid.height; y++) {
          const cell: TilePos = [x, y];
          // We can skip this for loop if we're ok with iterating over the same cell multiple times
          for (let j = 0; j < i; j++) {
            if (this.data[j].has(cell)) {
              // This cell has been reported previously
              continue;
            }
          }
          yield cell;
        }
      }
    }
  }

  values(): Iterator<TilePos> {
    return this.cellGenerator();
  }
}
