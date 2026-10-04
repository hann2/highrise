import { registerPiece } from "../pieces";

/*
 * Registers every piece in `head/` and `torso/` (the game and the character
 * editor import this; node scripts read the files themselves, see
 * `bin/look-sheet.ts`).
 */

const files = import.meta.glob<string>(["./head/*.svg", "./torso/*.svg"], {
  query: "?raw",
  import: "default",
  eager: true,
});

for (const [path, svg] of Object.entries(files)) {
  const [, place, name] = path.match(/^\.\/(head|torso)\/(.+)\.svg$/)!;
  registerPiece(name, place as "head" | "torso", svg);
}
