import { profile, profiler } from "../../util/Profiler";
import { CompatibleVector } from "../../Vector";
import { SleepState } from "../body/Body";
import { assertAllBodiesFinite } from "../body/assertBodyFinite";
import { Broadphase } from "../collision/broadphase/Broadphase";
import { SpatialHashingBroadphase } from "../collision/broadphase/SpatialHashingBroadphase";
import {
  Collision,
  getContactsFromPairs,
  SensorOverlap,
} from "../collision/narrowphase/getContactsFromCollisionPairs";
import { raycast, raycastAll } from "../collision/raycast/Raycast";
import { RaycastHit, RaycastOptions } from "../collision/raycast/RaycastHit";
import { generateContactEquationsForCollision } from "../collision/response/ContactGenerator";
import { generateFrictionEquationsForCollision } from "../collision/response/FrictionGenerator";
import { ContactEquation } from "../equations/ContactEquation";
import { FrictionEquation } from "../equations/FrictionEquation";
import { EventEmitter } from "../events/EventEmitter";
import { PhysicsEventMap } from "../events/PhysicsEvents";
import {
  DEFAULT_SOLVER_CONFIG,
  prepareSolverStep,
  solveIsland,
  solveSubstep,
  type SolverConfig,
} from "../solver/GSSolver";
import { SolverWorkspace } from "../solver/SolverWorkspace";
import type { Equation } from "../equations/Equation";
import type { Spring } from "../springs/Spring";
import { BodyManager } from "./BodyManager";
import { ConstraintManager } from "./ConstraintManager";
import { ContactMaterialManager } from "./ContactMaterialManager";
import { splitIntoIslands, type Island } from "./Island";
import {
  bodyKey,
  OverlapKeeper,
  type OverlapChanges,
  type ShapeOverlap,
} from "./OverlapKeeper";

/** Options for creating a World. */
export interface WorldOptions {
  /** Configuration for the constraint solver (iterations, tolerance). */
  solverConfig?: Partial<SolverConfig>;
  /** Broadphase algorithm for collision culling. Defaults to SpatialHashingBroadphase. */
  broadphase?: Broadphase;
  /** Enable island splitting for more efficient solving and sleeping. */
  islandSplit?: boolean;
  /**
   * Number of constraint-solve substeps per `step()` call. Broadphase,
   * narrowphase, and contact/friction equation generation run once per step;
   * constraint resolution and position integration run `substeps` times with
   * `dt / substeps`. Higher values stiffen constraints (especially useful for
   * long rope/chain assemblies) at the cost of linear solver work. Defaults
   * to `1` (legacy behavior). Clamped to `>= 1`.
   */
  substeps?: number;
}

/** Controls how bodies are allowed to sleep. */
export enum SleepMode {
  /** Bodies never sleep. */
  NO_SLEEPING = 1,
  /** Individual bodies sleep when idle. */
  BODY_SLEEPING = 2,
  /** Connected body groups (islands) sleep together. Requires islandSplit=true. */
  ISLAND_SLEEPING = 4,
}

/**
 * The physics simulation world. Contains all bodies, constraints, springs, and handles stepping.
 *
 * @example
 * ```ts
 * const world = new World({ islandSplit: true });
 * world.bodies.add(createRigid2D({ motion: "dynamic", mass: 1 }));
 * world.step(1/60);
 * ```
 */
export class World extends EventEmitter<PhysicsEventMap> {
  /** Manages all bodies in the simulation. */
  bodies: BodyManager;
  /** Manages all constraints between bodies. */
  constraints: ConstraintManager;
  /** Manages friction/restitution properties between material pairs. */
  contactMaterials: ContactMaterialManager;
  /** All springs in the simulation. */
  springs: Set<Spring>;
  /** Configuration for the Gauss-Seidel constraint solver. */
  solverConfig: SolverConfig;
  /** Broadphase algorithm used for collision culling. */
  broadphase: Broadphase;
  /** Total simulated time in seconds. */
  time: number = 0.0;
  /** True while step() is executing. */
  stepping: boolean = false;
  /** Whether to split bodies into islands for solving. */
  islandSplit: boolean;
  /** Number of constraint-solve substeps per step(). See WorldOptions.substeps. */
  substeps: number;
  /** Whether to emit "impact" events on first contact. */
  emitImpactEvent: boolean = true;
  /** When true, multiple contacts between shapes produce one averaged friction equation instead of many. */
  frictionReduction: boolean = true;
  /** @internal */
  _constraintIdCounter: number = 0;
  /** @internal */
  _bodyIdCounter: number = 0;

  // Solver stats from the most recent step (for debug overlays)
  /** Total equations solved in the most recent step. */
  solverEquationCount: number = 0;
  /** Number of islands solved in the most recent step (0 if island splitting is off). */
  solverIslandCount: number = 0;
  /** Total solver iterations across all islands in the most recent step. */
  solverIterations: number = 0;
  /** Max iterations used by any single island (or the global solve) in the most recent step. */
  solverMaxIterations: number = 0;
  /** Controls body sleeping behavior. */
  sleepMode: SleepMode;
  /** Tracks shape overlaps for begin/end contact events. */
  overlapKeeper: OverlapKeeper;
  /** Solver scratch state, reused across every `step()` to avoid per-solve
   *  allocation. See {@link SolverWorkspace}. */
  private solverWorkspace: SolverWorkspace = new SolverWorkspace();

  /** Creates a new physics world. */
  constructor(options: WorldOptions = {}) {
    super();

    this.bodies = new BodyManager(this);
    this.constraints = new ConstraintManager();
    this.springs = new Set<Spring>();

    this.solverConfig = { ...DEFAULT_SOLVER_CONFIG, ...options.solverConfig };

    this.broadphase = options.broadphase ?? new SpatialHashingBroadphase();
    this.broadphase.setWorld(this);

    this.contactMaterials = new ContactMaterialManager();

    this.islandSplit = options.islandSplit ?? false;
    this.substeps = Math.max(1, Math.floor(options.substeps ?? 1));

    this.sleepMode = SleepMode.NO_SLEEPING;
    this.overlapKeeper = new OverlapKeeper();
  }

  /**
   * Step the simulation forward by dt seconds.
   *
   * ## Pipeline (executed in order)
   *
   * 1. **Apply forces** — Spring forces are computed and applied to bodies.
   *    6DOF bodies recompute their world-frame inertia tensor. Velocity
   *    damping is applied to all awake dynamic bodies.
   *
   * 2. **Broadphase** — The spatial hashing broadphase returns candidate
   *    collision pairs. Pairs disabled by constraints (e.g. bodies connected
   *    by a hinge with `collideConnected=false`) are filtered out.
   *    Emits: `postBroadphase` with the filtered pair list.
   *
   * 3. **Narrowphase** — Exact collision detection runs on candidate pairs,
   *    producing Collision objects (with contact points and normals) and
   *    SensorOverlap objects (for sensor/trigger shapes).
   *
   * 4. **Overlap tracking** — The OverlapKeeper diffs current overlaps
   *    against the previous frame to determine newly-begun and newly-ended
   *    contacts (for beginContact/endContact events).
   *
   * 5. **Contact equations** — ContactEquations are generated from
   *    collisions. These encode "don't penetrate" constraints with
   *    restitution from ContactMaterials. First-impact detection is set
   *    for newly overlapping body pairs.
   *
   * 6. **Friction equations** — FrictionEquations are generated alongside
   *    contacts. When frictionReduction is enabled, multiple contact points
   *    between the same shape pair produce a single averaged friction
   *    equation instead of one per contact.
   *
   * 7. **Collision wake-ups** — Sleeping bodies are flagged for wake-up if
   *    hit by a fast-moving awake body (speed >= 2x the sleep threshold).
   *
   * 8. **Events & wake** — `beginContact` and `endContact` events are
   *    emitted. Flagged bodies are woken. Then `preSolve` is emitted,
   *    giving listeners a chance to modify contact/friction equations
   *    (e.g. disable contacts, adjust friction coefficients).
   *
   * 9. **Solve constraints** — All equations (contacts + friction +
   *    constraint equations from joints/motors) are collected. If island
   *    splitting is enabled, bodies are partitioned into connected islands
   *    and each is solved independently (better cache performance and
   *    enables island sleeping). Otherwise all equations are solved as
   *    one system. Uses the Gauss-Seidel Sequential Impulse solver.
   *
   * 10. **Integrate** — Velocities (including solver impulses) are
   *     integrated to update positions and angles for all kinematic and
   *     awake dynamic bodies. Forces are zeroed after integration.
   *
   * 11. **Impact events** — `impact` events are emitted for first-time
   *     contacts (contacts between body pairs that were not overlapping
   *     in the previous frame). Only fires if emitImpactEvent is true.
   *
   * 12. **Sleep update** — Depending on sleepMode:
   *     - BODY_SLEEPING: each body independently tracks idle time and
   *       sleeps when below the speed threshold for long enough.
   *     - ISLAND_SLEEPING: bodies track idle time, but only sleep when
   *       *all* bodies in their island want to sleep (prevents one body
   *       in a stack from sleeping while others are active).
   *
   * Finally, `postStep` is emitted and `this.time` is advanced by dt.
   *
   * ## Substepping
   *
   * When `substeps > 1`, phases 1-8 and 11-12 still run exactly once per
   * `step()` call. Constraint resolution and position integration (the
   * "substep core") run `substeps` times with `h = dt / substeps`:
   *
   *   for s in 1..N:
   *     for c in constraints: c.update()   // refresh Jacobians
   *     solve(h, contacts, friction, constraints)
   *     integratePositions(h)
   *
   * This stiffens constraint enforcement without paying N× the collision
   * detection cost. Forces (entity-applied + spring + damping) are folded
   * into velocity once, up front — so entities continue to see their usual
   * single `onTick` force application per game tick.
   *
   * @param dt - Timestep in seconds (typically 1/60 or 1/120)
   */
  @profile
  step(dt: number): void {
    this.stepping = true;

    assertAllBodiesFinite(this.bodies.dynamicAwake, "at step() entry");

    // 1. Apply forces (springs, damping) — once per step
    this.applyForces(dt);
    assertAllBodiesFinite(this.bodies.dynamicAwake, "after applyForces");

    // 2. Broadphase - get potential collision pairs
    const pairsToCheck = this.doBroadphase();

    // 3. Narrowphase - get actual collisions
    const { collisions, sensorOverlaps } = profiler.measure(
      "World.narrowphase",
      () => getContactsFromPairs(pairsToCheck),
    );

    // 4. Update overlap tracking
    const overlapChanges = this.updateOverlapTracking(
      collisions,
      sensorOverlaps,
    );

    // 5. Build contact equations to resolve overlaps
    profiler.start("World.contactEquations");
    const collisionsWithContactEquations: [Collision, ContactEquation[]][] =
      collisions.map((collision) => [
        collision,
        generateContactEquationsForCollision(
          collision,
          this.contactMaterials.get(
            collision.shapeA.material,
            collision.shapeB.material,
          ),
          overlapChanges.newlyOverlappingBodies.has(
            bodyKey(collision.bodyA, collision.bodyB),
          ),
        ),
      ]);

    const contactEquations: ContactEquation[] =
      collisionsWithContactEquations.flatMap(
        ([, contactEquations]) => contactEquations,
      );
    profiler.end("World.contactEquations");

    // 6. Build friction equations and flatten all equations
    profiler.start("World.frictionEquations");
    const frictionEquations: FrictionEquation[] =
      collisionsWithContactEquations.flatMap(([collision, contactEquations]) =>
        generateFrictionEquationsForCollision(
          collision,
          contactEquations,
          this.contactMaterials.get(
            collision.shapeA.material,
            collision.shapeB.material,
          ),
          this.frictionReduction,
        ),
      );
    profiler.end("World.frictionEquations");

    // 7. Handle wake-ups for sleeping bodies
    this.handleCollisionWakeUps(collisions);

    // 8. Emit collision events (using overlapChanges from step 4)
    this.emitContactEvents(overlapChanges, collisionsWithContactEquations);
    this.emitPreSolveAndWakeUp(contactEquations, frictionEquations);

    // 9. Fold accumulated forces into velocity once, up front. This consumes
    //    and zeroes body.force, so the subsequent substep loop only advances
    //    positions from velocity (plus constraint impulses).
    this.integrateForcesToVelocity(dt);
    assertAllBodiesFinite(
      this.bodies.dynamicAwake,
      "after integrateForcesToVelocity",
    );

    // 10. Collect equations once per step (not per substep) and — for the
    //     non-island path — sort + assign workspace indices up front. The
    //     body/equation membership is stable across substeps thanks to
    //     deferred body removal, so this setup is all hoisted out of the
    //     inner loop.
    profiler.start("World.collectEquations");
    const allEquations: Equation[] = [
      ...contactEquations,
      ...frictionEquations,
      ...[...this.constraints].flatMap((c) => c.equations),
    ];
    if (!this.islandSplit && this.solverConfig.equationSortFunction) {
      // In-place sort — unlike toSorted this doesn't allocate a new array.
      allEquations.sort(this.solverConfig.equationSortFunction);
    }
    profiler.end("World.collectEquations");

    if (!this.islandSplit && allEquations.length > 0) {
      prepareSolverStep(
        allEquations,
        this.bodies.dynamicAwake,
        this.solverWorkspace,
      );
    }

    // 11. Substep loop: solve constraints + integrate positions with h = dt/N
    const N = this.substeps;
    const h = dt / N;
    let lastIslands: Island[] | undefined;
    let totalIter = 0;
    let maxIter = 0;
    let totalIslandCount = 0;
    for (let s = 0; s < N; s++) {
      // Refresh constraint Jacobians against current positions. (On the
      // first substep this matches legacy behavior where solve() called
      // c.update() once.)
      profiler.start("World.constraintUpdate");
      for (const [ctor, bucket] of this.constraints.byType) {
        if (bucket.length === 0) continue;
        const t0 = performance.now();
        for (let i = 0; i < bucket.length; i++) {
          bucket[i].update();
        }
        profiler.recordElapsed(
          ctor.name,
          performance.now() - t0,
          bucket.length,
        );
      }
      profiler.end("World.constraintUpdate");

      const result = this.solve(h, allEquations);
      lastIslands = result.islands;
      totalIter += result.usedIterations;
      if (result.maxIterations > maxIter) maxIter = result.maxIterations;
      totalIslandCount = result.islandCount;
      assertAllBodiesFinite(
        this.bodies.dynamicAwake,
        `after solve (substep ${s})`,
      );

      this.integratePositions(h);
      assertAllBodiesFinite(
        this.bodies.dynamicAwake,
        `after integratePositions (substep ${s})`,
      );
    }
    this.solverEquationCount = allEquations.length;
    this.solverIslandCount = totalIslandCount;
    this.solverIterations = totalIter;
    this.solverMaxIterations = maxIter;

    // 12. Emit impact events
    this.emitImpactEvents(contactEquations);

    // 13. Update sleeping
    this.updateSleeping(dt, lastIslands);

    this.time += dt;

    this.stepping = false;
    this.emit({ type: "postStep" });
  }

  @profile
  private applyForces(dt: number): void {
    // Add spring forces
    for (const spring of this.springs) {
      spring.applyForce();
    }

    // Apply damping and recompute world inertia for 6DOF bodies
    for (const body of this.bodies.dynamicAwake) {
      if (body.is6DOF) {
        body.recomputeWorldInertia();
      }
      body.applyDamping(dt);
    }
  }

  @profile
  private doBroadphase() {
    const possibleCollisions = this.broadphase.getCollisionPairs(this);

    // Use pre-computed disabled body keys from ConstraintManager
    const disabledBodyKeys = this.constraints.disabledBodyKeys;

    const filteredPossibleCollisions = possibleCollisions.filter(
      ([bodyA, bodyB]) => !disabledBodyKeys.has(bodyKey(bodyA, bodyB)),
    );

    this.emit({ type: "postBroadphase", pairs: filteredPossibleCollisions });
    return filteredPossibleCollisions;
  }

  /** Update overlap tracking and return changes (called before contact equation generation) */
  @profile
  private updateOverlapTracking(
    collisions: Collision[],
    sensorOverlaps: SensorOverlap[],
  ): OverlapChanges {
    // Build overlap input (without contact equations - they don't exist yet)
    const currentOverlaps: ShapeOverlap[] = [
      ...collisions.map((collision) => ({
        ...collision,
        contactEquations: [] as ContactEquation[],
      })),
      ...sensorOverlaps.map((sensor) => ({
        ...sensor,
        contactEquations: [] as ContactEquation[],
      })),
    ];

    return this.overlapKeeper.updateOverlaps(currentOverlaps);
  }

  /** Handle wake-up logic for sleeping bodies that collide with fast-moving bodies */
  @profile
  private handleCollisionWakeUps(collisions: Collision[]): void {
    for (const { bodyA, bodyB } of collisions) {
      // Only dynamic bodies can sleep or wake other bodies
      const dynA = bodyA.motion === "dynamic" ? bodyA : null;
      const dynB = bodyB.motion === "dynamic" ? bodyB : null;

      // Check if bodyA (sleeping) should be woken by bodyB (fast-moving)
      if (
        dynA &&
        dynB &&
        dynA.allowSleep &&
        dynA.sleepState === SleepState.SLEEPING &&
        dynB.sleepState === SleepState.AWAKE
      ) {
        const speedSquaredB =
          dynB.velocity.squaredMagnitude + dynB.angularVelocity ** 2;
        const speedLimitSquaredB = dynB.sleepSpeedLimit ** 2;
        if (speedSquaredB >= speedLimitSquaredB * 2) {
          dynA._wakeUpAfterNarrowphase = true;
        }
      }

      // Check if bodyB (sleeping) should be woken by bodyA (fast-moving)
      if (
        dynA &&
        dynB &&
        dynB.allowSleep &&
        dynB.sleepState === SleepState.SLEEPING &&
        dynA.sleepState === SleepState.AWAKE
      ) {
        const speedSquaredA =
          dynA.velocity.squaredMagnitude + dynA.angularVelocity ** 2;
        const speedLimitSquaredA = dynA.sleepSpeedLimit ** 2;
        if (speedSquaredA >= speedLimitSquaredA * 2) {
          dynB._wakeUpAfterNarrowphase = true;
        }
      }
    }
  }

  /** Emit beginContact/endContact events using pre-computed overlap changes */
  @profile
  private emitContactEvents(
    overlapChanges: OverlapChanges,
    collisionsWithContacts: [Collision, ContactEquation[]][],
  ): void {
    const { newOverlaps, endedOverlaps } = overlapChanges;

    // Emit beginContact events, but only if we have at least one listener
    if (this.has("beginContact")) {
      // Build lookup for contact equations (newOverlaps don't have them yet)
      const contactsByShapePair = new Map<string, ContactEquation[]>();
      for (const [collision, contacts] of collisionsWithContacts) {
        const key = `${collision.shapeA.id}:${collision.shapeB.id}`;
        contactsByShapePair.set(key, contacts);
      }

      for (const overlap of newOverlaps) {
        const key = `${overlap.shapeA.id}:${overlap.shapeB.id}`;
        const contacts = contactsByShapePair.get(key) ?? [];
        this.emit({
          type: "beginContact",
          ...overlap,
          contactEquations: contacts,
        });
      }
    }

    // Emit endContact events, but only if we have at least one listener
    if (this.has("endContact")) {
      for (const overlap of endedOverlaps) {
        this.emit({ type: "endContact", ...overlap });
      }
    }
  }

  /** Wake up bodies and emit preSolve event */
  @profile
  private emitPreSolveAndWakeUp(
    contacts: ContactEquation[],
    friction: FrictionEquation[],
  ): void {
    // Wake up bodies that need it - check all dynamic bodies since sleeping ones may have the flag
    for (const body of this.bodies.dynamic) {
      if (body._wakeUpAfterNarrowphase) {
        body.wakeUp();
        body._wakeUpAfterNarrowphase = false;
      }
    }

    this.emit({
      type: "preSolve",
      contactEquations: contacts,
      frictionEquations: friction,
    });
  }

  /**
   * Run one substep of the constraint solver. For the non-island path,
   * `allEquations` must already be sorted and the workspace must already
   * be prepared (done once per step in `step()` before the substep loop).
   * For the island path, islands are rebuilt per substep.
   */
  @profile
  private solve(
    dt: number,
    allEquations: Equation[],
  ): {
    islands: Island[] | undefined;
    usedIterations: number;
    maxIterations: number;
    islandCount: number;
  } {
    if (allEquations.length === 0) {
      return {
        islands: undefined,
        usedIterations: 0,
        maxIterations: 0,
        islandCount: 0,
      };
    }

    if (this.islandSplit) {
      // Split into islands and solve each. Island membership can shift
      // between substeps (as the body graph changes with constraint limit
      // toggles), so the split runs per substep.
      const islands = splitIntoIslands(this.bodies.all, allEquations);
      let totalIter = 0;
      let maxIter = 0;
      for (const island of islands) {
        if (island.equations.length) {
          const result = solveIsland(
            island,
            dt,
            this.solverConfig,
            this.solverWorkspace,
          );
          totalIter += result.usedIterations;
          if (result.usedIterations > maxIter) maxIter = result.usedIterations;
        }
      }
      return {
        islands,
        usedIterations: totalIter,
        maxIterations: maxIter,
        islandCount: islands.length,
      };
    } else {
      // Non-island path: the workspace was prepared once in step() before
      // the substep loop. Each substep just runs the iteration phases
      // against the cached indices.
      const result = solveSubstep(
        allEquations,
        dt,
        this.solverConfig,
        this.solverWorkspace,
      );
      return {
        islands: undefined,
        usedIterations: result.usedIterations,
        maxIterations: result.usedIterations,
        islandCount: 0,
      };
    }
  }

  /**
   * Apply accumulated forces to body velocities and zero the forces. Called
   * once per physics step (before the substep loop) so entity-applied forces
   * are integrated at the full tick dt rather than multiplied by N substeps.
   */
  @profile
  private integrateForcesToVelocity(dt: number): void {
    for (const body of this.bodies.dynamicAwake) {
      body.integrateVelocity(dt);
    }
  }

  /**
   * Advance positions/orientations from current velocity. Called once per
   * substep with `h = dt / substeps`. Forces are not touched here.
   */
  @profile
  private integratePositions(h: number): void {
    for (const body of this.bodies.kinematic) {
      body.integratePosition(h);
    }
    for (const body of this.bodies.dynamicAwake) {
      body.integratePosition(h);
    }
  }

  /** Emit impact events for first-time contacts */
  @profile
  private emitImpactEvents(contacts: ContactEquation[]): void {
    if (this.emitImpactEvent && this.has("impact")) {
      for (const eq of contacts) {
        if (eq.firstImpact && eq.shapeA && eq.shapeB) {
          this.emit({
            type: "impact",
            bodyA: eq.bodyA,
            bodyB: eq.bodyB,
            shapeA: eq.shapeA,
            shapeB: eq.shapeB,
            contactEquation: eq,
          });
        }
      }
    }
  }

  @profile
  private updateSleeping(dt: number, islands: Island[] | undefined): void {
    if (this.sleepMode === SleepMode.BODY_SLEEPING) {
      // Only awake dynamic bodies participate in sleep logic
      // Use Array.from since sleepTick may modify the set via sleep()
      for (const body of Array.from(this.bodies.dynamicAwake)) {
        body.sleepTick(this.time, false, dt);
      }
    } else if (
      this.sleepMode === SleepMode.ISLAND_SLEEPING &&
      this.islandSplit &&
      islands
    ) {
      // Only awake dynamic bodies participate in sleep logic
      for (const body of this.bodies.dynamicAwake) {
        body.sleepTick(this.time, true, dt);
      }

      // Sleep islands where all dynamic bodies want to sleep
      for (const island of islands) {
        const allWantToSleep = island.bodies.every(
          (body) => body.motion !== "dynamic" || body.wantsToSleep,
        );
        if (allWantToSleep) {
          for (const body of island.bodies) {
            if (body.motion === "dynamic") {
              body.sleep();
            }
          }
        }
      }
    }
  }

  /** Add a spring to the simulation */
  addSpring(spring: Spring): void {
    this.springs.add(spring);
    this.emit({ type: "addSpring", spring });
  }

  /** Remove a spring */
  removeSpring(spring: Spring): void {
    this.springs.delete(spring);
  }

  /** Resets the World, removes all bodies, constraints and springs. */
  clear(): void {
    this.time = 0;

    // Remove all constraints
    this.constraints.clear();

    // Remove all bodies
    this.bodies.clear();
    this.springs.clear();
    this.contactMaterials = new ContactMaterialManager();
  }

  /**
   * Cast a ray and return the closest hit, or null if nothing was hit.
   *
   * @param from - Start point of the ray
   * @param to - End point of the ray
   * @param options - Optional raycast configuration
   * @returns The closest hit, or null if nothing was hit
   */
  raycast(
    from: CompatibleVector,
    to: CompatibleVector,
    options?: RaycastOptions,
  ): RaycastHit | null {
    return raycast(this, from, to, options);
  }

  /**
   * Cast a ray and return all hits, sorted by distance (closest first).
   *
   * @param from - Start point of the ray
   * @param to - End point of the ray
   * @param options - Optional raycast configuration
   * @returns Array of all hits, sorted by distance
   */
  raycastAll(
    from: CompatibleVector,
    to: CompatibleVector,
    options?: RaycastOptions,
  ): RaycastHit[] {
    return raycastAll(this, from, to, options);
  }
}
