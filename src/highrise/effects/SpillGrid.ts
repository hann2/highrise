/** Meters across each cell of what's spilled on the floor */
export const STAIN_CELL_SIZE = 0.25;

/** Something wet on the floor that shoes pick up */
export interface Spill {
  /** How much: 1 is a fresh pool */
  amount: number;
  /** What it's tinted */
  color: number;
  /** The time (`game.simulatedTime`) it's gone at (a splat that fades), or Infinity */
  until: number;
}

/**
 * What's spilled on the floor, by cells `STAIN_CELL_SIZE` across, kept only
 * where something has been spilled, so it doesn't need to know how big the
 * level is. Times are the caller's (`game.simulatedTime`). See `FloorStains`.
 */
export class SpillGrid {
  private spills = new Map<number, Spill>();

  /**
   * Spills `amount` of something in a circle: the cells whose middles are
   * inside it, until `until`. Where there's already some, the most of each is
   * kept.
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
        const spill = this.spills.get(key);
        if (spill && now < spill.until) {
          spill.amount = Math.max(spill.amount, amount);
          spill.until = Math.max(spill.until, until);
          spill.color = color;
        } else {
          this.spills.set(key, { amount, color, until });
        }
      }
    }
  }

  /** What's spilled at a point at time `now`, if anything */
  spillAt([x, y]: [number, number], now: number): Spill | undefined {
    const key = cellKey(
      Math.floor(x / STAIN_CELL_SIZE),
      Math.floor(y / STAIN_CELL_SIZE),
    );
    const spill = this.spills.get(key);
    if (spill && now >= spill.until) {
      this.spills.delete(key);
      return undefined;
    }
    return spill;
  }

  /** How many cells have something in them (some may have dried up) */
  get size(): number {
    return this.spills.size;
  }
}

/** One number for a cell (or chunk) of a grid that goes either way from 0 */
export function cellKey(column: number, row: number): number {
  return (column + 32768) * 65536 + (row + 32768);
}
