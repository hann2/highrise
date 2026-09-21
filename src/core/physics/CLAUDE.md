# Physics Engine

Custom rigid body physics engine (not a wrapper around another library).

## Architecture

- **World** - Central container managing bodies, constraints, springs, and collision
- **Body** - Single concrete `Body` class tagged by readonly `shape` (`pm2d` point mass / `rigid2d` rigid body) and `motion` (`static`/`kinematic`/`dynamic`). Narrowed interface views in `bodyInterfaces.ts`; construct via factories in `bodyFactories.ts` (`createRigid2D`, `createPointMass2D`) for type-level narrowing.
- **Systems** - Per-concern modules in `systems/` (AABB, Damping, Force, Integration, MassProperties, Sleep) operate on partitioned body buckets. The solver step in `World.step()` drives them in order.
- **Shapes** - Circle, Box, Convex, Capsule, Line, Plane, Particle attached to bodies
- **Collision** - Broadphase (spatial hashing or SAP) → Narrowphase → Contact generation

## Key Patterns

### Island Splitting

Connected bodies form "islands" that can sleep together. See `world/Island.ts`.

### Solver Pipeline

1. Broadphase finds potential pairs
2. Narrowphase generates ContactEquations
3. GSSolver iterates to resolve constraints

### Equation Shape Taxonomy

This is a 2D-only engine. Every equation couples two bodies, each with 3
degrees of freedom, so the full Jacobian is 6 components:
`G = [vxA, vyA, wA, vxB, vyB, wB]`.

The solver partitions equations into "shape" groups based on which components
of the Jacobian are structurally non-zero. Each group gets a dedicated
monomorphic inner loop in `GSSolver.runIteration`, so the hot math never pays
for zero multiplies, wasted inverse-inertia reads, or virtual dispatch.

| Shape              | Class (extends `Equation`) | Jacobian                                   | When to use                                                                                                            |
| ------------------ | -------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **planar**         | `PlanarEquation2D`         | `[-linX, -linY, angAz, linX, linY, angBz]` | Rigid-rigid with a shared linear direction. `ContactEquation`, `FrictionEquation`, rigid-rigid `DistanceConstraint`.   |
| **angular**        | `AngularEquation2D`        | `[0, 0, angAz, 0, 0, angBz]` (asymmetric)  | Pure rotational coupling. `RotationalLockEquation`, `AngleLockEquation`, `RotationalVelocityEquation` (motor).         |
| **point-to-point** | `PointToPointEquation2D`   | `[-nx, -ny, 0, nx, ny, 0]`                 | Both bodies are point masses (`pm2d`). `DistanceConstraint` between two point masses.                                  |
| **point-to-rigid** | `PointToRigidEquation2D`   | `[-nx, -ny, 0, nx, ny, rjCrossN]`          | One point mass, one rigid body. **Convention: the point is always `bodyA`.** `DistanceConstraint` swaps bodies to fit. |
| **general**        | `Equation` (base)          | Any combination (all 6 components of `G`)  | Anything that doesn't fit a specialized shape, e.g. the x/y rows of `RevoluteConstraint` and `LockConstraint`.         |

Each shape class:

- Stores only the non-zero components as named fields instead of the 6-element `G`.
- Overrides `computeGq` to return the inherited `offset` field; the owning
  constraint's `update()` writes `offset` to the signed position error each
  substep.
- Overrides `computeGW`, `computeGWlambda`, `computeGiMf`, `computeGiMGt`,
  and `addToWlambda` with reduced-arithmetic versions that skip the
  structurally-zero terms.

When writing a new constraint, pick the shape that matches its Jacobian
structure and extend that equation class. Don't instantiate the base
`Equation` directly unless the constraint genuinely has a fully general
6-component Jacobian — you'll miss out on the shape-specialized solver
path and pay for arithmetic against zeros.

Equation partitioning happens once in `prepareSolverStep` via `instanceof`
checks. `SolverWorkspace` holds a dedicated array per shape group, and
`runIteration` dispatches to the matching `iterateXxxBatch` function. See
`GSSolver.ts` for the iterator implementations.

### Solver Workspace Layout

`SolverWorkspace` assigns each body an integer index `i` for the duration of a
solve and stores per-body state in flat `Float64Array`s:

- `vlambda[i * 2]`, `vlambda[i * 2 + 1]` — accumulated linear velocity change
- `wlambda[i]` — accumulated angular velocity change
- `invMassSolve[i]`, `invInertiaSolve[i]` — scalar inverse mass / inertia
  (zero for static, kinematic and sleeping bodies; `invInertiaSolve` is also
  zero for point masses)

Per-equation `lambda`, `Bs` and `invCs` are `Float32Array`s indexed by the
equation's slot.

### Friction

With `solverConfig.frictionIterations === 0` (the default) friction equations
are bounded by a constant slip force and ignore `ContactMaterial.friction`.
Set `frictionIterations > 0` to derive the bound from the contact force
(`friction × average normal force`).

### Substepping

`World.step(dt)` supports splitting the constraint-solve + position-integrate
phase into `N = WorldOptions.substeps` iterations at `h = dt / N`. Broadphase,
narrowphase, and contact/friction equation generation run once per step;
entity-applied forces are folded into velocity once at the full `dt`; then
the substep loop refreshes constraint Jacobians (`constraint.update()`),
solves at `h`, and advances positions at `h`. This stiffens long constraint
chains without multiplying collision detection cost. Default
is `1` (legacy behavior).

### Adding New Collision Types

1. Create shape in `shapes/`
2. Add narrowphase handler in `collision/narrowphase/shape-on-shape/`
3. Register in the shape-pair dispatch table

## Common Tasks

- **Raycast**: `world.raycast(from, to, options)` - see RaycastOptions for filtering
- **Body sleeping**: Configure via `world.sleepMode` (`SleepMode.NO_SLEEPING`, `BODY_SLEEPING`, `ISLAND_SLEEPING`; the last needs `islandSplit: true`)
