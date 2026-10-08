/**
 * The AK-47 from its right side: a classic milled AK-47 with wooden stock, pistol grip and handguard, and a steel magazine. Drawn in the pixels of its photo (1920 by 1200) by named numbers, following the gun-art skill
 * (.claude/skills/gun-art/SKILL.md), with guns/m1911.ts as the worked example. A draft until it goes into the game.
 */
import type { GunDrawing } from "../lib/gun";

function drawSide(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1200" viewBox="0 0 1920 1200" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
</svg>`;
}

export const AK_47: GunDrawing = {
  name: "ak-47",
  draft: true,
  photo: {
    file: "ak-47-worn.jpg",
    width: 1920,
    height: 1200,
    about:
      "A worn real AK-47 from its right side, muzzle to the right, on white, evenly lit: dark wood, a taped magazine and a sticker (drawn clean)",
  },
  otherPhotos: [
    {
      file: "ak-47.jpg",
      width: 900,
      height: 332,
      about:
        "Another AK-47 from its right side, cleaner and lighter wood, smaller",
    },
    {
      file: "model",
      width: 0,
      height: 0,
      about:
        "A 3D model (Sketchfab, standard license; reference only): render it with `model ak-47` (from +y is above, from -x behind); the gun is along z, up +y",
    },
    {
      file: "model-ak-47s-scifi",
      width: 0,
      height: 0,
      about:
        "A stylized AK-47S model: not the gun we're drawing, only a last resort for shapes",
    },
  ],
  // Rough, to be measured: the origin on the gun's middle on the bore, and the real gun (about 880 mm long, to be
  // checked) over its length in the photo
  scale: { origin: [960, 600], mmPerPixel: 1 },
  // Rough, to be measured: the gun's extent in the photo, and the square round it in millimeters (a little more
  // than its length)
  frame: {
    top: 0,
    bottom: 1200,
    back: 0,
    front: 1920,
    side: 1920,
    pixels: 512,
  },
  comment: `
  <!-- The AK-47 from its right side, muzzle to the right. Millimeters, with the origin on the gun's middle on the bore,
       as the guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
};
