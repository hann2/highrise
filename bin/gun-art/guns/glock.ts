/**
 * The Glock 19 from its right side: a Glock 19 (Gen 5), black polymer frame, black slide. Drawn in the pixels of its photo
 * (1500 by 1051) by named numbers, following the gun-art skill (.claude/skills/gun-art/SKILL.md), with
 * guns/m1911.ts as the worked example. A draft until it goes into the game.
 */
import type { GunDrawing } from "../lib/gun";

function drawSide(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1051" viewBox="0 0 1500 1051" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
</svg>`;
}

export const GLOCK: GunDrawing = {
  name: "glock",
  draft: true,
  photo: {
    file: "glock-19.webp",
    width: 1500,
    height: 1051,
    about:
      "A Gen 5 Glock 19 from its right side, muzzle to the right, on white, evenly lit",
  },
  otherPhotos: [
    {
      file: "glock-19-alternate.jpg",
      width: 776,
      height: 776,
      about:
        "From behind and a little above: the widths of the slide, frame and grip, the rear sight",
    },
  ],
  // Rough, to be measured: the origin on the gun's middle on the bore, and the real gun, 185 mm long (a Glock 19's length, to be checked), over
  // the gun's length in the photo, about 1385 px
  scale: { origin: [760, 240], mmPerPixel: 185 / 1385 },
  // Rough, to be measured: the gun's extent in the photo, and the square round it in millimeters (a little more
  // than its length)
  frame: {
    top: 40,
    bottom: 1010,
    back: 70,
    front: 1460,
    side: 224,
    pixels: 256,
  },
  comment: `
  <!-- The Glock 19 from its right side, muzzle to the right. Millimeters, with the origin on the gun's
       middle on the bore, as the guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
};
