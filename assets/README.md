# Assets

Nothing in here ships. What ships is in `resources/` (preloaded, so only files the game uses), and art the game draws from SVG at runtime lives next to the code that uses it in `src/` (`src/highrise/looks/pieces/`, `src/highrise/looks/hats/`).

- `source/` — what shipped files are made from
  - `images/` — design files, sorted the way `resources/images/` is: `characters/`, `enemies/`, `environment/`, `effects/`, `items/`, `weapons/`. Most are Affinity Designer files (`.afdesign`), kept for reference; art made from now on is SVG. Also `textures/` (photo textures and the skin material pack some images were made from) and `kenney-vectors/` (Kenney's vector packs, with their license)
  - `foley/` — raw recordings that sounds in `resources/audio/` were cut from
  - `voices/<character>/` — disabled voice clips, kept for comparing (the character editor moves clips between here and `resources/audio/characters/`)
- `unused/` — images, audio and fonts the game doesn't use now
- `IMAGE_SOURCES.md` — where each shipped image came from, for the credits. Add a row when adding an image

SVGs drawn for images that ship as PNGs are rendered with `bin/render-svg.ts`.
