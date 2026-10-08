/**
 * The Remington 870 Marine Magnum from its right side: nickel receiver, barrel and magazine tube, black synthetic stock and ribbed pump, an 18-inch barrel. Drawn in the pixels of its photo (738 by 222) by named numbers, following the gun-art skill
 * (.claude/skills/gun-art/SKILL.md), with guns/m1911.ts as the worked example. A draft until it goes into the game.
 */
import type { GunDrawing } from "../lib/gun";

function drawSide(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="738" height="222" viewBox="0 0 738 222" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
</svg>`;
}

export const REMINGTON_870: GunDrawing = {
  name: "remington-870",
  draft: true,
  photo: {
    file: "remington-870-marine.jpeg",
    width: 738,
    height: 222,
    about:
      "The 870 Marine Magnum from its right side, muzzle to the right, on white: small",
  },
  otherPhotos: [
    {
      file: "remington-870-black-and-wood.jpg",
      width: 1200,
      height: 312,
      about:
        "An 870 Express with a blued receiver and wooden stock and pump, a long barrel with a vent rib: the receiver, trigger group and stock's shapes at a better size (and a finish for a skin later)",
    },
    {
      file: "remington-870-tactical.jpg",
      width: 1000,
      height: 244,
      about:
        "A tactical 870 with a Magpul stock and pump: same receiver (and a finish for a skin later)",
    },
  ],
  // Rough, to be measured: the origin on the gun's middle on the bore, and the real gun (about 970 mm long with its 18" barrel, to be
  // checked) over its length in the photo
  scale: { origin: [369, 111], mmPerPixel: 1 },
  // Rough, to be measured: the gun's extent in the photo, and the square round it in millimeters (a little more
  // than its length)
  frame: {
    top: 0,
    bottom: 222,
    back: 0,
    front: 738,
    side: 738,
    pixels: 512,
  },
  comment: `
  <!-- The Remington 870 Marine Magnum from its right side, muzzle to the right. Millimeters, with the origin on the gun's middle on the bore,
       as the guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
};
