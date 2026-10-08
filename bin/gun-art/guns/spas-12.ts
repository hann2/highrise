/**
 * The Franchi SPAS-12 from its right side, with no stock (Simon: it looks most like a zombie film that way): its pistol grip, the perforated heat shield and the ribbed pump. Drawn in the pixels of its photo (2400 by 1350) by named numbers, following the gun-art skill
 * (.claude/skills/gun-art/SKILL.md), with guns/m1911.ts as the worked example. A draft until it goes into the game.
 */
import type { GunDrawing } from "../lib/gun";

function drawSide(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1350" viewBox="0 0 2400 1350" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
</svg>`;
}

export const SPAS_12: GunDrawing = {
  name: "spas-12",
  draft: true,
  photo: {
    file: "spas-12-unfolded.jpg",
    width: 2400,
    height: 1350,
    about:
      "A SPAS-12 from its right side with its stock out, muzzle to the right, on white, evenly lit; drawn without the stock",
  },
  otherPhotos: [
    {
      file: "spas-12-folded.webp",
      width: 2000,
      height: 2000,
      about:
        "A SPAS-12 render with its stock folded over the top: the receiver's back, the grip",
    },
    {
      file: "model",
      width: 0,
      height: 0,
      about:
        "A 3D model with no stock (Sketchfab, CC-BY-NC; reference only): render it with `model spas-12` (from +z is the right side, from +y above, from -x behind)",
    },
  ],
  // Rough, to be measured: the origin on the gun's middle on the bore, and the real gun (about 790 mm long without its stock, to be
  // checked) over its length in the photo
  scale: { origin: [1200, 675], mmPerPixel: 1 },
  // Rough, to be measured: the gun's extent in the photo, and the square round it in millimeters (a little more
  // than its length)
  frame: {
    top: 0,
    bottom: 1350,
    back: 0,
    front: 2400,
    side: 2400,
    pixels: 512,
  },
  comment: `
  <!-- The Franchi SPAS-12 from its right side, with no stock (Simon, muzzle to the right. Millimeters, with the origin on the gun's middle on the bore,
       as the guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
};
