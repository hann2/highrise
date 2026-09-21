/**
 * 3-body constraint equation for a pulley/block.
 *
 * Enforces: |rA - rP| + |rP - rB| ≤ totalLength
 *
 * Where rA, rP, rB are the world-space anchor positions on bodyA (particle),
 * bodyC (pulley/block body), and bodyB (particle) respectively.
 *
 * The Jacobian has 18 elements (6 per body × 3 bodies) instead of the
 * base class's 12. All compute/apply methods are overridden to include
 * bodyC's contributions. The GSSolver only calls virtual methods, so
 * this slots into the existing solver without modification.
 */

import type { Body } from "../body/Body";
import { EQ_INDEX_A, EQ_INDEX_B, EQ_INDEX_C } from "../internal";
import type { SolverWorkspace } from "../solver/SolverWorkspace";
import { Equation } from "./Equation";

export class PulleyEquation extends Equation {
  /** The third body (pulley/block body). */
  bodyC: Body;

  /**
   * Extended Jacobian: 18 elements.
   * [bodyA linear(3), bodyA angular(3),
   *  bodyC linear(3), bodyC angular(3),
   *  bodyB linear(3), bodyB angular(3)]
   */
  private G18 = new Float64Array(18);

  /** Workspace row index for bodyC during the current solve. */
  [EQ_INDEX_C]: number = -1;

  constructor(bodyA: Body, bodyB: Body, bodyC: Body) {
    super(bodyA, bodyB);
    this.bodyC = bodyC;
  }

  override assignIndices(ws: SolverWorkspace): void {
    super.assignIndices(ws);
    this[EQ_INDEX_C] = ws.indexOf(this.bodyC);
  }

  /**
   * Fill the 18-element Jacobian from pre-computed directions and lever arms.
   * Called by PulleyConstraint3D.update().
   */
  setJacobian(
    // Unit direction from pulley toward A
    nAx: number,
    nAy: number,
    nAz: number,
    // Unit direction from pulley toward B
    nBx: number,
    nBy: number,
    nBz: number,
    // Lever arm: world anchor A minus bodyA center
    rAx: number,
    rAy: number,
    rAz: number,
    // Lever arm: world pulley anchor minus bodyC center
    rCx: number,
    rCy: number,
    rCz: number,
    // Lever arm: world anchor B minus bodyB center
    rBx: number,
    rBy: number,
    rBz: number,
  ): void {
    const G = this.G18;

    // Body A: pulled toward pulley → force direction = nA
    G[0] = nAx;
    G[1] = nAy;
    G[2] = nAz;
    // Body A angular: rA × nA
    G[3] = rAy * nAz - rAz * nAy;
    G[4] = rAz * nAx - rAx * nAz;
    G[5] = rAx * nAy - rAy * nAx;

    // Body C (pulley): receives resultant = -nA - nB
    const cLx = -nAx - nBx;
    const cLy = -nAy - nBy;
    const cLz = -nAz - nBz;
    G[6] = cLx;
    G[7] = cLy;
    G[8] = cLz;
    // Body C angular: rC × (-nA - nB)
    G[9] = rCy * cLz - rCz * cLy;
    G[10] = rCz * cLx - rCx * cLz;
    G[11] = rCx * cLy - rCy * cLx;

    // Body B: pulled toward pulley → force direction = nB
    G[12] = nBx;
    G[13] = nBy;
    G[14] = nBz;
    // Body B angular: rB × nB
    G[15] = rBy * nBz - rBz * nBy;
    G[16] = rBz * nBx - rBx * nBz;
    G[17] = rBx * nBy - rBy * nBx;
  }

  // ---- Override all virtual methods to use G18 and 3 bodies ----

  override computeGW(): number {
    const G = this.G18;
    const a = this.bodyA;
    const c = this.bodyC;
    const b = this.bodyB;
    const wA = a.angularVelocity3;
    const wC = c.angularVelocity3;
    const wB = b.angularVelocity3;
    return (
      G[0] * a.velocity[0] +
      G[1] * a.velocity[1] +
      G[2] * a.zVelocity +
      G[3] * wA[0] +
      G[4] * wA[1] +
      G[5] * wA[2] +
      G[6] * c.velocity[0] +
      G[7] * c.velocity[1] +
      G[8] * c.zVelocity +
      G[9] * wC[0] +
      G[10] * wC[1] +
      G[11] * wC[2] +
      G[12] * b.velocity[0] +
      G[13] * b.velocity[1] +
      G[14] * b.zVelocity +
      G[15] * wB[0] +
      G[16] * wB[1] +
      G[17] * wB[2] +
      this.relativeVelocity
    );
  }

  override computeGWlambda(ws: SolverWorkspace): number {
    const G = this.G18;
    const iA = this[EQ_INDEX_A] * 3;
    const iC = this[EQ_INDEX_C] * 3;
    const iB = this[EQ_INDEX_B] * 3;
    const vl = ws.vlambda;
    const wl = ws.wlambda;
    return (
      G[0] * vl[iA] +
      G[1] * vl[iA + 1] +
      G[2] * vl[iA + 2] +
      G[3] * wl[iA] +
      G[4] * wl[iA + 1] +
      G[5] * wl[iA + 2] +
      G[6] * vl[iC] +
      G[7] * vl[iC + 1] +
      G[8] * vl[iC + 2] +
      G[9] * wl[iC] +
      G[10] * wl[iC + 1] +
      G[11] * wl[iC + 2] +
      G[12] * vl[iB] +
      G[13] * vl[iB + 1] +
      G[14] * vl[iB + 2] +
      G[15] * wl[iB] +
      G[16] * wl[iB + 1] +
      G[17] * wl[iB + 2]
    );
  }

  override computeGiMf(ws: SolverWorkspace): number {
    const G = this.G18;
    const a = this.bodyA;
    const c = this.bodyC;
    const b = this.bodyB;
    const idxA = this[EQ_INDEX_A];
    const idxC = this[EQ_INDEX_C];
    const idxB = this[EQ_INDEX_B];
    const invMassSolve = ws.invMassSolve;
    const invMassSolveZ = ws.invMassSolveZ;
    const invInertia = ws.invInertia;

    // Body A: invI_world * torque3
    const iIA = invInertia[idxA];
    const tA = a.angularForce3;
    const aA0 = iIA[0] * tA[0] + iIA[1] * tA[1] + iIA[2] * tA[2];
    const aA1 = iIA[3] * tA[0] + iIA[4] * tA[1] + iIA[5] * tA[2];
    const aA2 = iIA[6] * tA[0] + iIA[7] * tA[1] + iIA[8] * tA[2];

    // Body C: invI_world * torque3
    const iIC = invInertia[idxC];
    const tC = c.angularForce3;
    const aC0 = iIC[0] * tC[0] + iIC[1] * tC[1] + iIC[2] * tC[2];
    const aC1 = iIC[3] * tC[0] + iIC[4] * tC[1] + iIC[5] * tC[2];
    const aC2 = iIC[6] * tC[0] + iIC[7] * tC[1] + iIC[8] * tC[2];

    // Body B: invI_world * torque3
    const iIB = invInertia[idxB];
    const tB = b.angularForce3;
    const aB0 = iIB[0] * tB[0] + iIB[1] * tB[1] + iIB[2] * tB[2];
    const aB1 = iIB[3] * tB[0] + iIB[4] * tB[1] + iIB[5] * tB[2];
    const aB2 = iIB[6] * tB[0] + iIB[7] * tB[1] + iIB[8] * tB[2];

    return (
      G[0] * a.force[0] * invMassSolve[idxA] +
      G[1] * a.force[1] * invMassSolve[idxA] +
      G[2] * a.zForce * invMassSolveZ[idxA] +
      G[3] * aA0 +
      G[4] * aA1 +
      G[5] * aA2 +
      G[6] * c.force[0] * invMassSolve[idxC] +
      G[7] * c.force[1] * invMassSolve[idxC] +
      G[8] * c.zForce * invMassSolveZ[idxC] +
      G[9] * aC0 +
      G[10] * aC1 +
      G[11] * aC2 +
      G[12] * b.force[0] * invMassSolve[idxB] +
      G[13] * b.force[1] * invMassSolve[idxB] +
      G[14] * b.zForce * invMassSolveZ[idxB] +
      G[15] * aB0 +
      G[16] * aB1 +
      G[17] * aB2
    );
  }

  override computeGiMGt(ws: SolverWorkspace): number {
    const G = this.G18;
    const idxA = this[EQ_INDEX_A];
    const idxC = this[EQ_INDEX_C];
    const idxB = this[EQ_INDEX_B];
    const iMA = ws.invMassSolve[idxA];
    const iMC = ws.invMassSolve[idxC];
    const iMB = ws.invMassSolve[idxB];
    const iMzA = ws.invMassSolveZ[idxA];
    const iMzC = ws.invMassSolveZ[idxC];
    const iMzB = ws.invMassSolveZ[idxB];

    // Body A linear
    let result = G[0] * G[0] * iMA + G[1] * G[1] * iMA + G[2] * G[2] * iMzA;
    // Body A angular: G_ang^T * invI * G_ang
    const iIA = ws.invInertia[idxA];
    result +=
      G[3] * (iIA[0] * G[3] + iIA[1] * G[4] + iIA[2] * G[5]) +
      G[4] * (iIA[3] * G[3] + iIA[4] * G[4] + iIA[5] * G[5]) +
      G[5] * (iIA[6] * G[3] + iIA[7] * G[4] + iIA[8] * G[5]);

    // Body C linear
    result += G[6] * G[6] * iMC + G[7] * G[7] * iMC + G[8] * G[8] * iMzC;
    // Body C angular
    const iIC = ws.invInertia[idxC];
    result +=
      G[9] * (iIC[0] * G[9] + iIC[1] * G[10] + iIC[2] * G[11]) +
      G[10] * (iIC[3] * G[9] + iIC[4] * G[10] + iIC[5] * G[11]) +
      G[11] * (iIC[6] * G[9] + iIC[7] * G[10] + iIC[8] * G[11]);

    // Body B linear
    result += G[12] * G[12] * iMB + G[13] * G[13] * iMB + G[14] * G[14] * iMzB;
    // Body B angular
    const iIB = ws.invInertia[idxB];
    result +=
      G[15] * (iIB[0] * G[15] + iIB[1] * G[16] + iIB[2] * G[17]) +
      G[16] * (iIB[3] * G[15] + iIB[4] * G[16] + iIB[5] * G[17]) +
      G[17] * (iIB[6] * G[15] + iIB[7] * G[16] + iIB[8] * G[17]);

    return result;
  }

  override addToWlambda(deltalambda: number, ws: SolverWorkspace): this {
    const G = this.G18;
    const dl = deltalambda;
    const idxA = this[EQ_INDEX_A];
    const idxC = this[EQ_INDEX_C];
    const idxB = this[EQ_INDEX_B];
    const iA = idxA * 3;
    const iCoff = idxC * 3;
    const iB = idxB * 3;
    const vl = ws.vlambda;
    const wl = ws.wlambda;
    const iMA = ws.invMassSolve[idxA];
    const iMC = ws.invMassSolve[idxC];
    const iMB = ws.invMassSolve[idxB];
    const iMzA = ws.invMassSolveZ[idxA];
    const iMzC = ws.invMassSolveZ[idxC];
    const iMzB = ws.invMassSolveZ[idxB];

    // Body A linear
    vl[iA] += iMA * G[0] * dl;
    vl[iA + 1] += iMA * G[1] * dl;
    vl[iA + 2] += iMzA * G[2] * dl;
    // Body A angular
    const iIA = ws.invInertia[idxA];
    const gA3 = G[3] * dl;
    const gA4 = G[4] * dl;
    const gA5 = G[5] * dl;
    wl[iA] += iIA[0] * gA3 + iIA[1] * gA4 + iIA[2] * gA5;
    wl[iA + 1] += iIA[3] * gA3 + iIA[4] * gA4 + iIA[5] * gA5;
    wl[iA + 2] += iIA[6] * gA3 + iIA[7] * gA4 + iIA[8] * gA5;

    // Body C linear
    vl[iCoff] += iMC * G[6] * dl;
    vl[iCoff + 1] += iMC * G[7] * dl;
    vl[iCoff + 2] += iMzC * G[8] * dl;
    // Body C angular
    const iIC = ws.invInertia[idxC];
    const gC9 = G[9] * dl;
    const gC10 = G[10] * dl;
    const gC11 = G[11] * dl;
    wl[iCoff] += iIC[0] * gC9 + iIC[1] * gC10 + iIC[2] * gC11;
    wl[iCoff + 1] += iIC[3] * gC9 + iIC[4] * gC10 + iIC[5] * gC11;
    wl[iCoff + 2] += iIC[6] * gC9 + iIC[7] * gC10 + iIC[8] * gC11;

    // Body B linear
    vl[iB] += iMB * G[12] * dl;
    vl[iB + 1] += iMB * G[13] * dl;
    vl[iB + 2] += iMzB * G[14] * dl;
    // Body B angular
    const iIB = ws.invInertia[idxB];
    const gB15 = G[15] * dl;
    const gB16 = G[16] * dl;
    const gB17 = G[17] * dl;
    wl[iB] += iIB[0] * gB15 + iIB[1] * gB16 + iIB[2] * gB17;
    wl[iB + 1] += iIB[3] * gB15 + iIB[4] * gB16 + iIB[5] * gB17;
    wl[iB + 2] += iIB[6] * gB15 + iIB[7] * gB16 + iIB[8] * gB17;

    return this;
  }
}
