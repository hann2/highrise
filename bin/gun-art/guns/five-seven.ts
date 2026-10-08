/**
 * The Five-seven from its right side: an FN Five-seven MK3 (MRD), flat dark earth frame and slide. Drawn in the pixels of its photo
 * (2560 by 1967) by named numbers, following the gun-art skill (.claude/skills/gun-art/SKILL.md), with
 * guns/m1911.ts as the worked example. A draft until it goes into the game.
 */
import type { GunDrawing } from "../lib/gun";

function drawSide(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2560" height="1967" viewBox="0 0 2560 1967" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
</svg>`;
}

export const FIVE_SEVEN: GunDrawing = {
  name: "five-seven",
  draft: true,
  photo: {
    file: "five-seven-mk3.webp",
    width: 2560,
    height: 1967,
    about:
      "An FDE Five-seven MK3 from its right side, muzzle to the right, on white, with a red dot sight mounted (draw it without: the optic plate's cover and rear sight, as in the third photo)",
  },
  otherPhotos: [
    {
      file: "five-seven-mk3-alternate.webp",
      width: 2060,
      height: 2400,
      about:
        "From the left, front three quarters, with the red dot: the left side's controls, the slide's top, the grip's width",
    },
    {
      file: "five-seven-mk3-alternate-2.webp",
      width: 1280,
      height: 907,
      about:
        "From the right, front three quarters, without an optic: the rear sight and the slide's top, the muzzle",
    },
  ],
  // Rough, to be measured: the origin on the gun's middle on the bore, and the real gun, 208 mm long (the MK3's length, to be checked), over
  // the gun's length in the photo, about 2290 px
  scale: { origin: [1300, 420], mmPerPixel: 208 / 2290 },
  // Rough, to be measured: the gun's extent in the photo, and the square round it in millimeters (a little more
  // than its length)
  frame: {
    top: 200,
    bottom: 1880,
    back: 160,
    front: 2450,
    side: 224,
    pixels: 256,
  },
  comment: `
  <!-- The Five-seven from its right side, muzzle to the right. Millimeters, with the origin on the gun's
       middle on the bore, as the guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
};
