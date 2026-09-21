/**
 * Shape-specialized 2-body equation for **2D planar rigid-rigid** constraints
 * where both bodies move in the XY plane and rotate only about Z. The Jacobian
 * has the shape:
 *
 *   G = [ -linX, -linY, 0,   0, 0, angAz,   linX, linY, 0,   0, 0, angBz ]
 *        └──── linA ────┘ └──── angA ────┘ └──── linB ────┘ └──── angB ────┘
 *
 * The linear contribution is symmetric by Newton's 3rd law: body A receives
 * `-(linX, linY)` and body B receives `+(linX, linY)`. The angular
 * contribution is a single Z-axis scalar per body (`angAz` / `angBz`), which
 * can differ because each body has its own lever arm to the contact point.
 *
 * ## Storage
 *
 * Four floats in named fields instead of a 12-element `G`:
 *   - `linX, linY` — shared linear direction (body A gets the negation)
 *   - `angAz` — body A angular Z component
 *   - `angBz` — body B angular Z component
 *
 * ## When to use
 *
 * Any 2D contact or friction constraint between two bodies that are
 * effectively planar (boat hulls, sails, obstacles). Used by:
 *   - {@link ContactEquation} — non-penetration along a contact normal
 *   - {@link FrictionEquation} — tangential slip resistance at a contact
 *
 * Gear-ratio-style angular constraints (where linear is zero and angular is
 * asymmetric) should use {@link AngularEquation2D} instead.
 *
 * ## Inertia tensor reads
 *
 * The solver only needs the Z column of each body's inverse inertia tensor
 * (since the angular Jacobian is purely Z). For a typical 2D dynamic body
 * the inverse inertia is effectively scalar on the Z axis, but the code
 * here reads the full Z column (`iI[2], iI[5], iI[8]`) so it works for both
 * pure-2D and 3DOF bodies without a branch.
 */
import type { Body } from "../body/Body";
import { EQ_INDEX_A, EQ_INDEX_B } from "../internal";
import type { SolverWorkspace } from "../solver/SolverWorkspace";
import { Equation } from "./Equation";

export class PlanarEquation2D extends Equation {
  /** Shared linear direction. Body A gets `-(linX, linY)`, body B gets `+(linX, linY)`. */
  linX: number = 0;
  linY: number = 0;

  /** Body A angular Z component. */
  angAz: number = 0;

  /** Body B angular Z component. */
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
    const wA = a.angularVelocity3;
    const wB = b.angularVelocity3;
    return (
      this.linX * (b.velocity[0] - a.velocity[0]) +
      this.linY * (b.velocity[1] - a.velocity[1]) +
      this.angAz * wA[2] +
      this.angBz * wB[2] +
      this.relativeVelocity
    );
  }

  override computeGWlambda(ws: SolverWorkspace): number {
    const iA = this[EQ_INDEX_A] * 3;
    const iB = this[EQ_INDEX_B] * 3;
    const vl = ws.vlambda;
    const wl = ws.wlambda;
    return (
      this.linX * (vl[iB] - vl[iA]) +
      this.linY * (vl[iB + 1] - vl[iA + 1]) +
      this.angAz * wl[iA + 2] +
      this.angBz * wl[iB + 2]
    );
  }

  override computeGiMf(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const a = this.bodyA;
    const b = this.bodyB;

    // Body A angular through world-frame inverse inertia — only the Z column
    // of the torque-to-angular-acceleration transform matters, because we
    // multiply by angAz on the single Z axis.
    const iIA = ws.invInertia[idxA];
    const tA = a.angularForce3;
    const aAz = iIA[6] * tA[0] + iIA[7] * tA[1] + iIA[8] * tA[2];

    const iIB = ws.invInertia[idxB];
    const tB = b.angularForce3;
    const aBz = iIB[6] * tB[0] + iIB[7] * tB[1] + iIB[8] * tB[2];

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

    // Body A angular: angAz² · invI[Z,Z]. For diagonal Z-only inverse inertia
    // (typical 2D body) this is exact; for a general 3×3 matrix we take the
    // (2,2) element since we're projecting onto the Z axis only.
    const iIA = ws.invInertia[idxA];
    result += this.angAz * this.angAz * iIA[8];

    const iIB = ws.invInertia[idxB];
    result += this.angBz * this.angBz * iIB[8];

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

    // Body A linear (-lin)
    vl[iA] -= iMA * this.linX * dl;
    vl[iA + 1] -= iMA * this.linY * dl;

    // Body B linear (+lin)
    vl[iB] += iMB * this.linX * dl;
    vl[iB + 1] += iMB * this.linY * dl;

    // Body A angular: wl += invI · (0,0,angAz*dl). That's the Z column of invI
    // scaled by angAz*dl.
    const iIA = ws.invInertia[idxA];
    const gAz = this.angAz * dl;
    wl[iA] += iIA[2] * gAz;
    wl[iA + 1] += iIA[5] * gAz;
    wl[iA + 2] += iIA[8] * gAz;

    // Body B angular
    const iIB = ws.invInertia[idxB];
    const gBz = this.angBz * dl;
    wl[iB] += iIB[2] * gBz;
    wl[iB + 1] += iIB[5] * gBz;
    wl[iB + 2] += iIB[8] * gBz;

    return this;
  }
}
