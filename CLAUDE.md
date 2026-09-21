# Highrise

Top-down 2D co-op-style zombie shooter for the browser. TypeScript, Pixi.js v5 (rendering), p2.js (physics), Web Audio, bundled with Parcel 1. Deployed to Vercel.

## Commands

- `npm ci` — install (runs `patch-package` on postinstall; required for `pixi-tilemap` types)
- `npm start` — dev server at http://localhost:1234
- `npm run build` — production build to `dist/`
- `npm run tsc` — type check (the only automated check; there are no tests and no eslint config)
- `npm run prettier` — format `src/`
- `npm run generate-asset-types` — regenerate `.d.ts` files next to assets (run after adding/renaming any asset)

Parcel does not type check. Always run `npm run tsc` after changes.

## Layout

- `src/core/` — game-agnostic engine. Must not import from `src/highrise/`.
  - `Game.ts` — main loop, entity add/remove, event dispatch, pause, slow-mo
  - `entity/` — `Entity` interface and `BaseEntity` base class
  - `graphics/` — Pixi renderer wrapper, layers, camera
  - `physics/` — fixes/extensions to p2 (`CustomWorld`, `SpatialHashingBroadphase`, CCD, custom springs)
  - `io/` — keyboard/mouse/gamepad
  - `sound/` — positional audio on Web Audio
  - `Vector.js` + `Vector.d.ts` — `V()`/`V2d`, an array-subclass 2D vector compatible with p2's `[x, y]` tuples. Hand-written JS with a separate declaration file; keep both in sync.
- `src/highrise/` — the actual game
  - `main.ts` — bootstraps `Game`, preloader, and global controllers
  - `controllers/` — long-lived entities driving game flow (`GameController`, `LevelController`, etc.)
  - `config/` — configures core for this game: render `Layer` enum, `CollisionGroups`, `PhysicsMaterials`
  - `levels/level-generation/` — procedural generation (room placement → maze → walls → doors → closets/nubbies → entity placement); `level-templates/` define per-floor themes; `rooms/` define room templates
  - `human/`, `characters/`, `enemies/`, `weapons/`, `projectiles/`, `environment/`, `effects/`, `hud/`, `menu/`
  - `lighting-and-vision/` — custom lighting/shadow pipeline using GLSL filters (`light.frag`, `shadow.frag`)
- `resources/` — ~900MB of images, audio, fonts, plus source files (`resources/assets/*.afdesign` etc.). Every importable asset has a generated sibling `.d.ts`.
- `notes/` — design ideas and todo lists (`simon-random-todos.txt` is the closest thing to a backlog)
- `patches/` — `patch-package` patch fixing `pixi-tilemap` type imports

## Architecture conventions

- Everything in the game is an `Entity` (usually `extends BaseEntity`) added with `game.addEntity(...)`. Entities optionally declare `body`/`bodies`, `sprite`/`sprites`, `springs`, `constraints`, `children`; the `Game` registers those with physics/rendering on add and cleans them up on `destroy()`.
- Lifecycle hooks live in `core/entity/GameEventHandler.ts`: `onAdd`, `afterAdded`, `beforeTick`, `onTick(dt)`, `afterPhysics`, `onRender(dt)`, `onLateRender`, `onPause`/`onUnpause`, `onDestroy`, `onResize`. IO hooks (`onKeyDown`, etc.) are in `IOEventHandler.ts`; collision hooks in `EntityPhysics.ts`.
- Child entities: use `this.addChild(entity)` so they are added/destroyed with the parent.
- Custom game events: `game.dispatch({ type: "levelComplete", ... })`, received via a `handlers = { levelComplete: (event) => {...} }` map on the entity. Event payloads are untyped (`any`).
- Sprites choose their render layer via `sprite.layerName = Layer.X` (see `highrise/config/layers.ts`).
- Fast entity lookup: `game.entities.getTagged(tag)`, `getById(id)`, or type-guard filters registered with `game.entities.addFilter(isHuman)` and read with `getByFilter(isHuman)`.
- `persistenceLevel` controls what survives scene clears: clearing removes entities at or below a threshold. Default is 0; global controllers use 100.
- Assets are imported as URL strings with a type prefix naming convention: `img_fooBar`, `snd_fooBar`, `fnt_fooBar`, `frag_fooBar`. Anything used at runtime must be reachable from the preloader lists in `highrise/preloader/`.
- Stats-as-data: guns, melee weapons, characters, decorations, and zombie variants are plain objects in their own files, collected in an index (`gunStats.ts`, `weapons.ts`, `decorations.ts`, `Character.ts`).
- `.frag` imports rely on Parcel 1's built-in glslify support; they arrive as strings.
- `process.env.NODE_ENV === "development"` gates `CheatController`. `window.DEBUG.game` exposes the game in the console.

## Gotchas

- `src/index.ts` must call `polyfill()` before importing anything else — import order matters there.
- tsconfig targets ES5 with `downlevelIteration`; Parcel 1 uses its own Babel pipeline and ignores most of tsconfig.
- `pixi.js` is pinned to v5 API (`PIXI.Loader`, `filters`, `pixi-tilemap` v2). v6+ changes are breaking.
- The repo is large (~800MB of git history, mostly binary assets). Avoid broad globbing/searching under `resources/`.
