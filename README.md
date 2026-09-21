# Highrise

A top-down zombie shooter that runs in the browser.

## How to run it

1. Install a recent version of [node.js](https://nodejs.org/) (see `.nvmrc`)
2. Run `npm ci`
3. Run `npm start` to start the development server at http://localhost:1234

Other useful commands:

- `npm run build` outputs a production build to `dist/`
- `npm run tsc` runs the type checker
- `npm test` runs the end-to-end smoke test (it plays the real game in a headless browser)
- `npm run test:physics` runs the physics engine tests
- `npm run benchmark` runs a seeded performance benchmark

## Structure

- `src/core/` — the game engine (entities, events, rendering on [Pixi.js](https://pixijs.com/), a custom 2D physics engine, input, sound)
- `src/config/` — how this game configures the engine (layers, events, collision groups)
- `src/highrise/` — the game itself
- `resources/` — the images, sounds, and fonts that ship with the game. Adding a file here makes it available by name in code (`npm start` keeps `resources/resources.ts` up to date)
- `assets/` — source files and unused assets that don't ship
- `notes/` — design notes and ideas

See `CLAUDE.md` for a more detailed tour of the code and its conventions.
