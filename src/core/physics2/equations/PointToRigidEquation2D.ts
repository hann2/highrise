/**
 * Shape-specialized 2-body equation for **2D particle (bodyA) ↔ 2D rigid
 * (bodyB)** constraints. Body A is a particle with only linear XY
 * contribution; body B is a rigid 2D body with linear XY + scalar yaw
 * angular contribution. The Jacobian has the shape:
 *
 *   G = [ -nx, -ny, 0,  0, 0, 0,   nx, ny, 0,   0, 0, rjCrossN ]
 *
 * Linear is symmetric by Newton's 3rd law (A gets `-n`, B gets `+n`). Body
 * A contributes no angular term; body B contributes a single scalar Z-axis
 * (`rjCrossN = rj × n` projected to Z).
 *
 * ## Storage
 *
 * Three floats instead of a 12-element `G`:
 *   - `nx, ny` — the unit direction (body A side gets the negation)
 *   - `rjCrossN` — body B scalar yaw angular contribution
 *
 * ## Convention
 *
 * **bodyA is always the particle, bodyB is always the rigid.** Constraints
 * that naturally have the point on side B should swap body order when
 * creating the equation so this invariant holds. This matches the
 * convention used by {@link PointToRigidEquation3D}.
 */
import type { Body } from "../body/Body";
import { EQ_INDEX_A, EQ_INDEX_B } from "../internal";
import type { SolverWorkspace } from "../solver/SolverWorkspace";
import { Equation } from "./Equation";

export class PointToRigidEquation2D extends Equation {
  /** Unit direction vector `n`. Body A gets `-n`, body B gets `+n`. */
  nx: number = 0;
  ny: number = 0;

  /** Body B scalar yaw angular contribution: `(rj × n)` projected to Z. */
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
    const wB = b.angularVelocity3;
    return (
      this.nx * (b.velocity[0] - a.velocity[0]) +
      this.ny * (b.velocity[1] - a.velocity[1]) +
      this.rjCrossN * wB[2] +
      this.relativeVelocity
    );
  }

  override computeGWlambda(ws: SolverWorkspace): number {
    const iA = this[EQ_INDEX_A] * 3;
    const iB = this[EQ_INDEX_B] * 3;
    const vl = ws.vlambda;
    const wl = ws.wlambda;
    return (
      this.nx * (vl[iB] - vl[iA]) +
      this.ny * (vl[iB + 1] - vl[iA + 1]) +
      this.rjCrossN * wl[iB + 2]
    );
  }

  override computeGiMf(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const a = this.bodyA;
    const b = this.bodyB;

    // Body B angular: only the Z row of invI matters (we multiply by
    // rjCrossN on the Z axis only).
    const iIB = ws.invInertia[idxB];
    const tB = b.angularForce3;
    const aBz = iIB[6] * tB[0] + iIB[7] * tB[1] + iIB[8] * tB[2];

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

    // Body B angular on Z only: rjCrossN² * invI[Z,Z]
    const iIB = ws.invInertia[idxB];
    result += this.rjCrossN * this.rjCrossN * iIB[8];

    return result;
  }

  override addToWlambda(deltalambda: number, ws: SolverWorkspace): this {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iA = idxA * 3;
    const iB = idxB * 3;
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

    // Body B angular: wl += invI_col2 * (rjCrossN * dl)
    const iIB = ws.invInertia[idxB];
    const g = this.rjCrossN * dl;
    wl[iB] += iIB[2] * g;
    wl[iB + 1] += iIB[5] * g;
    wl[iB + 2] += iIB[8] * g;

    return this;
  }
}
