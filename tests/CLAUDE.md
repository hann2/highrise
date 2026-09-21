# Tests

Playwright end-to-end tests that run the real game in headless Chrome (with GPU).

- `npm test` — smoke test. Run this after any non-trivial change; it is the main way to tell "compiles" from "works".
- `npm run benchmark` — seeded frame-time benchmark. Writes `tests/output/benchmark.json`. Numbers are only comparable on the same machine.

Both start their own dev server on port 3456, so they can run while `npm start` is running.

## How tests drive the game

- `?seed=123` in the URL seeds `core/util/Random.ts`, making level generation reproducible.
- `window.DEBUG.game` exposes the `Game`. Tests find things with `entities.getById(...)` (`main_menu`, `party_manager`, `level_controller`) and `entities.getTagged(...)` (`human`, `zombie`).
- Dev-only cheat keys from `CheatController` are used for flow control: `KeyL` completes the level, `KeyV` toggles the vision mask.
- Any `pageerror` or `console.error` fails the test. Don't log errors for non-error conditions.

## Philosophy

Browser startup and asset preloading are slow, so prefer one long scenario with many assertions over many small tests. Add assertions to `smoke.spec.ts` rather than adding new spec files unless the scenario is genuinely different.

## Screenshots

Tests write screenshots to `tests/output/` (gitignored). `tests/reference/` holds committed screenshots of known-good output for the same seed. They are for comparing by eye (or by an agent reading the images) after rendering changes — they are not pixel-diffed, because effects and AI are not frame-deterministic. When rendering changes intentionally, copy the new output over the references.
