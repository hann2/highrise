# Engine changes to upstream

Changes made to `src/core/` here that should go back to the engines it came
from: the physics to `simonbw/tack-and-trim` (`src/core/physics/`), the rest
to `simonbw/game-engine` (and tack-and-trim's copy of core). Commits are on
the `perf-enemies` branch (2026-09-30) unless noted; the subjects are given
too, in case the hashes change when it's merged.

## Physics (tack-and-trim)

### Separate static and moving hashes in the broadphase
`b10fd01` "Broadphase: separate hashes for static and moving bodies"

- `SpatialHashingBroadphase` used to put every dynamic and kinematic body in
  the hash and take them all out again for **every** query and raycast, so
  each cost time in proportion to the bodies in the world. Now static bodies
  are hashed once, moving ones in a second hash rebuilt at most once per step
  (lazily), with adds and removes between steps applied directly.
- Each body remembers its cells, so removing it doesn't depend on where it is
  now. (The old code recomputed them from the current AABB, which is wrong if
  it moved.)
- Queries mark seen bodies with `Body._queryStamp` instead of building a Set.
- `Broadphase.bodyShapesChanged(body)`, called from `Body.addShape` and
  `removeShape`: a static body that changes shape is rehashed.
- `resize()` now actually updates `width` and `height` (it didn't).
- **API change:** `aabbQuery`'s third parameter was `shouldAddBodies`; it's
  now `includeMoving` (false = static bodies only). Callers passing `false`
  to mean "don't bother adding them" now get only static bodies.
- Tests: `tests/physics/broadphase.test.ts` (pairs against brute force,
  queries across adds, removes, moves, shape changes, huge bodies).

### Raycasts walk the grid along the ray
`03f43d0` "Raycasts walk the grid along the ray"

- `raycast` and `raycastAll` take candidates from `Broadphase.rayQuery`
  (new on the base class: the ray's bounding box, which SAP uses) instead of
  `aabbQuery` over the ray's bounding box. `SpatialHashingBroadphase.rayQuery`
  walks the cells along the ray (DDA).
- The walk now takes a fixed number of steps in each direction, so it always
  ends (it used to loop until it hit the end cell exactly, and could loop
  forever if rounding stepped past it). Non-finite rays fall back to the
  bounding box.
- **API change:** `rayQuery(ray, shouldAddBodies)` is now
  `rayQuery(world, from, to, includeMoving)`.
- Tests: the twin-world test in `tests/physics/broadphase.test.ts` (414 rays
  against SAP, including grid-aligned, corner, zero-length and wrapping ones).

### No friction equations for frictionless contacts
`a80a3fa` "No friction between enemies" (the `World.ts` part; the material is
Highrise's)

- With `frictionIterations > 0` the solver bounds friction by contact force
  times the coefficient, so a coefficient of 0 makes friction equations that
  do nothing; `World.step` no longer makes them. Without
  `frictionIterations`, friction is a constant slip force whatever the
  material says, so they're still made there. (That's arguably a surprise in
  itself: `ContactMaterial.friction` is ignored unless `frictionIterations > 0`.)
- Test: "frictionless contacts get no friction equations..." in
  `tests/physics/physics.test.ts`.

### Contact and friction equations reused from step to step
`d9a6f87` "Reuse contact and friction equations from step to step"

- New `equations/EquationPool.ts`; `Equation.reset()` (and resets in
  `PlanarEquation2D`, `ContactEquation`, `FrictionEquation`) make a used
  equation as good as new. `World` releases its pools at the start of each
  step; the generators take a pool as an optional last argument.
- **API change:** equations are only good during the step they come from.
  `beginContact` handlers must copy what they need; the entity-level
  `contacting` event (in core's `Game`/`ContactList`, see below) no longer
  has `contactEquations`.
- Note while you're there: warm starting (`warmLambda`) never did anything
  for contacts, since every step's contact equations were new. With pooling
  they're reset, so still nothing. Carrying lambdas over by contact would be
  a real improvement to convergence.
- Test: "contact equations are reused from step to step".

### AABB updates that allocate nothing, and a moving hash updated incrementally
`49beb81` "Update AABBs without allocating, and only rehash bodies that changed cells"

- `Shape.computeAABB(position, angle, out?)` writes into `out` when it's
  given (every shape); `updateAABB` uses scratch space and writes the first
  shape straight into `body.aabb`; `AABB.setFromPoints` no longer allocates
  a vector per rotated point. 0.34 -> 0.05 us per circle body.
- The moving hash keeps each body's cell range and only moves bodies whose
  range changed, rather than rebuilding from scratch after every step; adds
  and removes go in right away. `debugData.movingRebuilds` is now
  `movingUpdates`, plus `movingRehashes`.
- Test: "bodies that stay in the same cells aren't moved in the hash".

### Narrowphase and contact bookkeeping without the garbage
`4311f12` "Narrowphase and contact bookkeeping without the garbage"

- `CollisionResult.ts` pools results and contacts: `createCollisionResult`
  reuses one, the new `addContact(result)` hands out a contact for the
  caller to fill in, and `releaseCollisionResults()` (called at the start of
  `getContactsFromPairs`) frees them all. Every shape-pair function in
  `narrowphase/shape-on-shape/` fills in `addContact` instead of pushing a
  literal with new vectors; `swapped` negates normals in place.
  `getContactsFromPairs` pools the `Collision` objects too and puts shapes'
  world positions in scratch vectors.
- `OverlapKeeper`: number keys (`tupleToInt` packs `lo * 2^32 + hi`, with a
  string fallback for ids from 2^21 on), maps and sets reused across steps,
  ongoing overlaps keep their records, `updateOverlaps(...lists)` takes the
  collisions and sensor overlaps as they are.
- `Collision.contactEquations` is set when the world makes them, so
  `emitContactEvents` doesn't build a lookup map every step; events are made
  from bodies and shapes rather than spread from pooled objects.
- `doBroadphase` skips the disabled-pairs filter when there are none.
- **API changes:** `Collision`s, `CollisionResult`s and their contacts are
  only good during their step; `bodyKey`/`shapeKey` return `PairKey`
  (number or string) and `ConstraintManager.disabledBodyKeys` is a
  `ReadonlySet<PairKey>`.
- Tests: `tests/physics/contacts.test.ts` (begin/end events over many
  steps, pair keys).

## Core (game-engine)

### Frame pacing: one tick per display refresh
`dcc546e` "Run one tick per display refresh, with dt the ideal frame time"
(and `3acd3c0`, which only changed Highrise's tick rate)

- New `core/FramePacing.ts`: `RefreshRateEstimator` (median of animation
  frame intervals, snapped to common rates, ignores loading, follows power
  saving and display changes, backs off raises that don't hold) and
  `FramePacer` (counts time in refreshes so jitter never adds or drops a
  frame, skips callbacks under a frame rate limit, catches up at most 3
  frames, keeps real time without vsync).
- `Game`: the loop runs a frame per refresh with `dt` = 1 / target rate;
  `ticksPerSecond`, `tickDuration` are getters now; new `refreshRate`,
  `targetFrameRate`, `frameRateLimit`, `refreshRateOverride`,
  `ticksPerFrame` (more than one below 60 fps).
- **API changes:** the `ticksPerSecond` constructor option and
  `getScreenFps()` / `averageFrameDuration` are gone.
- Uses `desktop?.displayFrequency()` (`core/desktop.ts`) as an upper limit;
  game-engine may not have the desktop bridge, in which case leave that out.
- `Camera2d.smoothSetVelocity` / `smoothZoom` scale with the tick duration
  (they were per call, so per tick).
- Stats overlay shows `FPS: actual / target (refresh Hz)`.
- Tests: `tests/core/framePacing.test.ts` (`npm run test:core`).

### Camera visibility check
`42a997f` "Don't pose or draw bodies out of view"

- `Camera2d.isInView(point, radius)`: against the view's bounding box in the
  world (handles rotation), cached until the camera or screen changes. Cheap
  enough for every sprite every frame.

### Tick layers: inheritance and render grouping
`88935f4` "Tick layers for enemies, effects and fire; render grouped by layer too"

- An entity without its own `tickLayer` is in its parent's (unless the parent
  uses `tickLayers`). `EntityList` remembers the layers each entity went in,
  so removal doesn't depend on its parent since.
- `onRender` is dispatched layer by layer (an entity's first layer), each
  timed by the profiler, so render has per-layer totals like tick does.
- The layers themselves (`src/config/tickLayers.ts`) are per game.
- Worth knowing for any profiling: per-entity timing
  (`profiler.entityDetail`) costs about 0.4 µs a call, which with hundreds of
  entities inflates totals by milliseconds.

### ContactList and the contacting event
Part of `d9a6f87`: `ContactList` keeps only bodies and shapes, and
`onContacting` no longer gets `contactEquations` (they were the ones from
when the contact began, and with pooling would belong to other contacts).

### Pixi's ticker drew the stage a second time
"Don't let Pixi's ticker draw the stage too" (`gpu-lights`, 2026-10-01)

- `GameRenderer2d.init` made a `Pixi.Application` without `autoStart:
  false`, so Pixi's own ticker drew the whole stage on every animation frame
  on top of the game's `render()`: twice a frame with vsync, and many times
  a frame without it (about 9 per game frame in the benchmarks). Its second
  draw was invisible to the profilers. Now `autoStart: false`.

### GPU profiler
"GPU profiler: WebGL timer queries for the render, in benchmarks and the
overlay" (`3169b15`), and "GPU sections around the fire and smoke draws"
(`gpu-lights`, 2026-10-01)

- `util/GpuProfiler.ts`: `gpuProfiler` times sections of the GPU's work with
  `EXT_disjoint_timer_query_webgl2` (`measure`, `start`/`end`, captures like
  `Profiler`'s), and `measureCpuAndGpu` times a section on both. `Game` times
  `Game.render` (by tick layer, `lateRender`, `Renderer.render`).
- `gpuTimed(label, content)` times something drawn as part of the stage,
  with a `RenderContainer` on either side that starts and ends the section.
- The profiler panel has a GPU section.
- Caveat (in its doc comment): on a Mac (ANGLE over Metal), splitting the
  timeline into sections inflates them, and siblings come out about equal
  whatever they draw, so only the total timed alone is trustworthy there.

## From before this branch

From the engine port (2026-09, merged to master), never upstreamed: the
`@on` decorator event system, tick layers, `getSingleton`, IO dispatch,
`entity.game` as a throwing getter with `isAdded`, the
`Camera2d.smoothCenter` fix, a Box narrowphase fix, and
`GameRenderer2d.getSize` no longer dividing Pixi 8's logical size by the
resolution. (Some of those came from tack-and-trim in the first place;
compare before copying.)
