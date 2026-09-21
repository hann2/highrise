type Cell = readonly [number, number];
/**
 * A 2D sparse grid data structure for storing values at integer coordinates.
 * Uses nested objects for efficient storage of sparse data, only allocating
 * space for coordinates that actually contain values.
 */
export default class Grid<T> {
  data: { [x: number]: { [y: number]: T } } = {};

  set([x, y]: Cell, value: T) {
    if (this.data[x] == null) {
      this.data[x] = {};
    }
    this.data[x][y] = value;
  }

  get([x, y]: Cell): T | undefined {
    if (!this.data.hasOwnProperty(x)) {
      return undefined;
    }
    return this.data[x][y];
  }

  delete([x, y]: Cell) {
    if (this.data[x]) {
      delete this.data[x][y];
    }
  }

  has(cell: Cell): boolean {
    return this.get(cell) != undefined;
  }
}
