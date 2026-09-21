/**
 * Shape-specialized 2-body equation for **2D particle ↔ 2D particle**
 * constraints. Both bodies contribute only linear XY terms — no angular and
 * no Z. The Jacobian has the shape:
 *
 *   G = [ -nx, -ny, 0,  0, 0, 0,   nx, ny, 0,   0, 0, 0 ]
 *
 * Linear is symmetric by Newton's 3rd law: body A receives `-(nx, ny)`,
 * body B receives `+(nx, ny)`. Neither body contributes angular terms, so
 * the solver's specialized batch iterator never touches `wlambda` or
 * `invInertia` for these equations.
 *
 * ## Storage
 *
 * Two floats instead of a 12-element `G`:
 *   - `nx, ny` — the unit direction (body A side gets the negation)
 *
 * ## When to use
 *
 * 2D distance-like constraints where both bodies are particle-like
 * (`pm2d × pm2d`). Rope chain links between adjacent 2D rope particles.
 */
import type { Body } from "../body/Body";
import { EQ_INDEX_A, EQ_INDEX_B } from "../internal";
import type { SolverWorkspace } from "../solver/SolverWorkspace";
import { Equation } from "./Equation";

export class PointToPointEquation2D extends Equation {
  /** Unit direction vector `n`. Body A gets `-n`, body B gets `+n`. */
  nx: number = 0;
  ny: number = 0;

  constructor(
    bodyA: Body,
    bodyB: Body,
    minForce = -Number.MAX_VALUE,
    maxForce = Number.MAX_VALUE,
  ) {
    super(bodyA, bodyB, minForce, maxForce);
  }

  override computeGq(): number {
    return this.offset;
  }

  override computeGW(): number {
    const a = this.bodyA;
    const b = this.bodyB;
    return (
      this.nx * (b.velocity[0] - a.velocity[0]) +
      this.ny * (b.velocity[1] - a.velocity[1]) +
      this.relativeVelocity
    );
  }

  override computeGWlambda(ws: SolverWorkspace): number {
    const iA = this[EQ_INDEX_A] * 3;
    const iB = this[EQ_INDEX_B] * 3;
    const vl = ws.vlambda;
    return this.nx * (vl[iB] - vl[iA]) + this.ny * (vl[iB + 1] - vl[iA + 1]);
  }

  override computeGiMf(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const a = this.bodyA;
    const b = this.bodyB;
    return (
      this.nx * (b.force[0] * iMB - a.force[0] * iMA) +
      this.ny * (b.force[1] * iMB - a.force[1] * iMA)
    );
  }

  override computeGiMGt(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const n2 = this.nx * this.nx + this.ny * this.ny;
    return n2 * (iMA + iMB);
  }

  override addToWlambda(deltalambda: number, ws: SolverWorkspace): this {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iA = idxA * 3;
    const iB = idxB * 3;
    const vl = ws.vlambda;
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const dl = deltalambda;

    vl[iA] -= iMA * this.nx * dl;
    vl[iA + 1] -= iMA * this.ny * dl;

    vl[iB] += iMB * this.nx * dl;
    vl[iB + 1] += iMB * this.ny * dl;

    return this;
  }
}
