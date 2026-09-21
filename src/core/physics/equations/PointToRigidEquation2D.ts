/**
 * Shape-specialized 2-body equation for **particle (bodyA) ↔ rigid
 * (bodyB)** constraints. Body A is a particle with only a linear
 * contribution; body B is a rigid body with linear + scalar angular
 * contribution. The Jacobian has the shape:
 *
 *   G = [ -nx, -ny, 0,   nx, ny, rjCrossN ]
 *
 * Linear is symmetric by Newton's 3rd law (A gets `-n`, B gets `+n`). Body
 * A contributes no angular term; body B contributes a single scalar
 * (`rjCrossN = rj × n`).
 *
 * ## Storage
 *
 * Three floats instead of a 6-element `G`:
 *   - `nx, ny` — the unit direction (body A side gets the negation)
 *   - `rjCrossN` — body B scalar angular contribution
 *
 * ## Convention
 *
 * **bodyA is always the particle, bodyB is always the rigid.** Constraints
 * that naturally have the point on side B should swap body order when
 * creating the equation so this invariant holds.
 */
import type { Body } from "../body/Body";
import { EQ_INDEX_A, EQ_INDEX_B } from "../internal";
import type { SolverWorkspace } from "../solver/SolverWorkspace";
import { Equation } from "./Equation";

export class PointToRigidEquation2D extends Equation {
  /** Unit direction vector `n`. Body A gets `-n`, body B gets `+n`. */
  nx: number = 0;
  ny: number = 0;

  /** Body B scalar angular contribution: `rj × n`. */
  rjCrossN: number = 0;

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
      this.rjCrossN * b.angularVelocity +
      this.relativeVelocity
    );
  }

  override computeGWlambda(ws: SolverWorkspace): number {
    const idxB = this[EQ_INDEX_B];
    const iA = this[EQ_INDEX_A] * 2;
    const iB = idxB * 2;
    const vl = ws.vlambda;
    const wl = ws.wlambda;
    return (
      this.nx * (vl[iB] - vl[iA]) +
      this.ny * (vl[iB + 1] - vl[iA + 1]) +
      this.rjCrossN * wl[idxB]
    );
  }

  override computeGiMf(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const a = this.bodyA;
    const b = this.bodyB;

    // Body B angular acceleration from external torque
    const aBz = ws.invInertiaSolve[idxB] * b.angularForce;

    return (
      this.nx * (b.force[0] * iMB - a.force[0] * iMA) +
      this.ny * (b.force[1] * iMB - a.force[1] * iMA) +
      this.rjCrossN * aBz
    );
  }

  override computeGiMGt(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const n2 = this.nx * this.nx + this.ny * this.ny;
    let result = n2 * (iMA + iMB);

    // Body B angular: rjCrossN² * invI
    result += this.rjCrossN * this.rjCrossN * ws.invInertiaSolve[idxB];

    return result;
  }

  override addToWlambda(deltalambda: number, ws: SolverWorkspace): this {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iA = idxA * 2;
    const iB = idxB * 2;
    const vl = ws.vlambda;
    const wl = ws.wlambda;
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const dl = deltalambda;

    // Body A linear (-n)
    vl[iA] -= iMA * this.nx * dl;
    vl[iA + 1] -= iMA * this.ny * dl;

    // Body B linear (+n)
    vl[iB] += iMB * this.nx * dl;
    vl[iB + 1] += iMB * this.ny * dl;

    // Body B angular: wl += invI * (rjCrossN * dl)
    wl[idxB] += ws.invInertiaSolve[idxB] * (this.rjCrossN * dl);

    return this;
  }
}
