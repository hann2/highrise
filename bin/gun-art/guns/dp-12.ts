/**
 * The Standard Manufacturing DP-12 from its right side: a bullpup pump shotgun with two barrels side by side, a
 * magazine tube under each, fed from ports in the stock's belly behind the pistol grip. One pump chambers both
 * barrels; each pull of the trigger fires one. Drawn in the pixels of its photo (2025 by 672) by named numbers,
 * following the gun-art skill (.claude/skills/gun-art/SKILL.md), with guns/m1911.ts as the worked example.
 *
 * Every color is an option (`Dp12Options`), so a skin (the FDE and OD green DP-12s) is a set of them.
 *
 * ## Dimensions (the scale)
 *
 * - Overall 29.5" (749 mm), barrels 18 7/8" (479 mm): Standard Manufacturing's figures (Wikipedia, IMFDB and
 *   retailers agree). In the photo the gun runs from the butt pad's back (x 16) to the muzzle device's crown teeth
 *   (x 1986): 1970 px, so 0.3802 mm a pixel. That's the scale.
 * - Checks: the muzzle device is 65 px across, 24.7 mm (a 12 gauge barrel is about 21 mm, a device over it a few
 *   mm more); the top rail's teeth are 26 px apart, 10 mm (Picatinny's 10.01 mm); the barrel, 479 mm, ends 1260 px
 *   back from the muzzle device's back (x 1824) at x 564, in the stock behind the grip, where a bullpup's chamber is.
 * - The bore's axis is y 166 (the middle of the muzzle device, y 134 to 199); the origin is the middle of the gun's
 *   length on it, x 1001.
 * - Widths (for the top view) aren't published. From the muzzle photo, the two muzzle devices sit side by side
 *   almost touching, so the barrels' axes are about 26 mm apart; the end cap and the body round them are about 2.3
 *   devices across (57 mm), the pump's front block a little wider (62 mm). The rail is Picatinny, 21.2 mm.
 *
 * ## Construction (from `grid --mode photo`, region by region, with the three-quarter and muzzle photos)
 *
 * Back to front, in drawing order, and how they sit:
 *
 * - BARREL, the near one (the far one is behind it, the same height): a black steel cylinder (y 140 to 192), seen
 *   only in the gap between the upper receiver's front and the pump's front block (x 1192 to 1440), polished, with a
 *   bright streak along its upper third. Over it, between it and the rail (y 113 to 140), the gun is open: a hole,
 *   the floor shows. When the pump comes back its front block closes the gap.
 * - END CAP, aluminum, at the front of the barrels and fixed to them (x 1736 to 1822): a block from under the rail
 *   to the pump's bottom, its upper part narrower; the pump's slanted front face stands in front of its back half.
 *   Out of its front, under the barrels, the MAGAZINE CAPS: knurled knobs, one in front of the other.
 * - MUZZLE DEVICE, out of the end cap (x 1824 to 1986): a steel collar, then four knurled rings with ports between
 *   them, and a crown of three teeth.
 * - STOCK and LOWER RECEIVER, black polymer, one molding as far as the eye goes: the butt's body behind the rubber
 *   pad, the long box of the stock (its top straight at y 119, a sloped face along its top down to a step at y 166,
 *   the flat side below, a seam across at y 232), into the trigger housing, the trigger guard (its opening a hole),
 *   and the pistol grip leaning back, with its back strap and a molded panel of slots. Slanted ribs on the butt end.
 * - BUTT PAD, black rubber, over the stock's back: angled, with a raised border and diagonal ribs.
 * - STOCK'S TOP PLATE, black, along the stock's top from x 480 (rising in a slope) to the rail (y 99): the cheek
 *   rest.
 * - TRIGGER, in the guard's opening, behind the guard: a crescent. The pump release lever in front of it, in the
 *   guard's front.
 * - UPPER RECEIVER, aluminum, matte, over the stock's front from x 700 to the gap at x 1192: lit along its sloped
 *   face with three slots, two bosses for screws on its top, its front end slanting back; below, a recessed ledge.
 * - ACTION WINDOW, under the upper receiver (x 790 to 1110, y 192 to 280): dark, the action bar across it with
 *   three lit tabs. The pump's back covers it when it comes back.
 * - PUMP, black polymer: the lower forend (from its slanted back at x 1068 to 1440, y 195 to 300: ribs, three slots,
 *   screws) and the front block (rising to y 124 at x 1462, its front slanting back from x 1782 at the top to 1720 at
 *   the bottom: a lit chamfer along its top, ribs on it and down its side, three slots, a step, holes), with the
 *   vertical grip under its front on a rail clamp. All of it slides back together, 95 mm.
 * - TOP RAIL, black anodized, over everything from x 958 to 1800: Picatinny teeth on a base, its back slanting, a
 *   mount strip under its front over the pump's front block (fixed, the pump slides under it).
 *
 * ## Deliberate simplifications
 *
 * - No lettering, the QR code and "DP-12" left off. Screws are dark circles; the grip panels' slots a regular
 *   pattern along each grip's axis.
 * - The action bar is drawn still in its window (it moves with the pump, but only shows in the side view).
 */
import type { Point } from "../lib/geometry";
import { arc, fixed, fmt, on, rounded, smoothCurve } from "../lib/geometry";
import type { GunDrawing, TopView } from "../lib/gun";
import { generatedNote } from "../lib/gun";
import type { Material, Stops } from "../lib/style";
import { linear } from "../lib/style";

// ---------------------------------------------------------------------------------------------------------
// The scale

const BUTT = 16;
const MUZZLE = 1986;
const BORE_Y = 166;
const MM_PER_PX = 749 / (MUZZLE - BUTT);
const ORIGIN: Point = [(BUTT + MUZZLE) / 2, BORE_Y];

// ---------------------------------------------------------------------------------------------------------
// Materials: each a base, a dark (shadowed faces, edges, the outline), a light (lit faces) and a highlight (the
// bright line where an edge catches the light). All of them are options, so a skin is a set of them.

export interface Dp12Options {
  /** The stock's, lower receiver's and pump's black polymer */
  polymer?: Partial<Material>;
  /** The upper receiver's and end cap's matte aluminum */
  aluminum?: Partial<Material>;
  /** The top rail's black anodizing */
  rail?: Partial<Material>;
  /** The barrels' and muzzle devices' black steel */
  steel?: Partial<Material>;
  /** The butt pad's rubber and the grips' panels */
  rubber?: Partial<Material>;
  /** A thin outline round the silhouette, in each part's own dark (the set's rule; default true) */
  outline?: boolean;
  /** The outline's width in millimeters (default OUTLINE_MM) */
  outlineMm?: number;
  /** How wide the rim light along the top edges is, in millimeters (default RIM_LIGHT_MM) */
  rimLightMm?: number;
}

/** Black polymer, neutral: the photo's side faces are 45 to 60, its lit top faces 100 to 130 */
export const DP12_POLYMER: Material = {
  base: "#38393b",
  dark: "#1b1c1e",
  light: "#56585b",
  highlight: "#7e8084",
};

/** The upper receiver's and end cap's matte black aluminum: a step lighter than the polymer, as the photo has it */
export const DP12_ALUMINUM: Material = {
  base: "#45474a",
  dark: "#232426",
  light: "#686b6f",
  highlight: "#8e9196",
};

/** The rail's black anodizing: darker than either (38 in the photo) */
export const DP12_RAIL: Material = {
  base: "#2a2b2e",
  dark: "#131416",
  light: "#45474b",
  highlight: "#6d7075",
};

/** The barrels' black steel, polished: a bright streak (104 in the photo) over near black (23) */
export const DP12_STEEL: Material = {
  base: "#303236",
  dark: "#141518",
  light: "#5a5d63",
  highlight: "#9a9ea6",
};

/** The butt pad's and the grip panels' rubber: a little darker and flatter than the polymer */
export const DP12_RUBBER: Material = {
  base: "#2e2f31",
  dark: "#161718",
  light: "#46474a",
  highlight: "#646669",
};

const OUTLINE_MM = 0.4;
const RIM_LIGHT_MM = 0.8;
const HOLE = "#0d0d0f";

const f1 = (v: number) => fixed(v, 1);

function mix(a: string, b: string, t: number): string {
  const ca = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const cb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return (
    "#" +
    ca
      .map((v, i) => Math.round(v + (cb[i] - v) * t))
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

/** A pill from x0 to x1, y0 to y1, round at both ends */
function pill(x0: number, x1: number, y0: number, y1: number): string {
  const r = (y1 - y0) / 2;
  const back: Point = [x0 + r, y0 + r];
  const front: Point = [x1 - r, y0 + r];
  return (
    `M${fmt(on(back, r, -90))} L${fmt(on(front, r, -90))} ${arc(front, r, -90, 90)} ` +
    `L${fmt(on(back, r, 90))} ${arc(back, r, 90, 270)} Z`
  );
}

/** A box from x0,y0 to x1,y1 */
function box(x0: number, y0: number, x1: number, y1: number): string {
  return `M${f1(x0)},${f1(y0)} L${f1(x1)},${f1(y0)} L${f1(x1)},${f1(y1)} L${f1(x0)},${f1(y1)} Z`;
}

/** A circle as a path (so it can join other paths) */
function disc(c: Point, r: number): string {
  return `M${fmt(on(c, r, 0))} ${arc(c, r, 0, 360)} Z`;
}

/**
 * Slanted ribs: parallelograms from y0 to y1, the first's top back corner at x, `pitch` apart, `width` wide,
 * leaning `lean` (x per y down: negative leans back)
 */
function ribs(
  x: number,
  count: number,
  pitch: number,
  width: number,
  y0: number,
  y1: number,
  lean: number,
): string {
  const shapes: string[] = [];
  for (let i = 0; i < count; i++) {
    const a = x + i * pitch;
    const d = (y1 - y0) * lean;
    shapes.push(
      `M${f1(a)},${y0} L${f1(a + width)},${y0} L${f1(a + width + d)},${y1} L${f1(a + d)},${y1} Z`,
    );
  }
  return shapes.join(" ");
}

/** Each rib's lit lower-front edge, a line along it */
function ribLights(
  x: number,
  count: number,
  pitch: number,
  width: number,
  y0: number,
  y1: number,
  lean: number,
): string {
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    const a = x + i * pitch + width + 1.2;
    const d = (y1 - y0) * lean;
    lines.push(`M${f1(a)},${y0 + 2} L${f1(a + d)},${y1 - 1}`);
  }
  return lines.join(" ");
}

/** A vertical gradient (top to bottom) over a part, in the drawing's units */
function down(id: string, top: number, bottom: number, stops: Stops) {
  return linear(id, [0, top], [0, bottom], stops);
}

/** A round part along the gun, top to bottom: dark edges, a bright streak over its middle */
function cylinder(id: string, top: number, bottom: number, m: Material) {
  return down(id, top, bottom, [
    [0, m.dark],
    [0.1, m.light],
    [0.22, m.highlight],
    [0.34, m.light],
    [0.6, m.base],
    [1, m.dark],
  ]);
}

// ---------------------------------------------------------------------------------------------------------
// The barrel, the end cap and the muzzle device

const BARREL_TOP = 140;
const BARREL_BOTTOM = 192;
const BARREL_BACK = 1150; // inside the upper receiver
const RAIL_BOTTOM = 113;

const CAP_BACK = 1736;
const CAP_FRONT = 1822;
const CAP_STEP: Point = [1782, 150]; // the narrower upper part's back, and where it widens
const CAP_TOP = RAIL_BOTTOM;
const CAP_BOTTOM = 284;
const END_CAP = rounded(
  [
    [CAP_STEP[0], CAP_TOP],
    [CAP_FRONT, CAP_TOP],
    [CAP_FRONT, CAP_BOTTOM],
    [CAP_BACK, CAP_BOTTOM],
    [CAP_BACK, CAP_STEP[1]],
    [CAP_STEP[0], CAP_STEP[1]],
  ],
  [0, 3, 4, 3, 2, 0],
);
// The magazine caps out of its front: knurled knobs, the near one and the far one peeking out above and behind
const KNOB: [number, number] = [CAP_FRONT, 1840];
const KNOB_TOP = 211;
const KNOB_BOTTOM = 266;
const KNOB_SHAPE = rounded(
  [
    [KNOB[0] - 2, KNOB_TOP],
    [KNOB[1], KNOB_TOP],
    [KNOB[1], KNOB_BOTTOM],
    [KNOB[0] - 2, KNOB_BOTTOM],
  ],
  [0, 5, 5, 0],
);

const DEVICE_BACK = 1824;
const DEVICE_TOP = 134;
const DEVICE_BOTTOM = 199;
const DEVICE_TUBE_TOP = 141; // the body between its rings
const DEVICE_TUBE_BOTTOM = 192;
const COLLAR: [number, number] = [DEVICE_BACK, 1852];
const RINGS: [number, number][] = [
  [1856, 1876],
  [1889, 1908],
  [1922, 1940],
  [1954, 1972],
];
const CROWN = 1972;
// The device's outline: the collar, rings and body, and the crown's three teeth
const DEVICE =
  `M${DEVICE_BACK},${DEVICE_TOP + 4} L${DEVICE_BACK},${DEVICE_BOTTOM - 4} ` +
  `C${DEVICE_BACK},${DEVICE_BOTTOM - 1} ${DEVICE_BACK + 2},${DEVICE_BOTTOM} ${DEVICE_BACK + 5},${DEVICE_BOTTOM} ` +
  `L${CROWN},${DEVICE_BOTTOM} L${MUZZLE},190 L${CROWN + 3},178 L${MUZZLE},166 L${CROWN + 3},154 L${MUZZLE},142 ` +
  `L${CROWN},${DEVICE_TOP} L${DEVICE_BACK + 5},${DEVICE_TOP} ` +
  `C${DEVICE_BACK + 2},${DEVICE_TOP} ${DEVICE_BACK},${DEVICE_TOP + 1} ${DEVICE_BACK},${DEVICE_TOP + 4} Z`;
// The ports between the rings: slots through the body (holes: the far barrel's device shows dark through them)
const PORTS = RINGS.slice(0, 3)
  .map(([, end], i) => box(end + 3, 146, RINGS[i + 1][0] - 3, 187))
  .join(" ");

// ---------------------------------------------------------------------------------------------------------
// The top rail

const RAIL_FRONT = 1800;
const RAIL_BACK_TOP = 965; // its back slants down to RAIL_BACK at its bottom
const RAIL_BACK = 958;
const RAIL_BASE_TOP = 92;
const TOOTH_TOP = 84;
const TOOTH_PITCH = 10.01 / MM_PER_PX; // Picatinny
const TOOTH_WIDTH = 5.35 / MM_PER_PX;
const TEETH = (() => {
  const teeth: [number, number][] = [];
  for (
    let x = RAIL_FRONT - TOOTH_WIDTH;
    x > RAIL_BACK_TOP + 4;
    x -= TOOTH_PITCH
  ) {
    teeth.push([x, x + TOOTH_WIDTH]);
  }
  return teeth.reverse();
})();
const RAIL =
  `M${RAIL_BACK},${RAIL_BOTTOM} L${RAIL_BACK_TOP},${RAIL_BASE_TOP} ` +
  TEETH.map(
    ([a, b]) =>
      `L${f1(a)},${RAIL_BASE_TOP} L${f1(a + 1)},${TOOTH_TOP} L${f1(b - 1)},${TOOTH_TOP} L${f1(b)},${RAIL_BASE_TOP}`,
  ).join(" ") +
  ` L${RAIL_FRONT},${RAIL_BASE_TOP} L${RAIL_FRONT},${RAIL_BOTTOM} Z`;
// Its screws into the pump's front block, under its front
const MOUNT_SCREWS: Point[] = [
  [1486, 120],
  [1620, 120],
];

// ---------------------------------------------------------------------------------------------------------
// The stock and the lower receiver: one molding, from the butt's body to the trigger guard and the pistol grip

const STOCK_TOP = 119;
const STOCK_STEP = 166; // the sloped face along its top meets the flat side
const STOCK_SEAM = 232;
const BODY_FRONT = 1100; // under the upper receiver, the window and the pump

// The pistol grip: front and back edges, top to bottom, and its flared base
const GRIP_FRONT: Point[] = [
  [933, 444],
  [924, 470],
  [912, 520],
  [900, 565],
  [895, 590],
  [902, 606],
];
const GRIP_BACK: Point[] = [
  [744, 589],
  [760, 572],
  [770, 548],
  [800, 472],
  [826, 410],
  [826, 386],
  [808, 374],
];

// The trigger guard: its opening (a hole), and its outer edge from the housing's front down and back to the grip
const OPENING: Point[] = [
  [952, 362],
  [1058, 362],
  [1046, 386],
  [1030, 418],
  [1018, 424],
  [952, 429],
  [944, 410],
  [944, 380],
];
const OPENING_SHAPE = rounded(OPENING, [6, 4, 0, 0, 6, 6, 0, 6]);

const BODY =
  // The butt's body behind the pad, its top round into the stock's top
  `M136,150 C142,132 150,${STOCK_TOP} 166,${STOCK_TOP} ` +
  `L${BODY_FRONT},${STOCK_TOP} L${BODY_FRONT},300 ` +
  // The housing's front, the guard's front sloping down and back, its bottom, into the grip's front
  `L1102,318 C1106,322 1106,330 1104,336 ` +
  smoothCurve(
    [
      [1104, 336],
      [1090, 380],
      [1066, 414],
      [1030, 436],
    ],
    [-0.3, 1],
    [-1, 0.25],
  ) +
  ` L962,442 C950,443 940,443 ${fmt(GRIP_FRONT[0])} ` +
  smoothCurve(GRIP_FRONT, [-0.3, 1], [0.4, 1]) +
  ` C904,612 900,614 893,614 L756,603 C744,602 740,596 ${fmt(GRIP_BACK[0])} ` +
  smoothCurve(GRIP_BACK, [0.7, -0.6], [-0.9, -0.3]) +
  // The housing's bottom back to the stock's belly, the belly back to the pad
  ` C800,372 795,372 788,372 L692,372 C680,372 672,368 668,360 L660,348 C652,340 646,338 638,335 ` +
  `L600,316 L566,298 L414,298 L240,335 L214,343 L198,346 Z`;

// The butt pad: angled, under-cut at the heel
const PAD_OUTLINE: Point[] = [
  [17, 163],
  [54, 148],
  [97, 133],
  [117, 135],
  [136, 150],
  [198, 346],
  [216, 350],
  [200, 392],
  [180, 440],
  [164, 450],
  [100, 458],
  [88, 446],
  [60, 336],
  [36, 246],
];
const PAD = rounded(PAD_OUTLINE, [4, 0, 8, 6, 0, 0, 6, 0, 8, 4, 4, 0, 0, 0]);
// Its raised border, inset, and its diagonal ribs
const PAD_BORDER: Point[] = [
  [60, 168],
  [104, 146],
  [130, 172],
  [182, 345],
  [168, 430],
  [112, 440],
  [80, 330],
];
const PAD_RIBS: [Point, Point][] = [
  [
    [96, 340],
    [148, 222],
  ],
  [
    [108, 380],
    [162, 262],
  ],
  [
    [128, 395],
    [168, 300],
  ],
  [
    [150, 386],
    [178, 322],
  ],
];

// The cheek rest along the stock's top
const TOP_PLATE = rounded(
  [
    [478, STOCK_TOP + 2],
    [556, 99],
    [948, 99],
    [962, RAIL_BOTTOM],
    [962, STOCK_TOP + 4],
  ],
  [0, 6, 6, 0, 0],
);

// ---------------------------------------------------------------------------------------------------------
// The trigger and the pump release

const TRIGGER =
  `M948,366 L961,366 ` +
  smoothCurve(
    [
      [961, 366],
      [967, 388],
      [976, 408],
      [983, 423],
    ],
    [0.15, 1],
    [0.6, 1],
  ) +
  ` C982,427 978,427 976,425 ` +
  smoothCurve(
    [
      [976, 425],
      [962, 408],
      [952, 390],
      [948, 366],
    ],
    [-0.8, -0.7],
    [-0.1, -1],
  ) +
  " Z";
const RELEASE = rounded(
  [
    [1061, 332],
    [1073, 330],
    [1083, 388],
    [1071, 391],
  ],
  [3, 3, 3, 3],
);

// ---------------------------------------------------------------------------------------------------------
// The upper receiver and the action window

const UPPER_BACK = 700;
const UPPER_FRONT = 1192;
const UPPER_TOP = 118;
const UPPER_FACE = 132; // its sloped face's top edge
const UPPER_STEP = 166; // the face's bottom, where the ledge steps back
const UPPER_BOTTOM = 192;
const UPPER = rounded(
  [
    [UPPER_BACK, UPPER_TOP],
    [712, UPPER_TOP],
    [726, 106],
    [770, 106],
    [784, UPPER_TOP],
    [930, UPPER_TOP],
    [942, 107],
    [960, 107],
    [UPPER_FRONT, UPPER_TOP],
    [UPPER_FRONT, 134],
    [1180, 172],
    [1168, UPPER_BOTTOM],
    [808, UPPER_BOTTOM],
    [804, 172],
    [UPPER_BACK, 172],
  ],
  [2, 0, 4, 4, 0, 0, 3, 0, 4, 3, 4, 3, 0, 0, 2],
);
const UPPER_SLOTS = [
  pill(790, 874, 144, 155),
  pill(912, 994, 144, 155),
  pill(1032, 1114, 144, 155),
].join(" ");
const UPPER_SCREWS: Point[] = [
  [752, 117],
  [946, 117],
  [1162, 122],
];

const WINDOW = rounded(
  [
    [812, UPPER_BOTTOM],
    [1110, UPPER_BOTTOM],
    [1110, 280],
    [786, 280],
    [770, 258],
  ],
  [0, 0, 0, 3, 3],
);
// The action bar across it, with its three lit tabs
const ACTION_BAR = box(790, 224, 1110, 246);
const TABS: number[] = [797, 925, 1054];

// ---------------------------------------------------------------------------------------------------------
// The pump: the lower forend and the front block, one piece, and the vertical grip on its rail

const FOREND_TOP = 195;
const PUMP_BOTTOM = 301;
const BLOCK_BACK = 1440; // where the front block rises from the forend
const BLOCK_TOP = 117;
const BLOCK_CHAMFER = 158; // the lit chamfer along its top, down to here
const BLOCK_STEP = 213; // a step along its side, under its slots
const PUMP =
  `M1104,${FOREND_TOP} L${BLOCK_BACK},${FOREND_TOP} ` +
  `C${BLOCK_BACK + 10},${FOREND_TOP} ${BLOCK_BACK + 16},${FOREND_TOP - 6} ${BLOCK_BACK + 18},${FOREND_TOP - 14} ` +
  `L1460,125 C1461,120 1464,${BLOCK_TOP} 1470,${BLOCK_TOP} L1778,${BLOCK_TOP} ` +
  `C1782,${BLOCK_TOP} 1784,${BLOCK_TOP + 3} 1783,${BLOCK_TOP + 7} ` +
  // Its front, slanting back to the bottom, and the hook under it
  `L1722,282 L1716,292 C1712,300 1708,${PUMP_BOTTOM + 4} 1700,${PUMP_BOTTOM + 4} L1440,${PUMP_BOTTOM + 4} ` +
  `L1430,${PUMP_BOTTOM} L1080,${PUMP_BOTTOM} C1072,${PUMP_BOTTOM} 1067,295 1068,288 Z`;
const FOREND_RIBS = {
  x: 1146,
  count: 6,
  pitch: 20,
  width: 8,
  y0: 202,
  y1: 245,
  lean: -0.31,
};
const BLOCK_RIBS = {
  x: 1556,
  count: 9,
  pitch: 19,
  width: 8,
  y0: 220,
  y1: 262,
  lean: -0.3,
};
const CHAMFER_RIBS = {
  x: 1606,
  count: 8,
  pitch: 18,
  width: 7,
  y0: 145,
  y1: 158,
  lean: -0.3,
};
const FOREND_SLOTS = [
  pill(1185, 1244, 266, 278),
  pill(1263, 1333, 266, 278),
  pill(1354, 1414, 266, 278),
].join(" ");
const BLOCK_SLOTS = [
  pill(1505, 1564, 187, 200),
  pill(1578, 1648, 187, 200),
  pill(1660, 1718, 187, 200),
].join(" ");
const PUMP_SCREWS: Point[] = [
  [1258, 208],
  [1088, 281],
  [1128, 281],
];
const PUMP_HOLES: Point[] = [
  [1466, 281],
  [1580, 281],
  [1693, 281],
];
const PUMP_BUTTON: Point = [1413, 288];

// The vertical grip: its clamp on the pump's bottom rail, its body leaning back, its flared base
const CLAMP = rounded(
  [
    [1468, 294],
    [1610, 294],
    [1610, 318],
    [1468, 318],
  ],
  [3, 3, 3, 3],
);
const VGRIP_FRONT: Point[] = [
  [1642, 318],
  [1622, 352],
  [1620, 398],
  [1600, 455],
  [1584, 512],
  [1564, 568],
  [1572, 590],
];
const VGRIP_BACK: Point[] = [
  [1444, 588],
  [1460, 568],
  [1482, 505],
  [1507, 430],
  [1520, 365],
  [1514, 318],
];
const VGRIP =
  `M${fmt(VGRIP_FRONT[0])} ` +
  smoothCurve(VGRIP_FRONT, [-0.4, 1], [0.5, 1]) +
  ` C1574,598 1570,602 1562,602 L1456,597 C1446,596 1442,594 ${fmt(VGRIP_BACK[0])} ` +
  smoothCurve(VGRIP_BACK, [0.7, -0.6], [-0.1, -1]) +
  " Z";
const VGRIP_SCREWS: Point[] = [
  [1572, 323],
  [1597, 323],
];

// The pistol grip's back strap (its front edge) and molded panel
const BACK_STRAP_EDGE: Point[] = [
  [842, 392],
  [818, 470],
  [796, 530],
  [784, 566],
];
const GRIP_PANEL = rounded(
  [
    [850, 388],
    [918, 392],
    [889, 578],
    [804, 576],
  ],
  [8, 8, 10, 10],
);
const VGRIP_PANEL = rounded(
  [
    [1566, 362],
    [1600, 368],
    [1544, 566],
    [1500, 566],
  ],
  [10, 10, 10, 10],
);

/** Slots along a grip's panel: columns of short pills leaning with it */
function gripSlots(
  start: Point,
  rows: number,
  columns: number,
  step: Point,
  across: number,
  length: number,
  width: number,
): string {
  const shapes: string[] = [];
  const along: Point = [
    step[0] / Math.hypot(...step),
    step[1] / Math.hypot(...step),
  ];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const x0 = start[0] + step[0] * r + across * c + ((r % 2) * across) / 2;
      const y0 = start[1] + step[1] * r;
      const x1 = x0 + along[0] * length;
      const y1 = y0 + along[1] * length;
      const n: Point = [along[1] * (width / 2), -along[0] * (width / 2)];
      shapes.push(
        `M${fmt([x0 + n[0], y0 + n[1]])} L${fmt([x1 + n[0], y1 + n[1]])} L${fmt([x1 - n[0], y1 - n[1]])} L${fmt([x0 - n[0], y0 - n[1]])} Z`,
      );
    }
  }
  return shapes.join(" ");
}

const GRIP_SLOTS = gripSlots([872, 398], 4, 2, [-12, 44], 18, 34, 5);
const VGRIP_SLOTS = gripSlots([1574, 378], 4, 2, [-14, 46], 16, 34, 5);

// The stock's own holes, screws and details
const STOCK_HOLES: Point[] = [
  [430, 276],
  [264, 306],
  [714, 303],
  [686, 350],
  [1059, 310],
  [842, 372],
];
const STOCK_RIBS = {
  x: 302,
  count: 7,
  pitch: 20,
  width: 8,
  y0: 170,
  y1: 229,
  lean: -0.245,
};
const STOCK_RIBS_LOW = {
  x: 285,
  count: 6,
  pitch: 20,
  width: 8,
  y0: 238,
  y1: 276,
  lean: -0.245,
};
const FRONT_RIBS = {
  x: 754,
  count: 2,
  pitch: 20,
  width: 8,
  y0: 174,
  y1: 228,
  lean: -0.3,
};
const SWIVEL: Point = [178, 255];
const SLING_SLOT = rounded(
  [
    [178, 132],
    [205, 132],
    [205, 158],
    [182, 158],
  ],
  [3, 3, 6, 6],
);
const SELECTOR: Point = [880, 316];

// ---------------------------------------------------------------------------------------------------------
// Drawing the side view

function materials(options: Dp12Options) {
  return {
    P: { ...DP12_POLYMER, ...options.polymer } as Material,
    A: { ...DP12_ALUMINUM, ...options.aluminum } as Material,
    R: { ...DP12_RAIL, ...options.rail } as Material,
    S: { ...DP12_STEEL, ...options.steel } as Material,
    U: { ...DP12_RUBBER, ...options.rubber } as Material,
  };
}

function drawSide(options: Dp12Options = {}): string {
  const { P, A, R, S, U } = materials(options);
  const outline = (options.outlineMm ?? OUTLINE_MM) / MM_PER_PX;
  const rim = (options.rimLightMm ?? RIM_LIGHT_MM) / MM_PER_PX;
  const ribGroup = (
    r: {
      x: number;
      count: number;
      pitch: number;
      width: number;
      y0: number;
      y1: number;
      lean: number;
    },
    m: Material,
  ) =>
    `<path d="${ribs(r.x, r.count, r.pitch, r.width, r.y0, r.y1, r.lean)}" fill="${m.dark}"/>
      <path d="${ribLights(r.x, r.count, r.pitch, r.width, r.y0, r.y1, r.lean)}" stroke="${m.light}" stroke-width="1.6" fill="none"/>`;
  const knurl = (
    x0: number,
    x1: number,
    y0: number,
    y1: number,
    step = 3.2,
  ) => {
    const lines: string[] = [];
    for (let x = x0 + step / 2; x < x1; x += step) {
      lines.push(`M${f1(x)},${y0} L${f1(x)},${y1}`);
    }
    return lines.join(" ");
  };
  const screws = (list: Point[], r: number, m: Material) =>
    list
      .map(
        ([x, y]) =>
          `<circle cx="${x}" cy="${y}" r="${r}" fill="${m.dark}"/><circle cx="${x - 0.8}" cy="${y - 0.8}" r="${f1(r * 0.45)}" fill="${m.light}" opacity="0.7"/>`,
      )
      .join("\n    ");
  const holes = (list: Point[], r: number, m: Material) =>
    list
      .map(
        ([x, y]) =>
          `<circle cx="${x}" cy="${y}" r="${r}" fill="${HOLE}"/><path d="M${fmt(on([x, y], r + 0.8, 20))} ${arc([x, y], r + 0.8, 20, 160)}" stroke="${m.light}" stroke-width="1.5" fill="none"/>`,
      )
      .join("\n    ");

  const parts: [string, string][] = [
    [
      `M${BARREL_BACK},${BARREL_TOP} L${CAP_BACK},${BARREL_TOP} L${CAP_BACK},${BARREL_BOTTOM} L${BARREL_BACK},${BARREL_BOTTOM} Z`,
      S.dark,
    ],
    [END_CAP, A.dark],
    [KNOB_SHAPE, S.dark],
    [DEVICE, S.dark],
    [BODY, P.dark],
    [PAD, U.dark],
    [TOP_PLATE, R.dark],
    [UPPER, A.dark],
    [PUMP, P.dark],
    [CLAMP, R.dark],
    [VGRIP, P.dark],
    [RAIL, R.dark],
  ];
  const outlines = `<!-- The outline: each part's shape stroked under everything, so only its outer half shows -->
  <g id="dp-12-outline" fill="none" stroke-width="${f1(outline * 2)}">
    ${parts.map(([d, c]) => `<path d="${d}" stroke="${c}"/>`).join("\n    ")}
  </g>`;

  const rimPaths = {
    // The stock's top, from the butt's top corner to the top plate's slope
    stock: `M140,146 C146,130 152,${STOCK_TOP} 166,${STOCK_TOP} L480,${STOCK_TOP}`,
    plate: `M478,${STOCK_TOP + 2} L556,99 L948,99`,
    upper: `M${UPPER_BACK},${UPPER_TOP} L712,${UPPER_TOP} L726,106 L770,106 L784,${UPPER_TOP} L930,${UPPER_TOP} L942,107 L958,107`,
    upperFront: `M${UPPER_FRONT},${UPPER_TOP} L${UPPER_FRONT},134 L1180,172`,
    pump: `M1104,${FOREND_TOP} L${BLOCK_BACK},${FOREND_TOP} M1458,133 L1460,125 C1461,120 1464,${BLOCK_TOP} 1470,${BLOCK_TOP} L1778,${BLOCK_TOP}`,
    rail:
      `M${RAIL_BACK},${RAIL_BOTTOM} L${RAIL_BACK_TOP},${RAIL_BASE_TOP} ` +
      TEETH.map(
        ([a, b]) => `M${f1(a + 1)},${TOOTH_TOP} L${f1(b - 1)},${TOOTH_TOP}`,
      ).join(" "),
    vgrip: `M1514,318 L1642,318`,
    cap: `M${CAP_STEP[0]},${CAP_TOP} L${CAP_FRONT},${CAP_TOP} M${CAP_BACK},${CAP_STEP[1]} L${CAP_STEP[0]},${CAP_STEP[1]}`,
  };
  const rimStroke = (d: string, m: Material, clip: string) =>
    `<path d="${d}" stroke="${m.highlight}" stroke-width="${f1(rim * 2)}" fill="none" clip-path="url(#dp-12-${clip}-clip)"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="2025" height="672" viewBox="0 0 2025 672" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  <defs>
    ${cylinder("dp-12-barrel-shading", BARREL_TOP, BARREL_BOTTOM, S)}
    ${cylinder("dp-12-device-shading", DEVICE_TOP, DEVICE_BOTTOM, S)}
    ${cylinder("dp-12-knob-shading", KNOB_TOP, KNOB_BOTTOM, S)}
    <!-- The end cap: lit along its top, its face, darker to its bottom -->
    ${down("dp-12-cap-shading", CAP_TOP, CAP_BOTTOM, [
      [0, A.light],
      [0.2, mix(A.base, A.light, 0.5)],
      [0.6, A.base],
      [1, mix(A.base, A.dark, 0.5)],
    ])}
    <!-- The stock: its sloped top face lit, a hard step down to the flat side, darker toward its belly -->
    ${down("dp-12-body-shading", STOCK_TOP, 620, [
      [0, P.highlight],
      [0.01, P.light],
      [
        ((STOCK_STEP - STOCK_TOP) / (620 - STOCK_TOP)) * 0.7,
        mix(P.light, P.base, 0.45),
      ],
      [
        (STOCK_STEP - STOCK_TOP - 1) / (620 - STOCK_TOP),
        mix(P.light, P.base, 0.7),
      ],
      [(STOCK_STEP - STOCK_TOP) / (620 - STOCK_TOP), P.base],
      [0.45, P.base],
      [1, mix(P.base, P.dark, 0.35)],
    ])}
    <!-- The pistol grip, across it square to its lean: its back lit, its front rounding away -->
    ${linear(
      "dp-12-grip-shading",
      [770, 470],
      [915, 500],
      [
        [0, P.light],
        [0.2, mix(P.base, P.light, 0.5)],
        [0.6, P.base],
        [1, P.dark],
      ],
    )}
    ${linear(
      "dp-12-vgrip-shading",
      [1480, 450],
      [1615, 480],
      [
        [0, P.light],
        [0.2, mix(P.base, P.light, 0.5)],
        [0.6, P.base],
        [1, P.dark],
      ],
    )}
    ${down("dp-12-pad-shading", 133, 458, [
      [0, U.light],
      [0.1, U.base],
      [1, mix(U.base, U.dark, 0.4)],
    ])}
    ${down("dp-12-plate-shading", 99, STOCK_TOP + 4, [
      [0, R.light],
      [0.4, R.base],
      [1, R.dark],
    ])}
    <!-- The upper receiver: a lit chamfer along its top, its sloped face lit, the ledge under it in shadow -->
    ${down("dp-12-upper-shading", 106, UPPER_BOTTOM, [
      [0, A.highlight],
      [(UPPER_TOP - 106 + 2) / (UPPER_BOTTOM - 106), A.light],
      [
        (UPPER_FACE - 106) / (UPPER_BOTTOM - 106),
        mix(A.light, A.highlight, 0.4),
      ],
      [(UPPER_FACE - 106 + 3) / (UPPER_BOTTOM - 106), A.light],
      [
        (UPPER_STEP - 106 - 1) / (UPPER_BOTTOM - 106),
        mix(A.light, A.base, 0.4),
      ],
      [(UPPER_STEP - 106) / (UPPER_BOTTOM - 106), A.dark],
      [(UPPER_STEP - 106 + 6) / (UPPER_BOTTOM - 106), A.base],
      [1, mix(A.base, A.dark, 0.3)],
    ])}
    <!-- The pump: the front block's chamfer lit, its side; the forend's side below -->
    ${down("dp-12-pump-shading", BLOCK_TOP, PUMP_BOTTOM + 4, [
      [0, P.highlight],
      [0.02, P.light],
      [
        (BLOCK_CHAMFER - BLOCK_TOP - 1) / (PUMP_BOTTOM + 4 - BLOCK_TOP),
        mix(P.light, P.base, 0.4),
      ],
      [(BLOCK_CHAMFER - BLOCK_TOP) / (PUMP_BOTTOM + 4 - BLOCK_TOP), P.base],
      [
        (FOREND_TOP - BLOCK_TOP) / (PUMP_BOTTOM + 4 - BLOCK_TOP),
        mix(P.base, P.light, 0.25),
      ],
      [(FOREND_TOP - BLOCK_TOP + 8) / (PUMP_BOTTOM + 4 - BLOCK_TOP), P.base],
      [1, mix(P.base, P.dark, 0.4)],
    ])}
    ${down("dp-12-rail-shading", TOOTH_TOP, RAIL_BOTTOM, [
      [0, R.light],
      [0.28, R.base],
      [0.3, R.light],
      [0.4, R.base],
      [1, R.dark],
    ])}
    ${down("dp-12-window-shading", UPPER_BOTTOM, 280, [
      [0, HOLE],
      [0.4, mix(HOLE, P.dark, 0.6)],
      [1, HOLE],
    ])}
    ${down("dp-12-bar-shading", 224, 246, [
      [0, S.light],
      [0.3, S.base],
      [1, S.dark],
    ])}
    <clipPath id="dp-12-body-clip"><path d="${BODY}"/></clipPath>
    <clipPath id="dp-12-plate-clip"><path d="${TOP_PLATE}"/></clipPath>
    <clipPath id="dp-12-upper-clip"><path d="${UPPER}"/></clipPath>
    <clipPath id="dp-12-pump-clip"><path d="${PUMP}"/></clipPath>
    <clipPath id="dp-12-rail-clip"><path d="${RAIL}"/></clipPath>
    <clipPath id="dp-12-vgrip-clip"><path d="${VGRIP}"/></clipPath>
    <clipPath id="dp-12-cap-clip"><path d="${END_CAP}"/></clipPath>
    <clipPath id="dp-12-device-clip"><path d="${DEVICE}"/></clipPath>
  </defs>
  ${options.outline === false ? "" : outlines}
  <!-- The near barrel, seen in the gap between the upper receiver and the pump's front block -->
  <g id="dp-12-barrel">
    <path d="M${BARREL_BACK},${BARREL_TOP} L${CAP_BACK},${BARREL_TOP} L${CAP_BACK},${BARREL_BOTTOM} L${BARREL_BACK},${BARREL_BOTTOM} Z" fill="url(#dp-12-barrel-shading)"/>
  </g>
  <!-- The end cap on the barrels' front, the magazine caps out of it, and the muzzle device -->
  <g id="dp-12-end-cap">
    <path d="${END_CAP}" fill="url(#dp-12-cap-shading)"/>
    <path d="M${CAP_FRONT - 3},${CAP_TOP + 4} L${CAP_FRONT - 3},${CAP_BOTTOM - 4}" stroke="${A.light}" stroke-width="2" fill="none" opacity="0.6"/>
    ${rimStroke(rimPaths.cap, A, "cap")}
    <path d="${KNOB_SHAPE}" fill="url(#dp-12-knob-shading)"/>
    <path d="${knurl(KNOB[0] + 1, KNOB[1] - 2, KNOB_TOP + 2, KNOB_BOTTOM - 2)}" stroke="${S.dark}" stroke-width="1.4" fill="none" opacity="0.8"/>
  </g>
  <g id="dp-12-muzzle-device">
    <path d="${DEVICE}" fill="url(#dp-12-device-shading)"/>
    <g clip-path="url(#dp-12-device-clip)">
      <!-- The body between the rings, a step in from them -->
      ${RINGS.slice(0, 3)
        .map(
          ([, end], i) =>
            `<path d="${box(end, DEVICE_TOP, RINGS[i + 1][0], DEVICE_TUBE_TOP)} ${box(end, DEVICE_TUBE_BOTTOM, RINGS[i + 1][0], DEVICE_BOTTOM)}" fill="${S.dark}"/>`,
        )
        .join("\n      ")}
      <path d="${box(COLLAR[1], DEVICE_TOP, RINGS[0][0], DEVICE_TUBE_TOP)} ${box(COLLAR[1], DEVICE_TUBE_BOTTOM, RINGS[0][0], DEVICE_BOTTOM)}" fill="${S.dark}"/>
      <path d="${RINGS.map(([a, b]) => knurl(a + 1, b - 1, DEVICE_TOP + 2, DEVICE_BOTTOM - 2, 3)).join(" ")}" stroke="${S.dark}" stroke-width="1.3" fill="none" opacity="0.75"/>
      <path d="M${COLLAR[1]},${DEVICE_TOP} L${COLLAR[1]},${DEVICE_BOTTOM}" stroke="${S.dark}" stroke-width="2.5" fill="none"/>
      <!-- The ports through it, the far barrel's device dark behind them, their bottom edges lit -->
      <path d="${PORTS}" fill="${HOLE}"/>
      <path d="${RINGS.slice(0, 3)
        .map(([, end], i) => `M${end + 4},187.5 L${RINGS[i + 1][0] - 4},187.5`)
        .join(" ")}" stroke="${S.light}" stroke-width="1.5" fill="none"/>
    </g>
  </g>
  <!-- The stock and lower receiver, one molding: the butt's body, the stock's sloped top face and flat side, the
       trigger housing and guard (its opening a hole), the pistol grip with its back strap and panel -->
  <g id="dp-12-stock">
    <path d="${BODY} ${OPENING_SHAPE}" fill="url(#dp-12-body-shading)"/>
    <g clip-path="url(#dp-12-body-clip)">
      <path d="M760,372 L940,372 L930,620 L730,620 Z" fill="url(#dp-12-grip-shading)"/>
      <!-- The step under the sloped face: a shadow, lit just below -->
      <path d="M150,${STOCK_STEP} L${BODY_FRONT},${STOCK_STEP}" stroke="${P.dark}" stroke-width="2.5" fill="none"/>
      <path d="M150,${STOCK_STEP + 2.5} L${BODY_FRONT},${STOCK_STEP + 2.5}" stroke="${P.light}" stroke-width="1.2" fill="none" opacity="0.5"/>
      <!-- The seam along its side, and the line where the lower receiver's panel meets it -->
      <path d="M214,${STOCK_SEAM} L470,${STOCK_SEAM}" stroke="${P.dark}" stroke-width="2" fill="none"/>
      <path d="M470,${STOCK_SEAM} L540,${STOCK_SEAM - 8} L1000,${STOCK_SEAM - 8}" stroke="${P.dark}" stroke-width="1.5" fill="none" opacity="0.6"/>
      <path d="M560,238 L780,300 L1100,300" stroke="${P.light}" stroke-width="1.5" fill="none" opacity="0.45"/>
      <!-- The butt's body: a lit band down its back edge -->
      <path d="M144,160 L203,345" stroke="${P.light}" stroke-width="9" fill="none" opacity="0.55"/>
      ${ribGroup(STOCK_RIBS, P)}
      ${ribGroup(STOCK_RIBS_LOW, P)}
      ${ribGroup(FRONT_RIBS, P)}
      <path d="${ribs(700, 4, 18, 3, 262, 322, -0.3)}" fill="${P.dark}" opacity="0.6"/>
      <!-- The guard's opening: its lower inside edge lit -->
      <path d="M${fmt(OPENING[3])} L${fmt(OPENING[4])} L${fmt(OPENING[5])}" stroke="${P.light}" stroke-width="2" fill="none" opacity="0.7"/>
      <!-- The grip's back strap: a separate strip, its front edge a groove -->
      <path d="M${fmt(BACK_STRAP_EDGE[0])} ${smoothCurve(BACK_STRAP_EDGE, [-0.3, 1], [-0.3, 1])}" stroke="${P.dark}" stroke-width="3" fill="none"/>
      <path d="M${fmt([BACK_STRAP_EDGE[0][0] - 10, BACK_STRAP_EDGE[0][1]])} ${smoothCurve(
        BACK_STRAP_EDGE.map(([x, y]) => [x - 12, y] as Point),
        [-0.3, 1],
        [-0.3, 1],
      )}" stroke="${P.highlight}" stroke-width="2" fill="none" opacity="0.45"/>
      <!-- The grip's panel, a step in, and its slots -->
      <path d="${GRIP_PANEL}" fill="${mix(U.base, P.base, 0.4)}" stroke="${P.dark}" stroke-width="2"/>
      <path d="${GRIP_SLOTS}" fill="${U.dark}"/>
      <!-- The grip's base flare, lit along its top -->
      <path d="M750,592 C760,585 770,580 790,580 M880,590 L898,600" stroke="${P.light}" stroke-width="2" fill="none" opacity="0.6"/>
    </g>
    <!-- The sling slot and swivel socket in the butt, holes and screws -->
    <path d="${SLING_SLOT}" fill="${HOLE}"/>
    <circle cx="${SWIVEL[0]}" cy="${SWIVEL[1]}" r="17" fill="${P.dark}"/>
    <circle cx="${SWIVEL[0]}" cy="${SWIVEL[1]}" r="12" fill="${P.light}" opacity="0.5"/>
    <circle cx="${SWIVEL[0]}" cy="${SWIVEL[1]}" r="7" fill="${P.dark}"/>
    ${holes(STOCK_HOLES, 8, P)}
    ${screws(
      [
        [223, 190],
        [652, 262],
        [774, 584],
        [865, 594],
        [810, 486],
      ],
      5.5,
      P,
    )}
    <!-- The selector, and its lever -->
    <circle cx="${SELECTOR[0]}" cy="${SELECTOR[1]}" r="10" fill="${P.dark}"/>
    <path d="${rounded(
      [
        [874, 316],
        [886, 316],
        [884, 350],
        [876, 350],
      ],
      [3, 3, 4, 4],
    )}" fill="${P.light}"/>
    ${rimStroke(rimPaths.stock, P, "body")}
  </g>
  <!-- The butt pad: its raised border and diagonal ribs -->
  <g id="dp-12-butt-pad">
    <path d="${PAD}" fill="url(#dp-12-pad-shading)"/>
    <path d="${rounded(PAD_BORDER, [4, 10, 4, 10, 4, 4, 8])}" stroke="${U.light}" stroke-width="2" fill="none" opacity="0.7"/>
    <path d="${PAD_RIBS.map(([a, b]) => `M${fmt(a)} L${fmt(b)}`).join(" ")}" stroke="${U.light}" stroke-width="2.2" fill="none" opacity="0.6"/>
  </g>
  <!-- The cheek rest along the stock's top -->
  <g id="dp-12-top-plate">
    <path d="${TOP_PLATE}" fill="url(#dp-12-plate-shading)"/>
    ${rimStroke(rimPaths.plate, R, "plate")}
  </g>
  <!-- The trigger in the guard's opening, and the pump release in the guard's front -->
  <g id="dp-12-trigger">
    <path d="${TRIGGER}" fill="${P.base}" stroke="${P.dark}" stroke-width="1.5"/>
    <path d="M963,372 C966,388 972,402 979,416" stroke="${P.light}" stroke-width="2" fill="none" opacity="0.7"/>
    <path d="${RELEASE}" fill="${P.light}" stroke="${P.dark}" stroke-width="1.5"/>
  </g>
  <!-- The action window under the upper receiver: dark, the action bar across it with three lit tabs -->
  <g id="dp-12-action">
    <path d="${WINDOW}" fill="url(#dp-12-window-shading)"/>
    <path d="${ACTION_BAR}" fill="url(#dp-12-bar-shading)"/>
    ${TABS.map(
      (x) =>
        `<path d="${rounded(
          [
            [x - 13, 228],
            [x + 13, 228],
            [x + 11, 242],
            [x - 11, 242],
          ],
          [3, 3, 3, 3],
        )}" fill="${S.highlight}"/>`,
    ).join("\n    ")}
    <path d="M790,280 L1104,280" stroke="${P.light}" stroke-width="2" fill="none"/>
  </g>
  <!-- The upper receiver: a lit chamfer, its sloped face with three slots, bosses for screws, the ledge below -->
  <g id="dp-12-upper">
    <path d="${UPPER} ${UPPER_SLOTS}" fill="url(#dp-12-upper-shading)"/>
    <g clip-path="url(#dp-12-upper-clip)">
      <path d="M${UPPER_BACK + 4},${UPPER_TOP + 4} L${UPPER_BACK + 4},172" stroke="${A.light}" stroke-width="5" fill="none" opacity="0.7"/>
      <path d="M${UPPER_BACK},${UPPER_FACE} L${UPPER_FRONT},${UPPER_FACE}" stroke="${A.highlight}" stroke-width="1.5" fill="none" opacity="0.7"/>
      ${rimStroke(rimPaths.upper, A, "upper")}
      ${rimStroke(rimPaths.upperFront, A, "upper")}
      <path d="M812,${UPPER_BOTTOM - 1.5} L1166,${UPPER_BOTTOM - 1.5}" stroke="${A.highlight}" stroke-width="2" fill="none" opacity="0.8"/>
    </g>
    <!-- The slots: their tops in shadow, their bottoms lit -->
    <path d="${UPPER_SLOTS}" fill="${HOLE}"/>
    <path d="M798,155.5 L866,155.5 M920,155.5 L986,155.5 M1040,155.5 L1106,155.5" stroke="${A.highlight}" stroke-width="1.5" fill="none"/>
    ${screws(UPPER_SCREWS, 6.5, A)}
  </g>
  <!-- The pump: the lower forend and the front block, ribs, slots, screws; the vertical grip under its front -->
  <g id="dp-12-pump">
    <path d="${CLAMP}" fill="${R.base}"/>
    <path d="M1470,296 L1608,296" stroke="${R.light}" stroke-width="2" fill="none"/>
    <path d="${VGRIP}" fill="url(#dp-12-vgrip-shading)"/>
    <g clip-path="url(#dp-12-vgrip-clip)">
      <path d="${VGRIP_PANEL}" fill="${mix(U.base, P.base, 0.4)}" stroke="${P.dark}" stroke-width="2"/>
      <path d="${VGRIP_SLOTS}" fill="${U.dark}"/>
      <path d="M1516,330 C1520,360 1516,400 1506,440" stroke="${P.light}" stroke-width="3" fill="none" opacity="0.5"/>
      ${rimStroke(rimPaths.vgrip, P, "vgrip")}
    </g>
    ${screws(VGRIP_SCREWS, 9, R)}
    <path d="${PUMP} ${FOREND_SLOTS} ${BLOCK_SLOTS}" fill="url(#dp-12-pump-shading)"/>
    <g clip-path="url(#dp-12-pump-clip)">
      ${ribGroup(FOREND_RIBS, P)}
      ${ribGroup(BLOCK_RIBS, P)}
      ${ribGroup(CHAMFER_RIBS, P)}
      <!-- The front block's back edge rising from the forend, lit; the step along its side -->
      <path d="M${BLOCK_BACK + 2},${FOREND_TOP - 1} C${BLOCK_BACK + 12},${FOREND_TOP - 4} ${BLOCK_BACK + 16},${FOREND_TOP - 8} ${BLOCK_BACK + 18},${FOREND_TOP - 16} L1460,127" stroke="${P.light}" stroke-width="3" fill="none"/>
      <path d="M1486,${BLOCK_STEP} L1730,${BLOCK_STEP}" stroke="${P.dark}" stroke-width="2.5" fill="none"/>
      <path d="M1486,${BLOCK_STEP + 2.5} L1730,${BLOCK_STEP + 2.5}" stroke="${P.light}" stroke-width="1.2" fill="none" opacity="0.5"/>
      <!-- Its slanted front face, catching the light -->
      <path d="M1782,${BLOCK_TOP + 8} L1722,282" stroke="${P.light}" stroke-width="4" fill="none"/>
      <!-- The forend's slanted back -->
      <path d="M1104,${FOREND_TOP + 2} L1070,286" stroke="${P.light}" stroke-width="3" fill="none" opacity="0.7"/>
      ${rimStroke(rimPaths.pump, P, "pump")}
    </g>
    <path d="${FOREND_SLOTS} ${BLOCK_SLOTS}" fill="${P.dark}"/>
    <path d="M1192,278.5 L1238,278.5 M1270,278.5 L1326,278.5 M1361,278.5 L1408,278.5 M1512,200.5 L1558,200.5 M1585,200.5 L1641,200.5 M1667,200.5 L1712,200.5" stroke="${P.light}" stroke-width="1.5" fill="none"/>
    ${screws(PUMP_SCREWS, 7, P)}
    ${holes(PUMP_HOLES, 9, P)}
    <circle cx="${PUMP_BUTTON[0]}" cy="${PUMP_BUTTON[1]}" r="8" fill="${P.light}" stroke="${P.dark}" stroke-width="1.5"/>
  </g>
  <!-- The top rail over everything: its teeth, its back slanting, its screws over the pump -->
  <g id="dp-12-rail">
    ${screws(MOUNT_SCREWS, 6, A)}
    <path d="${RAIL}" fill="url(#dp-12-rail-shading)"/>
    ${rimStroke(rimPaths.rail, R, "rail")}
    <path d="M${RAIL_BACK_TOP},${RAIL_BASE_TOP + 2} L${RAIL_FRONT},${RAIL_BASE_TOP + 2}" stroke="${R.light}" stroke-width="1.5" fill="none" opacity="0.6"/>
  </g>
</svg>
`;
}

// ---------------------------------------------------------------------------------------------------------
// The top view: the gun as it's held, seen from above, muzzle along +x and its right side +y, in millimeters
// about its middle on the bore, at the same scale as the side view. Lengths along it come from the side view's
// numbers (`sx`); widths across it from the muzzle photo, scaled by the muzzle devices (24.7 mm across, the side
// view's), as no spec sheet gives them:
//
//   - The barrels' axes 13 mm either side of the middle (the devices almost touch); the barrels 19.8 mm across
//     (the side view's), the devices 24.7.
//   - The stock, the end cap and the forend 57 mm across (about 2.3 devices), the upper receiver a little narrower
//     (55), the pump's front block a little wider (62). The cheek rest along the stock's top 32 mm. The butt pad
//     54. The rail is Picatinny, 21.2 mm.
//   - The grips, the guard and the magazine caps are under the gun, out of sight from above.
//
// What moves: the pump (the forend, the front block and the vertical grip), straight back. Its stroke is the gap
// it closes, from the front block's back (x 1440) to the upper receiver's front (x 1192): 250 px, 95 mm, which is
// about a 3" shell's length and a bit, what the bolts have to travel. It slides under the upper receiver, the rail
// and the stock (drawn after it), and uncovers the barrels in front of it and the end cap's back (drawn before it).

/** A length along the gun from the side view's pixels, in millimeters from the gun's middle */
const sx = (px: number) => (px - ORIGIN[0]) * MM_PER_PX;

const T_BUTT = sx(BUTT);
const T_PAD_FRONT = sx(136);
const T_PAD_HALF = 27;
const T_STOCK_HALF = 28.5;
const T_STOCK_FRONT = sx(UPPER_BACK + 20);
const T_PLATE = [sx(478), sx(962)] as const;
const T_PLATE_RISE = sx(556); // where its slope reaches its top
const T_PLATE_HALF = 16;
const T_UPPER = [sx(UPPER_BACK), sx(UPPER_FRONT)] as const;
const T_UPPER_HALF = 27.5;
const T_RAIL = [sx(RAIL_BACK), sx(RAIL_FRONT)] as const;
const T_RAIL_HALF = 21.2 / 2;
const T_BARREL_Y = 13;
const T_BARREL_HALF = ((BARREL_BOTTOM - BARREL_TOP) * MM_PER_PX) / 2;
const T_BARREL = [sx(BARREL_BACK), sx(DEVICE_BACK) + 1] as const;
const T_DEVICE = [sx(DEVICE_BACK), sx(MUZZLE)] as const;
const T_DEVICE_HALF = ((DEVICE_BOTTOM - DEVICE_TOP) * MM_PER_PX) / 2;
const T_TUBE_HALF = ((DEVICE_TUBE_BOTTOM - DEVICE_TUBE_TOP) * MM_PER_PX) / 2;
const T_CAP = [sx(CAP_BACK), sx(CAP_FRONT)] as const;
const T_CAP_HALF = 28.5;
const T_FOREND = [sx(1068), sx(BLOCK_BACK + 10)] as const;
const T_FOREND_HALF = 28.5;
const T_BLOCK = [sx(BLOCK_BACK + 4), sx(1783)] as const;
const T_BLOCK_HALF = 31;
const T_STROKE = (BLOCK_BACK - UPPER_FRONT) * MM_PER_PX;

const t1 = (v: number) =>
  fixed(v, 2).replace(/0+$/, "").replace(/\.$/, "").replace(/^-0$/, "0");
const tp = (x: number, y: number) => `${t1(x)},${t1(y)}`;

/** A rectangle with each corner rounded by its own radius (back-left, front-left, front-right, back-right) */
function tbox(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number | [number, number, number, number] = 0,
): string {
  const [a, b, c, d] = typeof r === "number" ? [r, r, r, r] : r;
  const k = 0.45;
  const corner = (
    cx: number,
    cy: number,
    fx: number,
    fy: number,
    tx: number,
    ty: number,
  ) =>
    `C${tp(fx + (cx - fx) * (1 - k), fy + (cy - fy) * (1 - k))} ${tp(tx + (cx - tx) * (1 - k), ty + (cy - ty) * (1 - k))} ${tp(tx, ty)}`;
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

/** A gradient across the gun (along y), from its left edge to its right */
function across(id: string, y0: number, y1: number, list: Stops): string {
  return [
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${t1(y0)}" x2="0" y2="${t1(y1)}">`,
    ...list.map(([o, c]) => `      <stop offset="${o}" stop-color="${c}"/>`),
    "    </linearGradient>",
  ].join("\n    ");
}

/** A round part from above: dark at its edges, a bright streak down its middle */
const roundAcross = (m: Material): Stops => [
  [0, m.dark],
  [0.22, m.base],
  [0.42, m.light],
  [0.5, m.highlight],
  [0.6, m.light],
  [0.82, m.base],
  [1, m.dark],
];
/** A flat top with rounded edges: lit across its flat, darker as its edges round away */
const flatAcross = (m: Material): Stops => [
  [0, m.dark],
  [0.07, m.base],
  [0.16, m.light],
  [0.5, mix(m.light, m.highlight, 0.35)],
  [0.84, m.light],
  [0.93, m.base],
  [1, m.dark],
];

// The shapes
const T_PAD_SHAPE = tbox(
  T_BUTT,
  -T_PAD_HALF,
  T_PAD_FRONT + 2,
  T_PAD_HALF,
  [6, 0, 0, 6],
);
const T_STOCK = tbox(
  T_PAD_FRONT,
  -T_STOCK_HALF,
  T_STOCK_FRONT,
  T_STOCK_HALF,
  [4, 0, 0, 4],
);
// The cheek rest: its back sloping up (seen from above as a fade into the stock), its front square to the rail
const T_PLATE_SHAPE = tbox(
  T_PLATE[0],
  -T_PLATE_HALF,
  T_PLATE[1],
  T_PLATE_HALF,
  [8, 2, 2, 8],
);
const T_UPPER_SHAPE = tbox(
  T_UPPER[0],
  -T_UPPER_HALF,
  T_UPPER[1],
  T_UPPER_HALF,
  [3, 4, 4, 3],
);
const T_RAIL_SHAPE = tbox(
  T_RAIL[0],
  -T_RAIL_HALF,
  T_RAIL[1],
  T_RAIL_HALF,
  [2, 1, 1, 2],
);
// The rail's slots between its teeth, across it
const T_RAIL_SLOTS = TEETH.slice(0, -1)
  .map(([, b], i) =>
    tbox(sx(b), -T_RAIL_HALF + 0.6, sx(TEETH[i + 1][0]), T_RAIL_HALF - 0.6),
  )
  .join(" ");
const T_BARRELS = [-T_BARREL_Y, T_BARREL_Y]
  .map((y) =>
    tbox(T_BARREL[0], y - T_BARREL_HALF, T_BARREL[1], y + T_BARREL_HALF),
  )
  .join(" ");
const T_CAP_SHAPE = tbox(
  T_CAP[0],
  -T_CAP_HALF,
  T_CAP[1],
  T_CAP_HALF,
  [2, 4, 4, 2],
);
/** One muzzle device from above, its axis at y: the collar, rings and body, the crown's teeth */
function tDevice(y: number): string {
  const h = T_DEVICE_HALF;
  const crown = sx(CROWN);
  const tip = T_DEVICE[1];
  return (
    `M${tp(T_DEVICE[0], y - h + 1.5)} C${tp(T_DEVICE[0], y - h + 0.5)} ${tp(T_DEVICE[0] + 0.5, y - h)} ${tp(T_DEVICE[0] + 1.5, y - h)} ` +
    `L${tp(crown, y - h)} L${tp(tip, y - h + 3)} L${tp(crown + 1.2, y - h / 2)} L${tp(tip, y)} ` +
    `L${tp(crown + 1.2, y + h / 2)} L${tp(tip, y + h - 3)} L${tp(crown, y + h)} ` +
    `L${tp(T_DEVICE[0] + 1.5, y + h)} C${tp(T_DEVICE[0] + 0.5, y + h)} ${tp(T_DEVICE[0], y + h - 0.5)} ${tp(T_DEVICE[0], y + h - 1.5)} Z`
  );
}
// The pump from above: the forend, under the barrels, so only its edges show beside them (two strips), and the
// front block
const T_FOREND_INNER = T_BARREL_Y + T_BARREL_HALF - 1;
const T_FOREND_SHAPE =
  tbox(
    T_FOREND[0],
    -T_FOREND_HALF,
    T_FOREND[1],
    -T_FOREND_INNER,
    [3, 0, 0, 0],
  ) +
  " " +
  tbox(T_FOREND[0], T_FOREND_INNER, T_FOREND[1], T_FOREND_HALF, [0, 0, 0, 3]);
const T_BLOCK_SHAPE = tbox(
  T_BLOCK[0],
  -T_BLOCK_HALF,
  T_BLOCK[1],
  T_BLOCK_HALF,
  [5, 4, 4, 5],
);
// The ribs on its chamfered top edges, notching both edges
const T_BLOCK_RIBS = Array.from({ length: CHAMFER_RIBS.count }, (_, i) => {
  const x0 = sx(CHAMFER_RIBS.x + i * CHAMFER_RIBS.pitch);
  const x1 = x0 + CHAMFER_RIBS.width * MM_PER_PX;
  return (
    tbox(x0, -T_BLOCK_HALF + 0.8, x1, -T_BLOCK_HALF + 5) +
    " " +
    tbox(x0, T_BLOCK_HALF - 5, x1, T_BLOCK_HALF - 0.8)
  );
}).join(" ");

function drawTop(options: Dp12Options = {}): string {
  const { P, A, R, S, U } = materials(options);
  const outlineWidth = options.outlineMm ?? OUTLINE_MM;
  const outline = options.outline !== false;
  const minX = T_BUTT - 1;
  const maxX = T_DEVICE[1] + 1;
  const half = T_BLOCK_HALF + 1;
  const width = t1(maxX - minX);
  const height = t1(half * 2);
  // Each group's own outline: its silhouette stroked twice as wide under its fill, in its own dark, so it moves
  // with the part
  const edge = (d: string, color: string) =>
    outline
      ? `<path d="${d}" stroke="${color}" stroke-width="${t1(outlineWidth * 2)}" fill="none"/>\n    `
      : "";
  const knurl = (x0: number, x1: number, y: number, h: number, step = 1.2) => {
    const lines: string[] = [];
    for (let x = x0 + step / 2; x < x1; x += step) {
      lines.push(`M${tp(x, y - h)} L${tp(x, y + h)}`);
    }
    return lines.join(" ");
  };
  const deviceDetail = (y: number) =>
    `<path d="${RINGS.map(([a, b]) => knurl(sx(a) + 0.3, sx(b) - 0.3, y, T_DEVICE_HALF - 0.4)).join(" ")}" stroke="${S.dark}" stroke-width="0.4" fill="none" opacity="0.75"/>
    <path d="${RINGS.slice(0, 3)
      .map(([, end], i) =>
        [-1, 1]
          .map((side) =>
            tbox(
              sx(end),
              y + side * T_TUBE_HALF,
              sx(RINGS[i + 1][0]),
              y + side * T_DEVICE_HALF,
            ),
          )
          .join(" "),
      )
      .join(" ")}" fill="${S.dark}"/>
    <path d="${RINGS.slice(0, 3)
      .map(([, end], i) =>
        tbox(sx(end) + 1, y - 2.2, sx(RINGS[i + 1][0]) - 1, y + 2.2, 1),
      )
      .join(" ")}" fill="${HOLE}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${t1(minX)} ${t1(-half)} ${width} ${height}" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  ${generatedNote("dp-12")}
  <!-- The DP-12 from above, as it's held: muzzle along +x, its right side down the page (+y), millimeters about
       its middle on the bore, at the same scale as its side view (the pickup); lengths along it are the side
       view's, widths the muzzle photo's. Two barrels side by side under the rail. Lit from above. -->
  <defs>
    ${across("dp-12-top-pad", -T_PAD_HALF, T_PAD_HALF, flatAcross(U))}
    ${across("dp-12-top-stock", -T_STOCK_HALF, T_STOCK_HALF, flatAcross(P))}
    ${across("dp-12-top-plate", -T_PLATE_HALF, T_PLATE_HALF, flatAcross(R))}
    ${across("dp-12-top-upper", -T_UPPER_HALF, T_UPPER_HALF, flatAcross(A))}
    ${across("dp-12-top-rail", -T_RAIL_HALF, T_RAIL_HALF, flatAcross(R))}
    ${across("dp-12-top-cap", -T_CAP_HALF, T_CAP_HALF, flatAcross(A))}
    ${across("dp-12-top-forend", -T_FOREND_HALF, T_FOREND_HALF, flatAcross(P))}
    ${across("dp-12-top-block", -T_BLOCK_HALF, T_BLOCK_HALF, flatAcross(P))}
    ${[-1, 1]
      .map(
        (side) =>
          `${across(`dp-12-top-barrel-${side < 0 ? "left" : "right"}`, side * T_BARREL_Y - T_BARREL_HALF, side * T_BARREL_Y + T_BARREL_HALF, roundAcross(S))}
    ${across(`dp-12-top-device-${side < 0 ? "left" : "right"}`, side * T_BARREL_Y - T_DEVICE_HALF, side * T_BARREL_Y + T_DEVICE_HALF, roundAcross(S))}`,
      )
      .join("\n    ")}
  </defs>
  <!-- The two barrels side by side, from inside the upper receiver to the muzzle devices: they show beside the
       rail in the gap the pump closes, and in front of the pump once it's back -->
  <g id="barrels">
    ${edge(T_BARRELS, S.dark)}<path d="${tbox(T_BARREL[0], -T_BARREL_Y - T_BARREL_HALF, T_BARREL[1], -T_BARREL_Y + T_BARREL_HALF)}" fill="url(#dp-12-top-barrel-left)"/>
    <path d="${tbox(T_BARREL[0], T_BARREL_Y - T_BARREL_HALF, T_BARREL[1], T_BARREL_Y + T_BARREL_HALF)}" fill="url(#dp-12-top-barrel-right)"/>
    <!-- The dark between them, under the rail -->
    <path d="${tbox(T_BARREL[0], -T_BARREL_Y + T_BARREL_HALF - 1, T_CAP[0], T_BARREL_Y - T_BARREL_HALF + 1)}" fill="${HOLE}"/>
  </g>
  <!-- The end cap on the barrels' front, its back half under the pump's front block until the pump comes back -->
  <g id="end-cap">
    ${edge(T_CAP_SHAPE, A.dark)}<path d="${T_CAP_SHAPE}" fill="url(#dp-12-top-cap)"/>
  </g>
  <!-- The muzzle devices: knurled rings, ports through their sides and tops, crowns of teeth -->
  <g id="muzzle">
    ${edge(tDevice(-T_BARREL_Y) + " " + tDevice(T_BARREL_Y), S.dark)}<path d="${tDevice(-T_BARREL_Y)}" fill="url(#dp-12-top-device-left)"/>
    <path d="${tDevice(T_BARREL_Y)}" fill="url(#dp-12-top-device-right)"/>
    ${deviceDetail(-T_BARREL_Y)}
    ${deviceDetail(T_BARREL_Y)}
  </g>
  <!-- Slides back ${t1(T_STROKE)} mm to pump, under the upper receiver, the stock and the rail: the forend (its edges
       show beside the barrels) and the front block, ribbed along its top edges; the vertical grip is under it -->
  <g id="pump">
    ${edge(T_FOREND_SHAPE, P.dark)}<path d="${T_FOREND_SHAPE}" fill="url(#dp-12-top-forend)"/>
    ${edge(T_BLOCK_SHAPE, P.dark)}<path d="${T_BLOCK_SHAPE}" fill="url(#dp-12-top-block)"/>
    <path id="pump-ribs" d="${T_BLOCK_RIBS}" fill="${P.dark}"/>
    <path d="M${tp(T_BLOCK[0] + 1, -T_BLOCK_HALF + 6)} L${tp(T_BLOCK[1] - 1, -T_BLOCK_HALF + 6)} M${tp(T_BLOCK[0] + 1, T_BLOCK_HALF - 6)} L${tp(T_BLOCK[1] - 1, T_BLOCK_HALF - 6)}" stroke="${P.dark}" stroke-width="0.4" fill="none" opacity="0.6"/>
  </g>
  <!-- The stock: the butt pad, the stock's top, the cheek rest along it -->
  <g id="stock">
    ${edge(T_STOCK, P.dark)}<path d="${T_STOCK}" fill="url(#dp-12-top-stock)"/>
    ${edge(T_PAD_SHAPE, U.dark)}<path id="butt-pad" d="${T_PAD_SHAPE}" fill="url(#dp-12-top-pad)"/>
    <path d="M${tp(T_BUTT + 4, -T_PAD_HALF + 3)} L${tp(T_BUTT + 4, T_PAD_HALF - 3)}" stroke="${U.light}" stroke-width="0.6" fill="none" opacity="0.6"/>
    ${edge(T_PLATE_SHAPE, R.dark)}<path id="cheek-rest" d="${T_PLATE_SHAPE}" fill="url(#dp-12-top-plate)"/>
    <path d="M${tp(T_PLATE_RISE, -T_PLATE_HALF + 1)} L${tp(T_PLATE_RISE, T_PLATE_HALF - 1)}" stroke="${R.light}" stroke-width="0.6" fill="none" opacity="0.7"/>
  </g>
  <!-- The upper receiver, aluminum, its flat top lit -->
  <g id="receiver">
    ${edge(T_UPPER_SHAPE, A.dark)}<path d="${T_UPPER_SHAPE}" fill="url(#dp-12-top-upper)"/>
    <circle cx="${t1(sx(752))}" cy="${t1(-T_UPPER_HALF + 5)}" r="1.8" fill="${A.dark}"/>
    <circle cx="${t1(sx(752))}" cy="${t1(T_UPPER_HALF - 5)}" r="1.8" fill="${A.dark}"/>
  </g>
  <!-- The top rail over everything: its slots across between the teeth -->
  <g id="rail">
    ${edge(T_RAIL_SHAPE, R.dark)}<path d="${T_RAIL_SHAPE}" fill="url(#dp-12-top-rail)"/>
    <path d="${T_RAIL_SLOTS}" fill="${mix(R.dark, R.base, 0.6)}"/>
  </g>
</svg>
`;
}

const TOP: TopView<Dp12Options> = {
  draw: drawTop,
};

// ---------------------------------------------------------------------------------------------------------
// The gun

export const DP_12: GunDrawing<Dp12Options> = {
  name: "dp-12",
  photo: {
    file: "dp-12.png",
    width: 2025,
    height: 672,
    about:
      "A DP-12 from its right side, muzzle to the right, on white with a soft gray halo, evenly lit (dp-12.webp converted to PNG)",
  },
  otherPhotos: [
    {
      file: "dp-12-alternate.png",
      width: 600,
      height: 413,
      about:
        "A DP-12 from the front right, three-quarters: the two barrels side by side, the magazine caps under them, the rail over them",
    },
    {
      file: "dp-12-muzzle.png",
      width: 550,
      height: 550,
      about:
        "The DP-12's front close up: the end cap, the two muzzle devices side by side, the two knurled magazine caps, the pump's front block",
    },
  ],
  scale: { origin: ORIGIN, mmPerPixel: MM_PER_PX },
  frame: {
    // The rail's teeth, the pistol grip's base, the butt pad, the muzzle
    top: TOOTH_TOP,
    bottom: 614,
    back: BUTT,
    front: MUZZLE,
    side: 790,
    pixels: 512,
  },
  comment: `
  <!-- The Standard Manufacturing DP-12 from its right side, muzzle to the right: a bullpup double-barrel pump
       shotgun. The butt pad and stock with the loading ports in its belly, the pistol grip and trigger, the upper
       receiver, the pump with its vertical grip, the near barrel in the gap the pump closes, the end cap, the
       muzzle device and the top rail. Millimeters, with the origin on the gun's middle on the bore, as the guns'
       top views in weapons/guns/art/ have it. -->`,
  drawSide,
  top: TOP,
};
