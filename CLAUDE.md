# Highrise

Top-down 2D zombie shooter for the browser. TypeScript, Pixi.js v8 (rendering), a custom 2D physics engine, Web Audio, bundled with Parcel 2. Deployed to Vercel.

`src/core/` is Simon's shared game engine, copied per game. It descends from `simonbw/game-engine` (entities, events, rendering, io, sound) plus the physics engine from `simonbw/tack-and-trim`, stripped down to general-purpose 2D. When fixing engine bugs here, consider whether they should be upstreamed.

## Commands

- `npm ci` — install (Node version in `.nvmrc`)
- `npm start` — dev server at http://localhost:1234, plus a watcher that regenerates the asset manifest
- `npm run build` — production build to `dist/`
- `npm run tsc` — type check. Parcel does not type check, so always run this after changes
- `npm test` — Playwright smoke test that boots and plays the real game. Run after any non-trivial change; see `tests/CLAUDE.md`
- `npm run test:physics` — fast node tests for the physics engine. Run after touching `src/core/physics`
- `npm run benchmark` — seeded frame time benchmark
- `npm run prettier` — format `src/`
- `npm run generate-manifest` — regenerate `resources/resources.ts` after adding/removing assets (`npm start` does this automatically)

## Layout

- `src/core/` — game-agnostic engine. Must not import from `src/highrise/` (type-only imports via `src/config/` are the one exception)
  - `Game.ts` — main loop (fixed timestep), entity add/remove, event dispatch, pause, slow-mo
  - `entity/` — `Entity` interface, `BaseEntity` base class, event type maps
  - `graphics/` — Pixi renderer wrapper, layers, camera
  - `physics/` — custom 2D rigid body engine (see its `README.md` and `CLAUDE.md`)
  - `io/`, `sound/`, `resources/` (preloader), `util/`
- `src/config/` — configures core for this game: render `Layer`s, `CustomEvents`, `CollisionGroups`, `PhysicsMaterials`
- `src/highrise/` — the actual game
  - `main.ts` — bootstraps `Game`, preloader, and global controllers
  - `controllers/` — long-lived entities driving game flow (`GameController`, `LevelController`, ...)
  - `levels/level-generation/` — procedural generation (room placement → maze → walls → doors → closets/nubbies → entity placement); `level-templates/` define per-floor themes; `rooms/` define room templates
  - `human/`, `characters/`, `enemies/`, `weapons/`, `projectiles/`, `environment/`, `effects/`, `hud/`, `menu/`
  - `lighting-and-vision/` — lights are baked into render textures (with shadow polygons cast from physics shapes), composited additively into a lighting texture, which is multiplied over the world. `VisionController` masks what the player can't see
- `resources/` — only assets the game ships. Everything in here is preloaded, so don't put unused files here
- `assets/` — not shipped: `assets/source` (design files), `assets/unused` (audio/images not currently used)
- `bin/generate-manifest.ts` — generates `resources/resources.ts`
- `tests/` — Playwright e2e (`*.spec.ts`), physics node tests (`physics/`), reference screenshots
- `notes/` — design ideas; `simon-random-todos.txt` is the closest thing to a backlog

## Architecture conventions

- Everything in the game is an `Entity` (usually `extends BaseEntity`) added with `game.addEntity(...)`. Entities optionally declare `body`/`bodies`, `sprite`/`sprites`, `springs`, `constraints`, `children`; the `Game` registers those with physics/rendering on add and cleans them up on `destroy()`.
- Child entities: use `this.addChild(entity)` so they are added/destroyed with the parent.
- `this.game` is always a `Game`; reading it while the entity isn't in a game throws. Use `this.isAdded` / `this.isDestroyed` for the rare cases where that's possible (setup before `game.addEntity`, or something that can be hit again in the physics step it was destroyed in, like `Enemy.die`). Code after `await this.wait(...)` never runs once the entity is destroyed, so it needs no guard.
- **Events are methods named `on<EventName>`, marked with `@on("eventName")`.** The decorator registers the handler (undecorated `on*` methods are never called), checks that the name matches, and type checks the payload. Built-in events are in `core/entity/BaseGameEvents.ts` (`onAdd({ game })`, `onAfterAdded`, `onBeforeTick`, `onTick(dt)`, `onAfterPhysics`, `onRender(dt)`, `onLateRender`, `onPause`, `onUnpause`, `onDestroy({ game })`, `onResize({ size })`), `IoEvents.ts` (`onKeyDown({ key })`, `onButtonDown({ button })`, `onMouseDown`, ...), and `PhysicsEvents.ts` (`onBeginContact({ other, ... })`, `onImpact`, ...).
- Custom game events are declared with their payload types in `src/config/CustomEvent.ts`, dispatched with `game.dispatch("levelComplete", undefined)` / `game.dispatch("startLevel", { level })`, and handled by an `onStartLevel({ level })` method.
- By convention `on*` names are only used for decorated event handlers; direct-call hooks use other names (`hitByBullet`, `handleDeath`, `handleInteract`).
- `onTick` runs in tick layers (`src/config/tickLayers.ts`: `input`, `main`, `camera`, in that order). An entity picks one with `tickLayer = "camera" as const`; the camera follows in the last layer so it sees final positions.
- Sprites choose their render layer via `sprite.layerName = Layer.X` (`src/config/layers.ts`, ordered bottom to top). Use a Pixi `Container` (not an empty `Sprite` or a `Graphics`) as a parent for other display objects. Position sprites from vectors with `sprite.position.copyFrom(v)`.
- Fast entity lookup: `game.entities.getSingleton(LevelController)` / `getByConstructor(Cls)` (exact class), `getTagged(tag)`, `getById(id)`, or type-guard filters registered with `game.entities.addFilter(isHuman)` and read with `getByFilter(isHuman)`.
- `persistenceLevel` (see `Persistence` in `highrise/constants/constants.ts`) controls what `game.clearScene(threshold)` removes.
- Assets are referred to by name (camelCased file name without extension): `Sprite.from("andyHead")`, `new PositionalSound("wallHit1", position)`, `fontName("captureIt")`. Names are type checked against the manifest (`ImageName`, `SoundName`, `FontName`), so type arrays of them accordingly. Names must be unique per asset type; the manifest generator fails loudly otherwise.
- Stats-as-data: guns, melee weapons, characters, decorations, and zombie variants are plain objects in their own files, collected in an index (`gunStats.ts`, `weapons.ts`, `decorations.ts`, `Character.ts`).
- All randomness goes through `core/util/Random.ts` so that `?seed=123` makes runs reproducible. Don't call `Math.random()` directly, and don't consume randomness at module load time (the seed is applied in `main()`, after modules have run): `ShuffleRing` shuffles lazily for exactly this reason.
- `process.env.NODE_ENV === "development"` gates `CheatController`. `window.DEBUG.game` exposes the game in the console.

## Physics

- Bodies come from factories: `createRigid2D({ motion: "dynamic" | "kinematic" | "static", ... })`, or `createPointMass2D(...)` for things that should never rotate from collisions (humans — their `angle` is set directly).
- Pairs are only collision-tested if at least one body is dynamic. A sensor-like body that you move by hand but that must detect static things is a dynamic body with `mass: 0, collisionResponse: false` (see `SwingingWeapon`).
- There is no gravity. Friction comes from actual contact forces.
- `game.world.raycast(from, to, { collisionMask, filter, skipBackfaces })` returns the closest `RaycastHit` or `null`. `collisionMask` is matched against the shape's `collisionGroup` only; to respect a shape's own `collisionMask` (e.g. fences that let projectiles through) use `filter` — see `projectileRaycast`.
- Boxes can't be resized; replace the shape (see `ElevatorDoor`). Concave colliders: `convexShapesFromPolygon` in `core/physics/utils/polygonShapes.ts`.
- Vectors are `V2d` (`core/Vector.ts`), an `Array` subclass so it is compatible with `[x, y]` tuples. Methods prefixed with `i` mutate in place (`iadd`, `imul`); the others allocate.

## Rendering gotchas (Pixi 8)

- Filters nested inside another filter render nothing if their `resolution`s differ. The stage-level damage filter in `DamagedOverlay` uses `resolution: "inherit"` for this reason.
- Custom filters are GLSL ES 3.0 for the WebGL renderer (`damage-filter.frag`), imported as a string via Parcel's glsl transformer.
- Rendering into textures mid-frame (`LightingManager`, `Light`) uses `renderer.render({ container, target, clear })`.

## Misc gotchas

- `src/index.ts` must import `core/Polyfills` first.
- The repo is large (~800MB of git history, mostly binary assets). Avoid broad globbing/searching under `resources/` and `assets/`.
