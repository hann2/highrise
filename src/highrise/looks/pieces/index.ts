import type { HatStyle } from "../BodyLook";
import { registerHatDrawing, registerPiece } from "../pieces";

/*
 * Registers every piece in `head/` and `torso/`, and the hand-drawn hats in
 * `../hats/` (the game and the character
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

const hats = import.meta.glob<string>("../hats/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

for (const [path, svg] of Object.entries(hats)) {
  const style = path.match(/([^/]+)\.svg$/)![1];
  registerHatDrawing(style as HatStyle, svg);
}
