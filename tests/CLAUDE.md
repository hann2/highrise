# Tests

Playwright end-to-end tests that run the real game in headless Chrome (with GPU).

- `npm test` — smoke test. Run this after any non-trivial change; it is the main way to tell "compiles" from "works". It boots the game, moves, picks up a gun and shoots a zombie, swings the doors, checks physics sanity, pauses, and changes levels.
- `npm run test:physics` — node tests for `src/core/physics` (`tests/physics/`). No browser, runs in about a second. Several tests pin exact numeric results; if you change solver/integration behavior on purpose, re-record them with `PHYSICS_RECORD_PINS=1 npm run test:physics` and paste the output into `PINS`. If you didn't mean to change behavior and a pin fails, you broke something.
- `npm run benchmark` — seeded frame-time benchmark. Writes `tests/output/benchmark.json`. Numbers are only comparable on the same machine.

The Playwright tests start their own dev server on port 3456, so they can run while `npm start` is running.

## How tests drive the game

- `?seed=123` in the URL seeds `core/util/Random.ts`, making level generation reproducible.
- Levels are reseeded with `seed + levelNumber` right before generation, so the wall/room layout of every level is reproducible regardless of what happened earlier in the run. Known limitation: a few decorations/vending machines still differ between runs with the same seed (cause not yet tracked down). The smoke test logs a wall-layout fingerprint for comparing runs.
- `window.DEBUG.game` exposes the `Game`. Tests find things with `entities.getById(...)` (`main_menu`, `party_manager`, `level_controller`) and `entities.getTagged(...)` (`human`, `zombie`).
- Tests reach into entities by class name (`e.constructor.name === "Door"`), which only works in development builds where names aren't minified.
- Dev-only cheat keys from `CheatController` are used for flow control: `KeyL` completes the level, `KeyV` toggles the vision mask.
- Any `pageerror` or `console.error` fails the test. Don't log errors for non-error conditions.

## Philosophy

Browser startup and asset preloading are slow, so prefer one long scenario with many assertions over many small tests. Add assertions to `smoke.spec.ts` rather than adding new spec files unless the scenario is genuinely different.

## Screenshots

Tests write screenshots to `tests/output/` (gitignored). `tests/reference/` holds committed screenshots of known-good output for the same seed, and benchmark numbers from before and after the engine port (same machine). They are for comparing by eye (or by an agent reading the images) after rendering changes — they are not pixel-diffed, because effects and AI are not frame-deterministic. When rendering changes intentionally, copy the new output over the references.
