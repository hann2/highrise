/**
 * The revolver from its right side: a Smith & Wesson Model 629 (.44 Magnum), polished stainless, very shiny. Drawn in the pixels of its photo
 * (1800 by 863) by named numbers, following the gun-art skill (.claude/skills/gun-art/SKILL.md), with
 * guns/m1911.ts as the worked example. A draft until it goes into the game.
 */
import type { GunDrawing } from "../lib/gun";

function drawSide(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="863" viewBox="0 0 1800 863" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
</svg>`;
}

export const REVOLVER: GunDrawing = {
  name: "revolver",
  draft: true,
  photo: {
    file: "sw-629-mirrored.jpg",
    width: 1800,
    height: 863,
    about:
      "An 8 3/8\" stainless 629 with target wood grips from its LEFT side, mirrored so the muzzle is to the right (sw-629.jpg is the original): its cylinder release and the left side's details show",
  },
  otherPhotos: [
    {
      file: "sw-629.jpg",
      width: 1800,
      height: 863,
      about: "The same, unmirrored (its left side, muzzle to the left)",
    },
    {
      file: "sw-629-alternate.jpg",
      width: 2100,
      height: 1576,
      about:
        "An 8 3/8\" 629 from the left and in front: the cylinder's flutes and chambers, the barrel's taper and rib, the grip's shape",
    },
    {
      file: "sw-629-rosewood-grip.jpg",
      width: 1200,
      height: 1200,
      about:
        'A 629 Classic (6 1/2", full underlug, not ours) from its right side: the right side of the frame and side plate, the hammer, the trigger',
    },
  ],
  // Rough, to be measured: the origin on the gun's middle on the bore, and the real gun, 349 mm long (the 8 3/8\" 629's length, to be checked), over
  // the gun's length in the photo, about 1680 px
  scale: { origin: [900, 200], mmPerPixel: 349 / 1680 },
  // Rough, to be measured: the gun's extent in the photo, and the square round it in millimeters (a little more
  // than its length)
  frame: {
    top: 50,
    bottom: 800,
    back: 60,
    front: 1740,
    side: 224,
    pixels: 256,
  },
  comment: `
  <!-- The revolver from its right side, muzzle to the right. Millimeters, with the origin on the gun's
       middle on the bore, as the guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
};
