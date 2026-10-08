/**
 * The FN P90 from its right side: black polymer, the standard model with its ring sight and the rails on top. Drawn in the pixels of its photo (1920 by 949) by named numbers, following the gun-art skill
 * (.claude/skills/gun-art/SKILL.md), with guns/m1911.ts as the worked example. A draft until it goes into the game.
 */
import type { GunDrawing } from "../lib/gun";

function drawSide(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="949" viewBox="0 0 1920 949" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
</svg>`;
}

export const P90: GunDrawing = {
  name: "p90",
  draft: true,
  photo: {
    file: "p90.webp",
    width: 1920,
    height: 949,
    about:
      "A P90 from its right side, muzzle to the right, on a transparent (shown black) background; the magazine's rounds show through",
  },
  // Rough, to be measured: the origin on the gun's middle on the bore, and the real gun (500 mm long, to be
  // checked) over its length in the photo
  scale: { origin: [960, 474], mmPerPixel: 1 },
  // Rough, to be measured: the gun's extent in the photo, and the square round it in millimeters (a little more
  // than its length)
  frame: {
    top: 0,
    bottom: 949,
    back: 0,
    front: 1920,
    side: 1920,
    pixels: 512,
  },
  comment: `
  <!-- The FN P90 from its right side, muzzle to the right. Millimeters, with the origin on the gun's middle on the bore,
       as the guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
};
