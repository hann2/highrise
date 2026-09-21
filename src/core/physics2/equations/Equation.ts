/**
 * Base constraint equation for the physics solver.
 *
 * ## Constraint formulation
 *
 * Each equation represents a single scalar constraint of the form:
 *
 *   C(q) = 0          (position-level: "these bodies should be at this configuration")
 *   dC/dt = G * v = 0 (velocity-level: "the relative velocity along this constraint axis is zero")
 *
 * where:
 *   - C(q) is the constraint function evaluated at the current positions/orientations
 *   - G is the constraint Jacobian — a 1x12 row vector (see the G field below)
 *   - v is the 12-component generalized velocity vector of the two bodies:
 *     [vxA, vyA, vzA, wxA, wyA, wzA, vxB, vyB, vzB, wxB, wyB, wzB]
 *
 * The Jacobian G encodes *how* the constraint responds to each body's motion.
 * For example, a contact normal constraint sets G so that G*v gives the
 * relative velocity along the contact normal.
 *
 * ## Stiffness, damping, and the a/b/epsilon parameters
 *
 * Rather than enforcing C=0 rigidly (which requires infinite stiffness and
 * can cause instability), constraints are modeled as damped springs:
 *
 *   F = -k*C - d*(dC/dt)
 *
 * where k = stiffness (N/m) and d = relaxation (dimensionless damping ratio,
 * not seconds — higher values = more damping).
 *
 * The update() method converts (k, d, h) into solver-friendly parameters:
 *   a       = 4 / (h * (1 + 4d))       — position error feedback gain (1/s)
 *   b       = 4d / (1 + 4d)             — velocity error feedback gain (dimensionless, 0..1)
 *   epsilon = 4 / (h^2 * k * (1 + 4d)) — compliance/regularization (s^2/kg/m or equivalent)
 *
 * These appear in the solver's right-hand side: B = -a*Gq - b*GW - h*GiMf
 * and in the effective mass: invC = 1/(G*M^-1*G^T + epsilon).
 *
 * High stiffness (k -> inf) makes epsilon -> 0, recovering a rigid constraint.
 * High relaxation (d -> inf) makes b -> 1 and a -> 0, prioritizing velocity
 * correction over position correction (more damped, less springy).
 */
import type { Body } from "../body/Body";
import type { SolverWorkspace } from "../solver/SolverWorkspace";
import {
  EQ_B,
  EQ_INDEX_A,
  EQ_INDEX_B,
  EQ_INV_C,
  EQ_LAMBDA,
  EQ_MAX_FORCE_DT,
  EQ_MIN_FORCE_DT,
  EQ_SLOT,
} from "../internal";

export interface EquationOptions {
  /** Spring stiffness for the constraint (N/m). Higher = more rigid.
   *  Default: 1e6. */
  stiffness?: number;
  /** Damping ratio (dimensionless). Higher = more damping, less oscillation.
   *  Default: 4. Typical range: 1-10. */
  relaxation?: number;
}

/** Base class for constraint equations. See module-level docs for theory. */
export class Equation {
  static DEFAULT_STIFFNESS = 1e6;
  static DEFAULT_RELAXATION = 4;

  static idCounter = 0;

  id: number;
  /** Minimum force the constraint can apply (N). Negative for bilateral
   *  constraints, 0 for unilateral (e.g. contacts that can only push). */
  minForce: number;
  /** Maximum force the constraint can apply (N). */
  maxForce: number;
  bodyA: Body;
  bodyB: Body;
  /** Spring stiffness (N/m). Controls how rigidly the constraint is enforced. */
  stiffness: number;
  /** Damping ratio (dimensionless). Controls how quickly oscillations die out. */
  relaxation: number;
  /** Constant offset added to the position-level constraint evaluation (Gq).
   *  Used to set a desired separation distance or angle. */
  offset: number;
  /** Position error feedback gain (1/s). Derived from stiffness, relaxation, and timestep.
   *  Multiplies Gq in the RHS computation: B = -a*Gq - b*GW - h*GiMf. */
  a: number;
  /** Velocity error feedback gain (dimensionless, 0..1). Derived from relaxation.
   *  Multiplies GW in the RHS computation. */
  b: number;
  /** Compliance/regularization (s^2*kg^-1*m^-1 equivalent). Added to the
   *  effective mass denominator to soften the constraint and improve stability.
   *  Derived from stiffness, relaxation, and timestep. */
  epsilon: number;
  /** Current simulation timestep (s). Cached to detect when update() is needed. */
  timeStep: number;
  /** Flag indicating that a/b/epsilon need recomputation (e.g. after stiffness change). */
  needsUpdate: boolean;
  /** The constraint force magnitude from the last solver iteration (N).
   *  Positive means the constraint was active. Useful for game logic
   *  (e.g. reading contact force, breaking constraints above a threshold). */
  multiplier: number;
  /** Desired relative velocity along the constraint axis (m/s).
   *  Added to GW. Used by motor constraints to drive a target speed. */
  relativeVelocity: number;
  /** When false, the solver skips this equation entirely. */
  enabled: boolean;
  /**
   * Cached impulse (lambda) from the previous solver step. Used for warm
   * starting: instead of solving from lambda=0 each frame, the solver begins
   * from the previous solution and corrects the delta. For constraints under
   * steady load (taut ropes, persistent contacts), this dramatically reduces
   * the number of iterations needed to converge.
   */
  warmLambda: number;
  /**
   * Solver iteration order hint. Equations are sorted by this value before
   * the Gauss-Seidel iteration loop. Default 0 means "no preference."
   *
   * For chain-like structures (ropes, ragdolls), assigning sequential values
   * lets corrections propagate along the chain in a single iteration instead
   * of requiring one iteration per link. Use even spacing (e.g. 2, 4, 6, ...)
   * to leave room for interleaving related equations (e.g. pulley constraints
   * between chain links).
   */
  solverOrder: number;

  /**
   * Jacobian vector (12 components):
   * [vxA, vyA, vzA, wxA, wyA, wzA, vxB, vyB, vzB, wxB, wyB, wzB]
   *
   * For 3DOF-only constraints, components 2,3,4 (vzA, wxA, wyA) and
   * 8,9,10 (vzB, wxB, wyB) are 0 — the solver handles this correctly
   * because the corresponding inverse mass/inertia values are also 0.
   */
  G: Float32Array = new Float32Array(12);

  // Solver-internal properties (hidden from autocomplete via symbols)
  [EQ_B]: number = 0;
  [EQ_INV_C]: number = 0;
  [EQ_LAMBDA]: number = 0;
  [EQ_MAX_FORCE_DT]: number = 0;
  [EQ_MIN_FORCE_DT]: number = 0;
  /** Workspace row index for bodyA during the current solve. -1 when unset. */
  [EQ_INDEX_A]: number = -1;
  /** Workspace row index for bodyB during the current solve. -1 when unset. */
  [EQ_INDEX_B]: number = -1;
  /** Slot in workspace.Bs / invCs / lambda for the current solve. -1 when unset. */
  [EQ_SLOT]: number = -1;

  constructor(
    bodyA: Body,
    bodyB: Body,
    minForce = -Number.MAX_VALUE,
    maxForce = Number.MAX_VALUE,
  ) {
    this.id = Equation.idCounter++;
    this.minForce = minForce;
    this.maxForce = maxForce;
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this.stiffness = Equation.DEFAULT_STIFFNESS;
    this.relaxation = Equation.DEFAULT_RELAXATION;
    this.offset = 0;
    this.a = 0;
    this.b = 0;
    this.epsilon = 0;
    this.timeStep = 1 / 60;
    this.needsUpdate = true;
    this.multiplier = 0;
    this.relativeVelocity = 0;
    this.enabled = true;
    this.warmLambda = 0;
    this.solverOrder = 0;
  }

  /**
   * Recompute the solver parameters (a, b, epsilon) from stiffness, relaxation,
   * and the current timestep. Called automatically by the solver when the
   * timestep changes or needsUpdate is set.
   *
   * Derivation: models the constraint as a damped spring C'' + 2d/h*C' + k*C = 0,
   * discretized with implicit Euler. The resulting formulas are:
   *   a       = 4 / (h * (1 + 4d))        — position correction rate
   *   b       = 4d / (1 + 4d)             — velocity correction blend (0 = spring, 1 = damper)
   *   epsilon = 4 / (h^2 * k * (1 + 4d)) — constraint softness (compliance)
   */
  update(): this {
    const k = this.stiffness;
    const d = this.relaxation;
    const h = this.timeStep;

    this.a = 4.0 / (h * (1 + 4 * d));
    this.b = (4.0 * d) / (1 + 4 * d);
    this.epsilon = 4.0 / (h * h * k * (1 + 4 * d));
    this.needsUpdate = false;
    return this;
  }

  /**
   * Assign workspace row indices for this equation's bodies. Called once
   * per solve during setup. Subclasses with extra bodies (e.g. PulleyEquation)
   * should override and call super.
   */
  assignIndices(ws: SolverWorkspace): void {
    this[EQ_INDEX_A] = ws.indexOf(this.bodyA);
    this[EQ_INDEX_B] = ws.indexOf(this.bodyB);
  }

  /**
   * Compute the right-hand side (B) of the constraint equation for the solver.
   *
   *   B = -a * Gq - b * GW - h * GiMf
   *
   * This combines three correction terms:
   * - **Gq** (position error): how far the constraint is violated right now.
   *   Scaled by `a` to control position correction aggressiveness (Baumgarte).
   * - **GW** (velocity error): the current relative velocity along the constraint.
   *   Scaled by `b` to provide velocity-level damping.
   * - **GiMf** (force term): the acceleration that external forces would cause
   *   along the constraint direction. Scaled by `h` to predict the velocity
   *   change from external forces over this timestep.
   *
   * @param a - Position error feedback gain (1/s), from update()
   * @param b - Velocity error feedback gain (dimensionless), from update()
   * @param h - Timestep (s)
   * @param ws - Solver workspace (provides inverse mass/inertia by body index)
   */
  computeB(a: number, b: number, h: number, ws: SolverWorkspace): number {
    const GW = this.computeGW();
    const Gq = this.computeGq();
    const GiMf = this.computeGiMf(ws);
    return -Gq * a - GW * b - GiMf * h;
  }

  /**
   * Position-level constraint evaluation.
   * Default: G · [posA, zA, 0, 0, yawA, posB, zB, 0, 0, yawB] + offset.
   * Most constraint types override this with a custom geometric computation.
   */
  computeGq(): number {
    const G = this.G;
    const bi = this.bodyA;
    const bj = this.bodyB;
    return (
      G[0] * bi.position[0] +
      G[1] * bi.position[1] +
      G[2] * bi.z +
      // G[3], G[4]: roll/pitch position terms — 0 for standard constraints
      G[5] * bi.angle +
      G[6] * bj.position[0] +
      G[7] * bj.position[1] +
      G[8] * bj.z +
      // G[9], G[10]: roll/pitch position terms — 0 for standard constraints
      G[11] * bj.angle +
      this.offset
    );
  }

  /**
   * Velocity-level constraint evaluation: G * v.
   *
   * Computes the current relative velocity along the constraint direction
   * using the bodies' actual velocities (not the solver accumulators).
   * This is the "GW" term in the RHS: it tells the solver how fast the
   * constraint is currently being violated.
   *
   * The `relativeVelocity` field is added as a bias — used by motor
   * constraints to drive toward a target speed.
   */
  computeGW(): number {
    const G = this.G;
    const bi = this.bodyA;
    const bj = this.bodyB;
    const wA = bi.angularVelocity3;
    const wB = bj.angularVelocity3;
    return (
      G[0] * bi.velocity[0] +
      G[1] * bi.velocity[1] +
      G[2] * bi.zVelocity +
      G[3] * wA[0] +
      G[4] * wA[1] +
      G[5] * wA[2] +
      G[6] * bj.velocity[0] +
      G[7] * bj.velocity[1] +
      G[8] * bj.zVelocity +
      G[9] * wB[0] +
      G[10] * wB[1] +
      G[11] * wB[2] +
      this.relativeVelocity
    );
  }

  /**
   * Compute the constraint velocity from accumulated solver impulses: G * v_lambda.
   *
   * This is the "GWlambda" term in the solver iteration. It represents
   * how much constraint-velocity has already been accumulated from impulses
   * applied by this and other equations during the current solve. The solver
   * subtracts this from B to find the remaining violation to correct.
   */
  computeGWlambda(ws: SolverWorkspace): number {
    const G = this.G;
    const iA = this[EQ_INDEX_A] * 3;
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
      G[6] * vl[iB] +
      G[7] * vl[iB + 1] +
      G[8] * vl[iB + 2] +
      G[9] * wl[iB] +
      G[10] * wl[iB + 1] +
      G[11] * wl[iB + 2]
    );
  }

  /**
   * External force contribution: G · [invM*f, invI*τ] for both bodies.
   * The angular part uses the full 3x3 world-frame inverse inertia tensor.
   */
  computeGiMf(ws: SolverWorkspace): number {
    const G = this.G;
    const bi = this.bodyA;
    const bj = this.bodyB;
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const invMassSolve = ws.invMassSolve;
    const invMassSolveZ = ws.invMassSolveZ;
    const invInertia = ws.invInertia;
    const iMA = invMassSolve[idxA];
    const iMzA = invMassSolveZ[idxA];
    const iMB = invMassSolve[idxB];
    const iMzB = invMassSolveZ[idxB];

    // Body A: invI_world * torque3
    const iIA = invInertia[idxA];
    const tA = bi.angularForce3;
    const aA0 = iIA[0] * tA[0] + iIA[1] * tA[1] + iIA[2] * tA[2];
    const aA1 = iIA[3] * tA[0] + iIA[4] * tA[1] + iIA[5] * tA[2];
    const aA2 = iIA[6] * tA[0] + iIA[7] * tA[1] + iIA[8] * tA[2];

    // Body B: invI_world * torque3
    const iIB = invInertia[idxB];
    const tB = bj.angularForce3;
    const aB0 = iIB[0] * tB[0] + iIB[1] * tB[1] + iIB[2] * tB[2];
    const aB1 = iIB[3] * tB[0] + iIB[4] * tB[1] + iIB[5] * tB[2];
    const aB2 = iIB[6] * tB[0] + iIB[7] * tB[1] + iIB[8] * tB[2];

    return (
      G[0] * bi.force[0] * iMA +
      G[1] * bi.force[1] * iMA +
      G[2] * bi.zForce * iMzA +
      G[3] * aA0 +
      G[4] * aA1 +
      G[5] * aA2 +
      G[6] * bj.force[0] * iMB +
      G[7] * bj.force[1] * iMB +
      G[8] * bj.zForce * iMzB +
      G[9] * aB0 +
      G[10] * aB1 +
      G[11] * aB2
    );
  }

  /**
   * Effective mass: G · invM · G^T.
   * Linear part: G_lin^T * diag(invM, invM, invMz) * G_lin.
   * Angular part: G_ang^T * invI_world * G_ang (quadratic form with 3x3 tensor).
   */
  computeGiMGt(ws: SolverWorkspace): number {
    const G = this.G;
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const iMzA = ws.invMassSolveZ[idxA];
    const iMzB = ws.invMassSolveZ[idxB];

    // Body A linear
    let result = G[0] * G[0] * iMA + G[1] * G[1] * iMA + G[2] * G[2] * iMzA;

    // Body A angular: G_ang^T * invI * G_ang (symmetric quadratic form)
    const iIA = ws.invInertia[idxA];
    result +=
      G[3] * (iIA[0] * G[3] + iIA[1] * G[4] + iIA[2] * G[5]) +
      G[4] * (iIA[3] * G[3] + iIA[4] * G[4] + iIA[5] * G[5]) +
      G[5] * (iIA[6] * G[3] + iIA[7] * G[4] + iIA[8] * G[5]);

    // Body B linear
    result += G[6] * G[6] * iMB + G[7] * G[7] * iMB + G[8] * G[8] * iMzB;

    // Body B angular
    const iIB = ws.invInertia[idxB];
    result +=
      G[9] * (iIB[0] * G[9] + iIB[1] * G[10] + iIB[2] * G[11]) +
      G[10] * (iIB[3] * G[9] + iIB[4] * G[10] + iIB[5] * G[11]) +
      G[11] * (iIB[6] * G[9] + iIB[7] * G[10] + iIB[8] * G[11]);

    return result;
  }

  /**
   * Apply impulse to both bodies' solver state.
   * Linear: vlambda += invM * G_lin * deltalambda
   * Angular: wlambda += invI_world * G_ang * deltalambda
   */
  addToWlambda(deltalambda: number, ws: SolverWorkspace): this {
    const G = this.G;
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

    // Body A linear
    vl[iA] += iMA * G[0] * dl;
    vl[iA + 1] += iMA * G[1] * dl;
    vl[iA + 2] += iMzA * G[2] * dl;

    // Body A angular: wlambda += invI * (G_ang * dl)
    const iIA = ws.invInertia[idxA];
    const gA3 = G[3] * dl;
    const gA4 = G[4] * dl;
    const gA5 = G[5] * dl;
    wl[iA] += iIA[0] * gA3 + iIA[1] * gA4 + iIA[2] * gA5;
    wl[iA + 1] += iIA[3] * gA3 + iIA[4] * gA4 + iIA[5] * gA5;
    wl[iA + 2] += iIA[6] * gA3 + iIA[7] * gA4 + iIA[8] * gA5;

    // Body B linear
    vl[iB] += iMB * G[6] * dl;
    vl[iB + 1] += iMB * G[7] * dl;
    vl[iB + 2] += iMzB * G[8] * dl;

    // Body B angular
    const iIB = ws.invInertia[idxB];
    const gB9 = G[9] * dl;
    const gB10 = G[10] * dl;
    const gB11 = G[11] * dl;
    wl[iB] += iIB[0] * gB9 + iIB[1] * gB10 + iIB[2] * gB11;
    wl[iB + 1] += iIB[3] * gB9 + iIB[4] * gB10 + iIB[5] * gB11;
    wl[iB + 2] += iIB[6] * gB9 + iIB[7] * gB10 + iIB[8] * gB11;

    return this;
  }

  /**
   * Compute the inverse effective mass for this constraint:
   *   invC = 1 / (G * M^-1 * G^T + epsilon)
   *
   * The denominator is the "effective mass" — how much impulse is needed to
   * produce a unit velocity change along this constraint. The epsilon term
   * regularizes the computation: it prevents division by zero when bodies
   * are massless along the constraint direction, and softens the constraint
   * to model compliance (springiness).
   */
  computeInvC(eps: number, ws: SolverWorkspace): number {
    const denom = this.computeGiMGt(ws) + eps;
    if (denom <= 0 || !isFinite(denom)) return 0;
    const inv = 1.0 / denom;
    return isFinite(inv) ? inv : 0;
  }
}
