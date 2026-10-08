/**
 * The AR-15 from its right side: a Knight's Armament SR-15 carbine (the base photo) with an M-LOK rail, a Magpul
 * DT-PR Carbine stock and a Vortex AMG UH-1 Gen II holographic sight, each from its own photo. Drawn in the pixels
 * of the base photo (2000 by 2000) by named numbers, following the gun-art skill (.claude/skills/gun-art/SKILL.md),
 * with guns/m1911.ts as the worked example. A draft until it goes into the game.
 */
import type { GunDrawing } from "../lib/gun";

function drawSide(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2000" viewBox="0 0 2000 2000" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
</svg>`;
}

export const AR_15: GunDrawing = {
  name: "ar-15",
  draft: true,
  photo: {
    file: "ar-15.jpg",
    width: 2000,
    height: 2000,
    about:
      "A Knight's Armament SR-15 carbine from its right side, muzzle to the right, on white, evenly lit: the base, but its stock and sights aren't the ones we draw",
  },
  otherPhotos: [
    {
      file: "ar-15-stock.jpg",
      width: 1200,
      height: 1200,
      about:
        "The Magpul DT-PR Carbine stock on its own, from its left side (butt to the right): mirror it onto the base photo's buffer tube",
    },
    {
      file: "ar-15-optic.webp",
      width: 1000,
      height: 1000,
      about:
        "The Vortex AMG UH-1 Gen II from one side, on a transparent background",
    },
    {
      file: "ar-15-optic-alternate.jpg",
      width: 1200,
      height: 1200,
      about:
        "The Vortex AMG UH-1 Gen II from its other side, with its quick-detach lever",
    },
  ],
  // Rough, to be measured: the origin on the gun's middle on the bore, and the real gun (to be checked) over its
  // length in the photo
  scale: { origin: [1000, 1000], mmPerPixel: 1 },
  // Rough, to be measured: the gun's extent in the photo, and the square round it in millimeters (a little more
  // than its length)
  frame: {
    top: 0,
    bottom: 2000,
    back: 0,
    front: 2000,
    side: 2000,
    pixels: 512,
  },
  comment: `
  <!-- The AR-15 from its right side, muzzle to the right. Millimeters, with the origin on the gun's middle on the
       bore, as the guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
};
