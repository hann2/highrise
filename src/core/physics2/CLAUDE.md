# Physics Engine

Custom rigid body physics engine (not a wrapper around another library).

## Architecture

- **World** - Central container managing bodies, constraints, springs, and collision
- **Body** - Single concrete `Body` class tagged by readonly `shape` (`pm2d`/`rigid2d`/`pm3d`/`rigid3d`) and `motion` (`static`/`kinematic`/`dynamic`). Narrowed interface views in `bodyInterfaces.ts`; construct via factories in `bodyFactories.ts` (`createRigid2D`, `createPointMass3D`, etc.) for type-level narrowing.
- **Systems** - Per-concern modules in `systems/` (AABB, Damping, Force, Integration, MassProperties, Sleep) operate on partitioned body buckets. The solver step in `World.step()` drives them in order.
- **Shapes** - Circle, Convex, Particle, Line, Plane, Heightfield attached to bodies
- **Collision** - Broadphase (spatial hashing) → Narrowphase → Contact generation

## Key Patterns

### Island Splitting

Connected bodies form "islands" that can sleep together. See `world/Island.ts`.

### Solver Pipeline

1. Broadphase finds potential pairs
2. Narrowphase generates ContactEquations
3. GSSolver iterates to resolve constraints

### Equation Shape Taxonomy

The solver partitions equations into "shape" groups based on which components
of the Jacobian are structurally non-zero. Each group gets a dedicated
monomorphic inner loop in `GSSolver.runIteration`, so the hot math never pays
for zero multiplies, wasted `invInertia` reads, or virtual dispatch.

| Shape                 | Class (extends `Equation`) | Non-zero `G`                                                           | When to use                                                                                                                            |
| --------------------- | -------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **point-to-point 3D** | `PointToPointEquation3D`   | `G[0..2]`, `G[6..8]` (symmetric: `-n` / `+n`)                          | Both bodies are point-like (no angular contribution). Rope chain links.                                                                |
| **point-to-rigid 3D** | `PointToRigidEquation3D`   | `G[0..2]`, `G[6..11]` (A linear only; B linear + angular)              | One side is a point, the other is a rigid body. Deck contacts, rope endpoint chain links. **Convention: the point is always `bodyA`.** |
| **planar 2D**         | `PlanarEquation2D`         | `G[0..1]`, `G[5]`, `G[6..7]`, `G[11]` (linear XY + angular Z per body) | 2D rigid-rigid contacts and friction. `ContactEquation`, `FrictionEquation`.                                                           |
| **angular 3D**        | `AngularEquation3D`        | `G[3..5]`, `G[9..11]` (antisymmetric: `+c` / `−c`)                     | Pure 3D rotational coupling — no linear force. `AxisAlignmentEquation` (used by 3D revolute joints).                                   |
| **angular 2D**        | `AngularEquation2D`        | `G[5]`, `G[11]` (asymmetric — supports gear ratios)                    | Pure 2D rotational coupling. `RotationalLockEquation`, `AngleLockEquation`, `RotationalVelocityEquation` (motor).                      |
| **general**           | `Equation` (base)          | Any combination (full 12 components)                                   | Anything that doesn't fit a specialized shape. Fallback path — prefer a specialized shape when possible.                               |
| **pulley**            | `PulleyEquation`           | 18-component, 3-body                                                   | 3-body pulley constraints. `PulleyEquation`.                                                                                           |

Each shape class:

- Stores only the non-zero components as named fields instead of a 12-element `G`.
- Overrides `computeGq` to return the inherited `offset` field; the owning
  constraint's `update()` writes `offset` to the signed position error each
  substep.
- Overrides `computeGW`, `computeGWlambda`, `computeGiMf`, `computeGiMGt`,
  and `addToWlambda` with reduced-arithmetic versions that skip the
  structurally-zero terms.

When writing a new constraint, pick the shape that matches its Jacobian
structure and extend that equation class. Don't instantiate the base
`Equation` directly unless the constraint genuinely has a fully general
12-component Jacobian — you'll miss out on the shape-specialized solver
path and pay for arithmetic against zeros.

Equation partitioning happens once in `prepareSolverStep` via `instanceof`
checks. `SolverWorkspace` holds a dedicated array per shape group, and
`runIteration` dispatches to the matching `iterateXxxBatch` function. See
`GSSolver.ts` for the iterator implementations.

### Substepping

`World.step(dt)` supports splitting the constraint-solve + position-integrate
phase into `N = WorldOptions.substeps` iterations at `h = dt / N`. Broadphase,
narrowphase, and contact/friction equation generation run once per step;
entity-applied forces are folded into velocity once at the full `dt`; then
the substep loop refreshes constraint Jacobians (`constraint.update()`),
solves at `h`, and advances positions at `h`. This stiffens ropes and other
long constraint chains without multiplying collision detection cost. Default
is `1` (legacy behavior).

### Adding New Collision Types

1. Create shape in `shapes/`
2. Add narrowphase handler in `collision/narrowphase/shape-on-shape/`
3. Register in the shape-pair dispatch table

## Common Tasks

- **Raycast**: `world.raycast(from, to, options)` - see RaycastOptions for filtering
- **Body sleeping**: Configure via World's sleepingMode (NO_SLEEPING, BODY_SLEEPING, ISLAND_SLEEPING)
