# Tests

Playwright end-to-end tests that run the real game in headless Chrome (with GPU).

- `npm test` — smoke test. Run this after any non-trivial change; it is the main way to tell "compiles" from "works". It boots the game, moves, picks up a gun and shoots a zombie, swings the doors, checks physics sanity, pauses, and changes levels.
- `npm run test:physics` — node tests for `src/core/physics` (`tests/physics/`). No browser, runs in about a second. Several tests pin exact numeric results; if you change solver/integration behavior on purpose, re-record them with `PHYSICS_RECORD_PINS=1 npm run test:physics` and paste the output into `PINS`. If you didn't mean to change behavior and a pin fails, you broke something.
- `npm run benchmark` — seeded frame-time benchmark. Writes `tests/output/benchmark.json` with `loopCpuMs` percentiles and a `profile` breakdown (per section and per entity class, ms per frame) and prints the breakdown as a table. Numbers are only comparable on the same machine. `captureProfile(page, ms)` in `helpers.ts` gets the same breakdown from any test or script.

The Playwright tests start their own dev server on port 3456, so they can run while `npm start` is running.

## How tests drive the game

- `?seed=123` in the URL seeds `core/util/Random.ts`, making level generation reproducible.
- Levels are reseeded with `seed + levelNumber` right before generation, so everything generated for a level is reproducible regardless of what happened earlier in the run. The smoke test asserts a fingerprint of `LevelController.level.entities` for level 2 against `LEVEL_2_FINGERPRINT`; when you change level generation on purpose, paste the new value from the failure message. If it changes when you didn't touch level generation, something is consuming randomness nondeterministically (see the randomness note in the root `CLAUDE.md`).
- `window.DEBUG.game` exposes the `Game`. Tests find things with `entities.getById(...)` (`main_menu`, `party_manager`, `level_controller`) and `entities.getTagged(...)` (`human`, `zombie`).
- Tests reach into entities by class name (`e.constructor.name === "Door"`), which only works in development builds where names aren't minified.
- Dev-only cheat keys from `CheatController` are used for flow control: `KeyL` completes the level, `KeyV` toggles the vision mask.
- Any `pageerror` or `console.error` fails the test. Don't log errors for non-error conditions.

## Philosophy

Browser startup and asset preloading are slow, so prefer one long scenario with many assertions over many small tests. Add assertions to `smoke.spec.ts` rather than adding new spec files unless the scenario is genuinely different.

## Screenshots

Tests write screenshots to `tests/output/` (gitignored). `tests/reference/` holds committed screenshots of known-good output for the same seed, and benchmark numbers from before and after the engine port (same machine). They are for comparing by eye (or by an agent reading the images) after rendering changes — they are not pixel-diffed, because effects and AI are not frame-deterministic. When rendering changes intentionally, copy the new output over the references.
