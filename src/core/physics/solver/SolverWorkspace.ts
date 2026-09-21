/**
 * Solver scratch state for a single `solveEquations` call.
 *
 * Replaces the previous `Map<Body, SolverBodyState>` approach with an
 * index-based Structure-of-Arrays layout. Bodies receive a stable integer
 * index for the duration of one solve; all per-body solver state lives in
 * flat Float64Arrays owned by this workspace.
 *
 * ## Why
 *
 * The old Map-based design allocated a Map, per-body state objects, and
 * per-body Float64Arrays on every solve (8x per physics step with substeps),
 * and the hot iteration loop did 2-4 Map lookups per equation per iteration.
 * Profiling showed `Solver.iterate` at ~5ms per step, dominated by the Map
 * traffic rather than the actual constraint math.
 *
 * This workspace is constructed once, owned by `World`, and reused across
 * every solve. The backing arrays grow geometrically on demand and then
 * stabilize; after the first few frames, a solve performs zero allocations
 * outside the index-assignment Map (which is cleared between calls).
 *
 * ## Separation of concerns
 *
 * `Body` remains unaware of the solver. Equations accept
 * a `SolverWorkspace` as an opaque handle — they know the workspace exposes
 * `vlambda`, `wlambda`, `invMassSolve`, etc. by index, but not how that
 * storage is organized. A different solver could supply its own workspace.
 */

import type { Body } from "../body/Body";
import type { AngularEquation2D } from "../equations/AngularEquation2D";
import type { Equation } from "../equations/Equation";
import type { PlanarEquation2D } from "../equations/PlanarEquation2D";
import type { PointToPointEquation2D } from "../equations/PointToPointEquation2D";
import type { PointToRigidEquation2D } from "../equations/PointToRigidEquation2D";

export class SolverWorkspace {
  /** Number of bodies currently registered in this solve. */
  bodyCount: number = 0;

  /** Backing capacity for per-body arrays. Grows geometrically. */
  private bodyCapacity: number = 0;

  /**
   * Linear constraint-velocity accumulator, 2 floats per body: [vx, vy].
   * Body `i` lives at `vlambda[i * 2]` and `vlambda[i * 2 + 1]`.
   */
  vlambda: Float64Array = new Float64Array(0);

  /** Angular constraint-velocity accumulator, 1 float per body: `wlambda[i]`. */
  wlambda: Float64Array = new Float64Array(0);

  /** Inverse mass, per body. Zero for sleeping/static/kinematic bodies. */
  invMassSolve: Float64Array = new Float64Array(0);

  /**
   * Scalar inverse moment of inertia, per body. Zero for point masses and
   * sleeping/static/kinematic bodies.
   */
  invInertiaSolve: Float64Array = new Float64Array(0);

  /**
   * Dynamic bodies that should receive their accumulated vlambda/wlambda on
   * finalize. Populated in the order they are registered. Parallel to
   * `dynamicBodyIndices`.
   */
  dynamicBodies: Body[] = [];

  /** Workspace index for each entry in `dynamicBodies`. */
  dynamicBodyIndices: number[] = [];

  /** Per-equation impulse accumulator. Length = current equation count. */
  lambda: Float32Array = new Float32Array(0);

  /** Per-equation right-hand side. Length = current equation count. */
  Bs: Float32Array = new Float32Array(0);

  /** Per-equation inverse effective mass. Length = current equation count. */
  invCs: Float32Array = new Float32Array(0);

  /** Backing capacity for per-equation arrays. Grows geometrically. */
  private eqCapacity: number = 0;

  /**
   * Equations partitioned by which specialized batch iterator handles them.
   * Populated by prepareSolverStep; the hot solver loop iterates each group
   * with a monomorphic, inlined function (no virtual dispatch).
   *
   * Each group corresponds to a Jacobian "shape" — which components of `G`
   * are structurally non-zero. See the equation class docs for the exact
   * shape and the `CLAUDE.md` next to the physics sources for the full
   * taxonomy:
   *
   *  - `pointToPoint2DEquations` — both bodies linear only (particle links)
   *  - `pointToRigid2DEquations` — body A linear only, body B linear + angular
   *  - `planar2DEquations` — rigid-rigid, shared linear direction + angular
   *    term per body (contacts, friction, distance)
   *  - `angular2DEquations` — pure rotational (angle locks, motors)
   *  - `generalEquations` — fully general 6-component Jacobian (anything
   *    that doesn't fit a specialized shape)
   */
  generalEquations: Equation[] = [];
  pointToPoint2DEquations: PointToPointEquation2D[] = [];
  pointToRigid2DEquations: PointToRigidEquation2D[] = [];
  planar2DEquations: PlanarEquation2D[] = [];
  angular2DEquations: AngularEquation2D[] = [];

  /**
   * Body -> index map. Only touched during the setup phase of a solve (never
   * by the hot iteration loop). Cleared in `reset()`.
   */
  private bodyToIndex: Map<Body, number> = new Map();

  /**
   * Fully clear per-step state. Drops the index assignment, registered
   * dynamic bodies, and zeroes the accumulators. Call when starting a fresh
   * solve that isn't reusing prepared indices (e.g. between islands, or at
   * the start of a new step when using `prepareSolverStep`).
   */
  reset(): void {
    this.resetAccumulators();
    this.bodyCount = 0;
    this.bodyToIndex.clear();
    this.dynamicBodies.length = 0;
    this.dynamicBodyIndices.length = 0;
    this.generalEquations.length = 0;
    this.pointToPoint2DEquations.length = 0;
    this.pointToRigid2DEquations.length = 0;
    this.planar2DEquations.length = 0;
    this.angular2DEquations.length = 0;
  }

  /**
   * Zero the solver accumulators (vlambda, wlambda, lambda) without touching
   * the body index assignment. Call this between substeps when the indices
   * are being reused — it's significantly cheaper than a full `reset()`
   * because it skips the Map clear and dynamic-body list churn.
   */
  resetAccumulators(): void {
    // Only clear the live region; the tail may hold stale values from a
    // larger previous solve but is never read.
    if (this.bodyCount > 0) {
      this.vlambda.fill(0, 0, this.bodyCount * 2);
      this.wlambda.fill(0, 0, this.bodyCount);
    }
  }

  /** Ensure per-body arrays can hold at least `needed` bodies. */
  ensureBodyCapacity(needed: number): void {
    if (needed <= this.bodyCapacity) return;
    const newCap = Math.max(needed, this.bodyCapacity * 2, 16);
    const newVl = new Float64Array(newCap * 2);
    const newWl = new Float64Array(newCap);
    const newInvM = new Float64Array(newCap);
    const newInvI = new Float64Array(newCap);
    // Copy live region (reset() will zero it next solve, but be safe mid-solve
    // if we ever grow during a single call).
    newVl.set(this.vlambda);
    newWl.set(this.wlambda);
    newInvM.set(this.invMassSolve);
    newInvI.set(this.invInertiaSolve);
    this.vlambda = newVl;
    this.wlambda = newWl;
    this.invMassSolve = newInvM;
    this.invInertiaSolve = newInvI;
    this.bodyCapacity = newCap;
  }

  /** Ensure per-equation arrays can hold at least `needed` equations. */
  ensureEqCapacity(needed: number): void {
    if (needed <= this.eqCapacity) return;
    const newCap = Math.max(needed, this.eqCapacity * 2, 64);
    this.lambda = new Float32Array(newCap);
    this.Bs = new Float32Array(newCap);
    this.invCs = new Float32Array(newCap);
    this.eqCapacity = newCap;
  }

  /**
   * Look up or assign an index for this body. Defaults to treating the body
   * as non-sleeping, which is correct for static/kinematic bodies pulled in
   * via equations (their invMass is naturally 0).
   *
   * Dynamic bodies should be registered via `registerDynamic()` instead so
   * the finalize pass knows about them.
   */
  indexOf(body: Body): number {
    const existing = this.bodyToIndex.get(body);
    if (existing !== undefined) return existing;
    return this.assign(body, false);
  }

  /**
   * Register a dynamic body. Sets invMass/invInertia from the body (or to
   * zero if sleeping) and records it for the finalize pass.
   */
  registerDynamic(body: Body): number {
    const existing = this.bodyToIndex.get(body);
    if (existing !== undefined) return existing;
    const idx = this.assign(body, body.isSleeping());
    this.dynamicBodies.push(body);
    this.dynamicBodyIndices.push(idx);
    return idx;
  }

  /** @internal */
  private assign(body: Body, isSleeping: boolean): number {
    const idx = this.bodyCount++;
    this.ensureBodyCapacity(this.bodyCount);
    // Freshly-grown vlambda/wlambda slots are already zero (new Float64Array).
    if (isSleeping) {
      this.invMassSolve[idx] = 0;
      this.invInertiaSolve[idx] = 0;
    } else {
      this.invMassSolve[idx] = body.invMass;
      this.invInertiaSolve[idx] = body.invInertia;
    }
    this.bodyToIndex.set(body, idx);
    return idx;
  }
}
