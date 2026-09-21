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
 *   - C(q) is the constraint function evaluated at the current positions/angles
 *   - G is the constraint Jacobian — a 1x6 row vector (see the G field below)
 *   - v is the 6-component generalized velocity vector of the two bodies:
 *     [vxA, vyA, wA, vxB, vyB, wB]
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
   * to leave room for interleaving related equations.
   */
  solverOrder: number;

  /**
   * Jacobian vector (6 components):
   * [vxA, vyA, wA, vxB, vyB, wB]
   *
   * i.e. body A's linear x/y and angular terms, then body B's.
   */
  G: Float32Array = new Float32Array(6);

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
   * per solve during setup.
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
   * Default: G · [posA, angleA, posB, angleB] + offset.
   * Most constraint types override this with a custom geometric computation.
   */
  computeGq(): number {
    const G = this.G;
    const bi = this.bodyA;
    const bj = this.bodyB;
    return (
      G[0] * bi.position[0] +
      G[1] * bi.position[1] +
      G[2] * bi.angle +
      G[3] * bj.position[0] +
      G[4] * bj.position[1] +
      G[5] * bj.angle +
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
    return (
      G[0] * bi.velocity[0] +
      G[1] * bi.velocity[1] +
      G[2] * bi.angularVelocity +
      G[3] * bj.velocity[0] +
      G[4] * bj.velocity[1] +
      G[5] * bj.angularVelocity +
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
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iA = idxA * 2;
    const iB = idxB * 2;
    const vl = ws.vlambda;
    const wl = ws.wlambda;
    return (
      G[0] * vl[iA] +
      G[1] * vl[iA + 1] +
      G[2] * wl[idxA] +
      G[3] * vl[iB] +
      G[4] * vl[iB + 1] +
      G[5] * wl[idxB]
    );
  }

  /** External force contribution: G · [invM*f, invI*τ] for both bodies. */
  computeGiMf(ws: SolverWorkspace): number {
    const G = this.G;
    const bi = this.bodyA;
    const bj = this.bodyB;
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const iIA = ws.invInertiaSolve[idxA];
    const iIB = ws.invInertiaSolve[idxB];

    return (
      G[0] * bi.force[0] * iMA +
      G[1] * bi.force[1] * iMA +
      G[2] * (iIA * bi.angularForce) +
      G[3] * bj.force[0] * iMB +
      G[4] * bj.force[1] * iMB +
      G[5] * (iIB * bj.angularForce)
    );
  }

  /** Effective mass: G · invM · G^T. */
  computeGiMGt(ws: SolverWorkspace): number {
    const G = this.G;
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const iIA = ws.invInertiaSolve[idxA];
    const iIB = ws.invInertiaSolve[idxB];

    // Body A linear + angular
    let result = G[0] * G[0] * iMA + G[1] * G[1] * iMA;
    result += G[2] * (iIA * G[2]);

    // Body B linear + angular
    result += G[3] * G[3] * iMB + G[4] * G[4] * iMB;
    result += G[5] * (iIB * G[5]);

    return result;
  }

  /**
   * Apply impulse to both bodies' solver state.
   * Linear: vlambda += invM * G_lin * deltalambda
   * Angular: wlambda += invI * G_ang * deltalambda
   */
  addToWlambda(deltalambda: number, ws: SolverWorkspace): this {
    const G = this.G;
    const idxA = this[EQ_INDEX_A];
    const idxB = this[EQ_INDEX_B];
    const iA = idxA * 2;
    const iB = idxB * 2;
    const vl = ws.vlambda;
    const wl = ws.wlambda;
    const iMA = ws.invMassSolve[idxA];
    const iMB = ws.invMassSolve[idxB];
    const dl = deltalambda;

    // Body A
    vl[iA] += iMA * G[0] * dl;
    vl[iA + 1] += iMA * G[1] * dl;
    wl[idxA] += ws.invInertiaSolve[idxA] * (G[2] * dl);

    // Body B
    vl[iB] += iMB * G[3] * dl;
    vl[iB + 1] += iMB * G[4] * dl;
    wl[idxB] += ws.invInertiaSolve[idxB] * (G[5] * dl);

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
