import { TilePos } from "./TilePos";

/**
 * Represents a rectangular subsection of a grid with efficient bounds checking.
 * Used for spatial partitioning and region-based operations on grid data.
 */
export class SubGrid {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
  ) {}

  has(cell: TilePos): boolean {
    const [x, y] = cell;
    return (
      x >= this.x &&
      y >= this.y &&
      x < this.x + this.width &&
      y < this.y + this.height
    );
  }
}
