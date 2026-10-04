/** Meters across each cell of what's spilled on the floor */
export const STAIN_CELL_SIZE = 0.25;

/** Something wet on the floor that shoes pick up, as it is now */
export interface Spill {
  /** How much: 1 is a fresh pool. It dries up, down to 0 at `until`. */
  amount: number;
  /** What it's tinted */
  color: number;
  /** The time (`game.simulatedTime`) it's dried up at, or Infinity */
  until: number;
}

/** A cell's spill as it was spilled */
interface Cell {
  /** How much there was when it was spilled */
  amount: number;
  color: number;
  /** When it was spilled, and when it's dried up */
  from: number;
  until: number;
}

/**
 * What's spilled on the floor, by cells `STAIN_CELL_SIZE` across, kept only
 * where something has been spilled, so it doesn't need to know how big the
 * level is. Spills dry up: the amount falls steadily from when it's spilled to
 * nothing when it's dried. Times are the caller's (`game.simulatedTime`). See
 * `FloorStains`.
 */
export class SpillGrid {
  private cells = new Map<number, Cell>();

  /**
   * Spills `amount` of something in a circle (the cells whose middles are
   * inside it) at `now`, drying up at `until`. Where there's still some, the
   * wetter of the two is kept.
   */
  spill(
    [x, y]: [number, number],
    radius: number,
    color: number,
    amount: number,
    until: number,
    now: number,
  ) {
    const minColumn = Math.floor((x - radius) / STAIN_CELL_SIZE);
    const maxColumn = Math.floor((x + radius) / STAIN_CELL_SIZE);
    const minRow = Math.floor((y - radius) / STAIN_CELL_SIZE);
    const maxRow = Math.floor((y + radius) / STAIN_CELL_SIZE);
    for (let column = minColumn; column <= maxColumn; column++) {
      for (let row = minRow; row <= maxRow; row++) {
        const dx = (column + 0.5) * STAIN_CELL_SIZE - x;
        const dy = (row + 0.5) * STAIN_CELL_SIZE - y;
        if (dx * dx + dy * dy > radius * radius) {
          continue;
        }
        const key = cellKey(column, row);
        const cell = this.cells.get(key);
        if (!cell || amountNow(cell, now) <= amount) {
          this.cells.set(key, { amount, color, from: now, until });
        }
      }
    }
  }

  /** What's spilled at a point at time `now`, if anything's still wet there */
  spillAt([x, y]: [number, number], now: number): Spill | undefined {
    const key = cellKey(
      Math.floor(x / STAIN_CELL_SIZE),
      Math.floor(y / STAIN_CELL_SIZE),
    );
    const cell = this.cells.get(key);
    if (!cell) {
      return undefined;
    }
    if (now >= cell.until) {
      this.cells.delete(key);
      return undefined;
    }
    return {
      amount: amountNow(cell, now),
      color: cell.color,
      until: cell.until,
    };
  }

  /** How many cells have something in them (some may have dried up) */
  get size(): number {
    return this.cells.size;
  }
}

/** How much is left in a cell at `now`, drying steadily to nothing */
function amountNow(cell: Cell, now: number): number {
  if (now >= cell.until) {
    return 0;
  }
  if (cell.until === Infinity) {
    return cell.amount;
  }
  return cell.amount * ((cell.until - now) / (cell.until - cell.from));
}

/** One number for a cell (or chunk) of a grid that goes either way from 0 */
export function cellKey(column: number, row: number): number {
  return (column + 32768) * 65536 + (row + 32768);
}
