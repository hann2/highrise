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
 *   On an S&W the side plate (its seams and screws) is on the RIGHT side, so the left side's frame is one plain
 *   surface; what the left side has instead is the cylinder release (a thumbpiece held on by a screw, proud of
 *   the frame) and the grip's medallion on this panel. The yoke (crane) shows on both sides.
 * - The wood is the M1911's cocoa walnut, not the photo's honey color. True scale (a 380 mm square). The rear
 *   sight is black.
 * - The polish (the whole set's): chrome-like, hard bands reflecting a bright sky above and a dark floor below,
 *   two or three to a face, along each face's own axis (along the barrel, round the cylinder), a near-white
 *   highlight on edges, and darks darker than POLISHED_STAINLESS.dark in the floor's reflection.
 * - The gaps round the cylinder are see-through, and the barrel's breech shows in the gap in front of it.
 *
 * ## Dimensions (the scale)
 *
 * - Barrel 8 3/8" = 212.7 mm, which S&W measure from the barrel's breech face (at the front of the cylinder
 *   window) to the muzzle. In the photo the breech is at x 739 and the muzzle at x 1728: 989 px, so 0.2151 mm a
 *   pixel. That's the scale.
 * - Checks: the cylinder is about 202 px across (y 129 to 331) = 43.5 mm, against the N frame's 1.740" = 44.2 mm;
 *   its length is about the same (x 520 to 726). The whole gun is 1673 px (the grip's heel at x 55 to the muzzle)
 *   = 360 mm = 14.2"; the 6" 629 is 11.6" long by the spec sheets (IMFDB), so an 8 3/8" is about 14.0" from the
 *   frame, and the target grips' heel reaches back a little past the frame's.
 * - Height: the front sight's top (y 57) to the grip's base (y 797) = 159 mm.
 * - The bore's axis is y 160 (the barrel is 106 at its rib's top to 207 under it); the cylinder's axis is y 230,
 *   70 px (15 mm) under the bore, where the chamber at the top lines up with it.
 *
 * ## Construction
 *
 * Parts, in drawing order (back to front), and how they sit:
 *
 * - HAMMER, behind the frame, down (at rest): only what sticks out shows. The spur reaching back over the grip
 *   (tip at x 301), its top checkered where the thumb goes; under its front a concave throat; then the hammer's
 *   front rising to its top (y 123), which meets the frame behind the rear sight. Lower down it disappears behind
 *   the frame's side, whose edge is the bright line curving from the topstrap's rear down toward the grip.
 * - TRIGGER, behind the frame, showing through the guard: a smooth, wide target trigger, a crescent between two
 *   true circles (its front, finger face concave), hanging from inside the frame, its tip curling forward.
 * - FRAME, one piece of stainless with the trigger guard. Its side is one flat face: the topstrap over the
 *   cylinder (flat at y 100, stepping down to 104 for its last stretch before the frame's front at x 830), the
 *   window round the cylinder (a hole: top y 126, bottom 336, front 740, its back curving out round the cylinder's
 *   rear), the lump in front of the window, which the barrel screws into, its front straight down to the shroud's
 *   underside, then sweeping back in a concave curve (the yoke's lug) to x 814 and down to its underside (y 403).
 *   The guard is a ring round an oval opening (a true ellipse fitted to the photo, 206 by 151 px, its long axis tipped 13.65 degrees up
 *   toward the muzzle), its own width (16 px, 3.4 mm) all round, rounded, a step down from the side; it grows out
 *   of the frame's underside, with a fillet at its front, and at its back it runs up under the grip's horn. The
 *   frame's back: a rounded face behind the side, between the bright line (the side's edge) and the outline, from
 *   the hammer down to the top of the grip, where it rounds over and runs down the back of the grip as a strip of
 *   bare backstrap behind the wood (12 px at the top, nothing by y 363, where the wood wraps round it).
 * - YOKE (crane), flush with the frame's side: seams only. One runs forward under the barrel at y 200; the yoke's
 *   lug is outlined below the window (y 331, and a step at y 372).
 * - CYLINDER, in the window: a true cylinder, its rear edge chamfered, its front's edge rounded. Six chambers,
 *   six flutes between them. With a chamber at the top (under the bore), the flutes are at 30, 90 and 150 degrees
 *   from the top on this side: the middle one faces us (y 202 to 258), the others are near the top and bottom
 *   edges, foreshortened to the projection of their arcs (y 132 to 160, and 300 to 328). Each is a ball-end cut,
 *   its rear end rounded (drawn as a half ellipse, longer than it's wide, since the cut runs out shallow), running
 *   out at the front face. Two cylinder stop notches show near the rear. Shaded round its axis: the flutes are
 *   grooves, so they're lit the other way up (dark under their top edges, bright along their bottoms).
 * - In the gap in front of the cylinder: the barrel's breech end (in the bore's line, its forcing cone meeting the
 *   chamber at the top), and the ejector's center pin. The rest of the gaps round the cylinder are see-through.
 * - BARREL, screwed into the frame's front (x 830): a tube tapering very slightly (its underside y 207 to 204 at
 *   the muzzle), with a narrow flat rib along its top (shading, not a line), the muzzle's crown rounded.
 *   "SMITH & WESSON" rolled into its side drops out at 128 px.
 * - EJECTOR ROD SHROUD, one piece with the barrel: a lug under it from the frame to x 1072 (its underside y 277),
 *   its front one concave sweep up into the barrel at x 1140. The rod lies in an open channel between the barrel
 *   and the lug (y 208 to 250), ending in a half circle. The ROD (y 218 to 240) has a rounded tip and a knurled
 *   band behind it.
 * - FRONT SIGHT, on the rib: a concave ramp, then the blade sloping up to a rounded top, square at the front; a
 *   red insert on its slope.
 * - REAR SIGHT, black: a long thin leaf on the topstrap, and at its back the rounded body with the elevation
 *   screw, and the notched blade on top.
 * - CYLINDER RELEASE (the thumbpiece), proud of the frame's side behind the window: one part, symmetrical about
 *   its own axis (y 277.5): a round checkered pad (r 28), and a round end (r 19) round its slotted screw, joined
 *   by concave flanks (circles tangent to both). It sits in a round recess cut in the frame, whose far wall shows
 *   as a shadowed crescent in front of it.
 * - GRIP, wood, over the grip frame: a target stock that wraps the front strap and, below y 363, the backstrap,
 *   and fills behind the guard with a horn. Long simple curves: its top along the frame from the backstrap round
 *   to the horn, the front concave under the horn and flaring to the base, the back leaning back. The checkered
 *   field is sunk into it (a step down, shadowed along its top and back, lit along its front and bottom) inside a
 *   smooth raised border; checkering in two sets of lines either side of the grip's axis. The silver medallion is
 *   flush in the border above the field; the grip screw's escutcheon is in the field.
 *
 * At 128 px (a pixel is about 2.9 mm): the silhouette, the cylinder and its flutes, the see-through gaps, the rod
 * in its channel, the spur, the guard and trigger, the red front sight, the black rear sight, the wood and its
 * field, the medallion. Gone or only a hint: the flutes' ends, the stop notches, the knurling, the thumbpiece's
 * checkering, the yoke's seams, the roll mark, the grip screw.
 */
import type { Point } from "../lib/geometry";
import {
  arc,
  fixed,
  fmt,
  on,
  polygon,
  rounded,
  smoothCurve,
} from "../lib/geometry";
import type { GunDrawing } from "../lib/gun";
import { BLUED_STEEL, POLISHED_STAINLESS, WALNUT } from "../lib/style";

// Not in style.ts yet: the front sight's red insert, from the photo (the lead moves it to style.ts)
const SIGHT_RED = "#e8553c";
const SIGHT_RED_DARK = "#a93424";

/**
 * Chrome-like polished stainless, the Desert Eagle's (desert-eagle.ts, copied here until the lead moves it to
 * style.ts): each face reflects a bright sky above and a dark floor below, so it's banded rather than shaded:
 * from `sky` at its top fading to `skyLow` at its horizon, a hard drop (`hardness`, as a fraction of the face) to
 * `floor`, rising to `floorLow` at its bottom edge. Edges that catch the light are a line of `edge` with
 * `edgeDark` just below (shading, not an outline: the outline is a thin line in each part's own dark shade).
 * Bead-blasted (matte) planes are a step darker.
 */
export interface Polish {
  readonly sky: string;
  readonly skyLow: string;
  readonly floor: string;
  readonly floorLow: string;
  /** Where on a face the floor's reflection starts, 0 at its top to 1 at its bottom */
  readonly horizon: number;
  /** How quickly the sky gives way to the floor, as a fraction of the face: 0 is a hard line */
  readonly hardness: number;
  readonly edge: string;
  readonly edgeDark: string;
  readonly matte: string;
  readonly matteLight: string;
  readonly matteDark: string;
}

/** The recommended polish, the Desert Eagle's: neutral to slightly cool, a hard horizon, a dark floor */
export const CHROME_STAINLESS: Polish = {
  sky: "#f5f7f9",
  skyLow: "#c4c9cf",
  floor: "#3e434a",
  floorLow: "#8c9199",
  horizon: 0.64,
  hardness: 0.02,
  edge: "#ffffff",
  edgeDark: "#25282d",
  matte: "#868b92",
  matteLight: "#a9aeb4",
  matteDark: "#5a5f66",
};

/**
 * The revolver's polish, Simon's pick (variant D of round 2): the Desert Eagle's, with a lighter floor (the
 * floor POLISHED_STAINLESS.dark), which brings the frame's lower half and the barrel's underside closer to the
 * photo. Same horizon, bands and edges.
 */
export const REVOLVER_POLISH: Polish = {
  ...CHROME_STAINLESS,
  floor: "#6c7178",
  floorLow: "#a7acb3",
};

export interface WoodColors {
  edge: string;
  middle: string;
  dark: string;
}

export const DEFAULT_WOOD: WoodColors = {
  edge: WALNUT.base,
  middle: WALNUT.light,
  dark: WALNUT.dark,
};

export interface RevolverOptions {
  polish?: Partial<Polish>;
  wood?: Partial<WoodColors>;
  /** A thin outline round the silhouette, in each part's own dark shade (default true) */
  outline?: boolean;
}

/** The outline's width: 0.4 mm, in the photo's pixels (the rule for every gun) */
const OUTLINE_MM = 0.4;

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
const FRAME_FRONT_TOP = 104; // the topstrap steps down for its last stretch before the frame's front
const STEP_X = 792;
const FRAME_FRONT = 830;
const LUG_FRONT = 814; // the frame's front below the shroud, swept back
const FRAME_UNDER = 403; // the frame's underside, in front of the guard
const FRAME_TOP_BACK: Point = [457, 120]; // the topstrap's rear, under the rear sight's body
// The frame's outline behind the hammer: from where the hammer disappears behind it, down its rounded back to
// the top of the grip, round over it, and down the bare backstrap to where the wood wraps round it
const HAMMER_FOOT: Point = [381, 205];
const BACK_OUTLINE: Point[] = [
  HAMMER_FOOT,
  [353, 220],
  [324, 242],
  [290, 252],
  [262, 259],
  [250, 272],
  [246, 300],
  [238, 363],
];
// The edge of the frame's flat side: a bright line from the topstrap's rear down toward the grip; behind it the
// frame's back is rounded (and above HAMMER_FOOT, the hammer shows)
const SIDE_EDGE: Point[] = [
  [459, 126],
  [455, 150],
  [445, 172],
  [430, 190],
  [412, 204],
  [385, 222],
  [352, 240],
  [318, 254],
  [285, 264],
  [262, 274],
];

// The window round the cylinder: its back curves out round the cylinder's rear (the recoil shield)
const WINDOW_TOP = 126;
const WINDOW_BOTTOM = 336;
const WINDOW_FRONT = 740;
const WINDOW_BACK: Point[] = [
  [514, WINDOW_BOTTOM],
  [500, 290],
  [491, 245],
  [500, 195],
  [515, WINDOW_TOP],
];

// The trigger guard's opening: an oval, a true ellipse fitted to 38 points on its edge in the photo (measured
// along rows and columns, every point within 4% of it), its long axis tipped up 13.65 degrees toward the muzzle.
// The guard round it is the same ellipse GUARD_WIDTH bigger along both axes, about its own width all round.
const OPENING_CENTER: Point = [577.2, 462.3];
const OPENING_RX = 102.8;
const OPENING_RY = 75.7;
const OPENING_TILT = -13.65; // degrees, clockwise on screen
const GUARD_WIDTH = 16;
// Where the guard leaves the frame's underside at its front, and where its back meets the grip's horn (the
// ellipse's parameter angles)
const GUARD_FRONT_AT = -35;
const GUARD_HORN_AT = 185;

// ---------------------------------------------------------------------------------------------------------
// The cylinder: a true cylinder
const CYLINDER_BACK = 520;
const CYLINDER_FRONT = 726;
const CYLINDER_TOP = 129;
const CYLINDER_BOTTOM = 331;
const CYLINDER_AXIS = (CYLINDER_TOP + CYLINDER_BOTTOM) / 2;
const CYLINDER_R = (CYLINDER_BOTTOM - CYLINDER_TOP) / 2;
const REAR_CHAMFER = 7;
const FLUTE_HALF = 16.4; // degrees: half a flute's width round the cylinder (the middle one is 56 px wide)
const FLUTE_BACK = 582; // the rear ends' rearmost point
const FLUTE_END = 52; // how long the rounded rear ends are
// The barrel's breech end, seen in the gap in front of the cylinder, and the ejector's center pin
const BREECH_END: [number, number] = [131, 189];
const CENTER_PIN: [number, number] = [206, 252];

// ---------------------------------------------------------------------------------------------------------
// The barrel and the ejector rod shroud under it
const RIB_TOP = 106;
const BARREL_UNDER = 207; // at the shroud
const BARREL_UNDER_MUZZLE = 204; // the taper
const CROWN = 4; // the muzzle's rounded edges
const SHROUD_UNDER = 277;
const SHROUD_FRONT: Point[] = [
  [1140, BARREL_UNDER],
  [1100, 220],
  [1080, 256],
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
  [1666, 73],
  [1690, 62],
  [1696, 69],
  [1672, 80],
];
const LEAF_FRONT = STEP_X;
const LEAF_TOP_BACK = 81;
const LEAF_TOP_FRONT = 97;
const ELEVATION_SCREW: Point = [470, 92];

// ---------------------------------------------------------------------------------------------------------
// The hammer: from the spur's tip along its checkered top, down into the throat, up its front to its top; and
// its underside, from where it goes behind the frame back to the tip
const SPUR_TIP: Point = [303, 156];
const SPUR_TIP_R = 6;
const HAMMER_TOP: Point[] = [
  [303, 150],
  [325, 145],
  [355, 146],
  [378, 160],
  [393, 174],
  [407, 163],
  [418, 141],
  [428, 124],
  [447, 122],
];
const HAMMER_UNDER: Point[] = [
  HAMMER_FOOT,
  [374, 186],
  [355, 170],
  [325, 162],
  [303, 162],
];

// ---------------------------------------------------------------------------------------------------------
// The trigger: a crescent between two circles, each through three points on its face in the photo
// (Remeasured in round 3 at 6x: the front face's dark edge from the frame at x 596 to its deepest at 565, the
// tip at 617, and the back's faint edge at 548 halfway down: a narrow blade, about 17 px across at its middle)
const TRIGGER_TIP: Point = [617, 514];
const TRIGGER_FRONT: [Point, Point, Point] = [[596, 395], [566, 458], TRIGGER_TIP];
const TRIGGER_BACK: [Point, Point, Point] = [[545, 395], [549, 462], TRIGGER_TIP];

// ---------------------------------------------------------------------------------------------------------
// The cylinder release: a checkered pad and a round end round its screw, joined by concave flanks, symmetrical
// about its axis
const PAD_CENTER: Point = [385, 277.5];
const PAD_R = 28;
const THUMB_SCREW: Point = [431.5, 277.5];
const SCREW_END_R = 19;
const FLANK_R = 70; // the concave flanks' radius: a shallow waist
const SCREW_R = 14;
const RECESS_R = 27; // the round recess in the frame the thumbpiece sits in, a little ahead of its screw end
const RECESS_CENTER: Point = [444, 277.5];

// ---------------------------------------------------------------------------------------------------------
// The grip: wood round the grip frame, in long simple curves
const WOOD_CORNER: Point = [262, 276]; // its top back corner, against the bare backstrap
const WOOD_TOP: Point[] = [
  [270, 271],
  [300, 278],
  [328, 300],
  [343, 335],
  [352, 370],
  [375, 393],
  [442, 403],
];
const WOOD_FRONT: Point[] = [
  [442, 403],
  [458, 425],
  [461, 458],
  [445, 481],
  [395, 500],
  [360, 536],
  [345, 610],
  [347, 700],
  [360, 795],
];
const GRIP_BASE = 797; // the base's back corner
const GRIP_SAG = 6; // how far the base bulges below the line between its corners
const WOOD_BACK: Point[] = [
  [GRIP_HEEL, 790],
  [110, 620],
  [164, 480],
  [238, 363],
  [252, 330],
  [260, 284],
];
// The sunk, checkered field, its back along the grip's back
const FIELD_CORNERS: Point[] = [
  [212, 440],
  [272, 440],
  [330, 478],
  [320, 700],
  [118, 706],
];
const FIELD = rounded(FIELD_CORNERS, [18, 18, 18, 14, 14]);
const GRIP_LEAN = (118 - 212) / (706 - 440); // x per y down the field's back edge
const CHECK_SPREAD = 0.42; // radians either side of the grip's axis
const CHECK_SPACING = 11;
const MEDALLION: Point = [300, 423];
const MEDALLION_R = 24;
const GRIP_SCREW: Point = [200, 573];
const GRIP_SCREW_R = 12;

// ---------------------------------------------------------------------------------------------------------
// Geometry

const f1 = (v: number) => fixed(v, 1);

/** A point on an ellipse at parameter angle `t` degrees */
function onEllipse(
  c: Point,
  rx: number,
  ry: number,
  tilt: number,
  t: number,
): Point {
  const a = (t * Math.PI) / 180;
  const r = (tilt * Math.PI) / 180;
  const x = rx * Math.cos(a);
  const y = ry * Math.sin(a);
  return [
    c[0] + x * Math.cos(r) - y * Math.sin(r),
    c[1] + x * Math.sin(r) + y * Math.cos(r),
  ];
}

/** Béziers along an ellipse from parameter angle t0 to t1 (degrees): the unit circle's arcs, mapped onto it */
function ellipseArc(
  c: Point,
  rx: number,
  ry: number,
  tilt: number,
  t0: number,
  t1: number,
): string {
  const pieces = Math.max(1, Math.ceil(Math.abs(t1 - t0) / 90 - 1e-9));
  const step = ((t1 - t0) / pieces) * (Math.PI / 180);
  const k = (4 / 3) * Math.tan(step / 4);
  const r = (tilt * Math.PI) / 180;
  const map = ([x, y]: Point): Point => [
    c[0] + rx * x * Math.cos(r) - ry * y * Math.sin(r),
    c[1] + rx * x * Math.sin(r) + ry * y * Math.cos(r),
  ];
  const parts: string[] = [];
  let a = (t0 * Math.PI) / 180;
  for (let i = 0; i < pieces; i++) {
    const b = a + step;
    const p0: Point = [Math.cos(a), Math.sin(a)];
    const p3: Point = [Math.cos(b), Math.sin(b)];
    const c1: Point = [p0[0] - k * p0[1], p0[1] + k * p0[0]];
    const c2: Point = [p3[0] + k * p3[1], p3[1] - k * p3[0]];
    parts.push(`C${fmt(map(c1))} ${fmt(map(c2))} ${fmt(map(p3))}`);
    a = b;
  }
  return parts.join(" ");
}

/** The guard's opening's edge, `grow` bigger along both axes, from parameter angle t0 to t1 (with its M) */
function openingEdge(grow: number, t0: number, t1: number): string {
  const rx = OPENING_RX + grow;
  const ry = OPENING_RY + grow;
  return `M${fmt(onEllipse(OPENING_CENTER, rx, ry, OPENING_TILT, t0))} ${ellipseArc(OPENING_CENTER, rx, ry, OPENING_TILT, t0, t1)}`;
}

/** The whole opening, `grow` bigger */
function openingShape(grow: number): string {
  return `${openingEdge(grow, 0, 360)} Z`;
}

/** The circle through three points: its center and radius */
function circleThrough(a: Point, b: Point, c: Point): [Point, number] {
  const d =
    2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  const sq = (p: Point) => p[0] * p[0] + p[1] * p[1];
  const x =
    (sq(a) * (b[1] - c[1]) + sq(b) * (c[1] - a[1]) + sq(c) * (a[1] - b[1])) /
    d;
  const y =
    (sq(a) * (c[0] - b[0]) + sq(b) * (a[0] - c[0]) + sq(c) * (b[0] - a[0])) /
    d;
  return [[x, y], Math.hypot(a[0] - x, a[1] - y)];
}

const angleOf = (c: Point, p: Point) =>
  (Math.atan2(p[1] - c[1], p[0] - c[0]) * 180) / Math.PI;

/** `arc` the short way round, from angle a0 to a1 */
function shortArc(c: Point, r: number, a0: number, a1: number): string {
  let end = a1;
  while (end - a0 > 180) end -= 360;
  while (end - a0 < -180) end += 360;
  return arc(c, r, a0, end);
}

/** Where two circles cross: the crossing on the left of the line from a to b, and the one on its right */
function crossings(a: Point, ra: number, b: Point, rb: number): [Point, Point] {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const along = (d * d + ra * ra - rb * rb) / (2 * d);
  const h = Math.sqrt(Math.max(0, ra * ra - along * along));
  const ux = (b[0] - a[0]) / d;
  const uy = (b[1] - a[1]) / d;
  const m: Point = [a[0] + ux * along, a[1] + uy * along];
  return [
    [m[0] + uy * h, m[1] - ux * h],
    [m[0] - uy * h, m[1] + ux * h],
  ];
}

// ---------------------------------------------------------------------------------------------------------
// Shading: the Desert Eagle's bands (faceStops, roundStops, upStops), and a groove's

type Stops = readonly (readonly [number, string])[];

/** A flat face's bands, top to bottom */
function faceStops(p: Polish): Stops {
  return [
    [0, p.sky],
    [p.horizon, p.skyLow],
    [Math.min(1, p.horizon + p.hardness), p.floor],
    [1, p.floorLow],
  ];
}

/** A horizontal cylinder's bands, top to bottom: a streak of sky near its top, the floor below its middle */
function roundStops(p: Polish): Stops {
  return [
    [0, p.floorLow],
    [0.1, p.edge],
    [0.22, p.sky],
    [0.48, p.skyLow],
    [0.48 + p.hardness, p.floor],
    [0.82, p.floorLow],
    [1, p.floor],
  ];
}

/** A face turned up toward the sky (a top bevel): bright, a little darker at its far edge */
function upStops(p: Polish): Stops {
  return [
    [0, p.edge],
    [0.4, p.sky],
    [1, p.skyLow],
  ];
}

/** A groove along a cylinder (a flute), across it: concave, so it reflects the other way up, floor above sky */
function grooveStops(p: Polish): Stops {
  return [
    [0, p.floor],
    [0.42, p.floorLow],
    [0.42 + p.hardness, p.sky],
    [0.75, p.edge],
    [1, p.skyLow],
  ];
}

function linear(id: string, from: Point, to: Point, stops: Stops): string {
  return [
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${fixed(from[0], 1)}" y1="${fixed(from[1], 1)}" x2="${fixed(to[0], 1)}" y2="${fixed(to[1], 1)}">`,
    ...stops.map(
      ([o, c]) => `      <stop offset="${fixed(o, 3)}" stop-color="${c}"/>`,
    ),
    "    </linearGradient>",
  ].join("\n");
}

/** A gradient over each shape's own box, top to bottom */
function boxGradient(id: string, stops: Stops): string {
  return [
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">`,
    ...stops.map(
      ([o, c]) => `      <stop offset="${fixed(o, 3)}" stop-color="${c}"/>`,
    ),
    "    </linearGradient>",
  ].join("\n");
}

// ---------------------------------------------------------------------------------------------------------

function drawSide(options: RevolverOptions = {}): string {
  const p: Polish = { ...REVOLVER_POLISH, ...options.polish };
  // Tones for the small marks (pins, seams, notches): the polish's own colors
  const P = {
    hi: p.edge,
    sky: p.sky,
    base: p.skyLow,
    dark: p.floorLow,
    floor: p.floor,
  };
  // A thin outline round each part's silhouette, in its own dark shade (the stainless's floor tone, a mid gray,
  // never near black)
  const outlineWidth = OUTLINE_MM / (BARREL_MM / (MUZZLE - BREECH));
  const outline = (d: string, color: string = p.floor) =>
    options.outline === false
      ? ""
      : `<path d="${d}" stroke="${color}" stroke-width="${fixed(outlineWidth, 2)}" fill="none"/>`;
  const W: WoodColors = { ...DEFAULT_WOOD, ...options.wood };

  // The hammer
  const hammer =
    `M${fmt(HAMMER_TOP[0])} ${smoothCurve(HAMMER_TOP, [1, -0.25], [1, 0])} ` +
    `L470,122 L470,250 L${fmt(HAMMER_FOOT)} ` +
    `${smoothCurve(HAMMER_UNDER, [-0.25, -1], [-1, 0])} ${arc(SPUR_TIP, SPUR_TIP_R, 90, 270)} Z`;
  const spurChecks: string[] = [];
  for (let x = 322; x <= 358; x += 6) {
    spurChecks.push(`M${x},${146} L${x + 3},${152}`);
  }

  // The trigger: the back circle's arc down to the tip, then back up the front face
  const [frontC, frontR] = circleThrough(...TRIGGER_FRONT);
  const [backC, backR] = circleThrough(...TRIGGER_BACK);
  const tip = TRIGGER_TIP;
  const backTop = angleOf(backC, [550, 370]);
  const backTip = angleOf(backC, tip);
  const frontTip = angleOf(frontC, tip);
  const frontTop = angleOf(frontC, [596, 370]);
  const trigger =
    `M${fmt(on(backC, backR, backTop))} ${shortArc(backC, backR, backTop, backTip)} ` +
    `${shortArc(frontC, frontR, frontTip, frontTop)} Z`;
  const triggerFace = `M${fmt(on(frontC, frontR - 4, frontTop))} ${shortArc(frontC, frontR - 4, frontTop, frontTip)}`;

  // The frame: round from the topstrap's rear, along the top, down the front and the lug, along the underside to
  // the guard, under the grip's horn and the wood (hidden), up the bare backstrap and the frame's back, and up the
  // side's edge to the topstrap. The window and the guard's opening are holes in it.
  const opening = openingShape(0);
  const guardFront = onEllipse(
    OPENING_CENTER,
    OPENING_RX + GUARD_WIDTH,
    OPENING_RY + GUARD_WIDTH,
    OPENING_TILT,
    GUARD_FRONT_AT,
  );
  // Round the guard's outside, from the frame's underside to the grip's horn
  const guardEdge = openingEdge(GUARD_WIDTH, GUARD_FRONT_AT, GUARD_HORN_AT);
  const sideEdgeUp = [...SIDE_EDGE.slice(0, 5)].reverse();
  const frame =
    `M${fmt(FRAME_TOP_BACK)} C470,110 488,${TOPSTRAP_TOP} 510,${TOPSTRAP_TOP} ` +
    `L${STEP_X},${TOPSTRAP_TOP} L${STEP_X + 2},${FRAME_FRONT_TOP} L${FRAME_FRONT - 6},${FRAME_FRONT_TOP} ` +
    `C${FRAME_FRONT - 2},${FRAME_FRONT_TOP} ${FRAME_FRONT},${FRAME_FRONT_TOP + 2} ${FRAME_FRONT},${FRAME_FRONT_TOP + 6} ` +
    `L${FRAME_FRONT},${SHROUD_UNDER} ` +
    `${smoothCurve(
      [
        [FRAME_FRONT, SHROUD_UNDER],
        [822, 298],
        [LUG_FRONT, 324],
      ],
      [0, 1],
      [0, 1],
    )} L${LUG_FRONT},${FRAME_UNDER - 5} ` +
    `C${LUG_FRONT},${FRAME_UNDER - 1} ${LUG_FRONT - 2},${FRAME_UNDER} ${LUG_FRONT - 6},${FRAME_UNDER} ` +
    `L745,${FRAME_UNDER} C722,${FRAME_UNDER} ${f1(guardFront[0] + 8)},${f1(guardFront[1] - 14)} ${fmt(guardFront)} ` +
    `${guardEdge.slice(guardEdge.indexOf(" ") + 1)} L445,478 L380,470 L330,520 L300,700 L200,700 L250,400 L${fmt(BACK_OUTLINE[BACK_OUTLINE.length - 1])} ` +
    `${smoothCurve([...BACK_OUTLINE].reverse(), [0.05, -1], [1, -0.6])} ` +
    `L${fmt(sideEdgeUp[0])} ${smoothCurve(sideEdgeUp, [0.8, -0.6], [0.05, -1])} L${fmt(FRAME_TOP_BACK)} Z ` +
    `M${fmt(WINDOW_BACK[0])} ${smoothCurve(WINDOW_BACK, [-0.3, -1], [0.3, -1])} ` +
    `L${WINDOW_FRONT},${WINDOW_TOP} L${WINDOW_FRONT},${WINDOW_BOTTOM} Z ` +
    opening;
  // The guard: a ring, its own width all round, drawn over the frame
  const guard = `${openingShape(GUARD_WIDTH)} ${opening}`;
  // Lit round the bottom of the opening's edge, dark round the bottom of the guard's outside and along the
  // opening's top, under the frame
  const guardBevel = openingEdge(3, -5, 175);
  const guardShadow = openingEdge(GUARD_WIDTH - 3, -25, 165);
  const guardTop = openingEdge(2, 215, 320);

  // The frame's rounded back, between the side's edge and the outline
  const roundedBack =
    `M${fmt(SIDE_EDGE[4])} ${smoothCurve(SIDE_EDGE.slice(4), [-0.8, 0.6], [-1, 0.45])} ` +
    `L${fmt(BACK_OUTLINE[BACK_OUTLINE.length - 1])} ${smoothCurve([...BACK_OUTLINE].reverse(), [0.05, -1], [1, -0.6])} Z`;
  const sideEdgeLine = `M${fmt(SIDE_EDGE[0])} ${smoothCurve(SIDE_EDGE, [-0.15, 1], [-1, 0.45])}`;

  // The cylinder, chamfered at its rear, rounded at its front
  const cylinder = rounded(
    [
      [CYLINDER_BACK, CYLINDER_TOP],
      [CYLINDER_FRONT, CYLINDER_TOP],
      [CYLINDER_FRONT, CYLINDER_BOTTOM],
      [CYLINDER_BACK, CYLINDER_BOTTOM],
    ],
    [REAR_CHAMFER, 4, 4, REAR_CHAMFER],
  );
  // The flutes: the projections of their arcs round the axis, each with its rounded rear end
  const flutes = [30, 90, 150].map((at) => {
    const yOf = (deg: number) =>
      CYLINDER_AXIS - CYLINDER_R * Math.cos((deg * Math.PI) / 180);
    const top = yOf(at - FLUTE_HALF);
    const bottom = yOf(at + FLUTE_HALF);
    const mid = (top + bottom) / 2;
    const half = (bottom - top) / 2;
    const endC: Point = [FLUTE_BACK + FLUTE_END, mid];
    const path =
      `M${CYLINDER_FRONT},${f1(top)} L${f1(endC[0])},${f1(top)} ` +
      `${ellipseArc(endC, FLUTE_END, half, 0, 270, 90)} L${CYLINDER_FRONT},${f1(bottom)} Z`;
    return { path, top, bottom, id: `revolver-flute-${at}` };
  });

  // The barrel's tube, and the shroud's lug under it
  const tube =
    `M${FRAME_FRONT},${RIB_TOP} L${MUZZLE - CROWN},${RIB_TOP} ` +
    `C${MUZZLE - 1},${RIB_TOP} ${MUZZLE},${RIB_TOP + 2} ${MUZZLE},${RIB_TOP + CROWN} ` +
    `L${MUZZLE},${BARREL_UNDER_MUZZLE - CROWN} ` +
    `C${MUZZLE},${BARREL_UNDER_MUZZLE - 1} ${MUZZLE - 1},${BARREL_UNDER_MUZZLE} ${MUZZLE - CROWN},${BARREL_UNDER_MUZZLE} ` +
    `L${FRAME_FRONT},${BARREL_UNDER} Z`;
  const lug =
    `M${FRAME_FRONT},${BARREL_UNDER - 4} L${fmt(SHROUD_FRONT[0])} ` +
    `${smoothCurve(SHROUD_FRONT, [-1, 0], [-0.3, 1])} L${FRAME_FRONT},${SHROUD_UNDER} Z`;
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
  const knurl: string[] = [];
  for (let x = KNURL[0] + 2; x < KNURL[1]; x += 4) {
    knurl.push(`M${x},${ROD_TOP + 1} L${x + 3},${ROD_BOTTOM - 1}`);
    knurl.push(`M${x + 3},${ROD_TOP + 1} L${x},${ROD_BOTTOM - 1}`);
  }

  const frontSight =
    `M${fmt(RAMP[0])} ${smoothCurve(RAMP, [1, -0.1], [1, -0.1])} L${fmt(BLADE[0])} ` +
    `${smoothCurve(BLADE, [1, -0.5], [1, -0.45])} ` +
    `C1700,${BLADE_TOP - 1} 1708,${BLADE_TOP} 1712,${BLADE_TOP} ` +
    `C1717,${BLADE_TOP} ${BLADE_FRONT},${BLADE_TOP + 4} ${BLADE_FRONT},${BLADE_TOP + 9} ` +
    `L${BLADE_FRONT},${RIB_TOP + 1} L${RAMP_START},${RIB_TOP + 1} Z`;

  const rearSight =
    `M470,${TOPSTRAP_TOP + 2} L470,${LEAF_TOP_BACK} L520,${LEAF_TOP_BACK} ` +
    `C560,${LEAF_TOP_BACK + 2} 585,${LEAF_TOP_FRONT - 4} 620,${LEAF_TOP_FRONT - 3} ` +
    `L${LEAF_FRONT - 4},${LEAF_TOP_FRONT} L${LEAF_FRONT + 2},${TOPSTRAP_TOP + 3} L470,${TOPSTRAP_TOP + 3} Z ` +
    `M490,${LEAF_TOP_BACK} L490,112 C490,117 485,120 478,120 L462,120 ` +
    `C456,120 453,112 453,100 C453,88 458,${LEAF_TOP_BACK} 466,${LEAF_TOP_BACK} Z ` +
    `M466,${LEAF_TOP_BACK + 1} L466,70 C466,68 467,67 469,67 L479,67 C481,67 482,68 482,70 L482,${LEAF_TOP_BACK + 1} Z`;

  // The thumbpiece: round the pad from its upper flank's tangent point, over the back, to the lower; along the
  // lower flank (concave), round the screw end, and back along the upper flank
  const upperFlank = crossings(
    PAD_CENTER,
    PAD_R + FLANK_R,
    THUMB_SCREW,
    SCREW_END_R + FLANK_R,
  )[0];
  const lowerFlank = crossings(
    PAD_CENTER,
    PAD_R + FLANK_R,
    THUMB_SCREW,
    SCREW_END_R + FLANK_R,
  )[1];
  const padUp = angleOf(PAD_CENTER, upperFlank);
  const padDown = angleOf(PAD_CENTER, lowerFlank);
  const endUp = angleOf(THUMB_SCREW, upperFlank);
  const endDown = angleOf(THUMB_SCREW, lowerFlank);
  const thumbpiece =
    `M${fmt(on(PAD_CENTER, PAD_R, padUp))} ${arc(PAD_CENTER, PAD_R, padUp, padDown - 360)} ` +
    `${shortArc(lowerFlank, FLANK_R, angleOf(lowerFlank, PAD_CENTER), angleOf(lowerFlank, THUMB_SCREW))} ` +
    `${arc(THUMB_SCREW, SCREW_END_R, endDown, endUp)} ` +
    `${shortArc(upperFlank, FLANK_R, angleOf(upperFlank, THUMB_SCREW), angleOf(upperFlank, PAD_CENTER))} Z`;
  const padChecks: string[] = [];
  for (let k = -6; k <= 6; k++) {
    const o = k * 6;
    padChecks.push(
      `M${f1(PAD_CENTER[0] + o - 40)},${f1(PAD_CENTER[1] - 40)} L${f1(PAD_CENTER[0] + o + 40)},${f1(PAD_CENTER[1] + 40)}`,
    );
    padChecks.push(
      `M${f1(PAD_CENTER[0] + o + 40)},${f1(PAD_CENTER[1] - 40)} L${f1(PAD_CENTER[0] + o - 40)},${f1(PAD_CENTER[1] + 40)}`,
    );
  }
  const recess = `M${fmt(on(RECESS_CENTER, RECESS_R, -60))} ${arc(RECESS_CENTER, RECESS_R, -60, 60)}`;
  const slot = (c: Point, r: number) =>
    `M${f1(c[0] - r * 0.95)},${f1(c[1] - r * 0.25)} L${f1(c[0] + r * 0.95)},${f1(c[1] + r * 0.25)}`;

  // The wood
  // The grip's base: an arc of a big circle through its front and back corners, bulging GRIP_SAG below the line
  // between them, so the grip looks round
  const baseFront = WOOD_FRONT[WOOD_FRONT.length - 1];
  const baseBack: Point = [GRIP_HEEL + 3, GRIP_BASE];
  const chord = Math.hypot(baseBack[0] - baseFront[0], baseBack[1] - baseFront[1]);
  const baseR = (chord * chord) / (8 * GRIP_SAG) + GRIP_SAG / 2;
  const up: Point = [
    (baseBack[1] - baseFront[1]) / chord,
    -(baseBack[0] - baseFront[0]) / chord,
  ];
  const towardCenter = up[1] < 0 ? up : ([-up[0], -up[1]] as Point);
  const baseCenter: Point = [
    (baseFront[0] + baseBack[0]) / 2 + towardCenter[0] * (baseR - GRIP_SAG),
    (baseFront[1] + baseBack[1]) / 2 + towardCenter[1] * (baseR - GRIP_SAG),
  ];
  const wood =
    `M${fmt(WOOD_CORNER)} C${WOOD_CORNER[0]},272 265,271 ${fmt(WOOD_TOP[0])} ` +
    `${smoothCurve(WOOD_TOP, [1, 0], [1, 0.05])} ` +
    `${smoothCurve(WOOD_FRONT, [1, 1.2], [0.12, 1])} ` +
    `${shortArc(baseCenter, baseR, angleOf(baseCenter, baseFront), angleOf(baseCenter, baseBack))} ` +
    `C${GRIP_HEEL},${GRIP_BASE} ${GRIP_HEEL - 1},${GRIP_BASE - 3} ${fmt(WOOD_BACK[0])} ` +
    `${smoothCurve(WOOD_BACK, [0.3, -1], [0.1, -1])} L${fmt(WOOD_CORNER)} Z`;
  // The checkering: two sets of lines either side of the grip's axis
  const axis = Math.atan2(1, GRIP_LEAN);
  const checks: string[] = [];
  for (const spread of [-CHECK_SPREAD, CHECK_SPREAD]) {
    const a = axis + spread;
    const dir: Point = [Math.cos(a), Math.sin(a)];
    const n: Point = [-dir[1], dir[0]];
    for (let k = -30; k <= 30; k++) {
      const px = GRIP_SCREW[0] + n[0] * k * CHECK_SPACING;
      const py = GRIP_SCREW[1] + n[1] * k * CHECK_SPACING;
      checks.push(
        `M${f1(px - dir[0] * 400)},${f1(py - dir[1] * 400)} L${f1(px + dir[0] * 400)},${f1(py + dir[1] * 400)}`,
      );
    }
  }
  // The field's step: shadowed along its top and back, lit along its front and bottom
  const [fa, fb, fc, fd, fe] = FIELD_CORNERS;
  const fieldShadow = `M${fmt(fe)} L${fmt(fa)} L${fmt(fb)} L${fmt(fc)}`;
  const fieldLight = `M${fmt(fc)} L${fmt(fd)} L${fmt(fe)}`;
  // The wood's gradient runs across the grip, square to its lean, lighter down the middle
  const gripAcross: [Point, Point] = [
    [120, 560],
    [120 + 260 * Math.cos(Math.atan(-GRIP_LEAN) * 1), 560 + 260 * Math.sin(Math.atan(-GRIP_LEAN))],
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="863" viewBox="0 0 1800 863" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  <defs>
    <!-- Round parts, shaded round their axes: the barrel, the rod, the cylinder (its flutes are grooves) -->
    ${linear("revolver-tube", [0, RIB_TOP], [0, BARREL_UNDER], roundStops(p))}
    ${linear("revolver-rod", [0, ROD_TOP], [0, ROD_BOTTOM], roundStops(p))}
    ${linear("revolver-cylinder", [0, CYLINDER_TOP], [0, CYLINDER_BOTTOM], roundStops(p))}
    ${flutes.map((fl) => linear(fl.id, [0, fl.top], [0, fl.bottom], grooveStops(p))).join("\n    ")}
    <!-- Flat faces, one horizon each: the frame's side, the shroud's lug -->
    ${linear("revolver-flat", [0, TOPSTRAP_TOP], [0, FRAME_UNDER], faceStops(p))}
    ${linear("revolver-lug", [0, BARREL_UNDER], [0, SHROUD_UNDER], faceStops(p))}
    <!-- The frame's rounded back, turned up toward the sky -->
    ${linear("revolver-back", [400, 200], [250, 330], upStops(p))}
    <!-- The guard, its own face -->
    ${linear("revolver-guard", [0, 386], [0, 556], faceStops(p))}
    <!-- Small parts, each over its own box -->
    ${boxGradient("revolver-part", faceStops(p))}
    ${boxGradient("revolver-up", upStops(p))}
    ${boxGradient("revolver-pin", [
      [0, p.floorLow],
      [0.5, p.floor],
      [1, p.floorLow],
    ])}
    <linearGradient id="revolver-wood" gradientUnits="userSpaceOnUse" x1="${f1(gripAcross[0][0])}" y1="${f1(gripAcross[0][1])}" x2="${f1(gripAcross[1][0])}" y2="${f1(gripAcross[1][1])}">
      <stop offset="0" stop-color="${W.edge}"/>
      <stop offset="0.5" stop-color="${W.middle}"/>
      <stop offset="1" stop-color="${W.edge}"/>
    </linearGradient>
    <clipPath id="revolver-cylinder-clip"><path d="${cylinder}"/></clipPath>
    <clipPath id="revolver-field-clip"><path d="${FIELD}"/></clipPath>
    <clipPath id="revolver-pad-clip"><circle cx="${PAD_CENTER[0]}" cy="${PAD_CENTER[1]}" r="${PAD_R - 3}"/></clipPath>
    <clipPath id="revolver-rod-clip"><path d="${rod}"/></clipPath>
  </defs>
  <!-- Behind the frame, down: only the spur, the throat and the top show -->
  <g id="revolver-hammer">
    <path d="${hammer}" fill="url(#revolver-part)"/>
    <path d="${spurChecks.join(" ")}" stroke="${P.dark}" stroke-width="2" fill="none"/>
    ${outline(hammer)}
  </g>
  <!-- Behind the frame, through the guard's opening: a crescent between two circles -->
  <g id="revolver-trigger">
    <path d="${trigger}" fill="url(#revolver-part)"/>
    <path d="${triggerFace}" stroke="${P.hi}" stroke-width="3" fill="none"/>
    ${outline(trigger)}
  </g>
  <!-- In the gap in front of the cylinder: the barrel's breech end, in the bore's line, and the center pin -->
  <g id="revolver-breech">
    <path d="M${CYLINDER_FRONT - 1},${BREECH_END[0]} L${WINDOW_FRONT},${BREECH_END[0]} L${WINDOW_FRONT},${BREECH_END[1]} L${CYLINDER_FRONT - 1},${BREECH_END[1]} Z" fill="${P.dark}"/>
    <path d="M${CYLINDER_FRONT - 1},${BREECH_END[0] + 4} L${WINDOW_FRONT},${BREECH_END[0] + 4}" stroke="${P.sky}" stroke-width="3"/>
    <path d="M${CYLINDER_FRONT - 1},${CENTER_PIN[0]} L${WINDOW_FRONT},${CENTER_PIN[0]} L${WINDOW_FRONT},${CENTER_PIN[1]} L${CYLINDER_FRONT - 1},${CENTER_PIN[1]} Z" fill="url(#revolver-pin)"/>
  </g>
  <!-- One piece with the guard; the window and the guard's opening are holes in it -->
  <g id="revolver-frame">
    <path d="${frame}" fill="url(#revolver-flat)"/>
    ${outline(frame)}
    <!-- Its rounded back, behind the side's edge, and the edge catching the light -->
    <path d="${roundedBack}" fill="url(#revolver-back)"/>
    <path d="${sideEdgeLine}" stroke="${P.hi}" stroke-width="3" fill="none"/>
    <!-- The topstrap's edge, and the window's cut edges -->
    <path d="M510,${TOPSTRAP_TOP + 1.5} L${STEP_X},${TOPSTRAP_TOP + 1.5} M${STEP_X + 2},${FRAME_FRONT_TOP + 1.5} L${FRAME_FRONT - 4},${FRAME_FRONT_TOP + 1.5}" stroke="${P.hi}" stroke-width="3" fill="none"/>
    <path d="M${WINDOW_BACK[0][0] + 2},${WINDOW_BOTTOM + 2} L${WINDOW_FRONT},${WINDOW_BOTTOM + 2}" stroke="${P.hi}" stroke-width="3" fill="none"/>
    <path d="M${WINDOW_BACK[4][0]},${WINDOW_TOP - 2} L${WINDOW_FRONT + 1},${WINDOW_TOP - 2} L${WINDOW_FRONT + 1},${WINDOW_BOTTOM}" stroke="${P.dark}" stroke-width="2.5" fill="none"/>
    <!-- The frame's front, and its lug swept back under the shroud -->
    <path d="M${FRAME_FRONT - 1.5},${FRAME_FRONT_TOP + 6} L${FRAME_FRONT - 1.5},${SHROUD_UNDER}" stroke="${P.dark}" stroke-width="3" fill="none"/>
    <!-- The yoke's seams -->
    <path d="M${WINDOW_FRONT + 2},200 L${FRAME_FRONT - 2},200 M745,331 L${LUG_FRONT - 1},331 M748,345 L748,372 L800,372 L811,386" stroke="${P.dark}" stroke-width="2" fill="none"/>
    <path d="M${WINDOW_FRONT + 2},202.5 L${FRAME_FRONT - 2},202.5 M749,374.5 L800,374.5" stroke="${P.hi}" stroke-width="2" fill="none"/>
    <!-- The round recess round the thumbpiece's screw end: its far wall in shadow -->
    <path d="${recess}" stroke="${P.dark}" stroke-width="5" fill="none"/>
    <path d="M${fmt(on(RECESS_CENTER, RECESS_R + 3, -50))} ${arc(RECESS_CENTER, RECESS_R + 3, -50, 50)}" stroke="${P.hi}" stroke-width="2" fill="none"/>
    <!-- Pins -->
    <circle cx="441" cy="153" r="5" fill="${P.dark}"/>
    <circle cx="505" cy="350" r="9" fill="${P.sky}" stroke="${P.dark}" stroke-width="2"/>
  </g>
  <!-- A ring round the oval opening, its own width all round; grows out of the frame's underside -->
  <g id="revolver-guard">
    <path d="${guard}" fill="url(#revolver-guard)"/>
    <path d="${guardShadow}" stroke="${P.floor}" stroke-width="5" fill="none" opacity="0.6"/>
    <path d="${guardBevel}" stroke="${P.hi}" stroke-width="4" fill="none"/>
    <path d="${guardTop}" stroke="${P.dark}" stroke-width="3" fill="none"/>
    ${outline(guard)}
  </g>
  <!-- A true cylinder, shaded round its axis; the flutes are grooves, lit the other way up -->
  <g id="revolver-cylinder">
    <path d="${cylinder}" fill="url(#revolver-cylinder)"/>
    <g clip-path="url(#revolver-cylinder-clip)">
      ${flutes.map((fl) => `<path d="${fl.path}" fill="url(#${fl.id})"/>`).join("\n      ")}
      <!-- The cylinder stop notches -->
      <path d="M523,168 L556,168 L556,177 L523,177 Z M523,274 L556,274 L556,284 L523,284 Z" fill="${P.sky}"/>
      <path d="M528,170 L548,170 L548,175 L528,175 Z M528,277 L548,277 L548,282 L528,282 Z" fill="${P.floor}"/>
      <!-- The rear chamfer and the front's rounded edge -->
      <path d="M${CYLINDER_BACK + 2},${CYLINDER_TOP + REAR_CHAMFER} L${CYLINDER_BACK + 2},${CYLINDER_BOTTOM - REAR_CHAMFER}" stroke="${P.hi}" stroke-width="4"/>
      <path d="M${CYLINDER_FRONT - 2},${CYLINDER_TOP} L${CYLINDER_FRONT - 2},${CYLINDER_BOTTOM}" stroke="${P.dark}" stroke-width="4"/>
    </g>
    ${outline(cylinder)}
  </g>
  <!-- The barrel: its lug, the tube, the rod's channel and the rod -->
  <g id="revolver-barrel">
    <path d="${lug}" fill="url(#revolver-lug)"/>
    <path d="${tube}" fill="url(#revolver-tube)"/>
    ${outline(lug)}
    ${outline(tube)}
    <path d="M${MUZZLE - 3},${RIB_TOP + 3} L${MUZZLE - 3},${BARREL_UNDER_MUZZLE - 3}" stroke="${P.dark}" stroke-width="2" opacity="0.6"/>
    <path d="${channel}" fill="${P.floor}"/>
    <path d="M${FRAME_FRONT},${CHANNEL_BOTTOM - 1.5} L${CHANNEL_END - channelR},${CHANNEL_BOTTOM - 1.5}" stroke="${P.hi}" stroke-width="3"/>
    <path d="${rod}" fill="url(#revolver-rod)"/>
    <g clip-path="url(#revolver-rod-clip)">
      <path d="${knurl.join(" ")}" stroke="${P.dark}" stroke-width="1.5" fill="none"/>
    </g>
  </g>
  <g id="revolver-front-sight">
    <path d="${frontSight}" fill="url(#revolver-part)"/>
    ${outline(frontSight)}
    <path d="${polygon(RED_INSERT)}" fill="${SIGHT_RED}"/>
    <path d="M${fmt(RED_INSERT[3])} L${fmt(RED_INSERT[2])}" stroke="${SIGHT_RED_DARK}" stroke-width="3"/>
  </g>
  <g id="revolver-rear-sight">
    <path d="${rearSight}" fill="${BLUED_STEEL.base}"/>
    ${outline(rearSight, BLUED_STEEL.dark)}
    <path d="M470,${LEAF_TOP_BACK + 1} L520,${LEAF_TOP_BACK + 1} C560,${LEAF_TOP_BACK + 3} 585,${LEAF_TOP_FRONT - 3} 620,${LEAF_TOP_FRONT - 2} L${LEAF_FRONT - 4},${LEAF_TOP_FRONT + 1}" stroke="${BLUED_STEEL.highlight}" stroke-width="2.5" fill="none"/>
    <circle cx="${ELEVATION_SCREW[0]}" cy="${ELEVATION_SCREW[1]}" r="9" fill="${BLUED_STEEL.dark}"/>
    <path d="${slot(ELEVATION_SCREW, 8)}" stroke="${BLUED_STEEL.light}" stroke-width="2"/>
  </g>
  <!-- One part, symmetrical about its axis, proud of the frame: the checkered pad and the end round its screw -->
  <g id="revolver-cylinder-release">
    <path d="${thumbpiece}" fill="url(#revolver-up)"/>
    ${outline(thumbpiece)}
    <g clip-path="url(#revolver-pad-clip)">
      <path d="${padChecks.join(" ")}" stroke="${P.dark}" stroke-width="2.5" fill="none" opacity="0.7"/>
    </g>
    <circle cx="${THUMB_SCREW[0]}" cy="${THUMB_SCREW[1]}" r="${SCREW_R}" fill="${P.sky}" stroke="${P.dark}" stroke-width="2"/>
    <path d="${slot(THUMB_SCREW, SCREW_R)}" stroke="${P.floor}" stroke-width="4"/>
  </g>
  <!-- Wraps the grip frame below the backstrap's top; the checkered field is sunk in a smooth raised border -->
  <g id="revolver-grip">
    <path d="${wood}" fill="url(#revolver-wood)"/>
    ${outline(wood, W.dark)}
    <path d="${FIELD}" fill="${W.edge}" opacity="0.55"/>
    <g clip-path="url(#revolver-field-clip)">
      <path d="${checks.join(" ")}" stroke="${W.dark}" stroke-width="3" fill="none" opacity="0.55"/>
      <path d="${fieldShadow}" stroke="${W.dark}" stroke-width="10" fill="none" opacity="0.8"/>
      <path d="${fieldLight}" stroke="${W.middle}" stroke-width="6" fill="none"/>
    </g>
    <path d="${FIELD}" stroke="${W.dark}" stroke-width="2.5" fill="none"/>
    <circle cx="${MEDALLION[0]}" cy="${MEDALLION[1]}" r="${MEDALLION_R}" fill="${P.sky}" stroke="${P.dark}" stroke-width="3"/>
    <circle cx="${MEDALLION[0]}" cy="${MEDALLION[1]}" r="${MEDALLION_R - 7}" fill="none" stroke="${P.base}" stroke-width="2.5"/>
    <circle cx="${GRIP_SCREW[0]}" cy="${GRIP_SCREW[1]}" r="${GRIP_SCREW_R}" fill="${P.sky}" stroke="${P.dark}" stroke-width="2"/>
    <circle cx="${GRIP_SCREW[0]}" cy="${GRIP_SCREW[1]}" r="${GRIP_SCREW_R - 5}" fill="${P.dark}"/>
  </g>
</svg>`;
}

export const REVOLVER: GunDrawing<RevolverOptions> = {
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
    bottom: GRIP_BASE + GRIP_SAG,
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
