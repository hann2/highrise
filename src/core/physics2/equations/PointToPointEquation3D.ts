/**
 * Shape-specialized 2-body equation where **both bodies are points** — they
 * contribute only linear terms, no angular. The Jacobian has the shape:
 *
 *   G = [ -nx, -ny, -nz,  0, 0, 0,   nx, ny, nz,  0, 0, 0 ]
 *        └──── linA ────┘ └─ angA ─┘ └──── linB ────┘ └─ angB ─┘
 *
 * The linear contribution is symmetric by Newton's 3rd law: body A receives
 * `-n`, body B receives `+n`. Both bodies' angular blocks are structurally
 * zero, and the solver's specialized batch iterator never touches `wlambda`
 * or `invInertia` for these equations at all.
 *
 * ## Storage
 *
 * Three floats in named fields instead of a 12-element `G`:
 *   - `nx, ny, nz` — the unit direction (body A side gets the negation)
 *
 * ## When to use
 *
 * 2-body constraints where both sides are particle-like (`fixedRotation` or
 * zero-moment-arm anchors). Used by:
 *   - {@link ParticleDistanceConstraint3D} — rope chain links between
 *     adjacent rope particles
 *
 * ## Position error
 *
 * `computeGq` returns the inherited `offset` field. Owning constraints set
 * `offset` in their `update()` method each substep (typically `currentDist -
 * targetDist` for distance constraints).
 */
import type { Body } from "../body/Body";
import { EQ_INDEX_A, EQ_INDEX_B } from "../internal";
import type { SolverWorkspace } from "../solver/SolverWorkspace";
import { Equation } from "./Equation";

export class PointToPointEquation3D extends Equation {
  /** Unit direction vector `n`. Body A gets `-n`, body B gets `+n`. */
  nx: number = 0;
  ny: number = 0;
  nz: number = 0;

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

  /** Linear-only relative velocity: `n · (vB − vA)`. */
  override computeGW(): number {
    const a = this.bodyA;
    const b = this.bodyB;
    return (
      this.nx * (b.velocity[0] - a.velocity[0]) +
      this.ny * (b.velocity[1] - a.velocity[1]) +
      this.nz * (b.zVelocity - a.zVelocity) +
      this.relativeVelocity
    );
  }

  /** Constraint-velocity from accumulated solver impulses: `n · (vlB − vlA)`. */
  override computeGWlambda(ws: SolverWorkspace): number {
    const iA = this[EQ_INDEX_A] * 3;
    const iB = this[EQ_INDEX_B] * 3;
    const vl = ws.vlambda;
    return (
      this.nx * (vl[iB] - vl[iA]) +
      this.ny * (vl[iB + 1] - vl[iA + 1]) +
      this.nz * (vl[iB + 2] - vl[iA + 2])
    );
  }

  /** External force contribution: linear only (no angular on either side). */
  override computeGiMf(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const iMzA = ws.invMassSolveZ[idxA];
    const iMzB = ws.invMassSolveZ[idxB];
    const a = this.bodyA;
    const b = this.bodyB;
    return (
      this.nx * (b.force[0] * iMB - a.force[0] * iMA) +
      this.ny * (b.force[1] * iMB - a.force[1] * iMA) +
      this.nz * (b.zForce * iMzB - a.zForce * iMzA)
    );
  }

  /**
   * Effective-mass denominator: `G · M^-1 · G^T`. Linear only.
   *   = (nx² + ny²)·(invMA + invMB) + nz²·(invMzA + invMzB)
   *
   * For isotropic bodies (`invM == invMz`) this further reduces to
   * `invMA + invMB`, but keeping the general form costs ~3 ops and handles
   * mixed-mass bodies correctly.
   */
  override computeGiMGt(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const iMzA = ws.invMassSolveZ[idxA];
    const iMzB = ws.invMassSolveZ[idxB];
    const nxy2 = this.nx * this.nx + this.ny * this.ny;
    const nz2 = this.nz * this.nz;
    return nxy2 * (iMA + iMB) + nz2 * (iMzA + iMzB);
  }

  /** Apply an impulse linearly only. Never touches `wlambda` or `invInertia`. */
  override addToWlambda(deltalambda: number, ws: SolverWorkspace): this {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iA = idxA * 3;
    const iB = idxB * 3;
    const vl = ws.vlambda;
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const iMzA = ws.invMassSolveZ[idxA];
    const iMzB = ws.invMassSolveZ[idxB];
    const dl = deltalambda;

    vl[iA] -= iMA * this.nx * dl;
    vl[iA + 1] -= iMA * this.ny * dl;
    vl[iA + 2] -= iMzA * this.nz * dl;

    vl[iB] += iMB * this.nx * dl;
    vl[iB + 1] += iMB * this.ny * dl;
    vl[iB + 2] += iMzB * this.nz * dl;

    return this;
  }
}
