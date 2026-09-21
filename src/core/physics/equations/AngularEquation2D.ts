/**
 * Shape-specialized 2-body equation for **pure rotational** constraints — no
 * linear contribution. The Jacobian has the shape:
 *
 *   G = [ 0, 0, angAz,   0, 0, angBz ]
 *
 * The two angular scalars are stored independently (not forced to be
 * antisymmetric) so we can represent gear-ratio style coupling (e.g.
 * `angAz = ratio`, `angBz = -1`).
 *
 * ## Storage
 *
 * Two floats in named fields:
 *   - `angAz` — body A angular contribution
 *   - `angBz` — body B angular contribution
 *
 * ## When to use
 *
 * Angular constraints between two rigid bodies. Used by:
 *   - {@link RotationalLockEquation} — hard-limit on relative angle
 *   - {@link AngleLockEquation} — hinge limit with optional gear ratio
 *   - {@link RotationalVelocityEquation} — motor that drives a target angular velocity
 */
import type { Body } from "../body/Body";
import { EQ_INDEX_A, EQ_INDEX_B } from "../internal";
import type { SolverWorkspace } from "../solver/SolverWorkspace";
import { Equation } from "./Equation";

export class AngularEquation2D extends Equation {
  /** Body A angular contribution. */
  angAz: number = 0;

  /** Body B angular contribution. */
  angBz: number = 0;

  constructor(
    bodyA: Body,
    bodyB: Body,
    minForce = -Number.MAX_VALUE,
    maxForce = Number.MAX_VALUE,
  ) {
    super(bodyA, bodyB, minForce, maxForce);
  }

  /** Position error. Owning constraints set `offset` each substep. */
  override computeGq(): number {
    return this.offset;
  }

  override computeGW(): number {
    return (
      this.angAz * this.bodyA.angularVelocity +
      this.angBz * this.bodyB.angularVelocity +
      this.relativeVelocity
    );
  }

  override computeGWlambda(ws: SolverWorkspace): number {
    const wl = ws.wlambda;
    return (
      this.angAz * wl[this[EQ_INDEX_A]] + this.angBz * wl[this[EQ_INDEX_B]]
    );
  }

  override computeGiMf(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const aAz = ws.invInertiaSolve[idxA] * this.bodyA.angularForce;
    const aBz = ws.invInertiaSolve[idxB] * this.bodyB.angularForce;
    return this.angAz * aAz + this.angBz * aBz;
  }

  override computeGiMGt(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iIA = ws.invInertiaSolve[idxA];
    const iIB = ws.invInertiaSolve[idxB];
    // angAz² · invI_A + angBz² · invI_B
    return this.angAz * this.angAz * iIA + this.angBz * this.angBz * iIB;
  }

  override addToWlambda(deltalambda: number, ws: SolverWorkspace): this {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const wl = ws.wlambda;
    const dl = deltalambda;

    // wl += invI * (ang * dl)
    wl[idxA] += ws.invInertiaSolve[idxA] * (this.angAz * dl);
    wl[idxB] += ws.invInertiaSolve[idxB] * (this.angBz * dl);

    return this;
  }
}
