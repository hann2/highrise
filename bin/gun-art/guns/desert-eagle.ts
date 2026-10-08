/**
 * The Desert Eagle from its right side: a Desert Eagle Mark XIX in .50 AE, 6\" barrel, polished stainless, very shiny. Drawn in the pixels of its photo
 * (1920 by 1151) by named numbers, following the gun-art skill (.claude/skills/gun-art/SKILL.md), with
 * guns/m1911.ts as the worked example. A draft until it goes into the game.
 */
import type { GunDrawing } from "../lib/gun";

function drawSide(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1151" viewBox="0 0 1920 1151" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
</svg>`;
}

export const DESERT_EAGLE: GunDrawing = {
  name: "desert-eagle",
  draft: true,
  photo: {
    file: "desert-eagle.png",
    width: 1920,
    height: 1151,
    about:
      "A stainless Desert Eagle from its right side, muzzle to the right, on a transparent background: brushed rather than polished, and with a muzzle brake",
  },
  otherPhotos: [
    {
      file: "desert-eagle-alternate.jpg",
      width: 4032,
      height: 3024,
      about:
        "From the right and above, from behind: the slide's top and rail, the hammer, the grip's width",
    },
  ],
  // Rough, to be measured: the origin on the gun's middle on the bore, and the real gun, 273 mm long (the Mark XIX's length with a 6\" barrel, to be checked against the brake), over
  // the gun's length in the photo, about 1850 px
  scale: { origin: [960, 230], mmPerPixel: 273 / 1850 },
  // Rough, to be measured: the gun's extent in the photo, and the square round it in millimeters (a little more
  // than its length)
  frame: {
    top: 30,
    bottom: 1110,
    back: 30,
    front: 1890,
    side: 224,
    pixels: 256,
  },
  comment: `
  <!-- The Desert Eagle from its right side, muzzle to the right. Millimeters, with the origin on the gun's
       middle on the bore, as the guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
};
