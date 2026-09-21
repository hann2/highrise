/**
 * Shape-specialized 2-body equation for **planar rigid-rigid** constraints:
 * a shared linear direction plus an independent angular term per body. The
 * Jacobian has the shape:
 *
 *   G = [ -linX, -linY, angA,   linX, linY, angB ]
 *        └──── body A ─────┘   └──── body B ───┘
 *
 * The linear contribution is symmetric by Newton's 3rd law: body A receives
 * `-(linX, linY)` and body B receives `+(linX, linY)`. The angular
 * contribution is a scalar per body (`angAz` / `angBz`), which can differ
 * because each body has its own lever arm to the contact point.
 *
 * ## Storage
 *
 * Four floats in named fields instead of a 6-element `G`:
 *   - `linX, linY` — shared linear direction (body A gets the negation)
 *   - `angAz` — body A angular component
 *   - `angBz` — body B angular component
 *
 * ## When to use
 *
 * Any contact, friction or distance-like constraint between two rigid
 * bodies. Used by:
 *   - {@link ContactEquation} — non-penetration along a contact normal
 *   - {@link FrictionEquation} — tangential slip resistance at a contact
 *
 * Gear-ratio-style angular constraints (where linear is zero and angular is
 * asymmetric) should use {@link AngularEquation2D} instead.
 */
import type { Body } from "../body/Body";
import { EQ_INDEX_A, EQ_INDEX_B } from "../internal";
import type { SolverWorkspace } from "../solver/SolverWorkspace";
import { Equation } from "./Equation";

export class PlanarEquation2D extends Equation {
  /** Shared linear direction. Body A gets `-(linX, linY)`, body B gets `+(linX, linY)`. */
  linX: number = 0;
  linY: number = 0;

  /** Body A angular component. */
  angAz: number = 0;

  /** Body B angular component. */
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
    const a = this.bodyA;
    const b = this.bodyB;
    return (
      this.linX * (b.velocity[0] - a.velocity[0]) +
      this.linY * (b.velocity[1] - a.velocity[1]) +
      this.angAz * a.angularVelocity +
      this.angBz * b.angularVelocity +
      this.relativeVelocity
    );
  }

  override computeGWlambda(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iA = idxA * 2;
    const iB = idxB * 2;
    const vl = ws.vlambda;
    const wl = ws.wlambda;
    return (
      this.linX * (vl[iB] - vl[iA]) +
      this.linY * (vl[iB + 1] - vl[iA + 1]) +
      this.angAz * wl[idxA] +
      this.angBz * wl[idxB]
    );
  }

  override computeGiMf(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const a = this.bodyA;
    const b = this.bodyB;

    // Angular acceleration from external torque
    const aAz = ws.invInertiaSolve[idxA] * a.angularForce;
    const aBz = ws.invInertiaSolve[idxB] * b.angularForce;

    return (
      this.linX * (b.force[0] * iMB - a.force[0] * iMA) +
      this.linY * (b.force[1] * iMB - a.force[1] * iMA) +
      this.angAz * aAz +
      this.angBz * aBz
    );
  }

  override computeGiMGt(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const lin2 = this.linX * this.linX + this.linY * this.linY;
    let result = lin2 * (iMA + iMB);

    // Angular: angAz² · invI_A + angBz² · invI_B
    result += this.angAz * this.angAz * ws.invInertiaSolve[idxA];
    result += this.angBz * this.angBz * ws.invInertiaSolve[idxB];

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

    // Body A linear (-lin)
    vl[iA] -= iMA * this.linX * dl;
    vl[iA + 1] -= iMA * this.linY * dl;

    // Body B linear (+lin)
    vl[iB] += iMB * this.linX * dl;
    vl[iB + 1] += iMB * this.linY * dl;

    // Angular: wl += invI * (ang * dl)
    wl[idxA] += ws.invInertiaSolve[idxA] * (this.angAz * dl);
    wl[idxB] += ws.invInertiaSolve[idxB] * (this.angBz * dl);

    return this;
  }
}
