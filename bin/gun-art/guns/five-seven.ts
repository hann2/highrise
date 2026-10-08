/**
 * The Five-seven from its right side: an FN Five-seven MK3 MRD, flat dark earth frame and slide, with its red
 * dot (a Trijicon RM06). Drawn in the pixels of its photo (2560 by 1967) by named numbers, following the
 * gun-art skill (.claude/skills/gun-art/SKILL.md), with guns/m1911.ts as the worked example. A draft until it
 * goes into the game.
 *
 * Every number below was measured in the photo (`measure runs`/`edges`, and edge, blob and texture scans of
 * its pixels), not placed by eye.
 *
 * HOW IT'S BUILT (the construction pass, from the three photos)
 *
 * Two assemblies, the slide over the frame, meeting along one straight seam (SLIDE_BOTTOM to FRAME_TOP, a dark
 * gap about 7 px tall). Both are FDE; the slide is drawn a touch lighter so the seam reads.
 *
 * The slide (y 306 to 543). Every face is the slide's own:
 * - Its SIDE is one flat, upright face the whole length, from the back to the nose and from the top (or the
 *   optic cut) to the bottom: the same tone behind the port, under it, and ahead of it.
 * - Ahead of the port, its top corner is cut away in a long FACET that faces up and out, so it's lit: from the
 *   port's front edge (y 401) its lower edge sags to 428 by x 1900 and rises again to 403 at the nose
 *   (FACET_EDGE). Over the port the same facet is the narrow band above the port's top.
 * - The front serrations are four slanted notches cut up through the facet's lower edge: each a parallelogram
 *   of the side's own face (FRONT_SERRATIONS), its top higher toward the nose, its back wall a dark groove
 *   and its front edge catching the light. The rear serrations are four slanted bands across the side behind
 *   the optic (REAR_SERRATIONS), drawn the same way: a dark groove at their back, a lit edge at their front.
 * - The back: a rounded chamfer from the top into a rear face leaning forward going up, with a lit bevel down
 *   its edge, and a scooped finger pocket just ahead of it (POCKET).
 * - The nose: the same rounded chamfer into a front face leaning back going down, its edge in shadow.
 * - The optic cut (MRD): a pocket in the top from x 485 to 1050, down to 352. In it, a black adapter plate
 *   (328 to 352, with a lip up its back), and on that the red dot.
 * - The ejection port: a rounded rectangle (1127 to 1569, 335 to 447). In it the barrel, shiny black metal:
 *   the chamber a step lighter than the barrel ahead of it, a dark recess under the barrel's front, and the
 *   dark inside of the slide above it. A lit edge along the port's bottom.
 * - A pin through the slide under the optic (597,391) and a small hole behind it (380,336).
 * - The sights: the rear one black, on the slide behind the cut, its top sloping down to the front, its back
 *   the windage screw's head overhanging the slide; the front one a black blade at the nose.
 *
 * The red dot (an RM06): an FDE body on the plate, low at its back (y 236), rising in a curve into the tall
 * hood over the lens (to y 38), which leans back a little. On its side: the windage dial (black, with ticks
 * and a slot) and a small gray button on the low part, and on the hood a black egg-shaped rubber shield with
 * the round battery cap in it (a slotted cap in a thin ring). Its mounting screws are under the hood, not seen
 * from the side.
 *
 * The frame (polymer), on two planes:
 * - The upper FACE (550 down to the grip's line at the back, to 735 over the trigger, to 660 over the rail): the
 *   pins, the slide stop, the marking panel (not a recess: a groove round its sides and bottom, no top, the
 *   sides slanting as the slide's rear serrations do: MARK_GROOVE), the small slot (735 to 783, 719 to 733).
 *   Its front is a narrow bevel in shadow; under the dust cover's front a chamfer.
 * - Below the face's edge at 735, over the trigger and round the upper stippled panel, the frame turns under:
 *   the same polymer at another angle, in shadow in the photo (luminance 70 against the face's 140). Drawn
 *   as that change of shade, with no line.
 * - The SLIDE STOP, the black control Simon calls the fire selector: the MK3's ambidextrous slide stop, a round
 *   black pivot (1180,614) with a ridged lever forward of it, the red cocked indicator dot above the lever's
 *   front, and a small FDE plate round the next pin (1379,618). (The left side has the takedown lever too; it
 *   doesn't show on the right.)
 * - Under the dust cover: the rail, set in under an overhang (1690 to 2300), with the steel serial plate
 *   on it (1782 to 2148, 678 to 731) and its lugs below between five slots.
 * - The grip's line (GRIP_LINE): one groove from the frame's back, along the ledge where the wider grip meets
 *   the upper face (y 682) to x 360, diagonally down to the upper stippled panel's back corner, and down the
 *   grip as the backstrap's seam to its foot. The big lower stippled panel's back edge is the same curve.
 * - The grip leans back 0.235 x per y. On it: two stippled panels (the upper one above the thumb rest, the
 *   big lower one), standing a hair proud, drawn darker with a speckle; a sculpted thumb rest between them,
 *   shaded; and grooves across the back strap and the front strap (every 24.6 and 25 px). The pyramids
 *   beside the grooves, and the FN logo, are left out.
 *
 * A thin outline (0.4 mm) runs round the silhouette, in each part's own dark shade (the `outline` option).
 * - The trigger guard: a front leaning back with grooves across it, a bottom falling to the back, a fillet up
 *   into the front strap. The opening is a hole in the frame, its inner edges lit.
 * - The magazine release: a black button, proud of the grip ahead of the thumb rest, square to the grip.
 * - The trigger: black, behind the frame, seen through the guard: a curved blade with a hooked toe.
 * - The magazine's base: black, flush with the grip's back, its lip ahead of the front strap; the frame's foot
 *   is cut away at the front, so more of it shows there.
 *
 * At 128 px (about 22 photo px a pixel) what reads: the slide's lit facet and its notches, the optic's hood and
 * shield, the port and barrel, the sights, the slide stop, the rail's slots, the panels as darker shapes, the
 * magazine release and base, the trigger. Too small: the markings (left out), the pins (dots), the grooves.
 */
import type { Point } from "../lib/geometry";
import {
  arc,
  fixed,
  fmt,
  on,
  rounded,
  SlantedAxis,
  smoothCurve,
  toward,
} from "../lib/geometry";
import type { GunDrawing } from "../lib/gun";
import type { Material } from "../lib/style";
import { BLACK_POLYMER, BRIGHT_STEEL, FDE } from "../lib/style";

// ---------------------------------------------------------------------------------------------------------
// Colors

/** How the gun is colored: the FDE, how much lighter the slide is than the frame, and how strong the shading is */
export interface FiveSevenOptions {
  fde?: Partial<Material>;
  /** 0: the slide is the frame's color; 1: it's the FDE's light color */
  slideLift?: number;
  /** How far shaded faces go toward the dark color (1 is the material's own) */
  shade?: number;
  /** A thin outline round the silhouette (0.4 mm), in each part's own dark shade */
  outline?: boolean;
}

const DEFAULTS: Required<FiveSevenOptions> = {
  fde: {},
  slideLift: 0.6,
  shade: 1.4,
  outline: true,
};

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** a to b by t */
function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hex(a);
  const [br, bg, bb] = hex(b);
  const ch = (x: number, y: number) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(ar, br)}${ch(ag, bg)}${ch(ab, bb)}`;
}

interface Palette {
  frame: Material;
  slide: Material;
  /** a frame color shaded toward its dark by t, scaled by the shading strength */
  frameShade(t: number): string;
  slideShade(t: number): string;
}

function palette(options: FiveSevenOptions): Palette {
  const o = { ...DEFAULTS, ...options };
  const frame: Material = { ...FDE, ...o.fde };
  const lift = o.slideLift;
  const slide: Material = {
    base: mix(frame.base, frame.light, lift),
    dark: mix(frame.dark, frame.base, lift * 0.6),
    light: mix(frame.light, frame.highlight, lift),
    highlight: mix(frame.highlight, "#ffffff", lift * 0.4),
  };
  const k = o.shade;
  return {
    frame,
    slide,
    frameShade: (t) => mix(frame.base, frame.dark, Math.min(1, t * k)),
    slideShade: (t) => mix(slide.base, slide.dark, Math.min(1, t * k)),
  };
}

// Black parts: the polymer magazine base and release, and black metal (trigger, sights, slide stop, pins)
const BLACK = BLACK_POLYMER.base;
const BLACK_DARK = BLACK_POLYMER.dark;
const BLACK_LIGHT = BLACK_POLYMER.light;
const BLACK_EDGE = BLACK_POLYMER.highlight;
const BLACK_SHINE = "#8a8d93"; // a glint on black metal

const f1 = (v: number) => fixed(v, 1);
const pt = (x: number, y: number) => `${f1(x)},${f1(y)}`;

function linear(
  id: string,
  [x1, y1]: Point,
  [x2, y2]: Point,
  stops: [number, string, number?][],
): string {
  return [
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}">`,
    ...stops.map(
      ([o, c, a]) =>
        `      <stop offset="${o}" stop-color="${c}"${a === undefined ? "" : ` stop-opacity="${a}"`}/>`,
    ),
    "    </linearGradient>",
  ].join("\n");
}

/** A polyline through points */
const line = (points: readonly Point[]) =>
  "M" + points.map(fmt).join(" L");

/** x along a piecewise straight edge given as points sorted by y */
function xAt(points: readonly Point[], y: number): number {
  for (let i = 0; i < points.length - 1; i++) {
    const [xa, ya] = points[i];
    const [xb, yb] = points[i + 1];
    if ((y - ya) * (y - yb) <= 0 && ya !== yb) {
      return xa + ((xb - xa) * (y - ya)) / (yb - ya);
    }
  }
  return points[y < points[0][1] ? 0 : points.length - 1][0];
}

/** Whether a point is inside a polygon */
function inside(poly: readonly Point[], [x, y]: Point): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      hit = !hit;
    }
  }
  return hit;
}

/** A small seeded generator, so the speckle is the same every build */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** A polyline through points, its inner corners rounded by their radii (0 for a sharp one), open at both ends */
function roundedOpen(points: readonly Point[], radii: readonly number[]): string {
  const k = 0.45;
  const parts = [`M${fmt(points[0])}`];
  for (let i = 1; i < points.length - 1; i++) {
    const c = points[i];
    const r = radii[i];
    if (!r) {
      parts.push(`L${fmt(c)}`);
      continue;
    }
    const a = toward(c, points[i - 1], r);
    const b = toward(c, points[i + 1], r);
    parts.push(
      `L${fmt(a)} C${fmt([a[0] + (c[0] - a[0]) * (1 - k), a[1] + (c[1] - a[1]) * (1 - k)])} ` +
        `${fmt([b[0] + (c[0] - b[0]) * (1 - k), b[1] + (c[1] - b[1]) * (1 - k)])} ${fmt(b)}`,
    );
  }
  parts.push(`L${fmt(points[points.length - 1])}`);
  return parts.join(" ");
}

/**
 * Points along a smooth curve (the Béziers smoothCurve writes, from `start`), about every `step` px: so one
 * curve can be both a line drawn on the gun and the edge of a shape, exactly
 */
function sampleCurve(start: Point, curves: string, step = 4): Point[] {
  const n = (curves.match(/-?[\d.]+/g) ?? []).map(Number);
  const out: Point[] = [start];
  let p0 = start;
  for (let i = 0; i + 5 < n.length; i += 6) {
    const c1: Point = [n[i], n[i + 1]];
    const c2: Point = [n[i + 2], n[i + 3]];
    const p3: Point = [n[i + 4], n[i + 5]];
    const pieces = Math.max(
      2,
      Math.ceil(Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) / step),
    );
    for (let k = 1; k <= pieces; k++) {
      const t = k / pieces;
      const u = 1 - t;
      const bez = (a: number, b1: number, b2: number, d: number) =>
        u * u * u * a + 3 * u * u * t * b1 + 3 * u * t * t * b2 + t * t * t * d;
      out.push([
        bez(p0[0], c1[0], c2[0], p3[0]),
        bez(p0[1], c1[1], c2[1], p3[1]),
      ]);
    }
    p0 = p3;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------
// The slide

const SLIDE_TOP = 306;
const SLIDE_BOTTOM = 543;
const FRAME_TOP = 550; // the seam between them is the gap from SLIDE_BOTTOM to here
// Its back: a rounded chamfer from the top into the rear face, which leans forward going up
const SLIDE_BACK_TOP = 222;
const SLIDE_BACK_BOTTOM = 149;
const REAR_CHAMFER: Point[] = [
  [167, 400],
  [170, 380],
  [179, 360],
  [192, 340],
  [205, 320],
  [SLIDE_BACK_TOP, SLIDE_TOP],
];
// The lit bevel down the rear face's edge: its inner line
const REAR_BEVEL_INNER: Point[] = [
  [232, SLIDE_TOP],
  [212, 314],
  [194, 340],
  [181, 440],
  [166, SLIDE_BOTTOM],
];
// Its nose: the same, a rounded chamfer from the top into a front face leaning back going down
const NOSE_TOP = 2405;
const NOSE_CHAMFER: Point[] = [
  [NOSE_TOP, SLIDE_TOP],
  [2437, 320],
  [2450, 340],
  [2460, 360],
  [2463, 378],
];
const SLIDE_FRONT_BOTTOM = 2446;
const NOSE_EDGE_INNER: Point[] = [
  [2449, 372],
  [2443, 440],
  [2433, SLIDE_BOTTOM],
];

// The optic cut, the black adapter plate in it, its lip up the cut's back wall
const CUT_BACK = 485;
const CUT_FRONT = 1050;
const CUT_FLOOR = 352;
const PLATE_TOP = 328;
const PLATE_LIP: [number, number] = [CUT_BACK, 512]; // x from, to: the lip up the back wall
const PLATE_LIP_TOP = 313;

const SLIDE =
  `M${SLIDE_BACK_TOP},${SLIDE_TOP} L${CUT_BACK},${SLIDE_TOP} L${CUT_BACK},${CUT_FLOOR} L${CUT_FRONT},${CUT_FLOOR} ` +
  `L${CUT_FRONT},316 C${CUT_FRONT},310 1053,${SLIDE_TOP} 1060,${SLIDE_TOP} L${NOSE_TOP},${SLIDE_TOP} ` +
  `${smoothCurve(NOSE_CHAMFER, [1, 0], [-17, 165])} ` +
  `L${SLIDE_FRONT_BOTTOM},${SLIDE_BOTTOM} L${SLIDE_BACK_BOTTOM},${SLIDE_BOTTOM} L${fmt(REAR_CHAMFER[0])} ` +
  `${smoothCurve(REAR_CHAMFER, [18, -143], [1, 0])} Z`;

const REAR_BEVEL =
  `M${SLIDE_BACK_BOTTOM},${SLIDE_BOTTOM} L${fmt(REAR_CHAMFER[0])} ${smoothCurve(REAR_CHAMFER, [18, -143], [1, 0])} ` +
  `L${fmt(REAR_BEVEL_INNER[0])} ${smoothCurve(REAR_BEVEL_INNER, [-1, 0.3], [-0.12, 1])} Z`;

const NOSE_EDGE =
  `M2440,${SLIDE_TOP + 40} ${smoothCurve(
    [
      [2440, 346],
      [2450, 360],
      [2460, 372],
      [2463, 378],
    ],
    [0.6, 1],
    [0.3, 1],
  )} L${SLIDE_FRONT_BOTTOM},${SLIDE_BOTTOM} L${fmt(NOSE_EDGE_INNER[2])} L${fmt(NOSE_EDGE_INNER[1])} L${fmt(NOSE_EDGE_INNER[0])} Z`;

// The ejection port, and the barrel in it
const PORT_BACK = 1127;
const PORT_FRONT = 1569;
const PORT_TOP = 335;
const PORT_BOTTOM = 447;
const PORT = rounded(
  [
    [PORT_BACK, PORT_TOP],
    [PORT_FRONT, PORT_TOP],
    [PORT_FRONT, PORT_BOTTOM],
    [PORT_BACK, PORT_BOTTOM],
  ],
  [12, 10, 26, 22],
);
const BARREL_TOP = 368; // above it, the dark inside of the slide
const CHAMBER_FRONT = 1338; // where the chamber gives way to the barrel
const BARREL_RECESS = rounded(
  [
    [1412, 425],
    [PORT_FRONT, 425],
    [PORT_FRONT, PORT_BOTTOM + 4],
    [1412, PORT_BOTTOM + 4],
  ],
  [12, 0, 0, 0],
);

// The facet ahead of the port: lit, from the port's front edge sagging and rising again to the nose
const FACET_EDGE: Point[] = [
  [2459, 403],
  [2350, 407],
  [2230, 412],
  [2100, 419],
  [1980, 425],
  [1900, 428],
  [1800, 426],
  [1700, 415],
  [1578, 401],
];
const FACET =
  `M1090,${SLIDE_TOP} L${NOSE_TOP},${SLIDE_TOP} ${smoothCurve(NOSE_CHAMFER, [1, 0], [-17, 165])} ` +
  `L${fmt(FACET_EDGE[0])} ${smoothCurve(FACET_EDGE, [-1, -0.03], [-1, 0.12])} ` +
  `L${PORT_FRONT},${PORT_TOP} L${PORT_BACK},${PORT_TOP} Z`;

// The front serrations: notches up through the facet's edge, each the side's own face; their backs lean
// forward going up (0.22), the tops higher toward the nose
const FRONT_SERRATIONS = [0, 1, 2, 3].map((i) => {
  const top = 404 - 5.7 * i;
  const back = (y: number) => 1877 + 118.3 * i - 0.22 * (y - 420);
  const width = 71;
  return {
    top,
    corners: [
      [back(top), top],
      [back(top) + width, top],
      [back(SLIDE_BOTTOM) + width, SLIDE_BOTTOM],
      [back(SLIDE_BOTTOM), SLIDE_BOTTOM],
    ] as Point[],
  };
});
// The rear serrations: slanted bands across the side, from the top (or the cut's floor) to the bottom
const REAR_SERRATIONS = [0, 1, 2, 3].map((i) => {
  const back = (y: number) => 444 + 123.2 * i - 0.2375 * (y - 360);
  const top = back(SLIDE_TOP) < CUT_BACK ? SLIDE_TOP : CUT_FLOOR;
  return {
    back: [
      [back(top), top],
      [back(SLIDE_BOTTOM), SLIDE_BOTTOM],
    ] as Point[],
    front: [
      [back(top) + 74, top],
      [back(SLIDE_BOTTOM) + 74, SLIDE_BOTTOM],
    ] as Point[],
  };
});
// The finger pocket at the back
const POCKET = rounded(
  [
    [206, SLIDE_TOP - 4],
    [278, SLIDE_TOP - 4],
    [238, 470],
    [187, 470],
  ],
  [0, 0, 10, 10],
);

const SLIDE_HOLE: Point = [380, 336];
const SLIDE_PIN: Point = [597, 391];

// The sights, black steel: the rear one on the slide behind the cut, its back the windage screw's head
// overhanging the slide; the front one a blade at the nose
const REAR_SIGHT_TOP: Point[] = [
  [300, 203],
  [380, 230],
  [450, 247],
];
const REAR_SIGHT =
  `M232,276 C226,262 225,246 228,232 C232,214 240,202 252,199 L300,203 ` +
  `${smoothCurve(REAR_SIGHT_TOP, [1, 0.1], [1, 0.25])} ` +
  "C462,250 472,262 478,280 L484,300 L488,307 L310,307 L306,284 Z";
const WINDAGE_SCREW: Point = [280, 246];
const FRONT_SIGHT =
  "M2228,307 L2244,256 C2249,232 2256,212 2268,207 C2276,205 2290,207 2300,212 L2355,230 " +
  "C2366,234 2372,246 2372,262 L2372,307 Z";

// ---------------------------------------------------------------------------------------------------------
// The red dot

const OPTIC_BOTTOM = PLATE_TOP;
const HOOD_BACK: Point[] = [
  [754, 234],
  [768, 233],
  [779, 226],
  [791, 214],
  [801, 196],
  [813, 169],
  [826, 135],
  [838, 102],
  [845, 80],
  [849, 58],
  [853, 46],
];
const HOOD_FRONT: Point[] = [
  [979, 46],
  [989, 68],
  [999, 102],
  [1007, 152],
  [1014, 202],
  [1020, 253],
  [1025, 276],
];
const OPTIC =
  `M527,${OPTIC_BOTTOM} L527,246 C527,240 531,236 537,236 L${fmt(HOOD_BACK[0])} ` +
  `${smoothCurve(HOOD_BACK, [1, 0], [0.25, -1])} C855,41 858,38 864,38 L966,38 C972,38 976,40 979,46 ` +
  `${smoothCurve(HOOD_FRONT, [0.4, 1], [0.2, 1])} L1032,280 C1034,281 1035,284 1035,288 L1036,${OPTIC_BOTTOM} Z`;
// The hood's top bevel, lit
const HOOD_BEVEL =
  "M853,46 C855,41 858,38 864,38 L966,38 C972,38 976,40 979,46 L986,62 L847,62 Z";
// The black rubber shield on the hood, egg-shaped, round at its top
const SHIELD_POINTS: Point[] = [
  [913, 101],
  [952, 110],
  [980, 140],
  [994, 195],
  [999, 250],
  [996, 285],
  [978, 302],
  [910, 304],
  [840, 302],
  [817, 288],
  [810, 250],
  [817, 192],
  [842, 136],
  [875, 109],
  [913, 101],
];
const SHIELD = `M${fmt(SHIELD_POINTS[0])} ${smoothCurve(SHIELD_POINTS, [1, 0], [1, 0])} Z`;
const CAP: Point = [910, 208];
const CAP_R = 41;
const CAP_RING_R = 57;
const DIAL: Point = [630, 280];
const DIAL_R = 37;
const BUTTON: Point = [695, 280];
const SERIAL_LABEL = rounded(
  [
    [695, 303],
    [790, 303],
    [790, 327],
    [695, 327],
  ],
  [3, 3, 0, 0],
);

// ---------------------------------------------------------------------------------------------------------
// The frame: one outline round the upper part, the dust cover and rail, the trigger guard, and the grip,
// with the guard's opening a hole in it

const GRIP = new SlantedAxis(213, 1400, -0.235, 0.235); // its back at y 1400, leaning back

// The dust cover's front: a narrow bevel leaning back going down, rounding under into its bottom
const FRAME_FRONT: Point[] = [
  [2446, 552],
  [2442, 565],
  [2436, 590],
  [2432, 620],
  [2427, 650],
  [2418, 670],
  [2408, 677],
];
const FRAME_FRONT_INNER: Point[] = [
  [2423, 552],
  [2421, 565],
  [2417, 590],
  [2413, 620],
  [2408, 650],
  [2402, 666],
];
const DUST_COVER_BOTTOM = 677;
const RAIL_FRONT = 2302;
const RAIL_BOTTOM = 800;
const SLOT_TOP = 767;
const SLOT_WIDTH = 32;
const RAIL_SLOTS = [1735, 1845, 1955, 2065, 2175]; // each slot's back edge
const railBottom = () => {
  const out: string[] = [`L2288,${RAIL_BOTTOM}`];
  for (const back of [...RAIL_SLOTS].reverse()) {
    out.push(
      `L${back + SLOT_WIDTH},${RAIL_BOTTOM} L${back + SLOT_WIDTH},${SLOT_TOP} L${back},${SLOT_TOP} L${back},${RAIL_BOTTOM}`,
    );
  }
  return out.join(" ");
};
const RAIL_RECESS_TOP = 660; // the face's edge over the rail; under it the rail's plane, set in
const RAIL_RECESS_BACK = 1690;

// The guard's front, leaning back like the grip, filleted into the frame's bottom at its top; its bottom,
// falling to the back; and the fillet up into the front strap
const GUARD_FRONT: Point[] = [
  [1665, 803],
  [1628, 812],
  [1606, 838],
  [1598, 870],
  [1576, 960],
  [1556, 1048],
  [1546, 1082],
];
const GUARD_BOTTOM: Point[] = [
  [1546, 1082],
  [1530, 1089],
  [1450, 1099],
  [1300, 1116],
  [1170, 1131],
  [1100, 1133],
  [1000, 1127],
  [962, 1126],
  [944, 1134],
  [932, 1150],
];
// The front strap, down to the frame's bottom (the silhouette is the grooves' ridges)
const FRONT_STRAP: Point[] = [
  [932, 1150],
  [906, 1200],
  [880, 1310],
  [855, 1420],
  [829, 1530],
  [803, 1640],
  [795, 1690],
  [797, 1737],
];
// The frame's bottom: cut away at the front so the magazine's base shows, a diagonal step down to the back
const FRAME_FOOT =
  "L780,1740 L620,1745 L520,1748 C500,1749 488,1752 478,1757 L420,1805 C412,1815 408,1824 400,1830 L140,1830";
// The back of the grip, up from its foot to the deepest point under the beavertail, round under it and up
// to the beavertail's tip (the silhouette is the backstrap grooves' ridges)
const GRIP_BACK: Point[] = [
  [131, 1822],
  [137, 1780],
  [150, 1700],
  [170, 1600],
  [191, 1500],
  [213, 1400],
  [236, 1300],
  [264, 1200],
  [304, 1100],
  [330, 1050],
  [355, 990],
  [367, 940],
  [360, 900],
  [346, 870],
  [325, 852],
  [300, 840],
  [220, 810],
  [160, 790],
  [136, 772],
  [129, 745],
];
// The frame's back above the beavertail: the ledge's end, then the upper face's back leaning forward going up
const FRAME_BACK = `L131,720 L135,700 L141,690 L139,684 L141,640 L145,600 L151,${FRAME_TOP}`;

const FRAME_OUTLINE =
  `M151,${FRAME_TOP} L${fmt(FRAME_FRONT[0])} ${smoothCurve(FRAME_FRONT, [0, 1], [-1, 0.3])} ` +
  `L${RAIL_FRONT},${DUST_COVER_BOTTOM} ` +
  `L2290,750 C2288,775 2290,790 2280,${RAIL_BOTTOM} ${railBottom()} L1690,${RAIL_BOTTOM} L${fmt(GUARD_FRONT[0])} ` +
  `${smoothCurve(GUARD_FRONT, [-1, 0.1], [-0.25, 1])} ` +
  `${smoothCurve(GUARD_BOTTOM, [-0.9, 0.45], [-0.6, 1])} ` +
  `${smoothCurve(FRONT_STRAP, [-0.6, 1], [0.05, 1])} ${FRAME_FOOT} ` +
  `L${fmt(GRIP_BACK[0])} ${smoothCurve(GRIP_BACK, [0.05, -1], [-0.05, -1])} ${FRAME_BACK} Z`;

// The guard's opening: its top the frame's bottom (lower behind the trigger), a chamfer at its top front,
// down the guard's inside front, round its bottom front corner, along the inside of its bottom, up the
// fillet and the front strap under the trigger
const OPENING_FRONT: Point[] = [
  [1545, 855],
  [1537, 900],
  [1526, 950],
  [1513, 995],
  [1490, 1022],
  [1460, 1044],
  [1440, 1049],
];
const OPENING_BOTTOM: Point[] = [
  [1440, 1049],
  [1300, 1065],
  [1160, 1081],
  [1100, 1073],
  [1040, 1048],
  [1000, 1031],
  [975, 1015],
  [966, 995],
];
const OPENING_INNER_EDGE =
  `M1478,799 C1500,812 1525,832 1545,855 ${smoothCurve(OPENING_FRONT, [-0.2, 1], [-1, 0.1])} ` +
  `${smoothCurve(OPENING_BOTTOM, [-1, 0.114], [0.1, -1])}`;
const OPENING =
  `M1035,818 L1150,818 L1180,799 L${OPENING_INNER_EDGE.slice(1)} ` +
  "L986,900 C992,872 996,860 999,850 C1006,834 1018,822 1035,818 Z";

// The guard's front: grooves across it
const GUARD_GROOVES: Point[][] = [];
for (let y = 878; y <= 1062; y += 16.5) {
  const x = 1600 - 0.238 * (y - 860);
  GUARD_GROOVES.push([
    [x + 2, y],
    [x - 26, y - 6],
  ]);
}

// The grip's line: one groove from the frame's back down the grip. It's the ledge where the wider grip meets
// the upper face (along from the beavertail, then diagonally down), turns at the upper panel's back corner,
// and runs down the grip as the backstrap's seam to the foot. The lower stippled panel's back edge is the same
// curve (GRIP_LINE, sampled), so the two line up by construction.
const GRIP_LINE_POINTS: Point[] = [
  [139, 681],
  [220, 688],
  [300, 695],
  [358, 702],
  [400, 717],
  [430, 742],
  [462, 772],
  [492, 805],
  [503, 840],
  [502, 900],
  [492, 965],
  [474, 1030],
  [452, 1087],
  [433, 1130],
  [404, 1198],
  [363, 1300],
  [326, 1422],
  [288, 1545],
  [259, 1668],
  [234, 1790],
  [230, 1828],
];
const GRIP_LINE = sampleCurve(
  GRIP_LINE_POINTS[0],
  smoothCurve(GRIP_LINE_POINTS, [1, 0.085], [-0.1, 1]),
);
const FACE_BOTTOM = 735; // the upper face's edge over the trigger, where the frame turns under
// The underside's back edge is the grip's line, from the face's edge down to where the upper panel's top is
const UNDERSIDE_BACK = GRIP_LINE.filter(
  ([, y]) => y >= FACE_BOTTOM && y <= 812,
);

// The marking panel: not a recess, only a groove round three sides (none at its top), its sides slanting as
// the slide's rear serrations do, its bottom corners round
const SERRATION_LEAN = -0.2375; // x per y down, the rear serrations' slant
const MARK_TOP = 553;
const MARK_BOTTOM = 668;
const markSide = (topX: number): Point[] => [
  [topX, MARK_TOP],
  [topX + SERRATION_LEAN * (MARK_BOTTOM - MARK_TOP), MARK_BOTTOM],
];
const MARK_GROOVE: Point[] = [
  markSide(642)[0],
  markSide(642)[1],
  markSide(1060)[1],
  markSide(1060)[0],
];
const MARK_GROOVE_RADII = [0, 26, 26, 0];
const FRAME_SLOT = rounded(
  [
    [735, 719],
    [783, 719],
    [783, 733],
    [735, 733],
  ],
  [3, 3, 3, 3],
);

// Pins through the frame, black: [center, radius]
const FRAME_PINS: [Point, number][] = [
  [[195, 618], 19],
  [[427, 615], 19],
  [[1120, 733], 23],
  [[1598, 708], 24],
];

// The slide stop: a round pivot, a ridged lever forward of it; the cocked indicator; the plate round the pin
const STOP_PIVOT: Point = [1180, 614];
const STOP_PIVOT_R = 54;
const STOP_LEVER =
  "M1163,676 C1160,660 1166,646 1180,638 C1194,630 1205,624 1222,623 L1292,625 C1314,627 1330,642 1331,660 " +
  "C1332,684 1318,702 1296,703 L1190,703 C1175,703 1165,692 1163,676 Z";
const STOP_RIDGES = [642, 656, 670, 685];
const INDICATOR: Point = [1301, 593];
const STOP_PLATE: Point[] = [
  [1326, 553],
  [1418, 553],
  [1418, 701],
  [1338, 701],
  [1342, 662],
  [1336, 600],
];
const STOP_PIN: Point = [1379, 618];

// The magazine release, black, proud of the grip ahead of the thumb rest, square to the grip
const MAG_RELEASE = rounded(
  [
    [838, 1017],
    [978, 1048],
    [983, 1110],
    [835, 1102],
  ],
  [12, 12, 10, 10],
);

// The grip's stippled panels
const UPPER_PANEL_CORNERS: Point[] = [
  [466, 742],
  [940, 776],
  [900, 836],
  [884, 906],
  [517, 933],
  [510, 822],
];
const UPPER_PANEL = rounded(UPPER_PANEL_CORNERS, [10, 14, 30, 12, 14, 30]);
// The lower panel: from the grip's line along its top, down its front and round its foot, and back up the
// grip's line itself
const LOWER_PANEL_TOP = 1110;
const LOWER_PANEL_FOOT = 1796;
const panelBack = GRIP_LINE.filter(
  ([, y]) => y >= LOWER_PANEL_TOP && y <= LOWER_PANEL_FOOT,
);
const LOWER_PANEL_CORNERS: Point[] = [
  panelBack[0],
  [768, 1178],
  [648, 1704],
  [470, 1712],
  [405, 1790],
  panelBack[panelBack.length - 1],
  ...panelBack.slice(1, -1).reverse(),
];
const LOWER_PANEL = rounded(LOWER_PANEL_CORNERS, [
  0,
  14,
  12,
  10,
  10,
  ...panelBack.map(() => 0),
]);
// The thumb rest's hollow, under the upper panel
const THUMB_REST =
  "M470,985 C520,945 640,930 760,925 C840,922 905,930 935,955 C925,990 880,1012 800,1018 " +
  "C700,1024 560,1020 470,985 Z";

// The magazine's base: under the frame's foot, its bottom flat at the back and slanting up to its lip
const MAG_BASE =
  "M150,1820 L500,1745 L800,1735 C808,1750 816,1766 826,1774 C836,1778 838,1790 834,1800 " +
  `${smoothCurve(
    [
      [834, 1800],
      [780, 1819],
      [700, 1836],
      [600, 1851],
      [480, 1864],
      [420, 1872],
    ],
    [-0.8, 0.6],
    [-1, 0.05],
  )} L172,1873 C156,1873 146,1866 143,1850 L141,1832 Z`;

// The trigger: a curved blade with a hooked toe, its top up behind the frame
const TRIGGER_BACK: Point[] = [
  [1108, 790],
  [1116, 830],
  [1120, 856],
  [1125, 900],
  [1132, 950],
  [1142, 980],
  [1152, 1006],
  [1170, 1025],
  [1190, 1045],
  [1220, 1054],
  [1240, 1054],
  [1254, 1048],
];
const TRIGGER_FRONT: Point[] = [
  [1254, 1048],
  [1240, 1033],
  [1220, 1016],
  [1205, 995],
  [1192, 960],
  [1191, 900],
  [1195, 850],
  [1202, 815],
  [1212, 790],
];
const TRIGGER =
  `M${fmt(TRIGGER_BACK[0])} ${smoothCurve(TRIGGER_BACK, [0.15, 1], [0.9, -0.5])} ` +
  `${smoothCurve(TRIGGER_FRONT, [-0.6, -0.8], [0.3, -1])} Z`;
const TRIGGER_FACE = `M${fmt(TRIGGER_FRONT[1])} ${smoothCurve(TRIGGER_FRONT.slice(1, 8), [-0.6, -0.8], [0.15, -1])}`;

// ---------------------------------------------------------------------------------------------------------
// Drawing helpers

/** A black pin: a dark disc, a darker rim, a glint up and back */
function pin([x, y]: Point, r: number, shine = BLACK_SHINE): string {
  return (
    `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${BLACK}"/>\n` +
    `    <circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r - 1.5)}" fill="none" stroke="${BLACK_DARK}" stroke-width="3"/>\n` +
    `    <path d="M${pt(...on([x, y], r * 0.62, 200))} ${arc([x, y], r * 0.62, 200, 290)}" stroke="${shine}" stroke-width="${f1(r * 0.28)}" stroke-linecap="round" fill="none"/>`
  );
}

/** Grooves across a strap: a dark line, a lit one just under it */
function grooves(lines: Point[][], dark: string, light: string, width: number): string {
  const d = lines.map(line).join(" ");
  const lit = lines
    .map((l) => line(l.map(([x, y]) => [x, y + width * 0.9] as Point)))
    .join(" ");
  return (
    `<path d="${lit}" stroke="${light}" stroke-width="${f1(width * 0.6)}" stroke-linecap="round" fill="none"/>\n` +
    `    <path d="${d}" stroke="${dark}" stroke-width="${width}" stroke-linecap="round" fill="none"/>`
  );
}

/** An indented groove: its lit edge (the path `lit`, just below and forward of it), then the dark line */
function groove(
  d: string,
  lit: string,
  dark: string,
  light: string,
  width = 4,
): string {
  return (
    `<path d="${lit}" stroke="${light}" stroke-width="${f1(width * 0.75)}" fill="none"/>\n` +
    `    <path d="${d}" stroke="${dark}" stroke-width="${width}" fill="none"/>`
  );
}

/** A stippled panel: darker, with a speckle of dark and light grains, clipped to it */
function speckle(id: string, corners: Point[], seed: number, p: Palette): string {
  const random = seeded(seed);
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  const [x0, x1, y0, y1] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  const darkGrains: string[] = [];
  const lightGrains: string[] = [];
  const step = 11;
  for (let y = y0 + 4; y < y1; y += step) {
    for (let x = x0 + 4; x < x1; x += step) {
      const g: Point = [x + random() * step, y + random() * step];
      if (!inside(corners, g)) continue;
      const r = 2.2 + random() * 2.6;
      const c = `<circle cx="${f1(g[0])}" cy="${f1(g[1])}" r="${f1(r)}"/>`;
      if (random() < 0.62) darkGrains.push(c);
      else lightGrains.push(c);
    }
  }
  return (
    `<g clip-path="url(#five-seven-${id}-clip)">\n` +
    `      <g fill="${p.frame.dark}" opacity="0.55">${darkGrains.join("")}</g>\n` +
    `      <g fill="${p.frame.light}" opacity="0.45">${lightGrains.join("")}</g>\n` +
    "    </g>"
  );
}

// ---------------------------------------------------------------------------------------------------------

const MM_PER_PIXEL = 207.9 / 2334;
const OUTLINE_WIDTH = 0.4 / MM_PER_PIXEL;
const OPTIC_PLATE = `M${PLATE_LIP[0]},${PLATE_LIP_TOP} L${PLATE_LIP[1]},${PLATE_LIP_TOP} L${PLATE_LIP[1]},${PLATE_TOP} L${CUT_FRONT - 2},${PLATE_TOP} L${CUT_FRONT - 2},${CUT_FLOOR} L${CUT_BACK},${CUT_FLOOR} Z`;

function drawSide(options: FiveSevenOptions = {}): string {
  const p = palette(options);
  // The silhouette's thin outline, 0.4 mm, in each part's own dark shade (the black parts' base: never
  // near-black)
  const showOutline = options.outline ?? DEFAULTS.outline;
  const edge = (d: string, color: string) =>
    showOutline
      ? `<path d="${d}" fill="none" stroke="${color}" stroke-width="${f1(OUTLINE_WIDTH)}"/>`
      : "";
  const F = p.frame;
  const S = p.slide;
  const panelFill = p.frameShade(0.45);
  const across = GRIP.forward;
  const gripBack = GRIP.at(0, 1400);
  const gripWidth = 640 * GRIP.down[1];
  const gripFront: Point = [
    gripBack[0] + across[0] * gripWidth,
    gripBack[1] + across[1] * gripWidth,
  ];

  const backGrooves: Point[][] = [];
  for (let y = 1105; y <= 1795; y += 24.6) {
    const x = xAt([...GRIP_BACK.slice(0, 11)].reverse(), y);
    backGrooves.push([
      [x + 3, y],
      [x + 52, y + 12.2],
    ]);
  }
  const frontGrooves: Point[][] = [];
  for (let y = 1198; y <= 1652; y += 25.2) {
    const x = xAt(FRONT_STRAP, y);
    frontGrooves.push([
      [x - 3, y],
      [x - 66, y - 15.5],
    ]);
  }

  // The dial's ticks
  const ticks: string[] = [];
  for (let a = -150; a <= 150; a += 25) {
    const t = a - 90;
    ticks.push(`M${pt(...on(DIAL, DIAL_R + 3, t))} L${pt(...on(DIAL, DIAL_R + 9, t))}`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="2560" height="1967" viewBox="0 0 2560 1967" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  <defs>
    ${linear("five-seven-slide-side", [0, SLIDE_TOP], [0, SLIDE_BOTTOM], [
      [0, mix(S.base, S.light, 0.5)],
      [0.35, S.base],
      [1, p.slideShade(0.45)],
    ])}
    ${linear("five-seven-facet", [0, SLIDE_TOP], [0, 430], [
      [0, S.highlight],
      [0.08, S.light],
      [1, mix(S.light, S.base, 0.35)],
    ])}
    ${linear("five-seven-frame-face", [0, FRAME_TOP], [0, 800], [
      [0, mix(F.base, F.light, 0.6)],
      [0.06, mix(F.base, F.light, 0.25)],
      [0.6, F.base],
      [1, p.frameShade(0.35)],
    ])}
    ${linear("five-seven-grip", gripBack, gripFront, [
      [0, p.frameShade(0.65)],
      [0.12, p.frameShade(0.25)],
      [0.45, F.base],
      [0.8, p.frameShade(0.2)],
      [1, p.frameShade(0.6)],
    ])}
    ${linear("five-seven-grip-fade", [0, 840], [0, 1000], [
      [0, "#ffffff", 0],
      [1, "#ffffff", 1],
    ])}
    ${linear("five-seven-underside", [0, FACE_BOTTOM], [0, 840], [
      [0, p.frameShade(0.62)],
      [0.6, p.frameShade(0.55)],
      [1, p.frameShade(0.45)],
    ])}
    ${linear("five-seven-thumb-rest", [0, 930], [0, 1020], [
      [0, F.dark, 0],
      [0.45, F.dark, 0.8],
      [1, F.dark, 0],
    ])}
    ${linear("five-seven-barrel", [0, BARREL_TOP], [0, PORT_BOTTOM], [
      [0, "#141416"],
      [0.1, "#3c3e43"],
      [0.2, "#b4b7bd"],
      [0.28, "#5b5e64"],
      [0.65, "#2a2c30"],
      [1, "#161719"],
    ])}
    ${linear("five-seven-chamber", [0, BARREL_TOP], [0, PORT_BOTTOM], [
      [0, "#2a2c30"],
      [0.12, "#6a6d74"],
      [0.22, "#d7dade"],
      [0.32, "#878a91"],
      [0.7, "#4b4e54"],
      [1, "#2a2b2f"],
    ])}
    ${linear("five-seven-black", [0, 0], [0, 1], [
      [0, BLACK_LIGHT],
      [1, BLACK_DARK],
    ])}
    ${linear("five-seven-mag-base", [0, 1740], [0, 1873], [
      [0, BLACK_EDGE],
      [0.3, BLACK],
      [1, BLACK_DARK],
    ])}
    ${linear("five-seven-trigger", [1120, 0], [1215, 0], [
      [0, BLACK_DARK],
      [0.6, BLACK],
      [1, BLACK_LIGHT],
    ])}
    ${linear("five-seven-optic", [0, 38], [0, OPTIC_BOTTOM], [
      [0, S.light],
      [0.5, S.base],
      [1, p.slideShade(0.35)],
    ])}
    ${linear("five-seven-serial", [0, 678], [0, 731], [
      [0, BRIGHT_STEEL.light],
      [0.25, BRIGHT_STEEL.base],
      [1, BRIGHT_STEEL.dark],
    ])}
    <clipPath id="five-seven-frame-clip">
      <path d="${FRAME_OUTLINE} ${OPENING}" clip-rule="evenodd"/>
    </clipPath>
    <clipPath id="five-seven-slide-clip">
      <path d="${SLIDE}"/>
    </clipPath>
    <clipPath id="five-seven-port-clip">
      <path d="${PORT}"/>
    </clipPath>
    <clipPath id="five-seven-upper-panel-clip">
      <path d="${UPPER_PANEL}"/>
    </clipPath>
    <clipPath id="five-seven-lower-panel-clip">
      <path d="${LOWER_PANEL}"/>
    </clipPath>
    <mask id="five-seven-grip-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="2560" height="1967">
      <rect x="0" y="840" width="1200" height="1100" fill="url(#five-seven-grip-fade)"/>
    </mask>
  </defs>
  <!-- Black polymer, under the frame's foot, its lip ahead of the front strap -->
  <g id="five-seven-magazine-base">
    <path d="${MAG_BASE}" fill="url(#five-seven-mag-base)"/>
    <path d="M800,1737 C808,1752 816,1766 826,1774 C834,1778 837,1786 836,1794" stroke="${BLACK_EDGE}" stroke-width="4" fill="none"/>
    ${edge(MAG_BASE, BLACK)}
  </g>
  <!-- Behind the frame, seen through the guard: a curved blade, its face catching the light -->
  <g id="five-seven-trigger">
    <path d="${TRIGGER}" fill="url(#five-seven-trigger)"/>
    <path d="${TRIGGER_FACE}" stroke="${BLACK_EDGE}" stroke-width="4" fill="none"/>
    ${edge(TRIGGER, BLACK)}
  </g>
  <!-- The seam between slide and frame -->
  <rect id="five-seven-seam" x="150" y="${SLIDE_BOTTOM - 3}" width="2286" height="${FRAME_TOP - SLIDE_BOTTOM + 5}" fill="${BLACK_DARK}"/>
  <g id="five-seven-frame">
    <path d="${FRAME_OUTLINE} ${OPENING}" fill="${F.base}"/>
    <g clip-path="url(#five-seven-frame-clip)">
      <!-- The upper face, lit along its top under the seam -->
      <rect x="130" y="${FRAME_TOP}" width="2330" height="250" fill="url(#five-seven-frame-face)"/>
      <!-- Under the face, over the trigger and round the upper panel, the frame turns under: the same polymer
           at another angle, in shadow; no line between them, only the change of shade -->
      <path d="${line(UNDERSIDE_BACK)} L940,812 C960,818 975,828 990,840 L${RAIL_RECESS_BACK + 20},840 L${RAIL_RECESS_BACK + 20},${FACE_BOTTOM} Z" fill="url(#five-seven-underside)"/>
      <!-- The grip: shaded across, square to its lean, dark at the back and front straps -->
      <path d="M100,840 L1000,840 L1000,1900 L100,1900 Z" fill="url(#five-seven-grip)" mask="url(#five-seven-grip-mask)"/>
      <!-- The rail, set in under the dust cover: its plane in the overhang's shadow -->
      <path d="M${RAIL_RECESS_BACK},${RAIL_BOTTOM + 5} L${RAIL_RECESS_BACK},${RAIL_RECESS_TOP + 14} C${RAIL_RECESS_BACK},${RAIL_RECESS_TOP + 5} ${RAIL_RECESS_BACK + 5},${RAIL_RECESS_TOP} ${RAIL_RECESS_BACK + 14},${RAIL_RECESS_TOP} L2310,${RAIL_RECESS_TOP} L2310,${RAIL_BOTTOM + 5} Z" fill="${p.frameShade(0.45)}"/>
      <path d="M${RAIL_RECESS_BACK + 6},${RAIL_RECESS_TOP + 9} L2306,${RAIL_RECESS_TOP + 9}" stroke="${p.frameShade(0.9)}" stroke-width="18" opacity="0.6" fill="none"/>
      <path d="M${RAIL_RECESS_BACK + 4},${SLOT_TOP - 3} L2296,${SLOT_TOP - 3}" stroke="${mix(F.base, F.light, 0.3)}" stroke-width="4" opacity="0.8" fill="none"/>
      <!-- Under the dust cover's front, a chamfer; down its front, a narrow bevel in shadow -->
      <path d="M${RAIL_FRONT},${RAIL_RECESS_TOP + 2} L2404,${RAIL_RECESS_TOP + 6} L2412,${DUST_COVER_BOTTOM + 4} L${RAIL_FRONT},${DUST_COVER_BOTTOM + 4} Z" fill="${p.frameShade(0.7)}"/>
      <path d="M${fmt(FRAME_FRONT_INNER[0])} ${smoothCurve(FRAME_FRONT_INNER, [-0.15, 1], [-0.6, 1])} L2420,675 L2470,675 L2470,${FRAME_TOP} Z" fill="${p.frameShade(0.55)}"/>
      <!-- The thumb rest's hollow -->
      <path d="${THUMB_REST}" fill="url(#five-seven-thumb-rest)"/>
      <!-- The guard's opening: its inner edges lit -->
      <path d="${OPENING_INNER_EDGE}" stroke="${mix(F.base, F.light, 0.8)}" stroke-width="10" fill="none"/>
    </g>
    <!-- The frame's top edge, catching the light under the seam -->
    <path d="M152,${FRAME_TOP + 2} L2440,${FRAME_TOP + 2}" stroke="${F.light}" stroke-width="3" fill="none"/>
    <!-- The marking panel: a groove round its sides and bottom, no top -->
    ${groove(roundedOpen(MARK_GROOVE, MARK_GROOVE_RADII), roundedOpen(MARK_GROOVE.map(([x, y]) => [x + 3.5, y + 3.5] as Point), MARK_GROOVE_RADII), p.frameShade(0.85), mix(F.base, F.light, 0.6))}
    <path id="five-seven-frame-slot" d="${FRAME_SLOT}" fill="${BLACK_DARK}"/>
    <!-- The steel serial plate on the rail -->
    <path id="five-seven-serial-plate" d="${rounded(
      [
        [1782, 678],
        [2148, 678],
        [2148, 731],
        [1782, 731],
      ],
      [6, 6, 6, 6],
    )}" fill="url(#five-seven-serial)"/>
    <path d="${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => rounded([[1812 + i * 33.5, 690], [1828 + i * 33.5, 690], [1826 + i * 33.5, 720], [1810 + i * 33.5, 720]], [5, 5, 5, 5])).join(" ")}" fill="none" stroke="${BRIGHT_STEEL.dark}" stroke-width="3"/>
    <!-- The guard's front: grooves across it -->
    <g clip-path="url(#five-seven-frame-clip)">
      ${grooves(GUARD_GROOVES, p.frameShade(0.9), mix(F.base, F.light, 0.6), 5)}
    </g>
    <!-- The stippled panels, a hair proud of the grip -->
    <g id="five-seven-upper-panel">
      <path d="${UPPER_PANEL}" fill="${panelFill}"/>
      ${speckle("upper-panel", UPPER_PANEL_CORNERS, 57, p)}
      <path d="${UPPER_PANEL}" stroke="${p.frameShade(1)}" stroke-width="3" fill="none"/>
      <!-- Its top edge, standing proud of the shadow round it, catches the light -->
      <path d="M${pt(476, 746)} L${pt(930, 778)}" stroke="${mix(F.base, F.light, 0.7)}" stroke-width="4" stroke-linecap="round" fill="none"/>
    </g>
    <g id="five-seven-lower-panel">
      <path d="${LOWER_PANEL}" fill="${panelFill}"/>
      ${speckle("lower-panel", LOWER_PANEL_CORNERS, 28, p)}
      <path d="${LOWER_PANEL}" stroke="${p.frameShade(0.85)}" stroke-width="3" fill="none"/>
    </g>
    <!-- The grip's line: one groove from the frame's back, along the ledge and down the grip, the lower
         panel's back edge -->
    <g clip-path="url(#five-seven-frame-clip)">
      ${groove(line(GRIP_LINE), line(GRIP_LINE.map(([x, y]) => [x + 4, y + 5] as Point)), p.frameShade(0.9), mix(F.base, F.light, 0.65), 5)}
    </g>
    <!-- Grooves across the back strap and the front strap -->
    <g clip-path="url(#five-seven-frame-clip)">
      ${grooves(backGrooves, p.frameShade(1), mix(F.base, F.light, 0.55), 9)}
      ${grooves(frontGrooves, p.frameShade(1), mix(F.base, F.light, 0.55), 9)}
    </g>
    ${edge(`${FRAME_OUTLINE} ${OPENING}`, F.dark)}
  </g>
  <!-- Pins through the frame -->
  <g id="five-seven-frame-pins">
    ${FRAME_PINS.map(([c, r]) => pin(c, r)).join("\n    ")}
  </g>
  <!-- The slide stop (ambidextrous): a round black pivot and a ridged lever; the red cocked indicator; a small
       plate round the pin ahead of it -->
  <g id="five-seven-slide-stop">
    <path d="${rounded(STOP_PLATE, [3, 3, 3, 3, 4, 4])}" fill="${mix(F.base, F.light, 0.2)}"/>
    <path d="M1342,660 L1380,680" stroke="${F.light}" stroke-width="3" fill="none"/>
    <path d="${line(STOP_PLATE.slice(3).concat([STOP_PLATE[0]]))}" stroke="${p.frameShade(0.7)}" stroke-width="3" fill="none"/>
    <circle cx="${STOP_PIN[0]}" cy="${STOP_PIN[1]}" r="31" fill="${p.frameShade(0.35)}"/>
    ${pin(STOP_PIN, 23)}
    <circle cx="${INDICATOR[0]}" cy="${INDICATOR[1]}" r="21" fill="${p.frameShade(0.4)}"/>
    <circle cx="${INDICATOR[0]}" cy="${INDICATOR[1]}" r="15" fill="#e2453a"/>
    <circle cx="${INDICATOR[0] - 4}" cy="${INDICATOR[1] - 5}" r="5" fill="#f08a7c"/>
    <circle cx="${STOP_PIVOT[0]}" cy="${STOP_PIVOT[1]}" r="${STOP_PIVOT_R}" fill="${BLACK}"/>
    <path d="M${pt(...on(STOP_PIVOT, STOP_PIVOT_R - 3, 160))} ${arc(STOP_PIVOT, STOP_PIVOT_R - 3, 160, 290)}" stroke="${BLACK_EDGE}" stroke-width="4" fill="none"/>
    <path d="${STOP_LEVER}" fill="${BLACK}"/>
    <path d="M1168,664 C1172,648 1184,638 1198,632 C1208,627 1216,625 1226,625 L1290,627" stroke="${BLACK_SHINE}" stroke-width="4" fill="none"/>
    ${grooves(
      STOP_RIDGES.map((y, i) => [
        [1178 + (i === 0 ? 14 : 0), y],
        [1318 - (i === 0 ? 8 : 0), y],
      ]),
      BLACK_DARK,
      BLACK_EDGE,
      6,
    )}
  </g>
  <!-- Black, proud of the grip -->
  <g id="five-seven-magazine-release">
    <path d="${MAG_RELEASE}" fill="${BLACK}"/>
    <path d="M850,1021 L968,1047" stroke="${BLACK_SHINE}" stroke-width="4" stroke-linecap="round" fill="none"/>
  </g>
  <g id="five-seven-slide">
    <!-- Its side, one upright face the whole length -->
    <path d="${SLIDE}" fill="url(#five-seven-slide-side)"/>
    <g clip-path="url(#five-seven-slide-clip)">
      <!-- The lit bevel down the back, and the finger pocket ahead of it -->
      <path d="${REAR_BEVEL}" fill="${S.light}"/>
      <path d="${POCKET}" fill="${p.slideShade(0.3)}"/>
      <path d="M278,${SLIDE_TOP} L238,470" stroke="${p.slideShade(0.9)}" stroke-width="4" fill="none"/>
      <path d="M206,${SLIDE_TOP} L187,468 L236,468" stroke="${S.light}" stroke-width="4" fill="none"/>
      <!-- The rear serrations: a groove at each band's back, a lit edge at its front -->
      <path d="${REAR_SERRATIONS.map((s) => line(s.front)).join(" ")}" stroke="${S.light}" stroke-width="4" opacity="0.6" fill="none"/>
      <path d="${REAR_SERRATIONS.map((s) => line(s.back)).join(" ")}" stroke="${p.slideShade(1)}" stroke-width="5" fill="none"/>
      <!-- The facet ahead of the port, lit, with the front serrations' notches cut up through its edge -->
      <path d="${FACET}" fill="url(#five-seven-facet)"/>
      <path d="M${fmt(FACET_EDGE[0])} ${smoothCurve(FACET_EDGE, [-1, -0.03], [-1, 0.12])}" stroke="${S.highlight}" stroke-width="3" opacity="0.35" fill="none"/>
      ${FRONT_SERRATIONS.map((s) => `<path d="${line(s.corners)} Z" fill="url(#five-seven-slide-side)"/>`).join("\n      ")}
      <path d="${FRONT_SERRATIONS.map((s) => line([s.corners[0], s.corners[1]])).join(" ")}" stroke="${p.slideShade(0.6)}" stroke-width="3" fill="none"/>
      <path d="${FRONT_SERRATIONS.map((s) => line([s.corners[1], s.corners[2]])).join(" ")}" stroke="${S.highlight}" stroke-width="4" opacity="0.6" fill="none"/>
      <path d="${FRONT_SERRATIONS.map((s) => line([s.corners[0], s.corners[3]])).join(" ")}" stroke="${p.slideShade(1)}" stroke-width="5" fill="none"/>
      <!-- The nose's edge, in shadow -->
      <path d="${NOSE_EDGE}" fill="${p.slideShade(0.55)}"/>
      <!-- The top's edge catching the light -->
      <path d="M${SLIDE_BACK_TOP},${SLIDE_TOP + 1.5} L${CUT_BACK},${SLIDE_TOP + 1.5} M1060,${SLIDE_TOP + 1.5} L${NOSE_TOP},${SLIDE_TOP + 1.5}" stroke="${S.highlight}" stroke-width="3" fill="none"/>
    </g>
    <!-- The ejection port: the dark inside of the slide, the barrel (shiny black metal), its chamber a step
         lighter, a recess under its front; a lit edge along the port's bottom -->
    <g id="five-seven-port">
      <path d="${PORT}" fill="#121112"/>
      <g clip-path="url(#five-seven-port-clip)">
        <path d="M${PORT_BACK},${BARREL_TOP - 9} L${PORT_FRONT},${BARREL_TOP - 9}" stroke="#3a3b3f" stroke-width="3" fill="none"/>
        <rect x="${PORT_BACK}" y="${BARREL_TOP}" width="${CHAMBER_FRONT - PORT_BACK}" height="${PORT_BOTTOM - BARREL_TOP + 4}" fill="url(#five-seven-chamber)"/>
        <rect x="${CHAMBER_FRONT}" y="${BARREL_TOP}" width="${PORT_FRONT - CHAMBER_FRONT}" height="${PORT_BOTTOM - BARREL_TOP + 4}" fill="url(#five-seven-barrel)"/>
        <path d="M${CHAMBER_FRONT},${BARREL_TOP} L${CHAMBER_FRONT},${PORT_BOTTOM}" stroke="#121112" stroke-width="3" fill="none"/>
        <path d="${BARREL_RECESS}" fill="#121112"/>
      </g>
      <path d="M${PORT_BACK + 6},${PORT_BOTTOM + 2} L${PORT_FRONT - 20},${PORT_BOTTOM + 2}" stroke="${S.highlight}" stroke-width="4" fill="none"/>
    </g>
    <!-- A pin through the slide under the optic, and a small hole behind it -->
    ${pin(SLIDE_PIN, 17)}
    <circle cx="${SLIDE_HOLE[0]}" cy="${SLIDE_HOLE[1]}" r="12" fill="${p.slideShade(1)}"/>
    <circle cx="${SLIDE_HOLE[0]}" cy="${SLIDE_HOLE[1] + 2}" r="7" fill="${BLACK_DARK}"/>
    ${edge(SLIDE, S.dark)}
  </g>
  <!-- The optic's adapter plate in the cut, black, its lip up the cut's back wall -->
  <path id="five-seven-optic-plate" d="${OPTIC_PLATE}" fill="${BLACK_DARK}"/>
  ${edge(OPTIC_PLATE, BLACK)}
  <path d="M${PLATE_LIP[0]},${PLATE_LIP_TOP + 2} L${PLATE_LIP[1]},${PLATE_LIP_TOP + 2} M${PLATE_LIP[1]},${PLATE_TOP + 2} L${CUT_FRONT - 4},${PLATE_TOP + 2}" stroke="${BLACK_LIGHT}" stroke-width="3" fill="none"/>
  <!-- The red dot (an RM06): FDE, low at the back, its hood tall over the lens -->
  <g id="five-seven-optic">
    <path d="${OPTIC}" fill="url(#five-seven-optic)"/>
    <path d="${HOOD_BEVEL}" fill="${S.highlight}" opacity="0.7"/>
    <path d="M533,240 L752,238" stroke="${S.highlight}" stroke-width="3" fill="none"/>
    <!-- The windage dial: black, ticked, slotted; a small gray button; the serial label -->
    <path d="${ticks.join(" ")}" stroke="${S.highlight}" stroke-width="3" fill="none"/>
    <circle cx="${DIAL[0]}" cy="${DIAL[1]}" r="${DIAL_R}" fill="${BLACK}"/>
    <path d="M${pt(DIAL[0] - 24, DIAL[1] + 26)} L${pt(DIAL[0] + 24, DIAL[1] - 22)}" stroke="${BLACK_SHINE}" stroke-width="9" stroke-linecap="round" fill="none"/>
    <circle cx="${BUTTON[0]}" cy="${BUTTON[1]}" r="20" fill="${BLACK_DARK}"/>
    <circle cx="${BUTTON[0]}" cy="${BUTTON[1] + 3}" r="15" fill="#c9c9cb"/>
    <path d="${SERIAL_LABEL}" fill="${p.slideShade(0.25)}"/>
    <!-- The black rubber shield on the hood, and the battery cap in it -->
    <path d="${SHIELD}" fill="${BLACK}"/>
    <path d="M${pt(820, 280)} C818,220 836,150 870,122 C890,108 905,106 913,106" stroke="${BLACK_EDGE}" stroke-width="5" fill="none"/>
    <circle cx="${CAP[0]}" cy="${CAP[1]}" r="${CAP_RING_R}" fill="none" stroke="#9a9a9e" stroke-width="2.5"/>
    <circle cx="${CAP[0]}" cy="${CAP[1]}" r="${CAP_R}" fill="${BLACK_LIGHT}"/>
    <path d="M${pt(...on(CAP, CAP_R - 3, 190))} ${arc(CAP, CAP_R - 3, 190, 300)}" stroke="${BLACK_EDGE}" stroke-width="4" fill="none"/>
    <path d="M${pt(CAP[0] - 32, CAP[1] - 1)} L${pt(CAP[0] + 32, CAP[1] - 1)}" stroke="${BLACK_DARK}" stroke-width="10" stroke-linecap="round" fill="none"/>
    ${edge(OPTIC, S.dark)}
  </g>
  <!-- The sights, black steel -->
  <g id="five-seven-rear-sight">
    <path d="${REAR_SIGHT}" fill="${BLACK}"/>
    <path d="M252,201 L300,205 ${smoothCurve(
      REAR_SIGHT_TOP.map(([x, y]) => [x, y + 2] as Point),
      [1, 0.1],
      [1, 0.25],
    )}" stroke="${BLACK_SHINE}" stroke-width="4" fill="none"/>
    <circle cx="${WINDAGE_SCREW[0]}" cy="${WINDAGE_SCREW[1]}" r="15" fill="${BLACK_LIGHT}"/>
    <path d="M${pt(WINDAGE_SCREW[0] - 13, WINDAGE_SCREW[1] + 9)} L${pt(WINDAGE_SCREW[0] + 13, WINDAGE_SCREW[1] - 9)}" stroke="${BLACK_DARK}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <circle cx="452" cy="265" r="6" fill="${BLACK_LIGHT}"/>
    ${edge(REAR_SIGHT, BLACK)}
  </g>
  <g id="five-seven-front-sight">
    <path d="${FRONT_SIGHT}" fill="${BLACK}"/>
    <path d="M2245,262 C2250,236 2257,214 2268,209 C2276,207 2290,209 2300,214 L2352,232" stroke="${BLACK_SHINE}" stroke-width="4" fill="none"/>
    ${edge(FRONT_SIGHT, BLACK)}
  </g>
</svg>`;
}

export const FIVE_SEVEN: GunDrawing<FiveSevenOptions> = {
  name: "five-seven",
  draft: true,
  photo: {
    file: "five-seven-mk3.webp",
    width: 2560,
    height: 1967,
    about:
      "An FDE Five-seven MK3 MRD from its right side, muzzle to the right, on white, with a Trijicon RM06 red dot",
  },
  otherPhotos: [
    {
      file: "five-seven-mk3-alternate.webp",
      width: 2060,
      height: 2400,
      about:
        "From the left, rear three quarters, with the red dot: the left side's controls, the slide's top, the grip's width",
    },
    {
      file: "five-seven-mk3-alternate-2.webp",
      width: 1280,
      height: 907,
      about:
        "From the right, front three quarters, without an optic: the slide's facets and serrations, the frame's front, the muzzle (the bore's height in the slide)",
    },
  ],
  // FN Herstal's technical data sheet for the Five-seveN Mk3 MRD: 207.9 mm (8.19") long, a 122 mm (4.81")
  // barrel. In the photo the gun runs from the beavertail's tip (129) to the nose (2463), 2334 px. The
  // origin is halfway along, on the bore: 430, from the barrel's top in the port (368) and the bore's place in
  // the slide's face in the front photo (about halfway down). Checks: the barrel, from the chamber at the
  // port's back (1127) to the nose, is 1336 px, 119 mm (122 with the muzzle's recess); the height over
  // the sights is 149.5 mm against the 142 to 145 retailers give (5.6 to 5.7", FN gives none), and 140 mm
  // without them.
  scale: { origin: [1296, 430], mmPerPixel: MM_PER_PIXEL },
  frame: {
    // The optic's hood, the bottom of the magazine's base, the beavertail's tip, the nose; the square
    // 218 mm, about 5% more than the gun's length, as the M1911's 224 for 216
    top: 38,
    bottom: 1873,
    back: 129,
    front: 2463,
    side: 218,
    pixels: 256,
  },
  comment: `
  <!-- The Five-seven MK3 MRD from its right side, muzzle to the right, in flat dark earth, with a red dot.
       Millimeters, with the origin on the gun's middle on the bore, as the guns' top views in
       weapons/guns/art/ have it. -->`,
  drawSide,
};
