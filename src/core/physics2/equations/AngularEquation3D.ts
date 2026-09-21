/**
 * Shape-specialized 2-body equation for **pure 3D rotational** constraints —
 * no linear contribution on either body. The Jacobian has the shape:
 *
 *   G = [ 0, 0, 0,  cx, cy, cz,   0, 0, 0,  -cx, -cy, -cz ]
 *        └─ linA ─┘ └─── angA ───┘ └─ linB ─┘ └──── angB ────┘
 *
 * The angular contribution is **antisymmetric**: body A receives `+c` and
 * body B receives `-c` (typical of alignment-style constraints derived from
 * a dot-product that equals zero at rest).
 *
 * ## Storage
 *
 * Three floats in named fields instead of a 12-element `G`:
 *   - `cx, cy, cz` — the angular direction vector (A side positive, B negative)
 *
 * ## When to use
 *
 * Pure orientation coupling in 3D — no linear force is applied. Used by:
 *   - {@link AxisAlignmentEquation} — locks two world-frame axes perpendicular,
 *     the building block for a 3D revolute joint's axis alignment.
 *
 * Constraints that need to *both* translate and rotate two bodies (like a
 * generic 3D distance with lever arms on both ends) should use the base
 * {@link Equation} class, not this shape.
 */
import type { Body } from "../body/Body";
import { EQ_INDEX_A, EQ_INDEX_B } from "../internal";
import type { SolverWorkspace } from "../solver/SolverWorkspace";
import { Equation } from "./Equation";

export class AngularEquation3D extends Equation {
  /** Angular direction vector. Body A gets `+c`, body B gets `-c`. */
  cx: number = 0;
  cy: number = 0;
  cz: number = 0;

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
    return (
      this.cx * (wA[0] - wB[0]) +
      this.cy * (wA[1] - wB[1]) +
      this.cz * (wA[2] - wB[2]) +
      this.relativeVelocity
    );
  }

  override computeGWlambda(ws: SolverWorkspace): number {
    const iA = this[EQ_INDEX_A] * 3;
    const iB = this[EQ_INDEX_B] * 3;
    const wl = ws.wlambda;
    return (
      this.cx * (wl[iA] - wl[iB]) +
      this.cy * (wl[iA + 1] - wl[iB + 1]) +
      this.cz * (wl[iA + 2] - wl[iB + 2])
    );
  }

  override computeGiMf(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];

    // Body A angular force through world-frame inverse inertia
    const iIA = ws.invInertia[idxA];
    const tA = this.bodyA.angularForce3;
    const aA0 = iIA[0] * tA[0] + iIA[1] * tA[1] + iIA[2] * tA[2];
    const aA1 = iIA[3] * tA[0] + iIA[4] * tA[1] + iIA[5] * tA[2];
    const aA2 = iIA[6] * tA[0] + iIA[7] * tA[1] + iIA[8] * tA[2];

    const iIB = ws.invInertia[idxB];
    const tB = this.bodyB.angularForce3;
    const aB0 = iIB[0] * tB[0] + iIB[1] * tB[1] + iIB[2] * tB[2];
    const aB1 = iIB[3] * tB[0] + iIB[4] * tB[1] + iIB[5] * tB[2];
    const aB2 = iIB[6] * tB[0] + iIB[7] * tB[1] + iIB[8] * tB[2];

    return (
      this.cx * (aA0 - aB0) + this.cy * (aA1 - aB1) + this.cz * (aA2 - aB2)
    );
  }

  override computeGiMGt(ws: SolverWorkspace): number {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const cx = this.cx;
    const cy = this.cy;
    const cz = this.cz;

    // Body A: +c^T · invI_A · +c
    const iIA = ws.invInertia[idxA];
    let result =
      cx * (iIA[0] * cx + iIA[1] * cy + iIA[2] * cz) +
      cy * (iIA[3] * cx + iIA[4] * cy + iIA[5] * cz) +
      cz * (iIA[6] * cx + iIA[7] * cy + iIA[8] * cz);

    // Body B: (-c)^T · invI_B · (-c) — signs cancel, same quadratic form
    const iIB = ws.invInertia[idxB];
    result +=
      cx * (iIB[0] * cx + iIB[1] * cy + iIB[2] * cz) +
      cy * (iIB[3] * cx + iIB[4] * cy + iIB[5] * cz) +
      cz * (iIB[6] * cx + iIB[7] * cy + iIB[8] * cz);

    return result;
  }

  override addToWlambda(deltalambda: number, ws: SolverWorkspace): this {
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iA = idxA * 3;
    const iB = idxB * 3;
    const wl = ws.wlambda;
    const dl = deltalambda;

    // Body A: wl += invI_A · (+c) · dl
    const iIA = ws.invInertia[idxA];
    const gAx = this.cx * dl;
    const gAy = this.cy * dl;
    const gAz = this.cz * dl;
    wl[iA] += iIA[0] * gAx + iIA[1] * gAy + iIA[2] * gAz;
    wl[iA + 1] += iIA[3] * gAx + iIA[4] * gAy + iIA[5] * gAz;
    wl[iA + 2] += iIA[6] * gAx + iIA[7] * gAy + iIA[8] * gAz;

    // Body B: wl += invI_B · (-c) · dl
    const iIB = ws.invInertia[idxB];
    wl[iB] -= iIB[0] * gAx + iIB[1] * gAy + iIB[2] * gAz;
    wl[iB + 1] -= iIB[3] * gAx + iIB[4] * gAy + iIB[5] * gAz;
    wl[iB + 2] -= iIB[6] * gAx + iIB[7] * gAy + iIB[8] * gAz;

    return this;
  }
}
