/**
 * Shape-specialized 2-body equation where **body A is a point** (no angular
 * contribution) and **body B is a rigid body** with full linear + angular
 * response. The Jacobian has the shape:
 *
 *   G = [ -n, 0, n, rjXn ]
 *     └─ linA ─┘ └─ angA ─┘ └─ linB ─┘ └──── angB ────┘
 *
 * where `n` is a unit direction at the contact and `rjXn = rj × n` is the
 * cross product of body B's lever arm with `n`. Linear is symmetric (body A
 * receives `-n`, body B receives `+n`) by Newton's 3rd law. Body A's angular
 * block is structurally zero and never touched by the solver.
 *
 * ## Storage
 *
 * Only 6 floats are stored in named fields instead of a 12-element `G`:
 *   - `nx, ny, nz` — the unit direction (body A side gets the negation)
 *   - `rjXnX, rjXnY, rjXnZ` — body B angular contribution (`rj × n`)
 *
 * The base class's `G` Float32Array is inherited but unused; the 48-byte
 * overhead per equation is negligible and keeps the class hierarchy simple.
 *
 * ## When to use
 *
 * Any 2-body constraint where one side is a particle-like body (`fixedRotation`
 * or zero-moment-arm anchor) and the other side is a full rigid body. Examples:
 *   - Rope particle contacting a hull deck / wall
 *   - Rope endpoint chain links (particle to rigid attachment point)
 *   - Rope attached to a cleat on a rotating boat part
 *
 * **Convention**: the point-like body must always be `bodyA`. Constraints that
 * naturally have the point on side B should swap the body order when creating
 * the equation so this invariant holds. This lets the solver's specialized
 * batch iterator always skip angular-A work without a runtime branch.
 *
 * ## Position error
 *
 * `computeGq` returns the inherited `offset` field. Owning constraints set
 * `offset` in their `update()` method each substep (typically to a signed
 * distance or penetration depth). Friction-like equations that want pure
 * velocity constraints set `offset = 0`.
 */
import type { Body } from "../body/Body";
import { EQ_INDEX_A, EQ_INDEX_B } from "../internal";
import type { SolverWorkspace } from "../solver/SolverWorkspace";
import { Equation } from "./Equation";

export class PointToRigidEquation3D extends Equation {
  /** Unit direction vector `n`. Body A gets `-n`, body B gets `+n`. */
  nx: number = 0;
  ny: number = 0;
  nz: number = 0;

  /** Body B angular contribution: `rj × n`. */
  rjXnX: number = 0;
  rjXnY: number = 0;
  rjXnZ: number = 0;

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

  /** Relative velocity along the constraint direction. Linear A + linear B + angular B. */
  override computeGW(): number {
    const a = this.bodyA;
    const b = this.bodyB;
    const wB = b.angularVelocity3;
    return (
      this.nx * (b.velocity[0] - a.velocity[0]) +
      this.ny * (b.velocity[1] - a.velocity[1]) +
      this.nz * (b.zVelocity - a.zVelocity) +
      this.rjXnX * wB[0] +
      this.rjXnY * wB[1] +
      this.rjXnZ * wB[2] +
      this.relativeVelocity
    );
  }

  /**
   * Constraint-velocity from accumulated solver impulses. Skips body A angular
   * (structurally zero).
   */
  override computeGWlambda(ws: SolverWorkspace): number {
    const iA = this[EQ_INDEX_A] * 3;
    const iB = this[EQ_INDEX_B] * 3;
    const vl = ws.vlambda;
    const wl = ws.wlambda;
    return (
      this.nx * (vl[iB] - vl[iA]) +
      this.ny * (vl[iB + 1] - vl[iA + 1]) +
      this.nz * (vl[iB + 2] - vl[iA + 2]) +
      this.rjXnX * wl[iB] +
      this.rjXnY * wl[iB + 1] +
      this.rjXnZ * wl[iB + 2]
    );
  }

  /** External force contribution: linear A + linear B + angular B (no angular A). */
  override computeGiMf(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const iMzA = ws.invMassSolveZ[idxA];
    const iMzB = ws.invMassSolveZ[idxB];
    const a = this.bodyA;
    const b = this.bodyB;

    // Body B angular force through world-frame inverse inertia
    const iIB = ws.invInertia[idxB];
    const tB = b.angularForce3;
    const aB0 = iIB[0] * tB[0] + iIB[1] * tB[1] + iIB[2] * tB[2];
    const aB1 = iIB[3] * tB[0] + iIB[4] * tB[1] + iIB[5] * tB[2];
    const aB2 = iIB[6] * tB[0] + iIB[7] * tB[1] + iIB[8] * tB[2];

    return (
      this.nx * (b.force[0] * iMB - a.force[0] * iMA) +
      this.ny * (b.force[1] * iMB - a.force[1] * iMA) +
      this.nz * (b.zForce * iMzB - a.zForce * iMzA) +
      this.rjXnX * aB0 +
      this.rjXnY * aB1 +
      this.rjXnZ * aB2
    );
  }

  /**
   * Effective-mass denominator: `G · M^-1 · G^T`. Linear contribution from both
   * bodies, angular contribution only from body B.
   */
  override computeGiMGt(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const iMzA = ws.invMassSolveZ[idxA];
    const iMzB = ws.invMassSolveZ[idxB];
    const nx = this.nx;
    const ny = this.ny;
    const nz = this.nz;
    const nxy2 = nx * nx + ny * ny;
    const nz2 = nz * nz;
    let result = nxy2 * (iMA + iMB) + nz2 * (iMzA + iMzB);

    // Body B angular: (rjXn)^T · invI · (rjXn)
    const iIB = ws.invInertia[idxB];
    const g0 = this.rjXnX;
    const g1 = this.rjXnY;
    const g2 = this.rjXnZ;
    result +=
      g0 * (iIB[0] * g0 + iIB[1] * g1 + iIB[2] * g2) +
      g1 * (iIB[3] * g0 + iIB[4] * g1 + iIB[5] * g2) +
      g2 * (iIB[6] * g0 + iIB[7] * g1 + iIB[8] * g2);

    return result;
  }

  /**
   * Apply an impulse: linear to both bodies, angular only to body B. Body A
   * angular (`wlambda[iA..iA+2]`) is left untouched.
   */
  override addToWlambda(deltalambda: number, ws: SolverWorkspace): this {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iA = idxA * 3;
    const iB = idxB * 3;
    const vl = ws.vlambda;
    const wl = ws.wlambda;
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const iMzA = ws.invMassSolveZ[idxA];
    const iMzB = ws.invMassSolveZ[idxB];
    const dl = deltalambda;

    // Body A linear (-n direction)
    vl[iA] -= iMA * this.nx * dl;
    vl[iA + 1] -= iMA * this.ny * dl;
    vl[iA + 2] -= iMzA * this.nz * dl;

    // Body B linear (+n direction)
    vl[iB] += iMB * this.nx * dl;
    vl[iB + 1] += iMB * this.ny * dl;
    vl[iB + 2] += iMzB * this.nz * dl;

    // Body B angular through world-frame inverse inertia
    const iIB = ws.invInertia[idxB];
    const g0 = this.rjXnX * dl;
    const g1 = this.rjXnY * dl;
    const g2 = this.rjXnZ * dl;
    wl[iB] += iIB[0] * g0 + iIB[1] * g1 + iIB[2] * g2;
    wl[iB + 1] += iIB[3] * g0 + iIB[4] * g1 + iIB[5] * g2;
    wl[iB + 2] += iIB[6] * g0 + iIB[7] * g1 + iIB[8] * g2;

    return this;
  }
}
