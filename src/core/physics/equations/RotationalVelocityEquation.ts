import type { Body } from "../body/Body";
import type { SolverWorkspace } from "../solver/SolverWorkspace";
import { AngularEquation2D } from "./AngularEquation2D";

/**
 * Syncs rotational velocity of two bodies, or sets a relative velocity
 * (motor). Pure velocity constraint — position error is always zero, and
 * `computeB` returns only the velocity + external-force terms.
 *
 * Fits {@link AngularEquation2D} with body A contributing `−1` and body B
 * contributing `ratio` to the angular Z Jacobian. The ratio lets you spin
 * one body at a scaled speed relative to the other (effectively a
 * differential).
 */
export class RotationalVelocityEquation extends AngularEquation2D {
  ratio: number = 1;

  constructor(bodyA: Body, bodyB: Body) {
    super(bodyA, bodyB, -Number.MAX_VALUE, Number.MAX_VALUE);
    this.relativeVelocity = 1;
    this.angAz = -1;
    this.angBz = this.ratio;
  }

  /** Update the ratio and push it into the angular shape fields. */
  setRatio(ratio: number): void {
    this.ratio = ratio;
    this.angBz = ratio;
  }

  override computeB(
    _a: number,
    b: number,
    h: number,
    ws: SolverWorkspace,
  ): number {
    // Keep angBz in sync in case ratio was mutated since last solve.
    this.angBz = this.ratio;

    const GW = this.computeGW();
    const GiMf = this.computeGiMf(ws);
    return -GW * b - h * GiMf;
  }
}
