/**
 * Shape-specialized 2-body equation for **pure 2D rotational** constraints —
 * no linear contribution, and rotation only about the Z axis. The Jacobian
 * has the shape:
 *
 *   G = [ 0, 0, 0,  0, 0, angAz,   0, 0, 0,  0, 0, angBz ]
 *        └─ linA ─┘ └── angA ──┘ └─ linB ─┘ └── angB ──┘
 *
 * Unlike {@link AngularEquation3D} this is **not antisymmetric** — the two
 * angular scalars are stored independently so we can represent gear-ratio
 * style coupling (e.g. `angAz = ratio`, `angBz = -1`).
 *
 * ## Storage
 *
 * Two floats in named fields:
 *   - `angAz` — body A angular Z contribution
 *   - `angBz` — body B angular Z contribution
 *
 * ## When to use
 *
 * 2D angular constraints between two planar rigid bodies. Used by:
 *   - {@link RotationalLockEquation} — hard-limit on relative angle
 *   - {@link AngleLockEquation} — hinge limit with optional gear ratio
 *   - {@link RotationalVelocityEquation} — motor that drives a target angular velocity
 */
import type { Body } from "../body/Body";
import { EQ_INDEX_A, EQ_INDEX_B } from "../internal";
import type { SolverWorkspace } from "../solver/SolverWorkspace";
import { Equation } from "./Equation";

export class AngularEquation2D extends Equation {
  /** Body A angular Z contribution. */
  angAz: number = 0;

  /** Body B angular Z contribution. */
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
    const wA = this.bodyA.angularVelocity3;
    const wB = this.bodyB.angularVelocity3;
    return this.angAz * wA[2] + this.angBz * wB[2] + this.relativeVelocity;
  }

  override computeGWlambda(ws: SolverWorkspace): number {
    const iA = this[EQ_INDEX_A] * 3;
    const iB = this[EQ_INDEX_B] * 3;
    const wl = ws.wlambda;
    return this.angAz * wl[iA + 2] + this.angBz * wl[iB + 2];
  }

  override computeGiMf(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];

    // Only the Z row of each body's world-frame inverse inertia matters,
    // because the angular Jacobian is pure Z.
    const iIA = ws.invInertia[idxA];
    const tA = this.bodyA.angularForce3;
    const aAz = iIA[6] * tA[0] + iIA[7] * tA[1] + iIA[8] * tA[2];

    const iIB = ws.invInertia[idxB];
    const tB = this.bodyB.angularForce3;
    const aBz = iIB[6] * tB[0] + iIB[7] * tB[1] + iIB[8] * tB[2];

    return this.angAz * aAz + this.angBz * aBz;
  }

  override computeGiMGt(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iIA = ws.invInertia[idxA];
    const iIB = ws.invInertia[idxB];
    // angAz² · invI_A[Z,Z] + angBz² · invI_B[Z,Z]
    return this.angAz * this.angAz * iIA[8] + this.angBz * this.angBz * iIB[8];
  }

  override addToWlambda(deltalambda: number, ws: SolverWorkspace): this {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iA = idxA * 3;
    const iB = idxB * 3;
    const wl = ws.wlambda;
    const dl = deltalambda;

    // Body A: wl += invI · (0,0,angAz*dl) — the Z column of invI scaled
    const iIA = ws.invInertia[idxA];
    const gAz = this.angAz * dl;
    wl[iA] += iIA[2] * gAz;
    wl[iA + 1] += iIA[5] * gAz;
    wl[iA + 2] += iIA[8] * gAz;

    // Body B
    const iIB = ws.invInertia[idxB];
    const gBz = this.angBz * dl;
    wl[iB] += iIB[2] * gBz;
    wl[iB + 1] += iIB[5] * gBz;
    wl[iB + 2] += iIB[8] * gBz;

    return this;
  }
}
