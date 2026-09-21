/**
 * Gauss-Seidel Sequential Impulse (SI) constraint solver.
 *
 * This module implements an iterative Gauss-Seidel method for solving systems
 * of constraint equations in a rigid body physics simulation. The algorithm
 * is equivalent to projected Gauss-Seidel (PGS) — the standard approach used
 * by most real-time physics engines (Box2D, Bullet, etc.).
 *
 * ## Algorithm overview
 *
 * Given N constraint equations, each with a Jacobian row G_i, the solver
 * finds impulse magnitudes lambda_i that satisfy all constraints simultaneously
 * (within tolerance). On each iteration it sweeps through every equation and
 * computes an impulse correction:
 *
 *   delta_lambda_i = invC_i * (B_i - G_i * v_lambda - epsilon_i * lambda_i)
 *
 * where:
 *   - **lambda** is the accumulated constraint impulse (units: N*s = kg*m/s).
 *     Clamped to [minForce*dt, maxForce*dt] to enforce inequality constraints
 *     (e.g. contacts can push but not pull, friction is bounded).
 *   - **B** (the "right-hand side") encodes the constraint violation to be
 *     corrected this timestep. It combines three terms:
 *       B = -a * Gq - b * GW - h * GiMf
 *     where Gq is position error, GW is velocity error, and GiMf is the
 *     external-force contribution. The coefficients a, b come from the
 *     Baumgarte-like stabilization derived from stiffness/relaxation.
 *   - **invC** is the inverse effective mass for the constraint:
 *       invC = 1 / (G * M^-1 * G^T + epsilon)
 *     This is a scalar because each equation is 1-DOF.
 *   - **epsilon** is a compliance/regularization term (units: 1/(kg*m^2/s^2*s^2)
 *     effectively dimensionless after scaling). It softens the constraint,
 *     preventing the effective mass from becoming infinite or ill-conditioned
 *     when bodies have extreme mass ratios. Derived from stiffness and
 *     relaxation: epsilon = 4 / (h^2 * k * (1 + 4d)).
 *
 * After each equation update, the impulse is immediately applied to the
 * participating bodies' velocity accumulators (vlambda, wlambda), so
 * subsequent equations in the same iteration see the updated velocities.
 * This is what makes it "Gauss-Seidel" rather than "Jacobi".
 *
 * ## Per-body state storage
 *
 * The solver stores per-body scratch state (vlambda, wlambda, inverse mass,
 * inverse inertia) in a {@link SolverWorkspace}. Bodies are assigned integer
 * indices at the start of each solve; equations read/write the flat
 * Float64Arrays in the workspace by index. This replaces an earlier design
 * that used `Map<Body, SolverBodyState>` — the index-based layout removes
 * two Map lookups from the inner loop of every equation iteration.
 *
 * ## Friction pre-iterations
 *
 * Friction equations depend on the normal force magnitude from their
 * associated contact equations (Coulomb friction: |f_t| <= mu * |f_n|).
 * The `frictionIterations` parameter runs a preliminary solve pass to
 * estimate contact forces, then updates friction bounds before the main
 * solve. Without this, friction limits on the first iteration would use
 * stale or zero normal force estimates, leading to sliding artifacts.
 *
 * ## Convergence
 *
 * The solver terminates early when the total absolute change in lambda
 * across all equations falls below `tolerance` (squared comparison for
 * efficiency). This means the system has settled and further iterations
 * would produce negligible improvement.
 */
import { profiler } from "../../util/Profiler";
import type { Body } from "../body/Body";
import { AngularEquation2D } from "../equations/AngularEquation2D";
import type { Equation } from "../equations/Equation";
import { FrictionEquation } from "../equations/FrictionEquation";
import { PlanarEquation2D } from "../equations/PlanarEquation2D";
import { PointToPointEquation2D } from "../equations/PointToPointEquation2D";
import { PointToRigidEquation2D } from "../equations/PointToRigidEquation2D";
import { EQ_INDEX_A, EQ_INDEX_B, EQ_SLOT } from "../internal";
import type { Island } from "../world/Island";
import type { SolverWorkspace } from "./SolverWorkspace";

// --- Types ---

export interface SolverConfig {
  /** Maximum number of Gauss-Seidel iterations per solve. Higher values
   *  improve accuracy at the cost of CPU time. Typical range: 5-20. */
  readonly iterations: number;
  /** Early-exit threshold. The solver stops when the sum of |delta_lambda|
   *  across all equations squared is below this value (dimensionless after
   *  normalization). Typical range: 1e-7 to 1e-10. */
  readonly tolerance: number;
  /** Number of preliminary iterations used to estimate normal forces before
   *  the main solve, so friction bounds (mu * f_n) are reasonable from the
   *  start. 0 disables friction pre-iterations. Typical: 0-3. */
  readonly frictionIterations: number;
  /** When true, sets B=0 during iteration (ignores position/velocity error
   *  and external forces). Used for split-impulse / pseudo-velocity schemes
   *  where position correction is handled separately. */
  readonly useZeroRHS: boolean;
  /** Optional comparator to sort equations before solving. Solving order
   *  affects convergence in Gauss-Seidel; sorting contacts by penetration
   *  depth or by body mass ratio can improve stability. False disables sorting. */
  readonly equationSortFunction?:
    ((a: Equation, b: Equation) => number) | false;
}

export interface SolverResult {
  readonly usedIterations: number;
}

export const DEFAULT_SOLVER_CONFIG: SolverConfig = {
  iterations: 20,
  tolerance: 1e-3,
  frictionIterations: 0,
  useZeroRHS: false,
  equationSortFunction: (a, b) => a.solverOrder - b.solverOrder,
};

// --- Main Functions ---

/**
 * One-time-per-step workspace preparation. Registers all dynamic bodies,
 * assigns a workspace index to every body referenced by any equation, and
 * ensures per-equation scratch capacity.
 *
 * Callers that run multiple substeps per physics step should invoke this
 * once (before the substep loop) and then invoke {@link solveSubstep} for
 * each substep, reusing the same workspace. The body/equation membership
 * must not change between substeps — deferred body removal in `BodyManager`
 * ensures this is safe.
 *
 * @param equations - All equations to solve, already sorted into iteration
 *   order by the caller. Disabled equations may be included; they are
 *   skipped inside the solver but may still reference bodies whose indices
 *   need to be assigned for other equations.
 * @param dynamicBodies - All dynamic bodies that should receive constraint
 *   velocity updates on finalize.
 * @param workspace - Workspace to populate. Reset and rewritten in place.
 */
export function prepareSolverStep(
  equations: readonly Equation[],
  dynamicBodies: Iterable<Body>,
  workspace: SolverWorkspace,
): void {
  workspace.reset();
  for (const body of dynamicBodies) {
    workspace.registerDynamic(body);
  }
  const Neq = equations.length;
  const generalEquations = workspace.generalEquations;
  const pointToPoint2DEquations = workspace.pointToPoint2DEquations;
  const pointToRigid2DEquations = workspace.pointToRigid2DEquations;
  const planar2DEquations = workspace.planar2DEquations;
  const angular2DEquations = workspace.angular2DEquations;
  for (let i = 0; i < Neq; i++) {
    const eq = equations[i];
    eq.assignIndices(workspace);
    // Each equation gets a stable slot in Bs/invCs/lambda, independent of
    // which partitioned group it ends up in.
    eq[EQ_SLOT] = i;
    // Partition by Jacobian shape. The shape classes don't have subclass
    // relationships with each other, so order only matters for readability.
    if (eq instanceof PointToPointEquation2D) {
      pointToPoint2DEquations.push(eq);
    } else if (eq instanceof PointToRigidEquation2D) {
      pointToRigid2DEquations.push(eq);
    } else if (eq instanceof PlanarEquation2D) {
      planar2DEquations.push(eq);
    } else if (eq instanceof AngularEquation2D) {
      angular2DEquations.push(eq);
    } else {
      generalEquations.push(eq);
    }
  }
  workspace.ensureEqCapacity(Neq);
}

/**
 * Run one substep of the Gauss-Seidel solver against a workspace that was
 * previously prepared with {@link prepareSolverStep}. Equation body indices
 * are reused; only the per-substep accumulators (vlambda, wlambda, lambda)
 * are cleared.
 *
 * `equations` must be the same array that was passed to `prepareSolverStep`
 * — it is not re-sorted or re-filtered here. Equations whose `enabled` flag
 * is false are skipped by inline branches, since limit constraints can
 * toggle their enabled flag between substeps.
 */
export function solveSubstep(
  equations: readonly Equation[],
  h: number,
  config: SolverConfig,
  workspace: SolverWorkspace,
): SolverResult {
  const { iterations, tolerance, frictionIterations, useZeroRHS } = config;

  profiler.start("Solver.setup");

  const Neq = equations.length;
  if (Neq === 0) {
    profiler.end("Solver.setup");
    return { usedIterations: 0 };
  }

  const tolSquared = tolerance ** 2;
  let usedIterations = 0;

  // Zero the per-substep accumulators. Indices and per-body inverse mass
  // data are preserved from prepareSolverStep.
  workspace.resetAccumulators();

  const lambda = workspace.lambda;
  const Bs = workspace.Bs;
  const invCs = workspace.invCs;
  lambda.fill(0, 0, Neq);

  // Prepare equations - compute B and invC values. Each shape group gets
  // its own per-shape batch function so the `computeB` / `computeInvC` call
  // sites inside are monomorphic and V8 can inline the override chain
  // (computeGq / computeGW / computeGiMf / computeGiMGt). A single generic
  // helper won't work: V8 compiles one bytecode for the helper with shared
  // ICs, which go megamorphic once it's called with multiple shape types.
  setupPointToPoint2DBatch(
    workspace.pointToPoint2DEquations,
    h,
    Bs,
    invCs,
    workspace,
  );
  setupPointToRigid2DBatch(
    workspace.pointToRigid2DEquations,
    h,
    Bs,
    invCs,
    workspace,
  );
  setupPlanar2DBatch(workspace.planar2DEquations, h, Bs, invCs, workspace);
  setupAngular2DBatch(workspace.angular2DEquations, h, Bs, invCs, workspace);
  setupGeneralBatch(workspace.generalEquations, h, Bs, invCs, workspace);

  profiler.end("Solver.setup");

  profiler.start("Solver.warmStart");
  // Warm start: initialize lambda from the cached solution (previous frame
  // on substep 0, previous substep thereafter) and pre-apply the cached
  // impulses to body velocity deltas. Partitioned per shape so `addToWlambda`
  // is monomorphic and inlineable at each call site.
  warmStartPointToPoint2DBatch(
    workspace.pointToPoint2DEquations,
    h,
    lambda,
    workspace,
  );
  warmStartPointToRigid2DBatch(
    workspace.pointToRigid2DEquations,
    h,
    lambda,
    workspace,
  );
  warmStartPlanar2DBatch(workspace.planar2DEquations, h, lambda, workspace);
  warmStartAngular2DBatch(workspace.angular2DEquations, h, lambda, workspace);
  warmStartGeneralBatch(workspace.generalEquations, h, lambda, workspace);
  profiler.end("Solver.warmStart");

  // Optional friction pre-iteration phase
  if (frictionIterations > 0) {
    for (let iter = 0; iter < frictionIterations; iter++) {
      const deltaTot = runIteration(
        Bs,
        invCs,
        lambda,
        useZeroRHS,
        h,
        workspace,
      );
      usedIterations++;

      if (deltaTot * deltaTot <= tolSquared) {
        break;
      }
    }

    updateMultipliers(equations, lambda, 1 / h);
    updateFrictionBounds(equations);
  }

  // Main iteration phase
  profiler.start("Solver.iterate");
  for (let iter = 0; iter < iterations; iter++) {
    const deltaTot = runIteration(Bs, invCs, lambda, useZeroRHS, h, workspace);
    usedIterations++;

    if (deltaTot * deltaTot <= tolSquared) {
      break;
    }
  }
  profiler.end("Solver.iterate");

  profiler.start("Solver.finalize");
  // Apply constraint velocities to dynamic bodies. The workspace's parallel
  // dynamicBodies/dynamicBodyIndices arrays give us each dynamic body along
  // with its slot in the flat vlambda/wlambda arrays.
  const dynBodies = workspace.dynamicBodies;
  const dynIdx = workspace.dynamicBodyIndices;
  const vl = workspace.vlambda;
  const wl = workspace.wlambda;
  const dynCount = dynBodies.length;
  for (let i = 0; i < dynCount; i++) {
    const body = dynBodies[i];
    const idx = dynIdx[i];
    const base = idx * 2;

    body.velocity.x += vl[base];
    body.velocity.y += vl[base + 1];
    // Point masses have zero inverse inertia, so their wlambda stays 0.
    body.angularVelocity += wl[idx];
  }

  // Cache lambda for warm starting next frame, then update multipliers.
  // Disabled equations retain their previous warmLambda / multiplier so
  // game code reading those fields sees stable values. Partitioned per
  // shape so the field reads/writes are monomorphic.
  const invDt = 1 / h;
  finalizePointToPoint2DBatch(workspace.pointToPoint2DEquations, lambda, invDt);
  finalizePointToRigid2DBatch(workspace.pointToRigid2DEquations, lambda, invDt);
  finalizePlanar2DBatch(workspace.planar2DEquations, lambda, invDt);
  finalizeAngular2DBatch(workspace.angular2DEquations, lambda, invDt);
  finalizeGeneralBatch(workspace.generalEquations, lambda, invDt);
  profiler.end("Solver.finalize");

  return { usedIterations };
}

/**
 * Solve a set of constraint equations in one call. Performs sort, filter,
 * workspace prep, and a single substep. Used by the island-split path where
 * a new workspace prep is needed per island.
 *
 * For the common case of running multiple substeps against the same set of
 * equations, prefer {@link prepareSolverStep} + {@link solveSubstep}, which
 * hoists the sort and index assignment out of the substep loop.
 */
export function solveEquations(
  equations: readonly Equation[],
  dynamicBodies: Iterable<Body>,
  h: number,
  config: SolverConfig,
  workspace: SolverWorkspace,
): SolverResult {
  // Sort if configured
  if (config.equationSortFunction) {
    equations = equations.toSorted(config.equationSortFunction);
  }
  prepareSolverStep(equations, dynamicBodies, workspace);
  return solveSubstep(equations, h, config, workspace);
}

/**
 * Solve all equations in an island.
 *
 * Extracts dynamic bodies from the island and delegates to solveEquations.
 * The caller is responsible for passing a workspace; when solving multiple
 * islands in one step, the same workspace can be reused (it will be reset
 * at the start of each `solveEquations` call).
 */
export function solveIsland(
  island: Island,
  h: number,
  config: SolverConfig,
  workspace: SolverWorkspace,
): SolverResult {
  // Extract dynamic bodies from island
  const dynamicBodies: Body[] = [];
  for (const body of island.bodies) {
    if (body.motion === "dynamic") {
      dynamicBodies.push(body);
    }
  }

  return solveEquations(
    island.equations as Equation[],
    dynamicBodies,
    h,
    config,
    workspace,
  );
}

// --- Helper Functions ---

// --- Per-shape setup / warmStart / finalize batch functions ---
//
// Each of these is a separate top-level function so V8 compiles it with its
// own inline-cache feedback. Because each function is only ever called with
// equations of a single concrete shape, the `eq.computeB` / `eq.addToWlambda`
// / field-access sites inside stay monomorphic, and V8 can inline the shape
// override. A single generic helper called for every shape would share one bytecode
// with megamorphic ICs — which is what we started with.
//
// The bodies are intentionally identical across shapes. Don't try to DRY them
// by factoring into a generic helper; that defeats the whole point.

function setupPlanar2DBatch(
  eqs: readonly PlanarEquation2D[],
  h: number,
  Bs: Float32Array,
  invCs: Float32Array,
  ws: SolverWorkspace,
): void {
  for (let i = 0; i < eqs.length; i++) {
    const eq = eqs[i];
    if (!eq.enabled) continue;
    if (eq.timeStep !== h || eq.needsUpdate) {
      eq.timeStep = h;
      eq.update();
    }
    const slot = eq[EQ_SLOT];
    Bs[slot] = eq.computeB(eq.a, eq.b, h, ws);
    invCs[slot] = eq.computeInvC(eq.epsilon, ws);
  }
}

function setupAngular2DBatch(
  eqs: readonly AngularEquation2D[],
  h: number,
  Bs: Float32Array,
  invCs: Float32Array,
  ws: SolverWorkspace,
): void {
  for (let i = 0; i < eqs.length; i++) {
    const eq = eqs[i];
    if (!eq.enabled) continue;
    if (eq.timeStep !== h || eq.needsUpdate) {
      eq.timeStep = h;
      eq.update();
    }
    const slot = eq[EQ_SLOT];
    Bs[slot] = eq.computeB(eq.a, eq.b, h, ws);
    invCs[slot] = eq.computeInvC(eq.epsilon, ws);
  }
}

function setupGeneralBatch(
  eqs: readonly Equation[],
  h: number,
  Bs: Float32Array,
  invCs: Float32Array,
  ws: SolverWorkspace,
): void {
  for (let i = 0; i < eqs.length; i++) {
    const eq = eqs[i];
    if (!eq.enabled) continue;
    if (eq.timeStep !== h || eq.needsUpdate) {
      eq.timeStep = h;
      eq.update();
    }
    const slot = eq[EQ_SLOT];
    Bs[slot] = eq.computeB(eq.a, eq.b, h, ws);
    invCs[slot] = eq.computeInvC(eq.epsilon, ws);
  }
}

function warmStartPlanar2DBatch(
  eqs: readonly PlanarEquation2D[],
  h: number,
  lambda: Float32Array,
  ws: SolverWorkspace,
): void {
  for (let i = 0; i < eqs.length; i++) {
    const eq = eqs[i];
    if (!eq.enabled) continue;
    let warm = eq.warmLambda;
    if (warm === 0 || !isFinite(warm)) continue;
    const minFDt = eq.minForce * h;
    const maxFDt = eq.maxForce * h;
    if (warm < minFDt) warm = minFDt;
    else if (warm > maxFDt) warm = maxFDt;
    lambda[eq[EQ_SLOT]] = warm;
    eq.addToWlambda(warm, ws);
  }
}

function warmStartAngular2DBatch(
  eqs: readonly AngularEquation2D[],
  h: number,
  lambda: Float32Array,
  ws: SolverWorkspace,
): void {
  for (let i = 0; i < eqs.length; i++) {
    const eq = eqs[i];
    if (!eq.enabled) continue;
    let warm = eq.warmLambda;
    if (warm === 0 || !isFinite(warm)) continue;
    const minFDt = eq.minForce * h;
    const maxFDt = eq.maxForce * h;
    if (warm < minFDt) warm = minFDt;
    else if (warm > maxFDt) warm = maxFDt;
    lambda[eq[EQ_SLOT]] = warm;
    eq.addToWlambda(warm, ws);
  }
}

function warmStartGeneralBatch(
  eqs: readonly Equation[],
  h: number,
  lambda: Float32Array,
  ws: SolverWorkspace,
): void {
  for (let i = 0; i < eqs.length; i++) {
    const eq = eqs[i];
    if (!eq.enabled) continue;
    let warm = eq.warmLambda;
    if (warm === 0 || !isFinite(warm)) continue;
    const minFDt = eq.minForce * h;
    const maxFDt = eq.maxForce * h;
    if (warm < minFDt) warm = minFDt;
    else if (warm > maxFDt) warm = maxFDt;
    lambda[eq[EQ_SLOT]] = warm;
    eq.addToWlambda(warm, ws);
  }
}

function finalizePlanar2DBatch(
  eqs: readonly PlanarEquation2D[],
  lambda: Float32Array,
  invDt: number,
): void {
  for (let i = 0; i < eqs.length; i++) {
    const eq = eqs[i];
    if (!eq.enabled) continue;
    const slot = eq[EQ_SLOT];
    const l = lambda[slot];
    eq.warmLambda = isFinite(l) ? l : 0;
    eq.multiplier = isFinite(l) ? l * invDt : 0;
  }
}

function finalizeAngular2DBatch(
  eqs: readonly AngularEquation2D[],
  lambda: Float32Array,
  invDt: number,
): void {
  for (let i = 0; i < eqs.length; i++) {
    const eq = eqs[i];
    if (!eq.enabled) continue;
    const slot = eq[EQ_SLOT];
    const l = lambda[slot];
    eq.warmLambda = isFinite(l) ? l : 0;
    eq.multiplier = isFinite(l) ? l * invDt : 0;
  }
}

function finalizeGeneralBatch(
  eqs: readonly Equation[],
  lambda: Float32Array,
  invDt: number,
): void {
  for (let i = 0; i < eqs.length; i++) {
    const eq = eqs[i];
    if (!eq.enabled) continue;
    const slot = eq[EQ_SLOT];
    const l = lambda[slot];
    eq.warmLambda = isFinite(l) ? l : 0;
    eq.multiplier = isFinite(l) ? l * invDt : 0;
  }
}

/** Sets the .multiplier property of each enabled equation from lambda values. */
function updateMultipliers(
  equations: readonly Equation[],
  lambda: ArrayLike<number>,
  invDt: number,
): void {
  for (let i = equations.length - 1; i >= 0; i--) {
    const eq = equations[i];
    if (eq.enabled) eq.multiplier = lambda[eq[EQ_SLOT]] * invDt;
  }
}

/**
 * Runs one iteration over all equations in the workspace's partitioned
 * groups. Each group is handled by a specialized batch function whose inner
 * loop is monomorphic — so V8 can inline the hot math and avoid virtual
 * dispatch through `Equation.computeGWlambda` / `addToWlambda`.
 *
 * Group execution order is fixed. Within each group, equations are iterated
 * in the order they were inserted during prepareSolverStep (which is the
 * caller's sort order). This is a slight ordering change from the old
 * fully-flat-list behavior when mixed equation types had interleaved
 * solverOrder values; in practice it is fine for chain-like structures and
 * often better, since related equations of the same type stay adjacent.
 *
 * Each batch is only called when its group is non-empty. Timings are
 * reported via `profiler.recordElapsed` with the equation count as the
 * "work unit" — so the profiler's `calls/frame` for each batch label is
 * the total equations solved that frame (per-call count × iterations ×
 * substeps), and `ms/frame ÷ calls/frame` yields the per-equation cost.
 */
function runIteration(
  Bs: Float32Array,
  invCs: Float32Array,
  lambda: Float32Array,
  useZeroRHS: boolean,
  h: number,
  workspace: SolverWorkspace,
): number {
  let deltaTot = 0;

  if (workspace.pointToPoint2DEquations.length > 0) {
    const t0 = performance.now();
    deltaTot += iteratePointToPoint2DBatch(
      workspace.pointToPoint2DEquations,
      Bs,
      invCs,
      lambda,
      useZeroRHS,
      h,
      workspace,
    );
    profiler.recordElapsed(
      "pointToPoint2D",
      performance.now() - t0,
      workspace.pointToPoint2DEquations.length,
    );
  }

  if (workspace.pointToRigid2DEquations.length > 0) {
    const t0 = performance.now();
    deltaTot += iteratePointToRigid2DBatch(
      workspace.pointToRigid2DEquations,
      Bs,
      invCs,
      lambda,
      useZeroRHS,
      h,
      workspace,
    );
    profiler.recordElapsed(
      "pointToRigid2D",
      performance.now() - t0,
      workspace.pointToRigid2DEquations.length,
    );
  }

  if (workspace.planar2DEquations.length > 0) {
    const t0 = performance.now();
    deltaTot += iteratePlanar2DBatch(
      workspace.planar2DEquations,
      Bs,
      invCs,
      lambda,
      useZeroRHS,
      h,
      workspace,
    );
    profiler.recordElapsed(
      "planar2D",
      performance.now() - t0,
      workspace.planar2DEquations.length,
    );
  }

  if (workspace.angular2DEquations.length > 0) {
    const t0 = performance.now();
    deltaTot += iterateAngular2DBatch(
      workspace.angular2DEquations,
      Bs,
      invCs,
      lambda,
      useZeroRHS,
      h,
      workspace,
    );
    profiler.recordElapsed(
      "angular2D",
      performance.now() - t0,
      workspace.angular2DEquations.length,
    );
  }

  if (workspace.generalEquations.length > 0) {
    const t0 = performance.now();
    deltaTot += iterateGeneralBatch(
      workspace.generalEquations,
      Bs,
      invCs,
      lambda,
      useZeroRHS,
      h,
      workspace,
    );
    profiler.recordElapsed(
      "general",
      performance.now() - t0,
      workspace.generalEquations.length,
    );
  }

  return deltaTot;
}

/**
 * PGS iteration loop for equations that use the base Equation's general
 * 6-component Jacobian. Inlines computeGWlambda and addToWlambda so the call
 * site is monomorphic and V8 can keep the math in one function.
 */
function iterateGeneralBatch(
  equations: readonly Equation[],
  Bs: Float32Array,
  invCs: Float32Array,
  lambda: Float32Array,
  useZeroRHS: boolean,
  dt: number,
  ws: SolverWorkspace,
): number {
  const vl = ws.vlambda;
  const wl = ws.wlambda;
  const invMassSolve = ws.invMassSolve;
  const invInertiaSolve = ws.invInertiaSolve;

  let deltaTot = 0;
  const N = equations.length;

  for (let k = 0; k < N; k++) {
    const eq = equations[k];
    if (!eq.enabled) continue;

    const slot = eq[EQ_SLOT];
    const G = eq.G;
    const idxA = eq[EQ_INDEX_A];
    const idxB = eq[EQ_INDEX_B];
    const iA = idxA * 2;
    const iB = idxB * 2;

    // Inlined computeGWlambda: G · v_lambda (6 components)
    const GWlambda =
      G[0] * vl[iA] +
      G[1] * vl[iA + 1] +
      G[2] * wl[idxA] +
      G[3] * vl[iB] +
      G[4] * vl[iB + 1] +
      G[5] * wl[idxB];

    const B = useZeroRHS ? 0 : Bs[slot];
    const invC = invCs[slot];
    const lambdaj = lambda[slot];
    const eps = eq.epsilon;

    let dl = invC * (B - GWlambda - eps * lambdaj);
    if (!isFinite(dl)) dl = 0;

    // Clamp the new total lambda into [minForce*dt, maxForce*dt]
    const minFDt = eq.minForce * dt;
    const maxFDt = eq.maxForce * dt;
    const newTotal = lambdaj + dl;
    if (newTotal < minFDt) dl = minFDt - lambdaj;
    else if (newTotal > maxFDt) dl = maxFDt - lambdaj;

    lambda[slot] = lambdaj + dl;

    // Inlined addToWlambda
    const iMA = invMassSolve[idxA];
    const iMB = invMassSolve[idxB];

    // Body A
    vl[iA] += iMA * G[0] * dl;
    vl[iA + 1] += iMA * G[1] * dl;
    wl[idxA] += invInertiaSolve[idxA] * (G[2] * dl);

    // Body B
    vl[iB] += iMB * G[3] * dl;
    vl[iB + 1] += iMB * G[4] * dl;
    wl[idxB] += invInertiaSolve[idxB] * (G[5] * dl);

    deltaTot += dl >= 0 ? dl : -dl;
  }

  return deltaTot;
}

/**
 * Specialized PGS iteration loop for `PlanarEquation2D` — rigid-rigid
 * constraints whose Jacobian is `(linX, linY, angAz, angBz)`. The linear
 * direction is shared between the bodies (negated for body A), so it is read
 * from two named fields instead of four `G` slots, and the relative
 * `vlambda` is formed before multiplying.
 *
 * This is the hot loop: every contact and friction equation lands here.
 */
function iteratePlanar2DBatch(
  equations: readonly PlanarEquation2D[],
  Bs: Float32Array,
  invCs: Float32Array,
  lambda: Float32Array,
  useZeroRHS: boolean,
  dt: number,
  ws: SolverWorkspace,
): number {
  const vl = ws.vlambda;
  const wl = ws.wlambda;
  const invMassSolve = ws.invMassSolve;
  const invInertiaSolve = ws.invInertiaSolve;

  let deltaTot = 0;
  const N = equations.length;

  for (let k = 0; k < N; k++) {
    const eq = equations[k];
    if (!eq.enabled) continue;

    const slot = eq[EQ_SLOT];
    const idxA = eq[EQ_INDEX_A];
    const idxB = eq[EQ_INDEX_B];
    const iA = idxA * 2;
    const iB = idxB * 2;

    const linX = eq.linX;
    const linY = eq.linY;
    const angAz = eq.angAz;
    const angBz = eq.angBz;

    // GWlambda = lin · (vlB - vlA) + angAz * wlA + angBz * wlB
    const GWlambda =
      linX * (vl[iB] - vl[iA]) +
      linY * (vl[iB + 1] - vl[iA + 1]) +
      angAz * wl[idxA] +
      angBz * wl[idxB];

    const B = useZeroRHS ? 0 : Bs[slot];
    const invC = invCs[slot];
    const lambdaj = lambda[slot];
    const eps = eq.epsilon;

    let dl = invC * (B - GWlambda - eps * lambdaj);
    if (!isFinite(dl)) dl = 0;

    const minFDt = eq.minForce * dt;
    const maxFDt = eq.maxForce * dt;
    const newTotal = lambdaj + dl;
    if (newTotal < minFDt) dl = minFDt - lambdaj;
    else if (newTotal > maxFDt) dl = maxFDt - lambdaj;

    lambda[slot] = lambdaj + dl;

    const iMA = invMassSolve[idxA];
    const iMB = invMassSolve[idxB];

    // Body A linear (-lin); body B linear (+lin)
    vl[iA] -= iMA * linX * dl;
    vl[iA + 1] -= iMA * linY * dl;
    vl[iB] += iMB * linX * dl;
    vl[iB + 1] += iMB * linY * dl;

    // Angular impulse: wl += invI * (ang * dl)
    wl[idxA] += invInertiaSolve[idxA] * (angAz * dl);
    wl[idxB] += invInertiaSolve[idxB] * (angBz * dl);

    deltaTot += dl >= 0 ? dl : -dl;
  }

  return deltaTot;
}

/**
 * Specialized PGS iteration loop for `AngularEquation2D` — pure rotational
 * constraints (angle locks, motors). Calls the subclass's specialized
 * `computeGWlambda` / `addToWlambda` methods, which are monomorphic here
 * (only `AngularEquation2D` lives in this group) so V8 inlines them. Low
 * volume, so the method-call form is kept for clarity.
 */
function iterateAngular2DBatch(
  equations: readonly AngularEquation2D[],
  Bs: Float32Array,
  invCs: Float32Array,
  lambda: Float32Array,
  useZeroRHS: boolean,
  dt: number,
  ws: SolverWorkspace,
): number {
  let deltaTot = 0;
  const N = equations.length;

  for (let k = 0; k < N; k++) {
    const eq = equations[k];
    if (!eq.enabled) continue;

    const slot = eq[EQ_SLOT];
    const B = useZeroRHS ? 0 : Bs[slot];
    const invC = invCs[slot];
    const lambdaj = lambda[slot];
    const GWlambda = eq.computeGWlambda(ws);

    let dl = invC * (B - GWlambda - eq.epsilon * lambdaj);
    if (!isFinite(dl)) dl = 0;

    const minFDt = eq.minForce * dt;
    const maxFDt = eq.maxForce * dt;
    const newTotal = lambdaj + dl;
    if (newTotal < minFDt) dl = minFDt - lambdaj;
    else if (newTotal > maxFDt) dl = maxFDt - lambdaj;

    lambda[slot] = lambdaj + dl;
    eq.addToWlambda(dl, ws);

    deltaTot += dl >= 0 ? dl : -dl;
  }

  return deltaTot;
}

/** Updates friction equation bounds based on contact equation multipliers. */
function updateFrictionBounds(equations: readonly Equation[]): void {
  for (const eq of equations) {
    if (!eq.enabled) continue;
    if (eq instanceof FrictionEquation) {
      let f = 0.0;
      for (let k = 0; k < eq.contactEquations.length; k++) {
        f += eq.contactEquations[k].multiplier;
      }
      f *= eq.frictionCoefficient / eq.contactEquations.length;
      eq.maxForce = f;
      eq.minForce = -f;
    }
  }
}

function setupPointToPoint2DBatch(
  eqs: readonly PointToPointEquation2D[],
  h: number,
  Bs: Float32Array,
  invCs: Float32Array,
  ws: SolverWorkspace,
): void {
  for (let i = 0; i < eqs.length; i++) {
    const eq = eqs[i];
    if (!eq.enabled) continue;
    if (eq.timeStep !== h || eq.needsUpdate) {
      eq.timeStep = h;
      eq.update();
    }
    const slot = eq[EQ_SLOT];
    Bs[slot] = eq.computeB(eq.a, eq.b, h, ws);
    invCs[slot] = eq.computeInvC(eq.epsilon, ws);
  }
}

function setupPointToRigid2DBatch(
  eqs: readonly PointToRigidEquation2D[],
  h: number,
  Bs: Float32Array,
  invCs: Float32Array,
  ws: SolverWorkspace,
): void {
  for (let i = 0; i < eqs.length; i++) {
    const eq = eqs[i];
    if (!eq.enabled) continue;
    if (eq.timeStep !== h || eq.needsUpdate) {
      eq.timeStep = h;
      eq.update();
    }
    const slot = eq[EQ_SLOT];
    Bs[slot] = eq.computeB(eq.a, eq.b, h, ws);
    invCs[slot] = eq.computeInvC(eq.epsilon, ws);
  }
}

function warmStartPointToPoint2DBatch(
  eqs: readonly PointToPointEquation2D[],
  h: number,
  lambda: Float32Array,
  ws: SolverWorkspace,
): void {
  for (let i = 0; i < eqs.length; i++) {
    const eq = eqs[i];
    if (!eq.enabled) continue;
    let warm = eq.warmLambda;
    if (warm === 0 || !isFinite(warm)) continue;
    const minFDt = eq.minForce * h;
    const maxFDt = eq.maxForce * h;
    if (warm < minFDt) warm = minFDt;
    else if (warm > maxFDt) warm = maxFDt;
    lambda[eq[EQ_SLOT]] = warm;
    eq.addToWlambda(warm, ws);
  }
}

function warmStartPointToRigid2DBatch(
  eqs: readonly PointToRigidEquation2D[],
  h: number,
  lambda: Float32Array,
  ws: SolverWorkspace,
): void {
  for (let i = 0; i < eqs.length; i++) {
    const eq = eqs[i];
    if (!eq.enabled) continue;
    let warm = eq.warmLambda;
    if (warm === 0 || !isFinite(warm)) continue;
    const minFDt = eq.minForce * h;
    const maxFDt = eq.maxForce * h;
    if (warm < minFDt) warm = minFDt;
    else if (warm > maxFDt) warm = maxFDt;
    lambda[eq[EQ_SLOT]] = warm;
    eq.addToWlambda(warm, ws);
  }
}

function finalizePointToPoint2DBatch(
  eqs: readonly PointToPointEquation2D[],
  lambda: Float32Array,
  invDt: number,
): void {
  for (let i = 0; i < eqs.length; i++) {
    const eq = eqs[i];
    if (!eq.enabled) continue;
    const slot = eq[EQ_SLOT];
    const l = lambda[slot];
    eq.warmLambda = isFinite(l) ? l : 0;
    eq.multiplier = isFinite(l) ? l * invDt : 0;
  }
}

function finalizePointToRigid2DBatch(
  eqs: readonly PointToRigidEquation2D[],
  lambda: Float32Array,
  invDt: number,
): void {
  for (let i = 0; i < eqs.length; i++) {
    const eq = eqs[i];
    if (!eq.enabled) continue;
    const slot = eq[EQ_SLOT];
    const l = lambda[slot];
    eq.warmLambda = isFinite(l) ? l : 0;
    eq.multiplier = isFinite(l) ? l * invDt : 0;
  }
}

/**
 * Specialized PGS iteration loop for `PointToPointEquation2D` — constraints
 * where both bodies are particles. Reads `(nx, ny)` directly and touches only
 * `vlambda` + `invMassSolve`. No `wlambda` or `invInertiaSolve`.
 *
 * Per-equation op count vs. the general batch:
 *  - computeGWlambda: 2 mul-adds instead of 6
 *  - addToWlambda: 4 linear writes, zero angular work
 */
function iteratePointToPoint2DBatch(
  equations: readonly PointToPointEquation2D[],
  Bs: Float32Array,
  invCs: Float32Array,
  lambda: Float32Array,
  useZeroRHS: boolean,
  dt: number,
  ws: SolverWorkspace,
): number {
  const vl = ws.vlambda;
  const invMassSolve = ws.invMassSolve;

  let deltaTot = 0;
  const N = equations.length;

  for (let k = 0; k < N; k++) {
    const eq = equations[k];
    if (!eq.enabled) continue;

    const slot = eq[EQ_SLOT];
    const idxA = eq[EQ_INDEX_A];
    const idxB = eq[EQ_INDEX_B];
    const iA = idxA * 2;
    const iB = idxB * 2;

    const nx = eq.nx;
    const ny = eq.ny;

    const GWlambda = nx * (vl[iB] - vl[iA]) + ny * (vl[iB + 1] - vl[iA + 1]);

    const B = useZeroRHS ? 0 : Bs[slot];
    const invC = invCs[slot];
    const lambdaj = lambda[slot];
    const eps = eq.epsilon;

    let dl = invC * (B - GWlambda - eps * lambdaj);
    if (!isFinite(dl)) dl = 0;

    const minFDt = eq.minForce * dt;
    const maxFDt = eq.maxForce * dt;
    const newTotal = lambdaj + dl;
    if (newTotal < minFDt) dl = minFDt - lambdaj;
    else if (newTotal > maxFDt) dl = maxFDt - lambdaj;

    lambda[slot] = lambdaj + dl;

    const iMA = invMassSolve[idxA];
    const iMB = invMassSolve[idxB];

    vl[iA] -= iMA * nx * dl;
    vl[iA + 1] -= iMA * ny * dl;
    vl[iB] += iMB * nx * dl;
    vl[iB + 1] += iMB * ny * dl;

    deltaTot += dl >= 0 ? dl : -dl;
  }

  return deltaTot;
}

/**
 * Specialized PGS iteration loop for `PointToRigidEquation2D` — constraints
 * where body A is a particle (no angular) and body B is a rigid body (linear
 * + scalar angular). Reads `(nx, ny)` and `rjCrossN` directly and never
 * touches body A's angular accumulator.
 *
 * Per-equation op count vs. the general batch:
 *  - computeGWlambda: 3 mul-adds instead of 6
 *  - addToWlambda: skips body-A angular work
 */
function iteratePointToRigid2DBatch(
  equations: readonly PointToRigidEquation2D[],
  Bs: Float32Array,
  invCs: Float32Array,
  lambda: Float32Array,
  useZeroRHS: boolean,
  dt: number,
  ws: SolverWorkspace,
): number {
  const vl = ws.vlambda;
  const wl = ws.wlambda;
  const invMassSolve = ws.invMassSolve;
  const invInertiaSolve = ws.invInertiaSolve;

  let deltaTot = 0;
  const N = equations.length;

  for (let k = 0; k < N; k++) {
    const eq = equations[k];
    if (!eq.enabled) continue;

    const slot = eq[EQ_SLOT];
    const idxA = eq[EQ_INDEX_A];
    const idxB = eq[EQ_INDEX_B];
    const iA = idxA * 2;
    const iB = idxB * 2;

    const nx = eq.nx;
    const ny = eq.ny;
    const rjCrossN = eq.rjCrossN;

    const GWlambda =
      nx * (vl[iB] - vl[iA]) +
      ny * (vl[iB + 1] - vl[iA + 1]) +
      rjCrossN * wl[idxB];

    const B = useZeroRHS ? 0 : Bs[slot];
    const invC = invCs[slot];
    const lambdaj = lambda[slot];
    const eps = eq.epsilon;

    let dl = invC * (B - GWlambda - eps * lambdaj);
    if (!isFinite(dl)) dl = 0;

    const minFDt = eq.minForce * dt;
    const maxFDt = eq.maxForce * dt;
    const newTotal = lambdaj + dl;
    if (newTotal < minFDt) dl = minFDt - lambdaj;
    else if (newTotal > maxFDt) dl = maxFDt - lambdaj;

    lambda[slot] = lambdaj + dl;

    const iMA = invMassSolve[idxA];
    const iMB = invMassSolve[idxB];

    // Body A linear (-n); body B linear (+n)
    vl[iA] -= iMA * nx * dl;
    vl[iA + 1] -= iMA * ny * dl;
    vl[iB] += iMB * nx * dl;
    vl[iB + 1] += iMB * ny * dl;

    // Body B angular: wl += invI * (rjCrossN * dl)
    wl[idxB] += invInertiaSolve[idxB] * (rjCrossN * dl);

    deltaTot += dl >= 0 ? dl : -dl;
  }

  return deltaTot;
}
