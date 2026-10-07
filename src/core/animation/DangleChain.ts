import { Dangle, DangleStyle } from "./Dangle";

/**
 * Something hanging that bends as it swings (a ponytail, a tie, a scarf's
 * end): a chain of `Dangle`s, each hanging from the tip of the one before
 * and pulled toward the way that one points, so the end lags behind the
 * root, and it curves and whips rather than swinging stiffly as one.
 */
export class DangleChain {
  readonly links: Dangle[];

  constructor(
    /** How the root swings; the links after it are the same, but bend at most `bend` */
    style: DangleStyle,
    /** From its pivot to its tip at rest (meters), all its links together */
    length: number,
    count: number,
    /** The most each link after the first bends from the one before (radians) */
    bend: number,
  ) {
    const linkStyle: DangleStyle = { ...style, maxAngle: bend };
    this.links = Array.from(
      { length: count },
      (_, i) => new Dangle(i === 0 ? style : linkStyle, length / count),
    );
  }

  /**
   * Moves it on by `dt` seconds, its pivot having moved to here and turned
   * to `restAngle` (in the world): each link from the tip of the one before,
   * hanging the way that one points
   */
  update(pivotX: number, pivotY: number, restAngle: number, dt: number) {
    let x = pivotX;
    let y = pivotY;
    let angle = restAngle;
    for (const link of this.links) {
      link.update(x, y, angle, dt);
      angle += link.angle;
      x = link.tipX;
      y = link.tipY;
    }
  }

  /** Gives every link a shove (meters per second) */
  push(vx: number, vy: number) {
    for (const link of this.links) {
      link.push(vx, vy);
    }
  }
}
