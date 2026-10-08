/**
 * The Desert Eagle from its right side: a Desert Eagle Mark XIX in .50 AE, 6" barrel, polished stainless, very
 * shiny. Drawn in the pixels of its photo (1920 by 1151) by named numbers, following the gun-art skill
 * (.claude/skills/gun-art/SKILL.md), with guns/m1911.ts as the worked example. A draft until it goes into the game.
 *
 * Round 1: construction notes and a blockout (each part's silhouette, flat colors, no shading or detail yet).
 *
 * ## Dimensions
 *
 * The DE50SRMB (Mark XIX, .50 AE, stainless, 6" barrel with the integral muzzle brake, the gun in the photo) is
 * 10.75" (273 mm) long, 6.25" (159 mm) high and 1.25" (32 mm) wide, barrel 6" (152 mm), by Magnum Research's
 * spec as retailers list it (Kinsey's, Athlon Outdoors); the brake doesn't add length. In the photo the gun runs
 * from the beavertail's tip (x 31) to the muzzle (x 1888): 1857 px, so 0.1470 mm a pixel. Checked against the
 * height: the rear sight's top (y 52) to the magazine's base (y 1113) is 1061 px, 156 mm against 159 on paper
 * (1.8% short; the spec rounds, and the front sight's top, y 36, makes it 158.6). The barrel from the slide's
 * front face to the muzzle is 1072 px, 158 mm: the 152 mm barrel starts inside the slide, at the chamber, so
 * what shows of it is a little shorter than the whole; consistent. The slide (its back to its arms' front ends)
 * is x 210 to 1683, 1473 px, 217 mm. The photo is tilted a hair (the slide's bottom drops 5 px over 1000, 0.3°),
 * drawn level.
 *
 * ## Construction (how it's built, from the gridded photos: desert-eagle-grid-*.png)
 *
 * The Desert Eagle isn't built like other pistols: the barrel is fixed on top of the frame, and the slide runs
 * under and behind it. Three big steel parts, front to back and top to bottom:
 *
 * - **The barrel** (fixed, polygonal, not a tube): from the slide's front face (x 816) to the muzzle (x 1888).
 *   Its top is a rail of cross slots (8 slots, x 1122 to 1672, 36 px wide every 73.5, lugs' tops at y 90, slots'
 *   bottoms at y 115), plain from the last slot to the muzzle (y 95), with the front sight in a dovetail near the
 *   muzzle. Its side is one long flat face (the "long flat face"), from the rail's base (a step at y 118) down to
 *   the seam with the slide (the groove, a dark line at y 205 to 212). At its back the flat runs out into the
 *   round of the chamber in a sweeping concave curve, from (1040, 119) back and down to (840, 205): behind it,
 *   the barrel is round, and shaded as a cylinder, where it goes into the slide. Ahead of the slide's arm (x 1683
 *   on) the barrel's flat face goes all the way down: its nose is a block from y 95 to 345 (and its foot, x 1767
 *   to 1830, down to 381, in front of the frame), the front chamfered back from (1882, 200) to (1830, 381), with
 *   a lower chamfer band along its bottom (y 336 to 345). The muzzle brake is four ports through the barrel's
 *   upper side near the muzzle, stadiums ("pills") 31 px wide every 41.3, from y 105 to 181, open toward the top
 *   (the photo from above shows them as J-shaped slots coming over the edge). The bore's axis is the ports'
 *   middle, and the round chamber's (y 89 to 214) about: y 147.
 * - **The slide**: a block at the back (x 210 to 816, y 80 to 347) and two long arms either side of the barrel's
 *   flat face, below the seam (y 208 to 347), out to x 1683, where each arm ends in a square front face (the
 *   vertical line at x 1683). So under the barrel's flat face, the long lower panel with the engraving is the
 *   slide, not the barrel. The block's top steps down at its back: level at y 80 to x 560, then a slope down to
 *   y 101 at x 420, and a rounded corner over to its back face (322, 112). The back face leans back going down
 *   (from (269, 160) to (210, 347)), with a lit chamfer along it. The rear sight sits in a dovetail across the
 *   top (x 333 to 415, top y 52), a square-backed blade sloping down to the front.
 *   On its back half the slide is cut into a recess (a lower plane, matte in the photo) round the safety: from
 *   (320, 120) to (540, 255), rounded at the front bottom. The safety lever lies in it: a round hub (center
 *   (376, 184), r 53) with a slotted screw (r 25) and an arm forward to x 540 along y 131, with a raised thumb
 *   pad on its front end. Serrations: 13 grooves leaning back going down (-0.25 x per y), 35.8 px apart, from
 *   the slide's bottom up to y 165 (cut short by the recess under the safety), the front one ending on a line
 *   from (775, 165) to (730, 347).
 * - **The frame**: everything below y 347. Under the barrel, a dust cover (y 347 to 381, ending at x 1766 in a
 *   front face, with the recoil spring guide rod's black tip poking out of it at (1770 to 1792, 349 to 368)),
 *   and below it an accessory rail (y 381 to 420, rounded at its back end at x 1040) with 11 lugs underneath
 *   (35 px wide every 67.3, from x 1043, down to y 445). Behind that, the trigger guard: square-ish, its front
 *   nearly vertical (x 1004 to 991, from the rail down to its bottom at y 646), round at the bottom front, its
 *   bottom straight back into the front strap. The opening is a rounded rectangle, square at its front (x 964),
 *   flat on top and bottom (y 433, 615), round at the back (x 700). The face round the trigger is two planes like
 *   the M1911's: the frame's flat face (brushed), ending at an edge round the back of the opening; below it the
 *   guard and a band round the opening's back (matte, a lower plane). The grip: the front strap leans back by
 *   -0.2 (x per y), the same as the grip panel's front edge, and flares forward at the bottom (from y 1000) into
 *   the frame's foot; the frame wraps under the grip (y 1018 to 1078, its back corner chamfered from (157, 1040)
 *   to (243, 1080)). The beavertail (tang) reaches back to (31, 400), its underside sweeping down into the grip.
 *   The frame rises behind the hammer to (212, 268), so the hammer sits in a slot in the frame's top.
 *
 * Standing proud, on top of those:
 * - **The grip panel**: black rubber, one piece wrapped round the back strap (so from y 590 down the gun's back
 *   edge is the rubber, not the frame). Its top is notched round the frame: up to just under the slide at its
 *   back (y 349, x 380 to 463), down a step at x 463 to y 415 forward to its front (668, 415) (the serial number's
 *   on the frame ahead of the notch). Its front edge straight at -0.2, its bottom at y 1018 (the frame below),
 *   its back a long curve, the palm swell: -0.3 at the top, -0.45 in the middle, vertical at the bottom. Its
 *   stippling is in two diagonal bands and a medallion with the eagle: at 128 px, at most a hint (a lighter band
 *   or two), probably nothing. One screw (243, 840).
 * - **Black parts** (blued or black oxide on the stainless): the hammer (spur with teeth, round at the back), the
 *   rear and front sights, the safety lever and its screw, the slide stop (a lever over the trigger guard's top
 *   front, x 876 to 1007, y 353 to 453, pivoting on a round pin at (978, 435), r 18), the trigger (a crescent,
 *   its back at x 717, its tip at (798, 604), going into the frame at the opening's top), the magazine catch
 *   (a small round button with a slot by the panel's front, (690, 575)), the magazine and its base plate (y 1092
 *   to 1113, x 272 to 640, with a lip to 650), and the guide rod's tip.
 *
 * What goes through what: the trigger goes up into the frame and shows through the opening; the slide stop's
 * lever lies on the frame face, its pin through the frame; the barrel's round back goes into the slide's front
 * face; the magazine's base is below the frame's foot, not flush (a gap with the magazine's dark body showing,
 * y 1077 to 1092).
 *
 * At 128 px (about 7 px per cm) these survive: the barrel's rail slots (8, each 2.5 px), the brake's 4 ports,
 * the seam between barrel and slide, the slide arms' front step, the serrations (13 at 2.5 px: maybe as fewer,
 * or as a tone), the safety lever, the black hammer and sights, the trigger and guard, the accessory rail's lugs,
 * the black grip and the magazine base. These go: the engraving and serial number, the grip's stippling and
 * medallion, the red dot by the safety, the pins smaller than about 10 px, the sights' dovetails.
 */
import type { Point } from "../lib/geometry";
import { arc, fmt, on, rounded, smoothCurve } from "../lib/geometry";
import type { GunDrawing } from "../lib/gun";
import {
  BLACK_POLYMER,
  BLUED_STEEL,
  POLISHED_STAINLESS,
} from "../lib/style";

// Blockout colors: one flat tone per part, so the parts read apart
const BARREL_COLOR = POLISHED_STAINLESS.light;
const SLIDE_COLOR = POLISHED_STAINLESS.base;
const FRAME_COLOR = POLISHED_STAINLESS.dark;
const BLACK = BLUED_STEEL.dark;
const BLACK_PART = BLUED_STEEL.base;
const RUBBER = BLACK_POLYMER.base;

// ---------------------------------------------------------------------------------------------------------
// The barrel: fixed, its top a rail of cross slots, its side one long flat face down to the seam with the slide

const BARREL_BACK = 816; // the slide's front face, where the barrel comes out
const MUZZLE = 1888; // the chamfered nose's furthest point
const BARREL_FRONT = 1882; // the front face, above the chamfer
const RAIL_TOP = 90; // the rail's lugs
const SLOT_BOTTOM = 115;
const BARREL_TOP_FRONT = 95; // plain from the last slot to the muzzle
const SLOTS = 8;
const FIRST_SLOT = 1122;
const SLOT_WIDTH = 36;
const SLOT_PITCH = 73.5;
const LAST_SLOT_END = FIRST_SLOT + (SLOTS - 1) * SLOT_PITCH + SLOT_WIDTH;
const BARREL_FOOT = 381; // the nose's foot, in front of the frame
const FOOT_BACK = 1767; // the frame's front face, behind the foot
const NOSE_BOTTOM = 345; // the nose's bottom between the slide's arms and the foot
const CHAMFER_TOP: Point = [MUZZLE, 225]; // where the front chamfer starts
const FOOT_CORNER: Point = [1830, BARREL_FOOT];

/** The barrel's top, from its back to its front, down into each slot of the rail */
function barrelTop(): string {
  const parts = [`M${BARREL_BACK},${RAIL_TOP + 2}`];
  for (let i = 0; i < SLOTS; i++) {
    const x0 = FIRST_SLOT + i * SLOT_PITCH;
    const x1 = x0 + SLOT_WIDTH;
    parts.push(
      `L${x0},${RAIL_TOP} L${x0},${SLOT_BOTTOM} L${x1},${SLOT_BOTTOM} L${x1},${i === SLOTS - 1 ? BARREL_TOP_FRONT : RAIL_TOP}`,
    );
  }
  return parts.join(" ");
}

const BARREL =
  `${barrelTop()} L${BARREL_FRONT - 8},${BARREL_TOP_FRONT} ` +
  `C${BARREL_FRONT - 3},${BARREL_TOP_FRONT} ${BARREL_FRONT},${BARREL_TOP_FRONT + 3} ${BARREL_FRONT},${BARREL_TOP_FRONT + 8} ` +
  `L${BARREL_FRONT},200 C${BARREL_FRONT + 2},208 ${MUZZLE},215 ${fmt(CHAMFER_TOP)} ` +
  `L${FOOT_CORNER[0] + 4},${BARREL_FOOT - 6} C${FOOT_CORNER[0] + 2},${BARREL_FOOT - 2} ${FOOT_CORNER[0]},${BARREL_FOOT} ${FOOT_CORNER[0] - 4},${BARREL_FOOT} ` +
  `L${FOOT_BACK},${BARREL_FOOT} L${FOOT_BACK},${NOSE_BOTTOM} L${BARREL_BACK},${NOSE_BOTTOM} Z`;

// The muzzle brake: four ports through the barrel's side near the muzzle, pills with round ends
const PORTS = 4;
const PORT_BACK = 1714; // the first port's back edge
const PORT_WIDTH = 31;
const PORT_PITCH = 41.3;
const PORT_TOP = 105;
const PORT_BOTTOM = 181;

function port(i: number): string {
  const r = PORT_WIDTH / 2;
  const cx = PORT_BACK + i * PORT_PITCH + r;
  const top: Point = [cx, PORT_TOP + r];
  const bottom: Point = [cx, PORT_BOTTOM - r];
  return (
    `M${fmt(on(top, r, 180))} ${arc(top, r, 180, 360)} L${fmt(on(bottom, r, 0))} ` +
    `${arc(bottom, r, 0, 180)} Z`
  );
}

// The front sight: a blade sloping up to a square front, in a dovetail across the barrel near the muzzle
const FRONT_SIGHT = "M1772,88 L1772,74 C1790,60 1808,46 1822,38 C1826,36 1830,36 1834,36 L1852,36 L1852,88 Z";

// ---------------------------------------------------------------------------------------------------------
// The slide: a block at the back, and arms either side of the barrel below the seam, out to ARM_FRONT

const SLIDE_TOP = 80;
const SLIDE_BOTTOM = 347;
const SEAM = 208; // the slide arms' top, under the barrel's flat face
const ARM_FRONT = 1683;
// The block's top steps down at its back: level to STEP, sloping to the back corner
const STEP: Point = [560, SLIDE_TOP];
const BACK_TOP: Point = [420, 101];
const BACK_CORNER: Point = [322, 112];
// The back face, leaning back going down (measured along rows)
const SLIDE_BACK_POINTS: Point[] = [
  [300, 130],
  [269, 160],
  [259, 200],
  [250, 240],
  [238, 280],
  [221, 320],
  [210, SLIDE_BOTTOM],
];

const SLIDE =
  `M${fmt(STEP)} L${BARREL_BACK},${SLIDE_TOP} L${BARREL_BACK},${SEAM} L${ARM_FRONT},${SEAM} ` +
  `L${ARM_FRONT},${SLIDE_BOTTOM} L${fmt(SLIDE_BACK_POINTS[SLIDE_BACK_POINTS.length - 1])} ` +
  smoothCurve(
    [...SLIDE_BACK_POINTS].reverse().concat([BACK_CORNER]),
    [0.4, -1],
    [1, -0.4],
  ) +
  ` L${fmt(BACK_TOP)} C460,96 520,${SLIDE_TOP} ${fmt(STEP)} Z`;

// The rear sight: a square-backed blade sloping down to the front, its dovetail across the slide's top
const REAR_SIGHT =
  "M333,104 L333,56 C333,54 334,52 337,52 L365,52 L400,80 L415,98 L415,104 Z M346,104 L398,104 L406,118 L340,118 Z";

// The safety: a round hub with a slotted screw, an arm forward along the recess, a raised pad on its end
const SAFETY_HUB: Point = [376, 184];
const SAFETY_HUB_R = 53;
const SAFETY_SCREW_R = 25;
const SAFETY_ARM_TOP = 131;
const SAFETY_END: Point = [520, 157]; // the round end's center
const SAFETY_END_R = 26;
const SAFETY =
  `M${fmt(on(SAFETY_HUB, SAFETY_HUB_R, 120))} ${arc(SAFETY_HUB, SAFETY_HUB_R, 120, 270)} ` +
  `L${SAFETY_END[0]},${SAFETY_ARM_TOP} ${arc(SAFETY_END, SAFETY_END_R, -90, 75)} Z`;
const SAFETY_PAD = rounded(
  [
    [452, 166],
    [498, 135],
    [532, 135],
    [536, 168],
    [460, 178],
  ],
  [8, 8, 10, 8, 6],
);

// The hammer: cocked, its spur round at the back with teeth along its top, in a slot in the frame's top
const HAMMER =
  "M187,145 L265,163 L300,200 L262,292 L228,292 " +
  smoothCurve(
    [
      [228, 292],
      [222, 262],
      [213, 232],
      [200, 207],
      [181, 190],
      [170, 172],
      [174, 153],
      [187, 145],
    ],
    [0, -1],
    [1, -0.35],
  ) +
  " Z";

// ---------------------------------------------------------------------------------------------------------
// The frame: the dust cover and rail under the barrel, the trigger guard, the grip and the beavertail

const DUST_COVER_FRONT = FOOT_BACK;
const RAIL_BOTTOM = 420; // the accessory rail's body; its lugs go down to LUG_BOTTOM
const RAIL_BACK = 1040;
const LUGS = 11;
const FIRST_LUG = 1043;
const LUG_WIDTH = 35;
const LUG_PITCH = 67.3;
const LUG_BOTTOM = 445;
const GUARD_BOTTOM = 646;
// The grip leans back by STRAP_LEAN (x per y): the front strap and the panel's front edge
const STRAP_LEAN = -0.2;
const FOOT_BOTTOM = 1078; // the frame's foot under the grip

// From the rail's back down the guard's front, along its bottom, down the front strap to the foot
const GUARD_FRONT = smoothCurve(
  [
    [1076, 438],
    [1030, 456],
    [1012, 478],
    [1004, 500],
    [1000, 550],
    [995, 600],
    [995, 625],
    [985, 643],
    [968, GUARD_BOTTOM],
  ],
  [-1, 0.25],
  [-1, 0],
);
const FRONT_STRAP = smoothCurve(
  [
    [740, GUARD_BOTTOM],
    [712, 652],
    [690, 670],
    [675, 690],
    [669, 700],
    [649, 800],
    [630, 900],
    [618, 990],
    [624, 1020],
    [639, 1060],
    [645, FOOT_BOTTOM - 2],
  ],
  [-1, 0],
  [0.2, 1],
);
// The back of the grip, the rubber's palm swell, from the foot up to where the frame's back takes over under
// the beavertail, then round the tang's underside and its tip, and up behind the hammer
const GRIP_BACK_POINTS: Point[] = [
  [149, 1018],
  [148, 1000],
  [152, 950],
  [161, 900],
  [175, 850],
  [196, 800],
  [217, 750],
  [238, 700],
  [262, 650],
  [281, 600],
  [286, 545],
  [276, 500],
  [248, 460],
  [218, 440],
  [179, 430],
  [100, 425],
  [39, 420],
];
const TANG_POINTS: Point[] = [
  [39, 420],
  [32, 408],
  [33, 395],
  [53, 380],
  [106, 360],
  [172, 350],
  [194, 340],
  [205, 315],
  [212, 268],
];

// The opening in the guard: flat top and bottom, square at the front, round at the back
const OPENING_TOP = 433;
const OPENING_BOTTOM = 615;
const OPENING = `M850,${OPENING_TOP} ${smoothCurve(
  [
    [850, OPENING_TOP],
    [905, OPENING_TOP + 1],
    [940, 450],
    [958, 478],
    [964, 510],
    [964, 580],
    [958, 602],
    [935, OPENING_BOTTOM],
    [780, OPENING_BOTTOM],
    [745, 604],
    [717, 580],
    [701, 540],
    [703, 495],
    [722, 458],
    [760, 438],
    [800, OPENING_TOP],
    [850, OPENING_TOP],
  ],
  [1, 0],
  [1, 0],
)} Z`;

const FRAME =
  `M212,268 L240,268 L240,340 L${DUST_COVER_FRONT},340 L${DUST_COVER_FRONT},${LUG_BOTTOM} ` +
  `L${RAIL_BACK + 36},${RAIL_BOTTOM} L1076,438 ${GUARD_FRONT} L740,${GUARD_BOTTOM} ${FRONT_STRAP} ` +
  `L243,${FOOT_BOTTOM + 2} L157,1040 L${fmt(GRIP_BACK_POINTS[0])} ` +
  smoothCurve(GRIP_BACK_POINTS, [0, -1], [-1, 0]) +
  " " +
  smoothCurve(TANG_POINTS, [-1, -0.6], [0.2, -1]) +
  ` Z ${OPENING}`;

function railLugs(): string {
  const out: string[] = [];
  for (let i = 0; i < LUGS; i++) {
    const x = FIRST_LUG + i * LUG_PITCH;
    out.push(
      `M${x.toFixed(1)},${RAIL_BOTTOM - 1} L${(x + LUG_WIDTH).toFixed(1)},${RAIL_BOTTOM - 1} L${(x + LUG_WIDTH).toFixed(1)},${LUG_BOTTOM} L${x.toFixed(1)},${LUG_BOTTOM} Z`,
    );
  }
  return out.join(" ");
}

// The grip panel: notched round the frame at its top, its front edge along the grip's lean, its back the
// palm swell (the same curve as the gun's back, since it wraps round the back strap)
const PANEL_TOP = 349;
const PANEL_NOTCH = 463; // where its top steps down
const PANEL_SHOULDER = 415; // its top ahead of the notch
const PANEL_BOTTOM = 1018;
const panelFront = (y: number): Point => [611 + STRAP_LEAN * (y - 700), y];
const PANEL_BACK_POINTS: Point[] = [
  [150, PANEL_BOTTOM - 6],
  [148, 1000],
  [152, 950],
  [161, 900],
  [175, 850],
  [196, 800],
  [217, 750],
  [238, 700],
  [262, 650],
  [281, 600],
  [300, 560],
  [336, 500],
  [372, 380],
  [380, PANEL_TOP],
];
const PANEL =
  `M380,${PANEL_TOP} L${PANEL_NOTCH},${PANEL_TOP} L${PANEL_NOTCH},${PANEL_SHOULDER} ` +
  `L${fmt([panelFront(PANEL_SHOULDER)[0] - 6, PANEL_SHOULDER])} ` +
  `C${fmt([panelFront(PANEL_SHOULDER)[0] - 2, PANEL_SHOULDER])} ${fmt(panelFront(PANEL_SHOULDER + 2))} ${fmt(panelFront(PANEL_SHOULDER + 8))} ` +
  `L${fmt(panelFront(PANEL_BOTTOM - 10))} ` +
  `C${fmt(panelFront(PANEL_BOTTOM - 3))} ${fmt([panelFront(PANEL_BOTTOM)[0] - 4, PANEL_BOTTOM])} ${fmt([panelFront(PANEL_BOTTOM)[0] - 10, PANEL_BOTTOM])} ` +
  `L156,${PANEL_BOTTOM} C152,${PANEL_BOTTOM} 150,${PANEL_BOTTOM - 3} ${fmt(PANEL_BACK_POINTS[0])} ` +
  smoothCurve(PANEL_BACK_POINTS, [0, -1], [0.3, -1]) +
  " Z";
const GRIP_SCREW: Point = [243, 840];

// The trigger: a crescent, its back straight down then curving forward to the tip, its front curved, going up
// into the frame above the opening
const TRIGGER =
  `M722,425 ${smoothCurve(
    [
      [722, 425],
      [719, 470],
      [717, 510],
      [720, 540],
      [729, 560],
      [742, 580],
      [766, 598],
      [796, 606],
    ],
    [0, 1],
    [1, 0.1],
  )} C800,604 799,600 797,598 ${smoothCurve(
    [
      [797, 598],
      [784, 580],
      [775, 560],
      [768, 530],
      [767, 495],
      [772, 460],
      [785, 425],
    ],
    [-0.6, -1],
    [0.3, -1],
  )} Z`;

// The slide stop: a lever on the frame over the guard's top front, pivoting on a round pin
const SLIDE_STOP_PIN: Point = [978, 435];
const SLIDE_STOP_PIN_R = 18;
const SLIDE_STOP =
  "M905,353 L975,353 C980,353 983,356 985,360 L1000,400 L1008,425 " +
  `C1006,448 995,456 978,456 C962,456 950,448 940,430 L930,410 L876,410 L876,371 Z`;

// The magazine: its dark body between the frame's foot and its base plate, and the plate, with a lip in front
const MAG_BODY = `M275,${FOOT_BOTTOM - 4} L560,${FOOT_BOTTOM - 4} L560,1093 L275,1093 Z`;
const MAG_BASE = rounded(
  [
    [272, 1092],
    [548, 1092],
    [560, 1093],
    [650, 1094],
    [650, 1107],
    [610, 1113],
    [272, 1113],
  ],
  [3, 0, 6, 5, 5, 0, 3],
);

// The guide rod's tip, out of the dust cover's front face, in a notch in the barrel's foot
const GUIDE_ROD =
  "M1767,349 L1782,349 C1792,352 1794,358 1792,362 C1788,368 1780,368 1767,368 Z";
const MAG_CATCH: Point = [690, 575];

function drawSide(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1151" viewBox="0 0 1920 1151" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  <!-- Blockout: each part's silhouette in a flat color, in drawing order -->
  <!-- Cocked, in a slot in the frame's top behind the slide -->
  <path id="desert-eagle-hammer" d="${HAMMER}" fill="${BLACK_PART}"/>
  <!-- Up into the frame, showing through the guard's opening -->
  <path id="desert-eagle-trigger" d="${TRIGGER}" fill="${BLACK_PART}"/>
  <path id="desert-eagle-magazine" d="${MAG_BODY}" fill="${BLACK}"/>
  <!-- The dust cover and accessory rail, the guard, the grip's straps and foot, the beavertail -->
  <g id="desert-eagle-frame" fill="${FRAME_COLOR}">
    <path d="${FRAME}"/>
    <path d="${railLugs()}"/>
  </g>
  <!-- Fixed on top of the frame: the rail on its top, the long flat face, the nose and the brake -->
  <g id="desert-eagle-barrel">
    <path d="${BARREL}" fill="${BARREL_COLOR}"/>
    <path d="${Array.from({ length: PORTS }, (_, i) => port(i)).join(" ")}" fill="${BLACK}"/>
  </g>
  <path id="desert-eagle-guide-rod" d="${GUIDE_ROD}" fill="${BLACK}"/>
  <!-- The block behind the barrel and the arms either side of it -->
  <path id="desert-eagle-slide" d="${SLIDE}" fill="${SLIDE_COLOR}"/>
  <g id="desert-eagle-sights" fill="${BLACK_PART}">
    <path d="${REAR_SIGHT}"/>
    <path d="${FRONT_SIGHT}"/>
  </g>
  <g id="desert-eagle-safety">
    <path d="${SAFETY}" fill="${BLACK_PART}"/>
    <path d="${SAFETY_PAD}" fill="${BLUED_STEEL.light}"/>
    <circle cx="${SAFETY_HUB[0]}" cy="${SAFETY_HUB[1]}" r="${SAFETY_SCREW_R}" fill="${BLACK}"/>
  </g>
  <g id="desert-eagle-slide-stop">
    <path d="${SLIDE_STOP}" fill="${BLACK_PART}"/>
    <circle cx="${SLIDE_STOP_PIN[0]}" cy="${SLIDE_STOP_PIN[1]}" r="${SLIDE_STOP_PIN_R}" fill="${BLACK}"/>
  </g>
  <!-- Black rubber, wrapped round the back strap -->
  <g id="desert-eagle-grip-panel">
    <path d="${PANEL}" fill="${RUBBER}"/>
    <circle cx="${GRIP_SCREW[0]}" cy="${GRIP_SCREW[1]}" r="12" fill="${BLACK}"/>
  </g>
  <circle id="desert-eagle-magazine-catch" cx="${MAG_CATCH[0]}" cy="${MAG_CATCH[1]}" r="16" fill="${BLACK}"/>
  <path id="desert-eagle-magazine-base" d="${MAG_BASE}" fill="${BLACK_PART}"/>
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
      "A stainless Desert Eagle (DE50SRMB) from its right side, muzzle to the right, on a transparent background: brushed rather than polished, and with the integral muzzle brake",
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
  // The origin on the gun's middle (between the beavertail's tip, x 31, and the muzzle, x 1888) on the bore (the
  // brake ports' middle and the round chamber's, y 147), and 273 mm (the DE50SRMB's 10.75") over the 1857 px
  // they're apart
  scale: { origin: [959.5, 147], mmPerPixel: 273 / 1857 },
  frame: {
    // The front sight's top, the magazine base's bottom, the beavertail's tip, the muzzle
    top: 36,
    bottom: 1113,
    back: 31,
    front: MUZZLE,
    // A little more than its 273 mm length, about 5% margin as the M1911's 224 for 216
    side: 288,
    pixels: 256,
  },
  comment: `
  <!-- The Desert Eagle Mark XIX (.50 AE, 6" barrel with the integral muzzle brake) from its right side, muzzle to
       the right, in polished stainless. Millimeters, with the origin on the gun's middle on the bore, as the
       guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
};
