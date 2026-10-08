/**
 * The Desert Eagle from its right side: a Desert Eagle Mark XIX in .50 AE, 6" barrel, polished stainless, very
 * shiny. Drawn in the pixels of its photo (1920 by 1151) by named numbers, following the gun-art skill
 * (.claude/skills/gun-art/SKILL.md), with guns/m1911.ts as the worked example. A draft until it goes into the game.
 *
 * Round 2: drawn and shaded. The finish is chrome-like polish (`Polish`, `CHROME_STAINLESS` below, meant to be
 * shared with the revolver): every face banded rather than shaded, a bright sky above a hard horizon and a dark
 * floor below, along the face's own axis. The slide, its arms and the barrel's flat face are one plane and share
 * one horizon (y 254); the frame's face under the slide has its own. Bead-blasted planes (the trigger guard, the
 * band round the back of its opening, the front strap, the foot under the grip, the dust cover and its rail) are
 * matte, a step darker and flat. Black steel (hammer, sights, slide stop, trigger, magazine) is blued; the dark
 * plastic (the grip panel, the safety, the magazine catch) is one material. Holes are holes: the brake's ports,
 * the barrel rail's slots, the gaps between the accessory rail's lugs and the guard's opening.
 *
 * The set's outline (round 3): 0.4 mm round each part, in its own material's dark (a mid gray for the stainless),
 * never near-black; `outline: false` leaves it off. Where a part overhangs a lower plane it casts a short shadow
 * fading down: the barrel's rail on its flat face, the slide on the frame's face, the nose on the dust cover. The
 * grip's rubber is lit softly along its swell, following the curve of its back.
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
 *   round of the chamber where the cutter left it, a curve measured along rows from (1032, 118) down and forward
 *   to (1114, 208): behind it (x 816 to there), the barrel is round, shaded as a cylinder, where it goes into the
 *   slide. The rail's lugs are square at the front and slope at the back (10 px); the slots go right across,
 *   so they're open (the background shows through). Ahead of the slide's arm (x 1683
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
 *   On its back half the slide is cut into a pocket (a lower plane, matte in the photo) the safety turns in: a
 *   circle round the hub (r 57), its top along the arm's top (y 128), its front at x 541, its bottom a line
 *   rising back from its rounded front corner (517, 258) to the circle at (364, 238); its top and back walls in
 *   shadow, its bottom and front lit. The safety lever lies in it: a round hub (center
 *   (376, 184), r 53) with a slotted screw (r 25) and an arm forward to x 540 along y 131, with a raised thumb
 *   pad on its front end. Serrations: 13 grooves leaning back going down (-0.25 x per y), 35.8 px apart, from
 *   the slide's bottom up to y 165 (cut short by the recess under the safety), the front one ending on a line
 *   from (775, 165) to (730, 347).
 * - **The frame**: everything below y 347. Under the barrel, a dust cover (y 347 to 381, ending at x 1766 in a
 *   front face, with the recoil spring guide rod's black tip poking out of it at (1770 to 1792, 349 to 368)),
 *   and below it an accessory rail (y 381 to 430, the same depth all along, rounded at its back end at x 1040) with 11 lugs underneath
 *   (35 px wide every 67.25, from x 1043, down to y 448, their corners chamfered). Behind that, the trigger guard: square-ish, its front
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
 *   (a small round button with a slot by the panel's front, (686, 582)), the magazine and its base plate (y 1092
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
import { arc, fixed, fmt, on, rounded, smoothCurve } from "../lib/geometry";
import type { GunDrawing, TopView } from "../lib/gun";
import { generatedNote } from "../lib/gun";
import type { Polish, Stops } from "../lib/style";
import {
  BLACK_POLYMER,
  BLUED_STEEL,
  boxGradient,
  CHROME_STAINLESS,
  faceStops,
  linear,
  roundStops,
  upStops,
} from "../lib/style";

/** The photo's scale: 273 mm (the DE50SRMB's 10.75") over the 1857 px from the beavertail's tip to the muzzle */
const MM_PER_PIXEL = 273 / 1857;
/** The set's outline round each part, in millimeters */
const OUTLINE_MM = 0.4;

// ---------------------------------------------------------------------------------------------------------
// Materials

export interface DesertEagleOptions {
  polish?: Partial<Polish>;
  /** A thin outline round each part, in its own material's dark (default true) */
  outline?: boolean;
}

// Blued (black) steel: the hammer, sights, slide stop, trigger, magazine
const STEEL = BLUED_STEEL;
// The dark plastic: the grip panel, the safety and the magazine catch
const POLYMER = BLACK_POLYMER;

// ---------------------------------------------------------------------------------------------------------
// The barrel: fixed, its top a rail of cross slots, its side one long flat face down to the seam with the slide

const BARREL_BACK = 816; // the slide's front face, where the barrel comes out
const MUZZLE = 1888; // the chamfered nose's furthest point
const BARREL_FRONT = 1882; // the front face, above the chamfer
const BARREL_TOP = 90; // the round chamber's top, and the rail's lugs
const SLOT_BOTTOM = 115;
const RAIL_BASE = 118; // where the rail stands up from the flat face: a ledge
const BARREL_TOP_FRONT = 95; // plain from the last slot to the muzzle
const RAIL_START = 1032; // where the flat face (and the rail on it) starts, out of the round chamber
const SLOTS = 8;
const FIRST_SLOT = 1122;
const SLOT_WIDTH = 36;
const SLOT_PITCH = 73.5;
const LUG_BACK_SLOPE = 10; // each lug's back face slopes, its front is square
const BARREL_FOOT = 381; // the nose's foot, in front of the frame
const FOOT_BACK = 1767; // the frame's front face, behind the foot
const NOSE_BOTTOM = 345; // the nose's bottom between the slide's arms and the foot
const NOSE_CHAMFER = 336; // a narrow chamfer along the nose's bottom edge, turned down to the floor
const CHAMFER_TOP: Point = [MUZZLE, 225]; // where the front chamfer starts
const FOOT_CORNER: Point = [1830, BARREL_FOOT];
const SEAM = 208; // the slide arms' top, under the barrel's flat face: a groove
// The flat's back end, where the cutter ran out into the round chamber: measured along rows
const RUNOUT: Point[] = [
  [RAIL_START, RAIL_BASE],
  [1036, 140],
  [1045, 157],
  [1059, 171],
  [1077, 182],
  [1096, 195],
  [1114, SEAM],
];

/** The barrel's top, from its back to its front, down into each slot of the rail (open: the slots go across) */
function barrelTop(dy = 0): string {
  const top = BARREL_TOP + dy;
  const parts = [`M${BARREL_BACK},${top}`];
  for (let i = 0; i < SLOTS; i++) {
    const x0 = FIRST_SLOT + i * SLOT_PITCH;
    const x1 = x0 + SLOT_WIDTH;
    parts.push(
      `L${fixed(x0, 1)},${top} L${fixed(x0, 1)},${SLOT_BOTTOM + dy} L${fixed(x1 - LUG_BACK_SLOPE, 1)},${SLOT_BOTTOM + dy} ` +
        `L${fixed(x1, 1)},${(i === SLOTS - 1 ? BARREL_TOP_FRONT : BARREL_TOP) + dy}`,
    );
  }
  return parts.join(" ");
}

// The muzzle brake: four ports through the barrel near the muzzle, pills with round ends, cut right through
const PORTS = 4;
const PORT_BACK = 1714; // the first port's back edge
const PORT_WIDTH = 31;
const PORT_PITCH = 41.3;
const PORT_TOP = 105;
const PORT_BOTTOM = 181;
const PORT_WALL = 139; // how far down the port's far wall (its top, seen from a little above) shows
const PORT_SIDE = 12; // the port's front wall, seen past its edge

function portLeft(i: number): number {
  return PORT_BACK + i * PORT_PITCH;
}

function port(i: number): string {
  const r = PORT_WIDTH / 2;
  const cx = portLeft(i) + r;
  const top: Point = [cx, PORT_TOP + r];
  const bottom: Point = [cx, PORT_BOTTOM - r];
  return (
    `M${fmt(on(top, r, 180))} ${arc(top, r, 180, 360)} L${fmt(on(bottom, r, 0))} ` +
    `${arc(bottom, r, 0, 180)} Z`
  );
}
const PORT_HOLES = Array.from({ length: PORTS }, (_, i) => port(i)).join(" ");
// What shows inside each port: its far wall at the top, its front wall down the side (the rest is a hole)
const PORT_WALLS = Array.from({ length: PORTS }, (_, i) => {
  const x0 = portLeft(i);
  const x1 = x0 + PORT_WIDTH;
  return (
    `M${fixed(x0, 1)},${PORT_TOP} L${fixed(x1, 1)},${PORT_TOP} L${fixed(x1, 1)},${PORT_BOTTOM} ` +
    `L${fixed(x1 - PORT_SIDE, 1)},${PORT_BOTTOM} L${fixed(x1 - PORT_SIDE, 1)},${PORT_WALL + 6} ` +
    `C${fixed(x1 - PORT_SIDE - 2, 1)},${PORT_WALL + 1} ${fixed(x1 - PORT_SIDE - 6, 1)},${PORT_WALL} ${fixed(x1 - PORT_SIDE - 10, 1)},${PORT_WALL} ` +
    `L${fixed(x0, 1)},${PORT_WALL} Z`
  );
}).join(" ");

const BARREL =
  `${barrelTop()} L${BARREL_FRONT - 8},${BARREL_TOP_FRONT} ` +
  `C${BARREL_FRONT - 3},${BARREL_TOP_FRONT} ${BARREL_FRONT},${BARREL_TOP_FRONT + 3} ${BARREL_FRONT},${BARREL_TOP_FRONT + 8} ` +
  `L${BARREL_FRONT},200 C${BARREL_FRONT + 2},208 ${MUZZLE},215 ${fmt(CHAMFER_TOP)} ` +
  `L${FOOT_CORNER[0] + 4},${BARREL_FOOT - 6} C${FOOT_CORNER[0] + 2},${BARREL_FOOT - 2} ${FOOT_CORNER[0]},${BARREL_FOOT} ${FOOT_CORNER[0] - 4},${BARREL_FOOT} ` +
  `L${FOOT_BACK},${BARREL_FOOT} L${FOOT_BACK},${NOSE_BOTTOM} L${BARREL_BACK},${NOSE_BOTTOM} Z ${PORT_HOLES}`;

// The round chamber behind the flat, where the barrel goes into the slide
const CHAMBER =
  `M${BARREL_BACK},${BARREL_TOP} L${RAIL_START},${BARREL_TOP} L${RAIL_START},${RAIL_BASE} ` +
  `${smoothCurve(RUNOUT, [0, 1], [1, 0.55])} L${BARREL_BACK},${SEAM} Z`;
// The ledge where the rail stands up from the flat face, lit; and its shadow on the flat
const RAIL_SHADOW_DEPTH = 24; // how far down the flat face the rail's shadow fades
const UNDER_RAIL = `M${RAIL_START},${RAIL_BASE} L${BARREL_FRONT - 1},${RAIL_BASE} L${BARREL_FRONT - 1},${RAIL_BASE + RAIL_SHADOW_DEPTH} L${RAIL_START + 6},${RAIL_BASE + RAIL_SHADOW_DEPTH} Z`;
// The slide overhangs the frame's face, and the barrel's nose the dust cover: short shadows under each
const OVERHANG_DEPTH = 14;
const UNDER_SLIDE = `M212,347 L1052,347 L1052,${347 + OVERHANG_DEPTH} L212,${347 + OVERHANG_DEPTH} Z`;
const UNDER_NOSE = `M1683,345 L1767,345 L1767,${345 + OVERHANG_DEPTH} L1683,${345 + OVERHANG_DEPTH} Z`;
// The nose's bottom chamfer, between the slide's arms and the foot
const NOSE_UNDER = `M1683,${NOSE_CHAMFER} L1858,${NOSE_CHAMFER} L1854,${NOSE_BOTTOM} L1683,${NOSE_BOTTOM} Z`;
// The front chamfer's edge, catching the light
const NOSE_EDGE_IN = 2; // just inside the edge
const NOSE_EDGE =
  `M${BARREL_FRONT - NOSE_EDGE_IN},${BARREL_TOP_FRONT + 10} L${BARREL_FRONT - NOSE_EDGE_IN},200 ` +
  `C${BARREL_FRONT},208 ${MUZZLE - NOSE_EDGE_IN},215 ${CHAMFER_TOP[0] - NOSE_EDGE_IN},${CHAMFER_TOP[1]} ` +
  `L${FOOT_CORNER[0] + 4 - NOSE_EDGE_IN},${BARREL_FOOT - 6}`;
// The front sight's dovetail, across the barrel's top under it
const FRONT_DOVETAIL = "M1781,88 L1850,88 L1850,95 L1781,95 Z";

// The front sight: a blade sloping up to a square front, in its dovetail near the muzzle
const FRONT_SIGHT =
  "M1772,88 L1772,74 C1790,60 1808,46 1822,38 C1826,36 1830,36 1834,36 L1852,36 L1852,88 Z";

// ---------------------------------------------------------------------------------------------------------
// The slide: a block at the back, and arms either side of the barrel below the seam, out to ARM_FRONT

const SLIDE_TOP = 80;
const SLIDE_BOTTOM = 347;
const ARM_FRONT = 1683;
// The block's top steps down at its back: level to STEP, sloping to the back corner
const STEP: Point = [560, SLIDE_TOP];
const BACK_TOP: Point = [420, 101];
const BACK_CORNER: Point = [322, 112];
const TOP_BEVEL = 19; // the bevel along the block's top, turned up to the sky
const BACK_BEVEL = 18; // and down its back face
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
const backDown = [BACK_CORNER, ...SLIDE_BACK_POINTS];

const SLIDE =
  `M${fmt(STEP)} L${BARREL_BACK},${SLIDE_TOP} L${BARREL_BACK},${SEAM} L${ARM_FRONT},${SEAM} ` +
  `L${ARM_FRONT},${SLIDE_BOTTOM} L${fmt(SLIDE_BACK_POINTS[SLIDE_BACK_POINTS.length - 1])} ` +
  smoothCurve([...backDown].reverse(), [0.4, -1], [1, -0.4]) +
  ` L${fmt(BACK_TOP)} C460,96 520,${SLIDE_TOP} ${fmt(STEP)} Z`;

const SLIDE_TOP_BEVEL =
  `M${fmt(BACK_CORNER)} L${fmt(BACK_TOP)} C460,96 520,${SLIDE_TOP} ${fmt(STEP)} L${BARREL_BACK},${SLIDE_TOP} ` +
  `L${BARREL_BACK},${SLIDE_TOP + TOP_BEVEL} L${STEP[0] + 6},${SLIDE_TOP + TOP_BEVEL} ` +
  `C524,${SLIDE_TOP + TOP_BEVEL} 466,${BACK_TOP[1] + 14} ${BACK_TOP[0] + 4},${BACK_TOP[1] + TOP_BEVEL - 2} ` +
  `L${BACK_CORNER[0] + 14},${BACK_CORNER[1] + 14} Z`;
const backBevelInner = backDown.map(([x, y]): Point => [x + BACK_BEVEL, y]);
const SLIDE_BACK_BEVEL =
  `M${fmt(BACK_CORNER)} ${smoothCurve(backDown, [-0.8, 1], [-0.4, 1])} ` +
  `L${fmt(backBevelInner[backBevelInner.length - 1])} ${smoothCurve([...backBevelInner].reverse(), [0.4, -1], [0.8, -1])} Z`;

// Serrations: 13 grooves leaning back going down, from the slide's bottom up to SERRATION_TOP; the safety's
// recess, over them, cuts the back ones short
const SERRATIONS = 13;
const SERRATION_LEAN = -0.247; // x per y
const SERRATION_TOP = 165;
const SERRATION_BOTTOM = SLIDE_BOTTOM - 2;
const SERRATION_AT_Y = 280; // where the first groove's back edge is FIRST_SERRATION
const FIRST_SERRATION = 286;
const SERRATION_PITCH = 35.8;
const SERRATION_WIDTH = 29;
const serrationX = (x280: number, y: number) =>
  x280 + SERRATION_LEAN * (y - SERRATION_AT_Y);

function serrations(): { grooves: string; backWalls: string; ridges: string } {
  const grooves: string[] = [];
  const backWalls: string[] = [];
  const ridges: string[] = [];
  for (let i = 0; i < SERRATIONS; i++) {
    const x0 = FIRST_SERRATION + i * SERRATION_PITCH;
    const x1 = x0 + SERRATION_WIDTH;
    const pts: Point[] = [
      [serrationX(x0, SERRATION_TOP), SERRATION_TOP],
      [serrationX(x1, SERRATION_TOP), SERRATION_TOP],
      [serrationX(x1, SERRATION_BOTTOM), SERRATION_BOTTOM],
      [serrationX(x0, SERRATION_BOTTOM), SERRATION_BOTTOM],
    ];
    grooves.push(rounded(pts, [4, 4, 0, 0]));
    // Its back wall in shadow, its front edge (the ridge's corner) catching the light
    backWalls.push(
      `M${fmt(pts[0])} L${fmt(pts[3])} L${fmt([pts[3][0] + 5, pts[3][1]])} L${fmt([pts[0][0] + 5, pts[0][1]])} Z`,
    );
    ridges.push(
      `M${fmt([pts[1][0] + 1.5, pts[1][1] + 3])} L${fmt([pts[2][0] + 1.5, pts[2][1]])}`,
    );
  }
  return {
    grooves: grooves.join(" "),
    backWalls: backWalls.join(" "),
    ridges: ridges.join(" "),
  };
}

// The safety: a round hub with a slotted screw, an arm forward along y SAFETY_ARM_TOP to a round end, and a
// raised pad on the end; dark plastic, the same as the grip
const SAFETY_HUB: Point = [376, 184];
const SAFETY_HUB_R = 53;
const SAFETY_SCREW_R = 25;
const SAFETY_ARM_TOP = 131;
const SAFETY_END_R = 27;
const SAFETY_END: Point = [538 - SAFETY_END_R, SAFETY_ARM_TOP + SAFETY_END_R]; // its round end's center
const SAFETY =
  `M${fmt(on(SAFETY_HUB, SAFETY_HUB_R, 75))} ${arc(SAFETY_HUB, SAFETY_HUB_R, 75, 270)} ` +
  `L${SAFETY_END[0]},${SAFETY_ARM_TOP} ${arc(SAFETY_END, SAFETY_END_R, -90, 75)} Z`;
const SAFETY_LIT = `M${fmt(on(SAFETY_HUB, SAFETY_HUB_R - 3, 160))} ${arc(SAFETY_HUB, SAFETY_HUB_R - 3, 160, 270)} L${SAFETY_END[0]},${SAFETY_ARM_TOP + 3}`;
const SAFETY_PAD =
  "M456,172 C449,171 446,163 451,157 L497,134 C500,132 503,132 507,132 L520,132 C528,132 534,140 534,150 " +
  "C534,162 527,170 518,170 Z";
// The pocket the safety turns in: a lower plane cut into the slide round the hub and under the arm
const RECESS_R = SAFETY_HUB_R + 4;
const RECESS_RIGHT = 541;
const RECESS_BOTTOM: Point = [517, 258]; // its bottom front corner, rounded
const RECESS_BACK: Point = [364, 238]; // where its bottom edge meets the round round the hub
const RECESS_TOP = SAFETY_ARM_TOP - 3;
const recessBackAngle = 102; // RECESS_BACK's angle round the hub (it's on the circle)
const RECESS =
  `M${SAFETY_HUB[0]},${SAFETY_HUB[1] - RECESS_R} L${RECESS_RIGHT - 22},${RECESS_TOP} ` +
  `C${RECESS_RIGHT - 9},${RECESS_TOP} ${RECESS_RIGHT},${RECESS_TOP + 10} ${RECESS_RIGHT},${RECESS_TOP + 24} ` +
  `L${RECESS_RIGHT},${RECESS_BOTTOM[1] - 18} C${RECESS_RIGHT},${RECESS_BOTTOM[1] - 6} ${RECESS_BOTTOM[0] + 14},${RECESS_BOTTOM[1]} ${fmt(RECESS_BOTTOM)} ` +
  `L${fmt(on(SAFETY_HUB, RECESS_R, recessBackAngle))} ${arc(SAFETY_HUB, RECESS_R, recessBackAngle, 270)} Z`;
// Its walls: the top and back in shadow, the bottom and front catching the light
const RECESS_SHADOW = `M${fmt(on(SAFETY_HUB, RECESS_R, 120))} ${arc(SAFETY_HUB, RECESS_R, 120, 270)} L${RECESS_RIGHT - 22},${RECESS_TOP}`;
const RECESS_LIT =
  `M${RECESS_RIGHT},${RECESS_TOP + 24} L${RECESS_RIGHT},${RECESS_BOTTOM[1] - 18} ` +
  `C${RECESS_RIGHT},${RECESS_BOTTOM[1] - 6} ${RECESS_BOTTOM[0] + 14},${RECESS_BOTTOM[1]} ${fmt(RECESS_BOTTOM)} L${fmt(on(SAFETY_HUB, RECESS_R, recessBackAngle))}`;

// The rear sight: a square-backed blade sloping down to the front, its dovetail across the slide's top
const REAR_SIGHT =
  "M333,104 L333,56 C333,54 334,52 337,52 L365,52 L400,80 L415,98 L415,104 Z M346,104 L398,104 L406,118 L340,118 Z";

// The hammer: cocked, its spur round at the back with teeth along its top, in a slot in the frame's top
const SPUR_BACK: Point = [187, 145];
const SPUR_FRONT: Point = [265, 163];
function spurTeeth(): string {
  const dx = SPUR_FRONT[0] - SPUR_BACK[0];
  const dy = SPUR_FRONT[1] - SPUR_BACK[1];
  const length = Math.hypot(dx, dy);
  const u: Point = [dx / length, dy / length];
  const n: Point = [u[1], -u[0]]; // out of the spur, up
  const along = (s: number, out: number): Point => [
    SPUR_BACK[0] + u[0] * s + n[0] * out,
    SPUR_BACK[1] + u[1] * s + n[1] * out,
  ];
  const pts: string[] = [];
  const pitch = 11;
  for (let s = 14; s + pitch <= length + 0.5; s += pitch) {
    pts.push(`L${fmt(along(s, 0))} L${fmt(along(s + pitch / 2, 6))}`);
  }
  return pts.join(" ");
}
const HAMMER =
  `M${fmt(SPUR_BACK)} ${spurTeeth()} L${fmt(SPUR_FRONT)} L300,200 L262,292 L228,292 ` +
  smoothCurve(
    [
      [228, 292],
      [222, 262],
      [213, 232],
      [200, 207],
      [181, 190],
      [170, 172],
      [174, 153],
      SPUR_BACK,
    ],
    [0, -1],
    [1, -0.35],
  ) +
  " Z";

// ---------------------------------------------------------------------------------------------------------
// The frame: the dust cover and rail under the barrel, the trigger guard, the grip and the beavertail. Its face
// is polished; a lower plane under the face's edge (the guard, a band round the back of its opening, the front
// strap and the foot under the grip) and the rail are bead blasted, matte

const DUST_COVER_FRONT = FOOT_BACK;
const DUST_COVER_BOTTOM = 381; // where the rail starts, under the dust cover
const RAIL_BACK = 1043;
const RAIL_BOTTOM = 430; // the rail's body, between its lugs: the same depth all along
const LUGS = 11;
const LUG_PITCH = 67.25;
const LUG_WIDTH = 35;
const LUG_BOTTOM = 448;
const LUG_CHAMFER = 3;
const GUARD_BOTTOM = 646;
// The grip leans back by STRAP_LEAN (x per y): the front strap and the panel's front edge are straight lines
const STRAP_LEAN = -0.2;
const strapX = (y: number) => 669 + STRAP_LEAN * (y - 700); // the front strap
const FOOT_BOTTOM = 1078; // the frame's foot under the grip

// From the rail down the guard's front to its bottom (measured along rows)
const GUARD_FRONT = smoothCurve(
  [
    [1077, 448],
    [1048, 454],
    [1028, 461],
    [1018, 472],
    [1010, 486],
    [1004, 505],
    [1000, 550],
    [996, 600],
    [996, 624],
    [987, 642],
    [970, GUARD_BOTTOM],
  ],
  [-1, 0.2],
  [-1, 0],
);
// The front strap: round from the guard's bottom into one straight line, then flaring forward into the foot
const STRAP_TOP = 712; // where the straight line starts
const FLARE_START = 965; // and ends
const STRAP =
  `L760,${GUARD_BOTTOM} C724,${GUARD_BOTTOM} ${fixed(strapX(STRAP_TOP) + 6, 1)},${STRAP_TOP - 34} ${fixed(strapX(STRAP_TOP), 1)},${STRAP_TOP} ` +
  `L${fixed(strapX(FLARE_START), 1)},${FLARE_START} ` +
  `C${fixed(strapX(FLARE_START + 28), 1)},${FLARE_START + 28} 620,1012 630,1036 ` +
  `C636,1050 641,1064 645,${FOOT_BOTTOM - 2}`;
// The back of the grip, the rubber's palm swell, from the foot up to where the frame's back takes over under
// the beavertail, then round the tang's underside to its tip (measured along rows)
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
const GRIP_BACK = `${smoothCurve(GRIP_BACK_POINTS, [0, -1], [-1, 0])} ${smoothCurve(TANG_POINTS, [-1, -0.6], [0.2, -1])}`;

// The opening in the guard: flat top and bottom, square at the front, round at the back (a hole)
const OPENING_TOP = 433;
const OPENING_BOTTOM = 615;
const OPENING_POINTS: Point[] = [
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
];
const OPENING = `M850,${OPENING_TOP} ${smoothCurve(OPENING_POINTS, [1, 0], [1, 0])} Z`;
// Lit: the opening's edge along its bottom and up its front
const OPENING_LIT = `M790,${OPENING_BOTTOM - 1} L935,${OPENING_BOTTOM - 1} C950,${OPENING_BOTTOM - 4} 962,600 963,575 L963,515`;

const FRAME =
  `M212,268 L240,268 L240,340 L${DUST_COVER_FRONT},340 L${DUST_COVER_FRONT},${RAIL_BOTTOM} ` +
  `L1080,${RAIL_BOTTOM} L1077,448 ${GUARD_FRONT} ${STRAP} ` +
  `L243,${FOOT_BOTTOM + 2} L157,1040 L${fmt(GRIP_BACK_POINTS[0])} ${GRIP_BACK} Z ${OPENING}`;

// The face's edge, where it steps down to the lower plane: from the rail round the slide stop, along the guard's
// top, round the back of the opening, and down the front strap RIM_INSET behind the strap's front
const RIM_INSET = 35;
const RIM_POINTS: Point[] = [
  [1052, DUST_COVER_BOTTOM],
  [1030, 397],
  [1008, 428],
  [985, 448],
  [955, 446],
  [925, 437],
  [880, 421],
  [815, 413],
  [760, 414],
  [722, 421],
  [695, 434],
  [675, 465],
  [667, 510],
  [675, 545],
  [698, 567],
  [714, 588],
  [703, 610],
  [676, 630],
  [strapX(660) - RIM_INSET, 660],
];
const RIM_LINE = `${smoothCurve(RIM_POINTS, [-1, 0.5], [STRAP_LEAN, 1])} L${fixed(strapX(1018) - RIM_INSET, 1)},1018`;
// The dust cover under the barrel is matte, a step back from the face: the face ends over the rail's back end
const FACE_FRONT = RIM_POINTS[0][0];
const FRAME_FACE =
  `M212,268 L240,268 L240,340 L${FACE_FRONT},340 ` +
  `L${fmt(RIM_POINTS[0])} ${RIM_LINE} L${fmt(GRIP_BACK_POINTS[0])} ${GRIP_BACK} Z`;
const RIM_EDGE = `M${FACE_FRONT},${SLIDE_BOTTOM} L${fmt(RIM_POINTS[0])} ${RIM_LINE}`;
// The matte strap lit along its rounded front, and the guard along its bottom
const STRAP_LIT =
  `M955,${GUARD_BOTTOM - 7} L762,${GUARD_BOTTOM - 7} C730,${GUARD_BOTTOM - 7} ${fixed(strapX(STRAP_TOP) - 3, 1)},${STRAP_TOP - 30} ${fixed(strapX(STRAP_TOP) - 9, 1)},${STRAP_TOP + 4} ` +
  `L${fixed(strapX(FLARE_START) - 9, 1)},${FLARE_START}`;

function railLugs(): string {
  const out: string[] = [];
  // The first is part of the frame's underside, behind the guard
  for (let i = 1; i < LUGS; i++) {
    const x0 = RAIL_BACK + i * LUG_PITCH;
    const x1 = x0 + LUG_WIDTH;
    out.push(
      `M${fixed(x0, 1)},${RAIL_BOTTOM - 1} L${fixed(x1, 1)},${RAIL_BOTTOM - 1} L${fixed(x1, 1)},${LUG_BOTTOM - LUG_CHAMFER} ` +
        `L${fixed(x1 - LUG_CHAMFER, 1)},${LUG_BOTTOM} L${fixed(x0 + LUG_CHAMFER, 1)},${LUG_BOTTOM} L${fixed(x0, 1)},${LUG_BOTTOM - LUG_CHAMFER} Z`,
    );
  }
  return out.join(" ");
}
// The rail's side: the dust cover's shadow along its top, and the groove down its middle
const RAIL_SHADOW = `M${RAIL_BACK + 8},${DUST_COVER_BOTTOM + 3} L${DUST_COVER_FRONT},${DUST_COVER_BOTTOM + 3}`;
const RAIL_GROOVE = `M${RAIL_BACK + 14},401 L${DUST_COVER_FRONT},401`;

// The grip panel: notched round the frame at its top, its front edge straight along the grip's lean, its back the
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
// The rubber swells over the frame: lit softly along a curve following the grip's back, SWELL forward of it
const SWELL = 120;
const PANEL_SWELL = `M${fmt([PANEL_BACK_POINTS[12][0] + SWELL - 20, PANEL_BACK_POINTS[12][1] + 20])} ${smoothCurve(
  PANEL_BACK_POINTS.slice(1, 13)
    .reverse()
    .map(([x, y], i, all): Point => [
      x + SWELL - 20 + (20 * i) / (all.length - 1),
      y + (i === 0 ? 20 : 0),
    ]),
  [-0.35, 1],
  [0, 1],
)}`;
const PANEL_FRONT_LIT = `M${fmt([panelFront(PANEL_SHOULDER + 14)[0] - 9, PANEL_SHOULDER + 14])} L${fmt([panelFront(PANEL_BOTTOM - 20)[0] - 9, PANEL_BOTTOM - 20])}`;

// The trigger: a crescent, its back straight down then curving forward to the tip, its front curved, going up
// into the frame above the opening
const TRIGGER_FRONT_POINTS: Point[] = [
  [797, 598],
  [784, 580],
  [775, 560],
  [768, 530],
  [767, 495],
  [772, 460],
  [785, 425],
];
const TRIGGER = `M722,425 ${smoothCurve(
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
)} C800,604 799,600 797,598 ${smoothCurve(TRIGGER_FRONT_POINTS, [-0.6, -1], [0.3, -1])} Z`;
const TRIGGER_FACE = `M${fmt(TRIGGER_FRONT_POINTS[0])} ${smoothCurve(TRIGGER_FRONT_POINTS, [-0.6, -1], [0.3, -1])}`;

// The slide stop: a lever on the frame over the guard's top front, pivoting on a round pin
const SLIDE_STOP_PIN: Point = [978, 435];
const SLIDE_STOP_PIN_R = 18;
const SLIDE_STOP =
  "M905,353 L975,353 C980,353 983,356 985,360 L1000,400 L1008,425 " +
  "C1006,448 995,456 978,456 C962,456 950,448 940,430 L930,410 L876,410 L876,371 Z";
const SLIDE_STOP_LIT = "M878,371 L905,355 L975,355 C979,355 982,358 984,362";
const SLIDE_STOP_GRIP = "M880,380 L992,380 M880,390 L996,390"; // grooves across it to push it by

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
const MAG_CATCH: Point = [686, 582];

// ---------------------------------------------------------------------------------------------------------

function drawSide(options: DesertEagleOptions = {}): string {
  const p: Polish = { ...CHROME_STAINLESS, ...options.polish };
  const s = serrations();
  // The set's outline: OUTLINE mm wide outside each part (a stroke twice that, under the part's fill), in the
  // part's own dark
  const outline = (d: string, color: string = p.outline) =>
    options.outline === false
      ? ""
      : `<path d="${d}" stroke="${color}" stroke-width="${fixed((2 * OUTLINE_MM) / MM_PER_PIXEL, 2)}" fill="none"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1151" viewBox="0 0 1920 1151" fill-rule="evenodd" stroke-linejoin="round" stroke-linecap="round" clip-rule="evenodd">
  <defs>
    <!-- The gun's side, one plane reflecting one horizon: the slide, its arms and the barrel's flat face -->
    ${linear("desert-eagle-side", [0, BARREL_TOP], [0, SLIDE_BOTTOM], faceStops(p))}
    <!-- The frame's face, under the slide -->
    ${linear("desert-eagle-frame-face", [0, SLIDE_BOTTOM], [0, 440], faceStops(p))}
    <!-- The round chamber behind the flat -->
    ${linear("desert-eagle-chamber", [0, BARREL_TOP], [0, SEAM], roundStops(p))}
    ${boxGradient("desert-eagle-up", upStops(p))}
    ${linear(
      "desert-eagle-back-bevel",
      [0, BACK_CORNER[1]],
      [0, SLIDE_BOTTOM],
      [
        [0, p.edge],
        [0.35, p.sky],
        [p.horizon, p.skyLow],
        [Math.min(1, p.horizon + p.hardness), p.floorLow],
        [1, p.floorLow],
      ],
    )}
    ${linear(
      "desert-eagle-matte",
      [0, 381],
      [0, 1080],
      [
        [0, p.matte],
        [0.4, p.matte],
        [1, p.matteDark],
      ],
    )}
    ${linear(
      "desert-eagle-groove",
      [0, SERRATION_TOP],
      [0, SERRATION_BOTTOM],
      [
        [0, p.matteLight],
        [
          Math.max(
            0,
            (p.horizon * (SLIDE_BOTTOM - BARREL_TOP) +
              BARREL_TOP -
              SERRATION_TOP) /
              (SERRATION_BOTTOM - SERRATION_TOP),
          ),
          p.matte,
        ],
        [1, p.matteDark],
      ],
    )}
    ${boxGradient("desert-eagle-recess", [
      [0, p.matteDark],
      [1, p.matte],
    ])}
    ${boxGradient("desert-eagle-steel", [
      [0, STEEL.light],
      [0.3, STEEL.base],
      [1, STEEL.dark],
    ])}
    ${boxGradient("desert-eagle-port-wall", [
      [0, "#141518"],
      [1, p.floor],
    ])}
    ${linear(
      "desert-eagle-polymer",
      panelFront(700),
      [panelFront(700)[0] - 420, 700 - 84],
      [
        [0, POLYMER.dark],
        [0.06, POLYMER.base],
        [0.4, POLYMER.light],
        [0.75, POLYMER.base],
        [1, POLYMER.dark],
      ],
    )}
    ${boxGradient("desert-eagle-polymer-part", [
      [0, POLYMER.light],
      [0.5, POLYMER.base],
      [1, POLYMER.dark],
    ])}
    <linearGradient id="desert-eagle-overhang" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.edgeDark}" stop-opacity="0.6"/>
      <stop offset="0.5" stop-color="${p.edgeDark}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${p.edgeDark}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="desert-eagle-panel-clip">
      <path d="${PANEL}"/>
    </clipPath>
    <clipPath id="desert-eagle-ports">
      <path d="${PORT_HOLES}"/>
    </clipPath>
    <clipPath id="desert-eagle-recess-clip">
      <path d="${RECESS}"/>
    </clipPath>
    <clipPath id="desert-eagle-frame-face-clip">
      <path d="${FRAME_FACE}"/>
    </clipPath>
  </defs>
  <!-- Cocked, in a slot in the frame's top behind the slide -->
  <g id="desert-eagle-hammer">
    ${outline(HAMMER, STEEL.dark)}
    <path d="${HAMMER}" fill="url(#desert-eagle-steel)"/>
  </g>
  <!-- Up into the frame, showing through the guard's opening -->
  <g id="desert-eagle-trigger">
    ${outline(TRIGGER, STEEL.dark)}
    <path d="${TRIGGER}" fill="url(#desert-eagle-steel)"/>
    <path d="${TRIGGER_FACE}" stroke="${STEEL.highlight}" stroke-width="4" fill="none"/>
  </g>
  <path id="desert-eagle-magazine" d="${MAG_BODY}" fill="${STEEL.dark}"/>
  <!-- The frame: the lower plane and the rail (matte) under the polished face -->
  <g id="desert-eagle-frame">
    ${outline(FRAME)}
    ${outline(railLugs())}
    <path d="${FRAME}" fill="url(#desert-eagle-matte)"/>
    <path d="${railLugs()}" fill="url(#desert-eagle-matte)"/>
    <path d="${RAIL_SHADOW}" stroke="${p.matteDark}" stroke-width="6" fill="none"/>
    <path d="${RAIL_GROOVE}" stroke="${p.matteDark}" stroke-width="3" fill="none"/>
    <path d="${STRAP_LIT}" stroke="${p.matteLight}" stroke-width="7" fill="none"/>
    <path d="${OPENING_LIT}" stroke="${p.matteLight}" stroke-width="5" fill="none"/>
    <!-- The face's edge throws a shadow on the lower plane -->
    <path d="${RIM_EDGE}" stroke="${p.matteDark}" stroke-width="16" fill="none"/>
    <path d="${FRAME_FACE}" fill="url(#desert-eagle-frame-face)"/>
    <!-- Under the slide's bottom edge, and the barrel's nose -->
    <path d="${UNDER_SLIDE}" fill="url(#desert-eagle-overhang)"/>
    <path d="${UNDER_NOSE}" fill="url(#desert-eagle-overhang)"/>
    <path d="${RIM_EDGE}" stroke="${p.edge}" stroke-width="3" fill="none"/>
  </g>
  <!-- Fixed on top of the frame: the rail on its top, the long flat face, the round chamber behind it, the nose
       and the brake's ports, cut through -->
  <g id="desert-eagle-barrel">
    ${outline(BARREL)}
    <path d="${BARREL}" fill="url(#desert-eagle-side)"/>
    <path d="${CHAMBER}" fill="url(#desert-eagle-chamber)"/>
    <!-- The rail overhangs the flat face: its shadow, fading down the face -->
    <path d="${UNDER_RAIL}" fill="url(#desert-eagle-overhang)"/>
    <path d="M${RAIL_START + 2},${RAIL_BASE - 1} L${BARREL_FRONT - 2},${RAIL_BASE - 1}" stroke="${p.edge}" stroke-width="2" fill="none"/>
    <path d="${barrelTop(1.5)}" stroke="${p.edge}" stroke-width="2.5" fill="none"/>
    <path d="${NOSE_UNDER}" fill="${p.floor}"/>
    <path d="${NOSE_EDGE}" stroke="${p.edge}" stroke-width="3" fill="none"/>
    <path d="${FRONT_DOVETAIL}" fill="${STEEL.dark}"/>
    <path d="${PORT_WALLS}" fill="url(#desert-eagle-port-wall)" clip-path="url(#desert-eagle-ports)"/>
    <path d="${PORT_HOLES}" stroke="${p.outline}" stroke-width="2" fill="none"/>
  </g>
  <path id="desert-eagle-guide-rod" d="${GUIDE_ROD}" fill="${STEEL.dark}"/>
  <!-- The block behind the barrel and the arms either side of it, below the seam -->
  <g id="desert-eagle-slide">
    ${outline(SLIDE)}
    <path d="${SLIDE}" fill="url(#desert-eagle-side)"/>
    <path d="${SLIDE_TOP_BEVEL}" fill="url(#desert-eagle-up)"/>
    <path d="${SLIDE_BACK_BEVEL}" fill="url(#desert-eagle-back-bevel)"/>
    <!-- The seam under the barrel: a groove, the arm's edge lit below it -->
    <path d="M${BARREL_BACK},${SEAM} L${ARM_FRONT},${SEAM}" stroke="${p.edgeDark}" stroke-width="5" fill="none"/>
    <path d="M${BARREL_BACK + 4},${SEAM + 4} L${ARM_FRONT - 2},${SEAM + 4}" stroke="${p.edge}" stroke-width="2.5" fill="none"/>
    <!-- The block's front face over the barrel, and the arm's front end -->
    <path d="M${BARREL_BACK},${SLIDE_TOP + 2} L${BARREL_BACK},${SEAM}" stroke="${p.outline}" stroke-width="3" fill="none"/>
    <path d="M${ARM_FRONT},${SEAM} L${ARM_FRONT},${SLIDE_BOTTOM}" stroke="${p.outline}" stroke-width="3" fill="none"/>
    <path d="M${ARM_FRONT + 3},${SEAM + 3} L${ARM_FRONT + 3},${NOSE_CHAMFER}" stroke="${p.edge}" stroke-width="2" fill="none"/>
    <g id="desert-eagle-serrations">
      <path d="${s.grooves}" fill="url(#desert-eagle-groove)"/>
      <path d="${s.backWalls}" fill="${p.edgeDark}" opacity="0.45"/>
      <path d="${s.ridges}" stroke="${p.edge}" stroke-width="3" fill="none"/>
    </g>
    <!-- The pocket the safety turns in, a lower plane: its top and back walls in shadow, bottom and front lit -->
    <g id="desert-eagle-safety-pocket">
      <path d="${RECESS}" fill="url(#desert-eagle-recess)"/>
      <path d="${RECESS_SHADOW}" stroke="${p.edgeDark}" stroke-width="10" fill="none" clip-path="url(#desert-eagle-recess-clip)"/>
      <path d="${RECESS_LIT}" stroke="${p.edge}" stroke-width="5" fill="none" clip-path="url(#desert-eagle-recess-clip)"/>
    </g>
    <!-- The block's bottom edge, the seam with the frame -->
    <path d="M${fmt(SLIDE_BACK_POINTS[SLIDE_BACK_POINTS.length - 1])} L${ARM_FRONT},${SLIDE_BOTTOM}" stroke="${p.outline}" stroke-width="4" fill="none"/>
  </g>
  <g id="desert-eagle-sights">
    ${outline(REAR_SIGHT, STEEL.dark)}
    ${outline(FRONT_SIGHT, STEEL.dark)}
    <path d="${REAR_SIGHT}" fill="url(#desert-eagle-steel)"/>
    <path d="${FRONT_SIGHT}" fill="url(#desert-eagle-steel)"/>
  </g>
  <!-- Dark plastic, as the grip: the hub, the arm, the pad on its end; a steel screw through the hub -->
  <g id="desert-eagle-safety">
    ${outline(SAFETY, POLYMER.dark)}
    <path d="${SAFETY}" fill="url(#desert-eagle-polymer-part)"/>
    <path d="${SAFETY_LIT}" stroke="${POLYMER.highlight}" stroke-width="3" fill="none"/>
    <path d="${SAFETY_PAD}" fill="${POLYMER.highlight}" stroke="${POLYMER.dark}" stroke-width="3"/>
    <path d="M458,158 L500,137 L522,137" stroke="#7a7d83" stroke-width="3" fill="none"/>
    <circle cx="${SAFETY_HUB[0]}" cy="${SAFETY_HUB[1]}" r="${SAFETY_SCREW_R}" fill="${STEEL.base}" stroke="${STEEL.dark}" stroke-width="3"/>
    <path d="M${SAFETY_HUB[0] - SAFETY_SCREW_R + 3},${SAFETY_HUB[1] - 1} L${SAFETY_HUB[0] + SAFETY_SCREW_R - 3},${SAFETY_HUB[1] - 1}" stroke="${STEEL.dark}" stroke-width="6"/>
  </g>
  <g id="desert-eagle-slide-stop">
    ${outline(SLIDE_STOP, STEEL.dark)}
    <path d="${SLIDE_STOP}" fill="url(#desert-eagle-steel)"/>
    <path d="${SLIDE_STOP_GRIP}" stroke="${STEEL.dark}" stroke-width="3" fill="none"/>
    <path d="${SLIDE_STOP_LIT}" stroke="${STEEL.highlight}" stroke-width="3" fill="none"/>
    <circle cx="${SLIDE_STOP_PIN[0]}" cy="${SLIDE_STOP_PIN[1]}" r="${SLIDE_STOP_PIN_R}" fill="${STEEL.base}" stroke="${STEEL.dark}" stroke-width="3"/>
  </g>
  <!-- Black rubber, wrapped round the back strap -->
  <g id="desert-eagle-grip-panel">
    ${outline(PANEL, POLYMER.dark)}
    <path d="${PANEL}" fill="url(#desert-eagle-polymer)"/>
    <g clip-path="url(#desert-eagle-panel-clip)" fill="none" stroke="${POLYMER.highlight}" stroke-linecap="round">
      <path d="${PANEL_SWELL}" stroke-width="90" opacity="0.07"/>
      <path d="${PANEL_SWELL}" stroke-width="56" opacity="0.08"/>
      <path d="${PANEL_SWELL}" stroke-width="26" opacity="0.1"/>
      <path d="${PANEL_FRONT_LIT}" stroke-width="10" opacity="0.18"/>
    </g>
    <circle cx="${GRIP_SCREW[0]}" cy="${GRIP_SCREW[1]}" r="12" fill="${STEEL.base}" stroke="${STEEL.dark}" stroke-width="3"/>
    <path d="M${GRIP_SCREW[0] - 8},${GRIP_SCREW[1] + 5} L${GRIP_SCREW[0] + 8},${GRIP_SCREW[1] - 5}" stroke="${STEEL.dark}" stroke-width="4"/>
  </g>
  <!-- The magazine catch: a plastic button in a ring -->
  <g id="desert-eagle-magazine-catch">
    <circle cx="${MAG_CATCH[0]}" cy="${MAG_CATCH[1]}" r="20" fill="${p.floor}"/>
    <circle cx="${MAG_CATCH[0]}" cy="${MAG_CATCH[1]}" r="15" fill="url(#desert-eagle-polymer-part)"/>
  </g>
  <g id="desert-eagle-magazine-base">
    ${outline(MAG_BASE, STEEL.dark)}
    <path d="${MAG_BASE}" fill="url(#desert-eagle-steel)"/>
  </g>
</svg>`;
}

// ---------------------------------------------------------------------------------------------------------
// The top view: the gun as it's held, seen from above, muzzle along +x and its right side +y, in millimeters
// about its middle on the bore, at the same scale as the side view. Lengths along the gun are the side view's
// (`sx` converts its photo's pixels); widths are the real gun's.
//
// How it's built from above. The barrel is fixed: its top (the rail, on shoulders either side) from the slide's
// front (x 816) to the muzzle, its flats as wide as the slide, so the slide's arms (which run along the barrel's
// sides below its flats) are hidden under it, but for the round chamber just ahead of the slide, narrower than
// the flats, where the arms' tops show either side of it. The slide's rear block is behind the barrel: a raised
// top whose back end is round in plan (the slope in the side view, x 420 at the middle to 560 at the edges), a
// lower deck behind it carrying the rear sight, and its back face, which leans back going down, so it's seen from
// above as a band (x 210 to 322), with a slot for the hammer. From above the raised top's back is square with
// round corners (it slopes down in the side view, x 420 to 560, but the photo from above shows its plan). The ambidextrous safety stands out of both sides.
// When the slide goes back it uncovers the frame's top between the block and the barrel: the rails it runs on
// and the magazine's well, empty but for its follower. The hammer, cocked, sticks out behind the slide over the beavertail;
// it falls forward against the slide's back at each shot.
//
// Widths: the slide is 1.25" (31.75 mm), Magnum Research's width for the gun (dealers list it as the slide's).
// The rest are proportions measured in the photo from above and behind (desert-eagle-alternate.jpg, registered
// on the slide block's top corners): the round chamber about three quarters of the slide, the rail about two
// thirds, the rear sight most of the deck, the hammer's spur a third of the slide, the beavertail about 60%. The
// grip's rubber is a little narrower than the slide (the gun's width is the slide's).

/** A length along the gun from the side view's pixels, in millimeters from the gun's middle */
const sx = (px: number) => (px - 959.5) * MM_PER_PIXEL;

const SLIDE_HALF = 31.75 / 2;
const TOP_CHAMFER = 1.5; // the slide's and barrel's top edges, chamfered
const DECK_HALF = SLIDE_HALF - TOP_CHAMFER;
const SLIDE_BACK_TOP = sx(BACK_CORNER[0]); // the back face's top edge
const SLIDE_BACK_BOTTOM = sx(
  SLIDE_BACK_POINTS[SLIDE_BACK_POINTS.length - 1][0],
); // and its bottom, behind
const BLOCK_FRONT = sx(BARREL_BACK);
const ARMS_FRONT = sx(ARM_FRONT);
const RAISED_BACK_MIDDLE = sx(BACK_TOP[0]); // the raised top's round back end, at the middle
const RAISED_CORNER = 7; // its back corners, rounded in plan (the photo from above)
const REAR_SIGHT_X: [number, number] = [sx(333), sx(415)];
const REAR_SIGHT_HALF = 14;
const REAR_NOTCH_HALF = 1.8;
// The barrel from above
const MUZZLE_X = sx(MUZZLE);
const BARREL_FRONT_X = sx(BARREL_FRONT);
const CHAMBER_HALF = 10.5; // the round chamber (21 mm across), narrower than the flats
const CHAMBER_FRONT = sx(RUNOUT[RUNOUT.length - 1][0]); // where the flats are full width
const FLATS_START = sx(RAIL_START); // where the flats begin, at their top
const RAIL_HALF = 10.6; // the rail's lugs
const FRONT_SIGHT_X: [number, number] = [sx(1772), sx(1852)];
const FRONT_SIGHT_HALF = 1.7;
const DOVETAIL_X: [number, number] = [sx(1781), sx(1850)];
const PORT_IN = 3.6; // how far the brake's ports come in over the top's edges (J-shaped from above)
// The safety's levers, out of both sides of the slide
const SAFETY_HUB_X: [number, number] = [
  sx(SAFETY_HUB[0] - SAFETY_HUB_R),
  sx(SAFETY_HUB[0] + SAFETY_HUB_R),
];
const SAFETY_PAD_X: [number, number] = [sx(451), sx(538)];
const SAFETY_HUB_OUT = 1.6;
const SAFETY_PAD_OUT = 3.6;
// The hammer: cocked, behind the slide; its spur's checkered top
const HAMMER_BACK = sx(170);
const HAMMER_PIVOT = sx(269); // where it goes into the slide's back face, at the spur's height
const SPUR_HALF = 5;
const HAMMER_SLOT_HALF = SPUR_HALF + 0.6;
const HAMMER_SLOT_FRONT = sx(300); // the slot in the slide's back face, as far as the face's top
// The frame: the beavertail behind the slide, its top under the slide (seen when it's back), the grip below
const TANG_TIP = sx(31);
const TANG_HALF = 9.5;
const FRAME_HALF = 13.5;
const RAILS_IN = 3.6; // the rails the slide runs on, inside the frame's edges, just inside the arms
const GRIP_BACK_X = sx(148);
const GRIP_FRONT_X = sx(668);
const GRIP_HALF = 15;
// The magazine's well, under the slide's block, seen when the slide is back: empty but for the magazine's
// follower, since the slide only stays back (long enough to see) once the gun's empty
const WELL_X: [number, number] = [sx(400), sx(712)];
const WELL_HALF = 7.6;
const FOLLOWER_X: [number, number] = [sx(440), sx(690)];
const FOLLOWER_HALF = 6.4;
// The slide's travel, back (the stats' `parts.slide.offset`)
export const DESERT_EAGLE_SLIDE_TRAVEL = 48;

const t1 = (v: number) => fixed(v, 2).replace(/0+$/, "").replace(/\.$/, "");
const tp = (x: number, y: number) => `${t1(x)},${t1(y)}`;

/** A rectangle from x0,y0 to x1,y1 with each corner rounded by its own radius (back-left, front-left, front-right, back-right) */
function box(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number | [number, number, number, number] = 0,
) {
  const [a, b, c, d] = typeof r === "number" ? [r, r, r, r] : r;
  const k = 0.45;
  const corner = (
    cx: number,
    cy: number,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
  ) =>
    `C${tp(fromX + (cx - fromX) * (1 - k), fromY + (cy - fromY) * (1 - k))} ${tp(toX + (cx - toX) * (1 - k), toY + (cy - toY) * (1 - k))} ${tp(toX, toY)}`;
  return [
    `M${tp(x0 + a, y0)} L${tp(x1 - b, y0)}`,
    b ? corner(x1, y0, x1 - b, y0, x1, y0 + b) : "",
    `L${tp(x1, y1 - c)}`,
    c ? corner(x1, y1, x1, y1 - c, x1 - c, y1) : "",
    `L${tp(x0 + d, y1)}`,
    d ? corner(x0, y1, x0 + d, y1, x0, y1 - d) : "",
    `L${tp(x0, y0 + a)}`,
    a ? corner(x0, y0, x0, y0 + a, x0 + a, y0) : "",
    "Z",
  ]
    .filter(Boolean)
    .join(" ");
}

/** A gradient across the gun (along y), from -half to +half */
function across(id: string, half: number, stops: Stops): string {
  return linear(id, [0, -half], [0, half], stops);
}

/** A flat top seen from above: the sky, a little darker toward its edges */
function topStops(p: Polish): Stops {
  return [
    [0, p.skyLow],
    [0.25, p.sky],
    [0.5, p.edge],
    [0.75, p.sky],
    [1, p.skyLow],
  ];
}

/** A chamfered edge along a top: the horizon in it, hard, and the floor at its outer edge */
function chamferStops(p: Polish, half: number): Stops {
  const inner = (half - TOP_CHAMFER) / half; // where the chamfer starts, from the middle
  const lo = (1 - inner) / 2;
  const hi = 1 - lo;
  return [
    [0, p.floor],
    [lo * 0.45, p.floorLow],
    [lo * 0.55, p.skyLow],
    [lo, p.sky],
    [hi, p.sky],
    [1 - lo * 0.55, p.skyLow],
    [1 - lo * 0.45, p.floorLow],
    [1, p.floor],
  ];
}

/** A cylinder seen from above: bright down its middle, the floor at its sides */
function cylinderStops(p: Polish): Stops {
  return [
    [0, p.floor],
    [0.16, p.floorLow],
    [0.3, p.skyLow],
    [0.3 + p.hardness, p.sky],
    [0.5, p.edge],
    [0.7 - p.hardness, p.sky],
    [0.7, p.skyLow],
    [0.84, p.floorLow],
    [1, p.floor],
  ];
}

/** The raised top's outline: square at the back with round corners, out to the block's front */
function raisedTop(half: number): string {
  return box(RAISED_BACK_MIDDLE, -half, BLOCK_FRONT, half, [
    RAISED_CORNER,
    0,
    0,
    RAISED_CORNER,
  ]);
}

function drawTop(options: DesertEagleOptions = {}): string {
  const p: Polish = { ...CHROME_STAINLESS, ...options.polish };
  const outlineWidth = t1(2 * OUTLINE_MM);
  const outline = (d: string, color: string = p.outline) =>
    options.outline === false
      ? ""
      : `<path d="${d}" stroke="${color}" stroke-width="${outlineWidth}" fill="none"/>`;
  const minX = TANG_TIP - 1.5;
  const maxX = MUZZLE_X + 1.5;
  const half = SLIDE_HALF + SAFETY_PAD_OUT + 1.5;
  const width = t1(maxX - minX);
  const height = t1(half * 2);

  // The frame
  const tang =
    `M${tp(SLIDE_BACK_BOTTOM + 4, -TANG_HALF)} L${tp(TANG_TIP + TANG_HALF * 0.7, -TANG_HALF)} ` +
    `C${tp(TANG_TIP + 2, -TANG_HALF)} ${tp(TANG_TIP, -TANG_HALF * 0.55)} ${tp(TANG_TIP, 0)} ` +
    `C${tp(TANG_TIP, TANG_HALF * 0.55)} ${tp(TANG_TIP + 2, TANG_HALF)} ${tp(TANG_TIP + TANG_HALF * 0.7, TANG_HALF)} ` +
    `L${tp(SLIDE_BACK_BOTTOM + 4, TANG_HALF)} Z`;
  const frameTop = box(
    SLIDE_BACK_BOTTOM + 2,
    -FRAME_HALF,
    BLOCK_FRONT + 6,
    FRAME_HALF,
    1,
  );
  const grip = box(
    GRIP_BACK_X,
    -GRIP_HALF,
    GRIP_FRONT_X,
    GRIP_HALF,
    [5, 2, 2, 5],
  );
  const well = box(WELL_X[0], -WELL_HALF, WELL_X[1], WELL_HALF, 2);
  const follower = box(
    FOLLOWER_X[0],
    -FOLLOWER_HALF,
    FOLLOWER_X[1],
    FOLLOWER_HALF,
    2,
  );

  // The hammer: its spur, round at the back, and its neck forward under the slide
  const hammer = box(
    HAMMER_BACK,
    -SPUR_HALF,
    HAMMER_PIVOT + 8,
    SPUR_HALF,
    [3.5, 0, 0, 3.5],
  );
  const hammerTeeth: string[] = [];
  for (let x = HAMMER_BACK + 3; x < HAMMER_PIVOT - 1; x += 1.6) {
    hammerTeeth.push(`M${tp(x, -SPUR_HALF + 0.9)} L${tp(x, SPUR_HALF - 0.9)}`);
  }

  // The slide: its body (the block and the arms, the arms under the barrel), its back face seen as a band, the
  // deck, the raised top, the hammer's slot cut through the back
  const slot = box(
    SLIDE_BACK_BOTTOM - 0.5,
    -HAMMER_SLOT_HALF,
    HAMMER_SLOT_FRONT,
    HAMMER_SLOT_HALF,
    [0, 1.2, 1.2, 0],
  );
  // The block, and the two arms forward of it either side of the barrel (an open channel between them, where
  // the chamber is; the frame shows there when the slide is back)
  const arms =
    `${box(BLOCK_FRONT - 0.5, -SLIDE_HALF, ARMS_FRONT, -CHAMBER_HALF, [0, 0.5, 0, 0])} ` +
    box(
      BLOCK_FRONT - 0.5,
      CHAMBER_HALF,
      ARMS_FRONT,
      SLIDE_HALF,
      [0, 0, 0.5, 0],
    );
  const slideBody = `${box(SLIDE_BACK_BOTTOM, -SLIDE_HALF, BLOCK_FRONT, SLIDE_HALF, [1.5, 0, 0, 1.5])} ${slot} ${arms}`;
  const backFace = `${box(SLIDE_BACK_BOTTOM, -SLIDE_HALF, SLIDE_BACK_TOP, SLIDE_HALF, [1.5, 0, 0, 1.5])} ${slot}`;
  const deck = box(SLIDE_BACK_TOP, -SLIDE_HALF, BLOCK_FRONT, SLIDE_HALF);
  const raised = raisedTop(DECK_HALF);
  const serrationMarks: string[] = [];
  for (let i = 0; i < SERRATIONS; i++) {
    const x0 = sx(
      serrationX(FIRST_SERRATION + i * SERRATION_PITCH, SERRATION_TOP),
    );
    const x1 = sx(
      serrationX(
        FIRST_SERRATION + i * SERRATION_PITCH + SERRATION_WIDTH,
        SERRATION_TOP,
      ),
    );
    serrationMarks.push(box(x0, -SLIDE_HALF, x1, -SLIDE_HALF + 0.7));
    serrationMarks.push(box(x0, SLIDE_HALF - 0.7, x1, SLIDE_HALF));
  }
  const safety = (side: -1 | 1) => {
    const y0 = side * SLIDE_HALF;
    const hub = box(
      SAFETY_HUB_X[0],
      side < 0 ? y0 - SAFETY_HUB_OUT : y0 - 0.5,
      SAFETY_HUB_X[1],
      side < 0 ? y0 + 0.5 : y0 + SAFETY_HUB_OUT,
      side < 0 ? [1.2, 1.2, 0, 0] : [0, 0, 1.2, 1.2],
    );
    const pad = box(
      SAFETY_PAD_X[0],
      side < 0 ? y0 - SAFETY_PAD_OUT : y0 - 0.5,
      SAFETY_PAD_X[1],
      side < 0 ? y0 + 0.5 : y0 + SAFETY_PAD_OUT,
      side < 0 ? [1.5, 2.5, 0, 0] : [0, 0, 2.5, 1.5],
    );
    return `${hub} ${pad}`;
  };
  const safeties = `${safety(-1)} ${safety(1)}`;
  const rearSight = box(
    REAR_SIGHT_X[0],
    -REAR_SIGHT_HALF,
    REAR_SIGHT_X[1],
    REAR_SIGHT_HALF,
    [1, 2, 2, 1],
  );
  const rearNotch = box(
    REAR_SIGHT_X[0],
    -REAR_NOTCH_HALF,
    REAR_SIGHT_X[1],
    REAR_NOTCH_HALF,
  );

  // The barrel: the round chamber (the arms' tops either side of it), the flats out to the muzzle, the rail's
  // lugs with their slots across, the brake's ports over the top's edges, the front sight
  const chamber = box(
    BLOCK_FRONT - 0.5,
    -CHAMBER_HALF,
    CHAMBER_FRONT + 6,
    CHAMBER_HALF,
  );
  // The flats begin at the runout, full width from where it ends
  const flats =
    `M${tp(FLATS_START, -SLIDE_HALF + TOP_CHAMFER)} ` +
    `C${tp(FLATS_START + 3, -SLIDE_HALF)} ${tp(CHAMBER_FRONT - 4, -SLIDE_HALF)} ${tp(CHAMBER_FRONT, -SLIDE_HALF)} ` +
    `L${tp(BARREL_FRONT_X - 0.6, -SLIDE_HALF)} C${tp(MUZZLE_X, -SLIDE_HALF)} ${tp(MUZZLE_X, -SLIDE_HALF + 0.6)} ${tp(MUZZLE_X, -SLIDE_HALF + 1.2)} ` +
    `L${tp(MUZZLE_X, SLIDE_HALF - 1.2)} C${tp(MUZZLE_X, SLIDE_HALF - 0.6)} ${tp(MUZZLE_X, SLIDE_HALF)} ${tp(BARREL_FRONT_X - 0.6, SLIDE_HALF)} ` +
    `L${tp(CHAMBER_FRONT, SLIDE_HALF)} C${tp(CHAMBER_FRONT - 4, SLIDE_HALF)} ${tp(FLATS_START + 3, SLIDE_HALF)} ${tp(FLATS_START, SLIDE_HALF - TOP_CHAMFER)} ` +
    `L${tp(FLATS_START, -SLIDE_HALF + TOP_CHAMFER)} Z`;
  const lugs: string[] = [];
  let x = FLATS_START;
  for (let i = 0; i < SLOTS; i++) {
    const s0 = sx(FIRST_SLOT + i * SLOT_PITCH);
    lugs.push(
      box(x, -RAIL_HALF, s0, RAIL_HALF, i === 0 ? [2, 0.3, 0.3, 2] : 0.3),
    );
    x = sx(FIRST_SLOT + i * SLOT_PITCH + SLOT_WIDTH);
  }
  const lastLug = box(
    x,
    -RAIL_HALF,
    BARREL_FRONT_X - 2,
    RAIL_HALF,
    [0.3, 1.5, 1.5, 0.3],
  );
  const slotFloors: string[] = [];
  for (let i = 0; i < SLOTS; i++) {
    const s0 = sx(FIRST_SLOT + i * SLOT_PITCH);
    const s1 = sx(FIRST_SLOT + i * SLOT_PITCH + SLOT_WIDTH);
    slotFloors.push(box(s0, -RAIL_HALF, s1, RAIL_HALF));
  }
  const ports: string[] = [];
  for (let i = 0; i < PORTS; i++) {
    const p0 = sx(portLeft(i));
    const p1 = sx(portLeft(i) + PORT_WIDTH);
    ports.push(
      box(p0, -SLIDE_HALF - 0.1, p1, -SLIDE_HALF + PORT_IN, [0, 0, 2, 2]),
    );
    ports.push(
      box(p0, SLIDE_HALF - PORT_IN, p1, SLIDE_HALF + 0.1, [2, 2, 0, 0]),
    );
  }
  const frontSight = box(
    FRONT_SIGHT_X[0],
    -FRONT_SIGHT_HALF,
    FRONT_SIGHT_X[1],
    FRONT_SIGHT_HALF,
    [3, 0.4, 0.4, 3],
  );
  const dovetail = box(
    DOVETAIL_X[0],
    -RAIL_HALF - 0.3,
    DOVETAIL_X[1],
    RAIL_HALF + 0.3,
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${t1(minX)} ${t1(-half)} ${width} ${height}" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  ${generatedNote("desert-eagle")}
  <!-- The Desert Eagle Mark XIX from above, as it's held: muzzle along +x, its right side down the page (+y),
       millimeters about its middle on the bore, at the same scale as its side view (the pickup); lengths along it
       are the side view's. Polished stainless: the tops face the sky, so they're the brightest. The barrel is
       fixed; the slide and the hammer move. -->
  <defs>
    ${across("desert-eagle-top-slide", SLIDE_HALF, chamferStops(p, SLIDE_HALF))}
    ${across("desert-eagle-top-raised", DECK_HALF, topStops(p))}
    ${across("desert-eagle-top-back", SLIDE_HALF, [
      [0, p.floor],
      [0.1, p.floorLow],
      [0.5, p.skyLow],
      [0.9, p.floorLow],
      [1, p.floor],
    ])}
    ${across("desert-eagle-top-chamber", CHAMBER_HALF, cylinderStops(p))}
    ${across("desert-eagle-top-rail", RAIL_HALF, topStops(p))}
    ${across("desert-eagle-top-frame", FRAME_HALF, [
      [0, p.matteDark],
      [0.15, p.matte],
      [0.5, p.matteLight],
      [0.85, p.matte],
      [1, p.matteDark],
    ])}
    ${across("desert-eagle-top-tang", TANG_HALF, chamferStops(p, TANG_HALF))}
    ${across("desert-eagle-top-grip", GRIP_HALF, [
      [0, POLYMER.dark],
      [0.2, POLYMER.base],
      [0.5, POLYMER.light],
      [0.8, POLYMER.base],
      [1, POLYMER.dark],
    ])}
    ${across("desert-eagle-top-steel", SPUR_HALF, [
      [0, STEEL.dark],
      [0.3, STEEL.base],
      [0.5, STEEL.light],
      [0.7, STEEL.base],
      [1, STEEL.dark],
    ])}
    ${across("desert-eagle-top-steel-base", RAIL_HALF, [
      [0, STEEL.dark],
      [0.2, STEEL.base],
      [0.5, STEEL.light],
      [0.8, STEEL.base],
      [1, STEEL.dark],
    ])}
  </defs>
  <!-- The grip's rubber, a little narrower than the slide, out behind the beavertail at its foot -->
  <g id="grip">
    ${outline(grip, POLYMER.dark)}
    <path d="${grip}" fill="url(#desert-eagle-top-grip)"/>
  </g>
  <!-- The frame: the beavertail behind the slide, and under the slide (seen when it's back) its top, the rails the
       slide runs on, and the empty magazine's well -->
  <g id="frame">
    ${outline(tang)}
    ${outline(frameTop)}
    <path id="frame-top" d="${frameTop}" fill="url(#desert-eagle-top-frame)"/>
    <path id="beavertail" d="${tang}" fill="url(#desert-eagle-top-tang)"/>
    <g id="frame-rails" fill="${p.sky}">
      <path d="${box(SLIDE_BACK_BOTTOM + 3, -FRAME_HALF + RAILS_IN, BLOCK_FRONT + 4, -FRAME_HALF + RAILS_IN + 1)}"/>
      <path d="${box(SLIDE_BACK_BOTTOM + 3, FRAME_HALF - RAILS_IN - 1, BLOCK_FRONT + 4, FRAME_HALF - RAILS_IN)}"/>
    </g>
    <path id="magazine-well" d="${well}" fill="${STEEL.dark}"/>
    <path id="magazine-follower" d="${follower}" fill="${STEEL.base}"/>
  </g>
  <!-- Cocked: its spur out behind the slide over the beavertail, checkered; it falls forward against the slide's
       back at each shot (shorter from above, about where it goes into the slide) -->
  <g id="hammer">
    ${outline(hammer, STEEL.dark)}
    <path d="${hammer}" fill="url(#desert-eagle-top-steel)"/>
    <path d="${hammerTeeth.join(" ")}" stroke="${STEEL.dark}" stroke-width="0.5" fill="none"/>
  </g>
  <!-- The slide: its rear block (back face, deck, raised top) and the arms along the barrel's sides (under it but
       for the chamber), with the safety's levers out of both sides and the rear sight -->
  <g id="slide">
    ${outline(slideBody)}
    ${outline(safeties, POLYMER.dark)}
    <path id="safety" d="${safeties}" fill="${POLYMER.light}"/>
    <path id="slide-body" d="${slideBody}" fill="url(#desert-eagle-top-slide)"/>
    <path id="slide-back" d="${backFace}" fill="url(#desert-eagle-top-back)"/>
    <path id="hammer-slot" d="${slot}" stroke="${p.edgeDark}" stroke-width="0.5" fill="none"/>
    <path id="slide-top" d="${deck}" fill="url(#desert-eagle-top-slide)"/>
    <!-- The raised top, its round back end stepping down to the deck -->
    <path d="${raisedTop(DECK_HALF + 0.4)}" fill="${p.floorLow}"/>
    <path id="slide-rib" d="${raised}" fill="url(#desert-eagle-top-raised)"/>
    <g id="slide-serrations" fill="${p.floor}">
      <path d="${serrationMarks.join(" ")}"/>
    </g>
    <g id="rear-sight">
      ${outline(rearSight, STEEL.dark)}
      <path d="${rearSight}" fill="${STEEL.base}"/>
      <path d="${rearNotch}" fill="${STEEL.dark}"/>
      <path d="M${tp(REAR_SIGHT_X[1] - 0.6, -REAR_SIGHT_HALF + 1.5)} L${tp(REAR_SIGHT_X[1] - 0.6, -REAR_NOTCH_HALF - 0.4)} M${tp(REAR_SIGHT_X[1] - 0.6, REAR_NOTCH_HALF + 0.4)} L${tp(REAR_SIGHT_X[1] - 0.6, REAR_SIGHT_HALF - 1.5)}" stroke="${STEEL.highlight}" stroke-width="0.5" fill="none"/>
    </g>
  </g>
  <!-- Fixed: the round chamber just ahead of the slide, then the flats as wide as the slide out to the muzzle, the
       rail's lugs on top with their slots across, the brake's four ports coming over both edges, and the front
       sight in its dovetail -->
  <g id="barrel">
    ${outline(flats)}
    <path id="chamber" d="${chamber}" fill="url(#desert-eagle-top-chamber)"/>
    <path d="${flats}" fill="url(#desert-eagle-top-slide)"/>
    <!-- The flats' top, where the cutter ran out of the round -->
    <path d="M${tp(FLATS_START, -SLIDE_HALF + TOP_CHAMFER)} L${tp(FLATS_START, SLIDE_HALF - TOP_CHAMFER)}" stroke="${p.floorLow}" stroke-width="0.6" fill="none"/>
    <path d="${slotFloors.join(" ")}" fill="${p.floorLow}"/>
    <g id="barrel-rail">
      <path d="${lugs.join(" ")} ${lastLug}" fill="url(#desert-eagle-top-rail)" stroke="${p.floorLow}" stroke-width="0.4"/>
    </g>
    <path id="brake-ports" d="${ports.join(" ")}" fill="${p.edgeDark}"/>
  </g>
  <!-- On the barrel, fixed: a blade on a base across the rail, in its dovetail -->
  <g id="front-sight">
    ${outline(dovetail, STEEL.dark)}
    ${outline(frontSight, STEEL.dark)}
    <path d="${dovetail}" fill="url(#desert-eagle-top-steel-base)"/>
    <path d="${frontSight}" fill="${STEEL.light}"/>
  </g>
</svg>
`;
}

const TOP: TopView<DesertEagleOptions> = {
  draw: drawTop,
  registrations: [
    {
      // The slide block's top corners: its back face's top edge and its front face's (the photo is from behind,
      // above and to the right)
      file: "desert-eagle-alternate.jpg",
      points: [
        [
          [786, 1193],
          [SLIDE_BACK_TOP, -DECK_HALF],
        ],
        [
          [975, 1440],
          [SLIDE_BACK_TOP, DECK_HALF],
        ],
        [
          [1710, 795],
          [BLOCK_FRONT, -DECK_HALF],
        ],
        [
          [1925, 1010],
          [BLOCK_FRONT, DECK_HALF],
        ],
      ],
    },
  ],
};

export const DESERT_EAGLE: GunDrawing<DesertEagleOptions> = {
  name: "desert-eagle",
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
  scale: { origin: [959.5, 147], mmPerPixel: MM_PER_PIXEL },
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
  top: TOP,
};
