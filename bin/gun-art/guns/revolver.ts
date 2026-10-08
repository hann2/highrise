/**
 * The revolver: a Smith & Wesson Model 629 (.44 Magnum), polished stainless, very shiny, with an 8 3/8" tapered
 * barrel and target wood grips. Drawn in the pixels of its photo (1800 by 863) by named numbers, following the
 * gun-art skill (.claude/skills/gun-art/SKILL.md), with guns/m1911.ts as the worked example. A draft until it
 * goes into the game.
 *
 * Simon's decisions (2026-10-07):
 * - The barrel is the photographed 8 3/8", not a 6 1/2": these were the only photos he found with the tapered
 *   ejector rod shroud under the barrel (not the 629 Classic's full-length underlug). Drawn as photographed.
 * - The side is the LEFT side, mirrored (sw-629-mirrored.jpg, muzzle to the right), cylinder release and all.
 *   What that means for the drawing: on an S&W the side plate (its seams and its three or four screws) is on the
 *   RIGHT side, so the left side's frame is one plain surface; what the left side has instead is the cylinder
 *   release (a checkered thumbpiece held on by a screw, proud of the frame) and the grip's medallion on this
 *   panel. The yoke (crane) shows on both sides, in front of the cylinder.
 *
 * ROUND 1 is construction: the notes below, and a blockout of the main silhouettes in flat colors. No shading
 * or detail yet.
 *
 * ## Dimensions (the scale)
 *
 * - Barrel 8 3/8" = 212.7 mm, which S&W measure from the barrel's breech face (at the front of the cylinder
 *   window) to the muzzle. In the photo the breech is at x 739 (the window's front, where the gap in front of
 *   the cylinder ends) and the muzzle at x 1728: 989 px, so 0.2151 mm a pixel. That's the scale.
 * - Checks: the cylinder is 205 px across (y 132 to 337 at x 600) = 44.1 mm, and the N frame's cylinder is
 *   1.740" = 44.2 mm. The cylinder's length is 205 px too (x 518 to 723) = 44.1 mm, about the N frame .44's
 *   1.75". The whole gun is 1673 px (the grip's heel at x 55 to the muzzle) = 360 mm = 14.2"; the 6" 629 is
 *   11.6" long by the spec sheets (IMFDB), so an 8 3/8" is about 14.0" from the frame, and the target grips'
 *   heel reaches back a little past the frame's.
 * - Height: the front sight's top (y 57) to the grip's base (y 797) = 159 mm.
 * - The bore's axis is y 160 (the barrel is 106 at its rib's top to 207 under it); the cylinder's axis is y 234.5,
 *   74 px (16 mm) under the bore, where the chamber at the top lines up with it.
 *
 * ## Construction
 *
 * Parts, in drawing order (back to front), and how they sit:
 *
 * - HAMMER, behind the frame: it pivots inside the frame's hammer slot, so only what sticks out shows: the spur
 *   reaching back over the grip (tip at x 300, its top checkered where the thumb goes, a target hammer's wide
 *   spur), the concave throat under the spur's front, and the hammer's top in front of it, up to the frame's top
 *   behind the rear sight. Down, at rest, as it's carried. Its lower half is under the frame's side.
 * - TRIGGER, behind the frame, showing through the guard: a smooth, wide target trigger, a crescent whose front
 *   (finger) face is concave, hanging from the frame's underside in the guard's opening, its tip curling forward.
 * - FRAME, one piece of stainless with the trigger guard: the topstrap over the cylinder (its top flat at y 100,
 *   stepping down to 104 for the last 40 px before the frame's front at x 830); the window round the cylinder
 *   (top y 126, bottom 345, front 740, and a back that curves out round the cylinder's rear, the recoil shield,
 *   x 491 at its deepest); the lump in front of the window that the barrel screws into, down to the frame's front
 *   corner (830, 395); the frame's underside (y 404) back to the guard; the guard, a ring integral to the frame,
 *   about 15 px (3 mm) thick, tilted a little forward, whose opening's top is the frame's underside (y 393); the
 *   frame's back, a long curve from the topstrap's rear (458, 119) down to the grip's tang (285, 268); and the
 *   grip frame, entirely under the wood. Planes: the frame's side is one flat face (on this side, no side plate);
 *   the guard is rounded, a step down from it, and so are the frame's back and the topstrap's edges.
 * - YOKE (crane), flush with the frame's side, in front of the cylinder: its seam runs forward under the barrel's
 *   shank at y 200 to the frame's front, and back along y 333. The ejector rod comes out of its front. A seam
 *   only: drawn as the frame (a line, round 2).
 * - CYLINDER, in the window, in front of the frame's side: a true cylinder, 205 px long and across, with a
 *   chamfered rear edge and a bevelled front. Six chambers, six flutes between them. With a chamber at the top
 *   (under the bore), the flutes are at 30, 90 and 150 degrees from the top on this side: the middle one faces us
 *   (centered on the axis, y 234; full width, its rear end a half circle), and the other two are near the top
 *   and bottom edges (y 234 -+ 0.866 R = 145 and 323), foreshortened to half their width (sin 30), their ends
 *   half ellipses. Flutes are ball-end cuts that stop short of both faces, from about x 580 to 718. The cylinder
 *   stop notches (two small slots near the rear, at y 170 and 280, x 520 to 555) show too. The gap in front of
 *   the cylinder (x 723 to 739) shows the center pin and the ejector's collar, dark.
 * - BARREL, screwed into the frame's front (x 830), in front of everything but the sights: a tube tapering very
 *   slightly (its underside y 207 at the shroud to 204 at the muzzle), a narrow flat rib along its top (the dark
 *   band y 106 to 112, the rib's side), the muzzle's crown rounded. "SMITH & WESSON" is rolled into its side
 *   (drops out at 128 px).
 * - EJECTOR ROD SHROUD, one piece with the barrel, under it: a lug from the frame's front to x 1072 (its
 *   underside y 277), whose front sweeps up and forward in one concave curve into the barrel's underside at
 *   x 1140. The rod lies in an open channel between the barrel and the lug (y 208 to 250), its front end a half
 *   circle (the pocket the rod's tip locks into). The ROD, round (y 218 to 240), comes out of the yoke and ends
 *   at x 1017 in a rounded tip, behind a knurled band (x 970 to 998).
 * - FRONT SIGHT, standing on the rib: a ramp rising from the rib at x 1540 (concave, to y 88 at x 1630), then
 *   the blade, sloping up to a rounded top (y 57) and dropping straight at the front (x 1721). Its red insert is
 *   a parallelogram on the blade's slope, the one bit of color on the gun. Pinned to the rib (a pin, which drops
 *   out at 128 px).
 * - REAR SIGHT, on the topstrap: S&W's adjustable sight, black (blued) on a stainless gun. A long, thin leaf
 *   lying on the topstrap from the sight's body to x 792, sloping down from y 81 to 97; at its back the body,
 *   taller and rounded, with the elevation screw's head (470, 92) in its side, and the notched blade on top
 *   (y 68). The body sits on the frame's top where it curves down behind the topstrap.
 * - CYLINDER RELEASE (the thumbpiece), on the frame's side behind the window, standing proud of it: a checkered
 *   pad, wider than tall (x 362 to 440, y 250 to 306), and a plate reaching forward from it round its screw
 *   (452, 272), which is slotted. Its checkering is a grid of small domes; at 128 px it's a flat lighter pad.
 * - GRIP, wood, over everything round the grip: a target stock that wraps the whole grip frame, front strap and
 *   backstrap (no metal shows below the tang), and fills the space behind the trigger guard with a "horn"
 *   (x 442 to 461, y 403 to 480). Its top meets the frame along a curve from the tang (290, 276) down and
 *   forward to the horn. The back runs straight down, leaning back (about -0.44 x per y), the front is
 *   concave under the horn and flares out at the base. Planes: the checkered field is sunk into the panel, a
 *   step down with a raised, smooth border all round it, its back edge along the back's lean; checkering in two
 *   sets of lines along the grip's axis, like the M1911's (and one axis for all of it, SlantedAxis). The
 *   medallion (silver S&W monogram, a disc of 24 px radius at (300, 423)) is set in the border above the field,
 *   flush; the grip screw's escutcheon (r 12 at (200, 573)) is in the field.
 * - Pins: a pin in the frame's side above the thumbpiece (441, 152), and a round boss under the window's rear
 *   corner (505, 350).
 *
 * At 128 px (a pixel is about 2.9 mm): the silhouette, the cylinder and its three flutes, the window's dark
 * gaps, the ejector rod in its channel, the hammer spur, the guard and trigger, the front sight's red, the black
 * rear sight, the wood with a hint of its field and the medallion survive. The flutes' end shapes, the stop
 * notches, the knurling on the rod, the thumbpiece's checkering (as a lighter pad), the yoke seam, the rolled
 * marking, the pins and the grip screw go, or are kept only as a line or a dot.
 */
import type { Point } from "../lib/geometry";
import { arc, fmt, on, polygon, rounded, smoothCurve } from "../lib/geometry";
import type { GunDrawing } from "../lib/gun";
import { BLUED_STEEL, POLISHED_STAINLESS, WALNUT } from "../lib/style";

const STAINLESS = POLISHED_STAINLESS.base;
const STAINLESS_LIGHT = POLISHED_STAINLESS.light;
const STAINLESS_DARK = POLISHED_STAINLESS.dark;
const GAP = BLUED_STEEL.dark; // the dark gaps round the cylinder and in the rod's channel
const SIGHT = BLUED_STEEL.base; // the rear sight, blued
// Not in style.ts yet: the front sight's red insert, taken from the photo (to propose for style.ts)
const SIGHT_RED = "#e8553c";
const WOOD = WALNUT.base;

// ---------------------------------------------------------------------------------------------------------
// The scale's numbers, in the photo's pixels
const MUZZLE = 1728;
const BREECH = 739; // the barrel's breech face, at the front of the cylinder window
const BARREL_MM = 8.375 * 25.4;
const GRIP_HEEL = 55; // the grip's bottom back corner, the gun's back
const BORE_Y = 160;

// ---------------------------------------------------------------------------------------------------------
// The frame
const TOPSTRAP_TOP = 100;
const FRAME_FRONT_TOP = 104; // the topstrap steps down for the last stretch before the frame's front
const STEP_X = 792;
const FRAME_FRONT = 830;
const FRAME_FRONT_BOTTOM = 395;
const FRAME_UNDER = 404; // the frame's underside, in front of the guard
const FRAME_TOP_BACK: Point = [458, 119]; // the topstrap's rear, under the rear sight's body
const TANG: Point = [285, 268]; // the frame's back meets the wood at the top of the grip
// The frame's back, from the tang up to the topstrap (measured along its edge in the photo)
const FRAME_BACK: Point[] = [
  TANG,
  [300, 262],
  [335, 248],
  [370, 228],
  [400, 207],
  [425, 190],
  [445, 165],
  [455, 140],
  FRAME_TOP_BACK,
];

// The window round the cylinder: its back curves out round the cylinder's rear (the recoil shield)
const WINDOW_TOP = 126;
const WINDOW_BOTTOM = 345;
const WINDOW_FRONT = 740;
const WINDOW_BACK: Point[] = [
  [514, WINDOW_BOTTOM],
  [508, 310],
  [497, 280],
  [491, 245],
  [498, 215],
  [509, 170],
  [515, WINDOW_TOP],
];

// The trigger guard, a ring: its outside from where it leaves the frame's underside, round, and back up into
// the frame behind it (under the wood's horn); its opening, whose top is the frame's underside
const GUARD_OUTSIDE: Point[] = [
  [706, 412],
  [701, 430],
  [697, 450],
  [689, 470],
  [681, 490],
  [667, 510],
  [645, 530],
  [610, 544],
  [580, 551],
  [550, 553],
  [520, 550],
  [498, 540],
  [480, 524],
  [468, 505],
  [463, 485],
  [466, 460],
  [472, 432],
  [482, 412],
];
const OPENING_TOP = 393;
const OPENING: Point[] = [
  [682, OPENING_TOP],
  [684, 412],
  [685, 432],
  [681, 450],
  [674, 470],
  [666, 488],
  [647, 508],
  [610, 526],
  [580, 534],
  [550, 537],
  [522, 533],
  [505, 523],
  [491, 508],
  [481, 490],
  [478, 470],
  [483, 450],
  [491, 430],
  [503, 410],
  [520, OPENING_TOP],
];

// ---------------------------------------------------------------------------------------------------------
// The cylinder: a true cylinder, as long as it is across
const CYLINDER_BACK = 518;
const CYLINDER_FRONT = 723;
const CYLINDER_TOP = 132;
const CYLINDER_BOTTOM = 337;

// ---------------------------------------------------------------------------------------------------------
// The barrel and the ejector rod shroud under it
const RIB_TOP = 106;
const BARREL_UNDER = 207; // at the shroud
const BARREL_UNDER_MUZZLE = 204; // the taper
const CROWN = 4; // the muzzle's rounded edges
const SHROUD_UNDER = 277;
// The shroud's front, sweeping up into the barrel's underside
const SHROUD_FRONT: Point[] = [
  [1140, BARREL_UNDER],
  [1115, 212],
  [1098, 222],
  [1087, 240],
  [1078, 262],
  [1072, SHROUD_UNDER],
];
const CHANNEL_TOP = 208;
const CHANNEL_BOTTOM = 250;
const CHANNEL_END = 1017; // the front of the rod's pocket
const ROD_TOP = 218;
const ROD_BOTTOM = 240;
const ROD_TIP = 1017;
const KNURL: [number, number] = [970, 998];

// ---------------------------------------------------------------------------------------------------------
// The sights
// The front sight: a ramp off the rib, then the blade
const RAMP_START = 1540;
const RAMP: Point[] = [
  [RAMP_START, RIB_TOP],
  [1585, 96],
  [1630, 88],
];
const BLADE_TOP = 57;
const BLADE_FRONT = 1721;
const BLADE: Point[] = [
  [1636, 86],
  [1665, 72],
  [1694, 59],
];
const RED_INSERT: Point[] = [
  [1667, 70],
  [1694, 57],
  [1700, 63],
  [1672, 77],
];
// The rear sight: its body at the back (rounded), the blade on it, and the leaf along the topstrap
const LEAF_FRONT = STEP_X;
const LEAF_TOP_BACK = 81;
const LEAF_TOP_FRONT = 97;
const ELEVATION_SCREW: Point = [470, 92];

// ---------------------------------------------------------------------------------------------------------
// The hammer, at rest. Its top outline: from the spur's tip, along the spur's checkered top, down into the
// throat and up the hammer's front to its top; then its underside back to the tip
const SPUR_TIP: Point = [303, 155.5];
const SPUR_TIP_R = 5.5;
const HAMMER_TOP: Point[] = [
  [303, 150],
  [320, 145],
  [345, 145],
  [368, 150],
  [385, 163],
  [398, 174],
  [415, 171],
  [428, 158],
  [434, 140],
  [440, 123],
];
const HAMMER_UNDER: Point[] = [
  [378, 215],
  [370, 190],
  [355, 172],
  [330, 163],
  [303, 161],
];

// ---------------------------------------------------------------------------------------------------------
// The trigger: a crescent, its front (finger) face concave
const TRIGGER_FRONT: Point[] = [
  [592, OPENING_TOP],
  [590, 410],
  [578, 430],
  [567, 450],
  [568, 470],
  [578, 490],
  [598, 508],
  [612, 515],
];
const TRIGGER_BACK: Point[] = [
  [608, 518],
  [585, 516],
  [562, 505],
  [548, 480],
  [543, 450],
  [543, 420],
  [548, OPENING_TOP],
];

// ---------------------------------------------------------------------------------------------------------
// The cylinder release: a checkered pad, and its plate round the screw
const THUMBPIECE = rounded(
  [
    [362, 250],
    [440, 250],
    [440, 306],
    [362, 306],
  ],
  [26, 12, 12, 26],
);
const THUMB_SCREW: Point = [452, 272];
const THUMB_PLATE_R = 22;

// ---------------------------------------------------------------------------------------------------------
// The grip: wood all round the grip frame. Its top meets the frame along a curve from the tang to the horn
// behind the guard; then down its front, concave under the horn and flaring at the base; along the base; and
// up its back, leaning back
const WOOD_TOP: Point = [250, 276];
const WOOD_BORDER: Point[] = [
  [290, 276],
  [312, 288],
  [330, 305],
  [341, 325],
  [345, 350],
  [352, 372],
  [365, 390],
  [390, 399],
  [420, 401],
  [442, 403],
];
const WOOD_FRONT: Point[] = [
  [442, 403],
  [452, 415],
  [459, 440],
  [461, 462],
  [447, 480],
  [420, 492],
  [389, 501],
  [368, 520],
  [358, 540],
  [351, 560],
  [347, 580],
  [344, 620],
  [343, 660],
  [346, 700],
  [350, 740],
  [356, 770],
  [360, 795],
];
const GRIP_BASE = 797;
const WOOD_BACK: Point[] = [
  [GRIP_HEEL, 790],
  [61, 760],
  [77, 720],
  [92, 680],
  [104, 640],
  [115, 600],
  [128, 560],
  [145, 520],
  [164, 480],
  [187, 440],
  [213, 400],
  [238, 360],
  [245, 335],
  [247, 300],
  WOOD_TOP,
];
// The sunken checkered field, its back along the grip's back
const FIELD = rounded(
  [
    [210, 440],
    [275, 440],
    [330, 480],
    [318, 700],
    [118, 705],
  ],
  [18, 18, 18, 14, 14],
);
const MEDALLION: Point = [300, 423];
const MEDALLION_R = 24;
const GRIP_SCREW: Point = [200, 573];
const GRIP_SCREW_R = 12;

// ---------------------------------------------------------------------------------------------------------

const c = (p: Point, r: number, fill: string) =>
  `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${fill}"/>`;

function drawSide(): string {
  const hammer =
    `M${fmt(HAMMER_TOP[0])} ${smoothCurve(HAMMER_TOP, [1, -0.3], [0.3, -1])} ` +
    `L470,119 L470,250 L372,250 L${fmt(HAMMER_UNDER[0])} ` +
    `${smoothCurve(HAMMER_UNDER, [-0.2, -1], [-1, 0])} ${arc(SPUR_TIP, SPUR_TIP_R, 90, 270)} Z`;

  const trigger =
    `M${fmt(TRIGGER_FRONT[0])} ${smoothCurve(TRIGGER_FRONT, [0, 1], [1, 0.3])} ` +
    `C616,516 613,518 ${fmt(TRIGGER_BACK[0])} ${smoothCurve(TRIGGER_BACK, [-1, 0], [0.2, -1])} ` +
    `L548,${OPENING_TOP - 20} L592,${OPENING_TOP - 20} Z`;

  // The frame, round from the topstrap's rear: along the top, down the front, along the underside, round the
  // guard, back under the wood to the tang, and up its back. The guard's opening is a hole in it.
  const frame =
    `M${fmt(FRAME_TOP_BACK)} C470,110 488,${TOPSTRAP_TOP} 510,${TOPSTRAP_TOP} ` +
    `L${STEP_X},${TOPSTRAP_TOP} L${STEP_X + 2},${FRAME_FRONT_TOP} L${FRAME_FRONT - 6},${FRAME_FRONT_TOP} ` +
    `C${FRAME_FRONT - 2},${FRAME_FRONT_TOP} ${FRAME_FRONT},${FRAME_FRONT_TOP + 2} ${FRAME_FRONT},${FRAME_FRONT_TOP + 6} ` +
    `L${FRAME_FRONT},${FRAME_FRONT_BOTTOM} ` +
    `C${FRAME_FRONT},${FRAME_UNDER - 3} ${FRAME_FRONT - 4},${FRAME_UNDER} ${FRAME_FRONT - 9},${FRAME_UNDER} ` +
    `L722,${FRAME_UNDER} C714,${FRAME_UNDER} 709,406 ${fmt(GUARD_OUTSIDE[0])} ` +
    `${smoothCurve(GUARD_OUTSIDE, [-0.25, 1], [0.6, -1])} ` +
    `L440,404 L380,430 L340,520 L300,700 L200,700 L262,330 L${fmt(TANG)} ` +
    `${smoothCurve(FRAME_BACK, [1, -0.4], [0.1, -1])} Z ` +
    `M${fmt(OPENING[0])} ${smoothCurve(OPENING, [0.1, 1], [1, -0.5])} Z`;

  const window =
    `M${fmt(WINDOW_BACK[0])} ${smoothCurve(WINDOW_BACK, [-0.3, -1], [0.15, -1])} ` +
    `L${WINDOW_FRONT},${WINDOW_TOP} L${WINDOW_FRONT},${WINDOW_BOTTOM} Z`;

  const cylinder = rounded(
    [
      [CYLINDER_BACK, CYLINDER_TOP],
      [CYLINDER_FRONT, CYLINDER_TOP],
      [CYLINDER_FRONT, CYLINDER_BOTTOM],
      [CYLINDER_BACK, CYLINDER_BOTTOM],
    ],
    [6, 4, 4, 6],
  );

  const barrel =
    `M${FRAME_FRONT},${RIB_TOP} L${MUZZLE - CROWN},${RIB_TOP} ` +
    `C${MUZZLE - 1},${RIB_TOP} ${MUZZLE},${RIB_TOP + 2} ${MUZZLE},${RIB_TOP + CROWN} ` +
    `L${MUZZLE},${BARREL_UNDER_MUZZLE - CROWN} ` +
    `C${MUZZLE},${BARREL_UNDER_MUZZLE - 1} ${MUZZLE - 1},${BARREL_UNDER_MUZZLE} ${MUZZLE - CROWN},${BARREL_UNDER_MUZZLE} ` +
    `L${fmt(SHROUD_FRONT[0])} ${smoothCurve(SHROUD_FRONT, [-1, 0], [-0.35, 1])} ` +
    `L${FRAME_FRONT},${SHROUD_UNDER} Z`;
  const channelR = (CHANNEL_BOTTOM - CHANNEL_TOP) / 2;
  const channelCenter: Point = [CHANNEL_END - channelR, CHANNEL_TOP + channelR];
  const channel =
    `M${FRAME_FRONT},${CHANNEL_TOP} L${fmt(on(channelCenter, channelR, -90))} ` +
    `${arc(channelCenter, channelR, -90, 90)} L${FRAME_FRONT},${CHANNEL_BOTTOM} Z`;
  const rodR = (ROD_BOTTOM - ROD_TOP) / 2;
  const rodCenter: Point = [ROD_TIP - rodR, ROD_TOP + rodR];
  const rod =
    `M${FRAME_FRONT},${ROD_TOP} L${fmt(on(rodCenter, rodR, -90))} ` +
    `${arc(rodCenter, rodR, -90, 90)} L${FRAME_FRONT},${ROD_BOTTOM} Z`;

  const frontSight =
    `M${fmt(RAMP[0])} ${smoothCurve(RAMP, [1, -0.1], [1, -0.1])} L${fmt(BLADE[0])} ` +
    `${smoothCurve(BLADE, [1, -0.5], [1, -0.45])} ` +
    `C1700,${BLADE_TOP - 1} 1708,${BLADE_TOP} 1712,${BLADE_TOP} ` +
    `C1717,${BLADE_TOP} ${BLADE_FRONT},${BLADE_TOP + 4} ${BLADE_FRONT},${BLADE_TOP + 9} ` +
    `L${BLADE_FRONT},${RIB_TOP + 1} L${RAMP_START},${RIB_TOP + 1} Z`;

  // The rear sight: the leaf along the topstrap, and the body at its back with the blade on top
  const rearSight =
    `M470,${TOPSTRAP_TOP + 2} L470,${LEAF_TOP_BACK} L520,${LEAF_TOP_BACK} ` +
    `C560,${LEAF_TOP_BACK + 2} 585,${LEAF_TOP_FRONT - 4} 620,${LEAF_TOP_FRONT - 3} ` +
    `L${LEAF_FRONT - 4},${LEAF_TOP_FRONT} L${LEAF_FRONT + 2},${TOPSTRAP_TOP + 3} L470,${TOPSTRAP_TOP + 3} Z ` +
    `M490,${LEAF_TOP_BACK} L490,112 C490,117 485,120 478,120 L462,120 ` +
    `C456,120 453,112 453,100 C453,88 458,${LEAF_TOP_BACK} 466,${LEAF_TOP_BACK} Z ` +
    `M466,${LEAF_TOP_BACK + 1} L466,70 C466,68 467,67 469,67 L479,67 C481,67 482,68 482,70 L482,${LEAF_TOP_BACK + 1} Z`;

  const thumbPlate =
    `M410,252 L${fmt(on(THUMB_SCREW, THUMB_PLATE_R, -90))} ` +
    `${arc(THUMB_SCREW, THUMB_PLATE_R, -90, 90)} L410,300 Z`;

  const wood =
    `M${fmt(WOOD_TOP)} L${fmt(WOOD_BORDER[0])} ${smoothCurve(WOOD_BORDER, [1, 0.4], [1, 0.05])} ` +
    `${smoothCurve(WOOD_FRONT, [1, 1], [0.15, 1])} L${GRIP_HEEL + 2},${GRIP_BASE} ` +
    `C${GRIP_HEEL},${GRIP_BASE} ${GRIP_HEEL - 1},${GRIP_BASE - 3} ${fmt(WOOD_BACK[0])} ` +
    `${smoothCurve(WOOD_BACK, [0.15, -1], [0.05, -1])} Z`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="863" viewBox="0 0 1800 863" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  <!-- Blockout (round 1): the main silhouettes in flat colors, in drawing order -->
  <!-- Behind the frame, at rest: only the spur and the top show -->
  <g id="revolver-hammer">
    <path d="${hammer}" fill="${STAINLESS_LIGHT}"/>
  </g>
  <!-- Behind the frame, through the guard's opening -->
  <g id="revolver-trigger">
    <path d="${trigger}" fill="${STAINLESS_LIGHT}"/>
  </g>
  <!-- Topstrap, window, the lump in front of it, the underside, the guard (one piece with it) and the back -->
  <g id="revolver-frame">
    <path d="${frame}" fill="${STAINLESS}"/>
    <!-- The window round the cylinder: the gaps round it are dark -->
    <path d="${window}" fill="${GAP}"/>
  </g>
  <g id="revolver-cylinder">
    <path d="${cylinder}" fill="${STAINLESS_LIGHT}"/>
  </g>
  <!-- The rod, out of the yoke through the gap and along the shroud's channel -->
  <g id="revolver-barrel">
    <path d="${barrel}" fill="${STAINLESS}"/>
    <path d="${channel}" fill="${GAP}"/>
    <path d="${rod}" fill="${STAINLESS_LIGHT}"/>
    <path d="M${KNURL[0]},${ROD_TOP} L${KNURL[1]},${ROD_TOP} L${KNURL[1]},${ROD_BOTTOM} L${KNURL[0]},${ROD_BOTTOM} Z" fill="${STAINLESS_DARK}"/>
    <path d="M${FRAME_FRONT},${RIB_TOP} L${MUZZLE - CROWN},${RIB_TOP} L${MUZZLE - CROWN},112 L${FRAME_FRONT},112 Z" fill="${STAINLESS_DARK}"/>
  </g>
  <g id="revolver-front-sight">
    <path d="${frontSight}" fill="${STAINLESS}"/>
    <path d="${polygon(RED_INSERT)}" fill="${SIGHT_RED}"/>
  </g>
  <g id="revolver-rear-sight">
    <path d="${rearSight}" fill="${SIGHT}"/>
    ${c(ELEVATION_SCREW, 9, BLUED_STEEL.light)}
  </g>
  <!-- Proud of the frame's side -->
  <g id="revolver-cylinder-release">
    <path d="${thumbPlate}" fill="${STAINLESS}"/>
    <path d="${THUMBPIECE}" fill="${STAINLESS_LIGHT}"/>
    ${c(THUMB_SCREW, 13, STAINLESS_LIGHT)}
  </g>
  <!-- Wraps the whole grip frame; the checkered field is sunk into it, the medallion flush in its border -->
  <g id="revolver-grip">
    <path d="${wood}" fill="${WOOD}"/>
    <path d="${FIELD}" fill="${WALNUT.dark}" opacity="0.35"/>
    ${c(MEDALLION, MEDALLION_R, STAINLESS_LIGHT)}
    ${c(GRIP_SCREW, GRIP_SCREW_R, STAINLESS_DARK)}
  </g>
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
  // The origin on the bore (y 160), halfway along the gun (the grip's heel at x 55 to the muzzle at 1728); the
  // scale from the barrel's length, 8 3/8" from its breech (x 739) to the muzzle (see the top of the file)
  scale: {
    origin: [(GRIP_HEEL + MUZZLE) / 2, BORE_Y],
    mmPerPixel: BARREL_MM / (MUZZLE - BREECH),
  },
  // The gun's extent in the photo (the front sight's top to the grip's base, the heel to the muzzle), and the
  // square round it in millimeters: it's 360 mm long, so 380 (about 5% more, as the M1911's 224 for 216)
  frame: {
    top: 57,
    bottom: GRIP_BASE,
    back: GRIP_HEEL,
    front: MUZZLE,
    side: 380,
    pixels: 256,
  },
  comment: `
  <!-- The revolver (a Smith & Wesson 629, 8 3/8") from its left side, mirrored, muzzle to the right. Millimeters,
       with the origin on the gun's middle on the bore, as the guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
};
