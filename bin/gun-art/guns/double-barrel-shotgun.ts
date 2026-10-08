/**
 * A sawn-off side-by-side shotgun from its right side, cut from a coach gun with exposed hammers: blued barrels and steel, a case-hardened lock plate, walnut. Drawn in the pixels of its photo (2200 by 1650) by named numbers, following the gun-art skill
 * (.claude/skills/gun-art/SKILL.md), with guns/m1911.ts as the worked example. A draft until it goes into the game.
 */
import type { GunDrawing } from "../lib/gun";

function drawSide(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="1650" viewBox="0 0 2200 1650" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
</svg>`;
}

export const DOUBLE_BARREL_SHOTGUN: GunDrawing = {
  name: "double-barrel-shotgun",
  draft: true,
  photo: {
    file: "hammer-coach-gun.png",
    width: 2200,
    height: 1650,
    about:
      "A side-by-side coach gun with exposed hammers from its right side, muzzle to the right, on white, evenly lit (converted from hammer-coach-gun.avif); the barrels to be cut to about 12 inches",
  },
  otherPhotos: [
    {
      file: "stoeger-coach-gun.png",
      width: 2200,
      height: 1650,
      about:
        "A Stoeger Coach Gun (hammerless) from its right side: the action, triggers and forend, cleanly lit",
    },
    {
      file: "old-hammerless.jpg",
      width: 1000,
      height: 687,
      about: "A worn old hammerless side-by-side, reddish wood",
    },
    {
      file: "percussion-double.png",
      width: 2200,
      height: 1650,
      about: "A percussion double (muzzleloader): hammers and lock plate only",
    },
  ],
  // Rough, to be measured: the origin on the gun's middle on the bore, and the real gun (about 20" barrels as photographed, 37" overall; cut down, about 12" barrels, to be
  // checked) over its length in the photo
  scale: { origin: [1100, 825], mmPerPixel: 1 },
  // Rough, to be measured: the gun's extent in the photo, and the square round it in millimeters (a little more
  // than its length)
  frame: {
    top: 0,
    bottom: 1650,
    back: 0,
    front: 2200,
    side: 2200,
    pixels: 512,
  },
  comment: `
  <!-- A sawn-off side-by-side shotgun from its right side, cut from a coach gun with exposed hammers, muzzle to the right. Millimeters, with the origin on the gun's middle on the bore,
       as the guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
};
