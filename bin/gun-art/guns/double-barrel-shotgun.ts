/**
 * A sawn-off side-by-side shotgun from its right side, cut from a coach gun with exposed hammers: blued barrels and
 * steel, a brass lock plate (the photo's is case-hardened; Simon chose brass), walnut. Drawn in the pixels of its photo (2200 by 1650) by named numbers,
 * following the gun-art skill (.claude/skills/gun-art/SKILL.md), with guns/m1911.ts as the worked example. A draft
 * until it goes into the game.
 *
 * ## Dimensions (the scale)
 *
 * The photographed gun is a hammer coach gun of the Cimarron 1878 kind (12 gauge, exposed "rabbit ear" side
 * hammers, two triggers, a semi-pistol grip stock, a splinter forend with a schnabel tip, 20" cylinder bored
 * barrels, case-hardened locks; dealers list it at 36" overall, one at 37").
 * - Barrels 20" = 508 mm, from the breech face (where the barrels meet the fences, x 937) to the muzzle (x 2196):
 *   1259 px, so 0.4035 mm a pixel. That's the scale.
 * - Check: the barrel at the muzzle is 50 px tall (y 650 to 700) = 20.2 mm, a 12 gauge barrel's outside diameter
 *   at the muzzle (a 0.729" bore and thin walls: about 0.8"). The two agree.
 * - The whole gun in the photo is 2194 px (the butt's heel at x 2 to the muzzle) = 885 mm = 34.9", short of the
 *   36" the dealers list: this one's stock is a little short (or the listings round up). We trust the barrels.
 * - Cut down: barrels of BARREL_INCHES (12") = 305 mm = 755 px, so the muzzle is at x 1692; the forend is cut back
 *   to FOREND_SHORT (50 mm) behind the muzzle. With the full stock the gun is 682 mm (26.8") long; with the stock
 *   cut to a pistol grip, 485 mm (19.1").
 * - The bore's axis is level at y 674 (the barrels are y 642 to 706 at the breech, 645.5 to 703 at the cut).
 *
 * ## Construction
 *
 * Parts, back to front in drawing order, and how they sit:
 *
 * - STOCK: one piece of walnut from the butt to the action, its head inletted round the lock plate and the
 *   action. Straight comb, a comb nose dropping into the wrist, a semi-pistol grip (the knob under the wrist), the
 *   wrist rising to the top tang. Its front is hidden under the lock plate and the action; round the plate's back
 *   the wood stands up as a raised border (a lit line). The butt is plain wood (no plate in the photo). The
 *   pistol-grip option cuts it behind the grip: a sawn face of end grain, rounded off.
 * - ACTION (blued): the fences (the rounded standing breech behind the barrels, which the hammers strike), the top
 *   tang running back along the top of the wrist, the bar under the barrels forward to the knuckle, and its
 *   underside, the strip under the lock plate down to where the trigger guard attaches. The bar's sides are mostly
 *   hidden under the lock plate (a bar-action lock: its plate reaches forward along the bar).
 * - FOREND IRON (blued): under the barrels at the knuckle, seen in the forend's concave back.
 * - LOCK PLATE (brass), flush in the stock, on the action's side: a long round-ended plate, high under the
 *   hammer and narrow along the bar; screws and the hammer's pivot (the tumbler) on it.
 * - HAMMERS (blued steel, or the plate's brass), outside the plate, pivoting on the tumbler, down (at rest), their noses on the
 *   strikers in the fences, the spurs curling up and back. The left one is behind the right, seen beside it as the
 *   photo has it (its spur lower and further back): the gap between the spurs is a hole.
 * - TOP LEVER (blued) on the top tang, its thumbpiece a knob standing up at its back.
 * - TRIGGER GUARD (blued): a loop of flat steel from the action's underside to the wood, an open bow: its opening
 *   is a hole. The two TRIGGERS (front for the right barrel) hang from the trigger plate, crescents, through it.
 * - BARRELS (blued): two round tubes side by side, so one from the side, with the concave rib between them on top
 *   (its lit lip just under the top edge). Polished, so banded like a round barrel: sky above its middle, the
 *   horizon's dark band below, the floor's gray under it. Cut square at the muzzle (sawn steel catching the light).
 * - FOREND (walnut): under the barrels, wrapping up their sides, so it covers their lower part: its back concave
 *   round the knuckle, its top rising to cover the barrels, its front a rounded schnabel tip.
 */
import type { Point } from "../lib/geometry";
import { arc, fixed, fmt, smoothCurve, unit } from "../lib/geometry";
import type { GunDrawing, TopView } from "../lib/gun";
import { generatedNote } from "../lib/gun";
import type { Material } from "../lib/style";
import { BLUED_STEEL, WALNUT } from "../lib/style";

/**
 * Brass for the lock plate (Simon: all brass, bright, no color wash). Shaded only as a metal plate is: lit along
 * its top edge, a soft gradient down its face, darker along its lower edge. `dark` is for engraving and the
 * outline: a darker brass, never near-black.
 */
/** Polished yellow brass, bright */
export const BRASS: Material = {
  base: "#d9b958",
  dark: "#9c7a2a",
  light: "#ecd585",
  highlight: "#fcf1c6",
};

/** Warmer, a little aged: more golden than yellow, still light */
export const AGED_BRASS: Material = {
  base: "#cc9f45",
  dark: "#8d6624",
  light: "#e2bc69",
  highlight: "#f5dc9c",
};

/** AGED_BRASS deeper and more golden (Simon's direction: B2, in a more golden, somewhat aged brass) */
export const GOLDEN_BRASS: Material = {
  base: "#c99335",
  dark: "#845c1c",
  light: "#e0b25a",
  highlight: "#f3d58e",
};

/** Antique: golden, a touch browner and less contrasty, still light */
export const ANTIQUE_BRASS: Material = {
  base: "#c19651",
  dark: "#8a6833",
  light: "#d4ae6d",
  highlight: "#e7cd96",
};

/** Satin: the polished brass with less contrast between its lit and shaded parts */
export const SATIN_BRASS: Material = {
  base: "#d3b665",
  dark: "#a58841",
  light: "#e0c97f",
  highlight: "#ecdca6",
};

/** Engraving inset round the plate's edge: none, one line, or two parallel lines */
export type PlateBorder = "none" | "single" | "double";

export interface DoubleBarrelOptions {
  /** How long the barrels are cut to, in inches (12) */
  barrelInches?: number;
  /** How far the forend ends behind the muzzle, in mm (50) */
  forendShort?: number;
  /** The whole stock as photographed, or cut down to a pistol grip */
  stock?: "full" | "pistol";
  /** The barrels and the action */
  steel?: Partial<Material>;
  wood?: Partial<Material>;
  /** The lock plate: brass (default) or blued like the action */
  plate?: "brass" | "blued";
  brass?: Partial<Material>;
  /** Engraving inset round the plate's edge ("single" by default) */
  border?: PlateBorder;
  /** An engraved ring round the tail screw (with a border, by default) */
  ring?: boolean;
  /** The hammers (and the tumbler's boss): the plate's own metal (default), or dark blued steel */
  hammerFinish?: "steel" | "plate";
  /** The sawn muzzle's bright steel, or null for none */
  sawn?: string | null;
  /** A thin outline round the silhouette, in each part's own dark (the set's rule; default true) */
  outline?: boolean;
  /** The lit line along the barrels', fences' and tang's tops, in px (0.8 mm) */
  rimLight?: number;
  /** The hammers down on the strikers (at rest), or cocked */
  hammers?: "down" | "cocked";
}

// ---------------------------------------------------------------------------------------------------------
// The scale's numbers, in the photo's pixels
const BREECH = 937; // the barrels' breech face, against the fences
const PHOTO_MUZZLE = 2196; // the 20" barrels' muzzle, as photographed
const PHOTO_BARREL_MM = 20 * 25.4;
const MM_PER_PX = PHOTO_BARREL_MM / (PHOTO_MUZZLE - BREECH);
const mm = (v: number) => v / MM_PER_PX; // millimeters to pixels
const BARREL_INCHES = 12;
const FOREND_SHORT = 50;
const BORE_Y = 674;
const BUTT_HEEL_X = 2;

/** Where the muzzle is with barrels cut to `inches` */
const muzzleAt = (inches: number) => BREECH + mm(inches * 25.4);
const MUZZLE = muzzleAt(BARREL_INCHES);

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

function gradient(
  id: string,
  from: Point,
  to: Point,
  stops: [number, string, number?][],
): string {
  return [
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f1(from[0])}" y1="${f1(from[1])}" x2="${f1(to[0])}" y2="${f1(to[1])}">`,
    ...stops.map(
      ([o, c, a]) =>
        `      <stop offset="${o}" stop-color="${c}"${a === undefined ? "" : ` stop-opacity="${a}"`}/>`,
    ),
    "    </linearGradient>",
  ].join("\n");
}

/** A path along `points`, from wherever the path is, leaving and arriving along the way the points go */
function through(points: readonly Point[]): string {
  const n = points.length;
  const d0: Point = [points[1][0] - points[0][0], points[1][1] - points[0][1]];
  const d1: Point = [
    points[n - 1][0] - points[n - 2][0],
    points[n - 1][1] - points[n - 2][1],
  ];
  return smoothCurve(points, d0, d1);
}

/**
 * A tapering band along a centerline (a hammer's spur, a trigger): `w0` wide at its first point to `w1` at its
 * last, with a round end there
 */
function band(points: readonly Point[], w0: number, w1: number): string {
  const n = points.length;
  const normals = points.map((p, i) => {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(n - 1, i + 1)];
    const [ux, uy] = unit([b[0] - a[0], b[1] - a[1]]);
    return [-uy, ux] as Point;
  });
  const half = (i: number) => (w0 + ((w1 - w0) * i) / (n - 1)) / 2;
  const left = points.map(
    (p, i) =>
      [p[0] + normals[i][0] * half(i), p[1] + normals[i][1] * half(i)] as Point,
  );
  const right = points
    .map(
      (p, i) =>
        [
          p[0] - normals[i][0] * half(i),
          p[1] - normals[i][1] * half(i),
        ] as Point,
    )
    .reverse();
  const end = points[n - 1];
  const a = Math.atan2(normals[n - 1][1], normals[n - 1][0]) * (180 / Math.PI);
  return (
    `M${fmt(left[0])} ${through(left)} ${arc(end, half(n - 1), a, a - 180)} ` +
    `L${fmt(right[0])} ${through(right)} Z`
  );
}

// ---------------------------------------------------------------------------------------------------------
// The barrels: their top and bottom edges, nearly parallel (a little taper toward the muzzle)
const BARREL_TOP_BREECH = 642;
const BARREL_BOTTOM_BREECH = 706;
const TAPER = 3 / 755; // each edge closes in this much per px along
const barrelTop = (x: number) => BARREL_TOP_BREECH + (x - BREECH) * TAPER;
const barrelBottom = (x: number) => BARREL_BOTTOM_BREECH - (x - BREECH) * TAPER;

function barrel(muzzle: number): string {
  return (
    `M${BREECH},${BARREL_TOP_BREECH} L${f1(muzzle)},${f1(barrelTop(muzzle))} ` +
    `L${f1(muzzle)},${f1(barrelBottom(muzzle))} L${BREECH},${BARREL_BOTTOM_BREECH} Z`
  );
}

// ---------------------------------------------------------------------------------------------------------
// The stock. Its outline, measured round the photo (`measure runs`), from the top tang back along the wrist and
// the comb, down the butt, forward along the bottom, round the pistol grip's knob, and up the grip's front to the
// trigger guard's tang. Its head is under the action and the lock plate.
const TANG_BACK: Point = [700, 701]; // where the top tang ends on the wrist
const WRIST_TOP: Point[] = [
  [868, 666],
  [800, 683],
  [760, 692],
  TANG_BACK,
  [680, 714],
  [640, 729],
  [600, 744],
  [575, 752],
  [555, 755],
  [535, 749],
  [515, 736],
  [495, 728],
  [470, 726],
];
const COMB_BACK: Point = [40, 752];
const HEEL: Point = [BUTT_HEEL_X, 756];
const TOE: Point = [30, 1032];
const STOCK_BOTTOM_FRONT: Point = [478, 874]; // where the bottom line meets the pistol grip's knob
const GRIP_FRONT: Point[] = [
  STOCK_BOTTOM_FRONT,
  [495, 890],
  [515, 906],
  [540, 912],
  [562, 907],
  [582, 893],
  [602, 868],
  [622, 845],
  [645, 826],
  [672, 812],
  [700, 804],
  [722, 799],
];
// The wood's bottom from the guard's tang forward to the action, where the guard's front attaches
const WOOD_BOTTOM_FRONT: Point = [868, 777];
// The stock's head, hidden under the lock plate and the action
const HEAD = `L${fmt(WOOD_BOTTOM_FRONT)} L880,760 L880,700 L${fmt(WRIST_TOP[0])} Z`;

const FULL_STOCK =
  `M${fmt(WRIST_TOP[0])} ${through(WRIST_TOP)} L${fmt(COMB_BACK)} ` +
  `C24,752 10,754 ${fmt(HEEL)} L${fmt(TOE)} L${fmt(STOCK_BOTTOM_FRONT)} ` +
  `${through(GRIP_FRONT)} ${HEAD}`;

// Cut down to a pistol grip: sawn off just behind the comb nose, and rounded off: one curve from the wrist's top
// over the cut and down the back of the grip to its knob
const PISTOL_BACK: Point[] = [
  [532, 750],
  [508, 757],
  [493, 780],
  [487, 815],
  [491, 852],
  [504, 884],
  [522, 904],
  [540, 912],
];
const PISTOL_WRIST = WRIST_TOP.slice(0, 9); // to the bottom of the dip behind the comb nose
const PISTOL_STOCK =
  `M${fmt(WRIST_TOP[0])} ${through([...PISTOL_WRIST, ...PISTOL_BACK])} ` +
  `${through(GRIP_FRONT.slice(3))} ${HEAD}`;
const PISTOL_CUT = `M${fmt(PISTOL_BACK[0])} ${through(PISTOL_BACK)}`;

// The lit top of the stock and the shaded bottom (strokes along the edges, clipped to the wood): it's round in
// section, lit from above
const STOCK_TOP_EDGE = `M${fmt(WRIST_TOP[0])} ${through(WRIST_TOP)} L${fmt(COMB_BACK)} C24,752 10,754 ${fmt(HEEL)}`;
const STOCK_BOTTOM_EDGE = `M${fmt(TOE)} L${fmt(STOCK_BOTTOM_FRONT)} ${through(GRIP_FRONT)}`;
const PISTOL_TOP_EDGE = `M${fmt(WRIST_TOP[0])} ${through(PISTOL_WRIST)}`;
const PISTOL_BOTTOM_EDGE = `M${fmt(GRIP_FRONT[3])} ${through(GRIP_FRONT.slice(3))}`;

// ---------------------------------------------------------------------------------------------------------
// The action: the fences (round, behind the barrels' breech), the top tang back along the wrist, the bar under the
// barrels to the knuckle, and the strip under the lock plate down to the guard's front
const FENCE_TOP: Point = [BREECH, 640];
const KNUCKLE_X = 1112; // under the forend's back
const ACTION =
  `M${fmt(TANG_BACK)} L${fmt(WRIST_TOP[0])} C882,656 905,644 ${fmt(FENCE_TOP)} ` +
  `L${BREECH},${BARREL_BOTTOM_BREECH} L1092,${BARREL_BOTTOM_BREECH} ` +
  `C1101,708 ${KNUCKLE_X},722 ${KNUCKLE_X},735 C${KNUCKLE_X},745 1108,752 1104,757 ` +
  `L1040,762 L${fmt(WOOD_BOTTOM_FRONT)} L872,765 L880,698 L862,674 L${fmt([TANG_BACK[0], TANG_BACK[1] + 8])} Z`;
// The top tang, lit along the wrist's top
const TANG_TOP = `M${fmt(TANG_BACK)} L${fmt(WRIST_TOP[0])}`;
const FENCE_RIM = `M${fmt(WRIST_TOP[0])} C882,656 905,644 ${fmt(FENCE_TOP)}`;
// The fence's ball, catching the light round its top
const FENCE_CENTER: Point = [910, 676];
// Under the barrels at the knuckle, in the forend's concave back
const FOREND_IRON = "M1090,704 L1205,704 L1205,722 L1098,722 Z";

// The top lever, lying on the tang, and its thumbpiece standing up at its back
const TOP_LEVER =
  "M866,656 C850,659 830,663 812,667 C810,661 805,656 797,656 C786,656 780,664 781,671 " +
  "C782,678 790,682 799,680 C805,679 809,678 812,677 L868,666 Z";

// ---------------------------------------------------------------------------------------------------------
// The lock plate: round at both ends, high under the hammer, narrow along the bar
const PLATE_BACK: Point = [795, 740];
const PLATE_FRONT: Point = [1012, 740];
const PLATE_R = 18;
const PLATE_TOP: Point[] = [
  [PLATE_BACK[0], PLATE_BACK[1] - PLATE_R],
  [830, 707],
  [868, 699],
  [902, 698],
  [926, 711],
  [950, 721],
  [PLATE_FRONT[0], PLATE_FRONT[1] - PLATE_R],
];
const PLATE =
  `M${fmt(PLATE_TOP[0])} ${smoothCurve(PLATE_TOP, [1, -0.45], [1, 0])} ` +
  `${arc(PLATE_FRONT, PLATE_R, -90, 90)} L${PLATE_BACK[0]},${PLATE_BACK[1] + PLATE_R} ` +
  `${arc(PLATE_BACK, PLATE_R, 90, 270)} Z`;
// The wood's raised border round the plate's back, lit
const PLATE_BORDER =
  "M884,690 C850,690 805,697 784,712 C766,725 764,752 784,763 C800,770 840,770 868,769";
const TUMBLER: Point = [858, 728]; // the hammer's pivot on the plate
// The screws, placed clear of the border: one in the middle of the tail's round end, one behind the hammer, one
// down the middle of the bar
const PLATE_SCREWS: Point[] = [PLATE_BACK, [828, 731], [956, PLATE_FRONT[1]]];
// The engraved border: each line a cut (dark) with its lit lip (light) on the outside, inset round the plate's
// edge; a double border is two of them, BORDER_GAP apart, starting nearer the edge (DOUBLE_INSET) so the inner
// line clears the screws
const BORDER_INSET = 5;
const BORDER_LINE = 1.3;
const BORDER_GAP = 2;
const DOUBLE_INSET = 3;
// An engraved ring round the tail's screw, concentric with the tail and the border
const TAIL_RING = `M${fmt([PLATE_BACK[0] + 9.5, PLATE_BACK[1]])} ${arc(PLATE_BACK, 9.5, 0, 360)}`;

// ---------------------------------------------------------------------------------------------------------
// The hammers, down. One outline for the whole hammer: from the spur's tip down its front, over the head and
// round its nose (resting on the striker in the fence), back under the head, down the neck's front, round the body
// on the tumbler, up the neck's back and the spur's back to the tip, which is round. Checked against the main photo
// (where it is) and the percussion double (what a side hammer's body, neck, head and spur look like), simplified.
const HAMMER_POINTS: Point[] = [
  [866, 619], // the spur's tip, front side
  [872, 630],
  [876, 645],
  [878, 657], // the spur's root at the head's top
  [886, 659],
  [895, 661],
  [901, 667],
  [903, 676], // the nose
  [899, 685],
  [890, 689], // under the head
  [881, 694],
  [875, 704], // the neck's front
  [872, 716],
  [872, 728], // the body, round the tumbler
  [867, 739],
  [858, 743],
  [849, 739],
  [844, 728],
  [846, 715],
  [851, 702], // the neck's back
  [857, 690],
  [862, 678], // the head's back
  [866, 666],
  [868, 652], // the spur's back
  [866, 638],
  [861, 627],
  [858, 620], // the tip, back side
];
const SPUR_TIP: Point = [862, 619.5];
const HAMMER =
  `M${fmt(HAMMER_POINTS[0])} ${smoothCurve(HAMMER_POINTS, [0.5, 1], [-0.4, -1])} ` +
  `${arc(SPUR_TIP, 4, 180, 360)} Z`;
// Lit along the spur's front and over the head to the nose; shadowed down the neck's back and under the body
const HAMMER_LIT = `M${fmt(HAMMER_POINTS[1])} ${through(HAMMER_POINTS.slice(1, 9))}`;
const HAMMER_SHADE = `M${fmt(HAMMER_POINTS[13])} ${through(HAMMER_POINTS.slice(13, 22))}`;
// The thumb pad's checkering: short lines across the spur near its tip
const SPUR_AXIS: Point[] = [
  [870, 640],
  [868, 635],
  [866, 630],
  [864, 626],
];
const CHECKERING = SPUR_AXIS.map(([x, y]) => {
  const [ux, uy] = unit([-0.45, -1]);
  const [nx, ny] = [-uy, ux];
  return `M${f1(x - nx * 3.6)},${f1(y - ny * 3.6)} L${f1(x + nx * 3.6)},${f1(y + ny * 3.6)}`;
}).join(" ");
const FAR_HAMMER: Point = [-12, 18]; // how far the left hammer is from the right one in the photo

const shiftPath = (d: string, [dx, dy]: Point) =>
  d.replace(
    /(-?[\d.]+),(-?[\d.]+)/g,
    (_m, a: string, b: string) =>
      `${f1(parseFloat(a) + dx)},${f1(parseFloat(b) + dy)}`,
  );

// Cocked, each hammer is turned back about its tumbler by this much (degrees, counterclockwise as seen): its nose
// lifts off the striker and the spur leans back over the top lever. A first guess at the real throw.
const HAMMER_COCK = -30;

/** Every point of a path turned `degrees` about `center` (clockwise as seen) */
function turnPath(d: string, center: Point, degrees: number): string {
  if (degrees === 0) {
    return d;
  }
  const a = (degrees * Math.PI) / 180;
  const [cos, sin] = [Math.cos(a), Math.sin(a)];
  return d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_m, sx: string, sy: string) => {
    const x = parseFloat(sx) - center[0];
    const y = parseFloat(sy) - center[1];
    return `${f1(center[0] + x * cos - y * sin)},${f1(center[1] + x * sin + y * cos)}`;
  });
}

// The strikers in the fence, under the hammers' noses (seen when they're cocked)
const STRIKER: Point = [897, 677];

// ---------------------------------------------------------------------------------------------------------
// The trigger guard: a bow of flat steel from the action's underside back to the wood (its centerline, stroked
// GUARD_WIDTH wide), and the two triggers through it
const GUARD: Point[] = [
  [870, 776],
  [877, 796],
  [871, 818],
  [848, 835],
  [810, 843],
  [770, 839],
  [748, 826],
  [736, 812],
  [726, 803],
];
const GUARD_WIDTH = 5.5;
const GUARD_PATH = `M${fmt(GUARD[0])} ${smoothCurve(GUARD, [0.3, 1], [-0.9, -0.5])}`;
const FRONT_TRIGGER: Point[] = [
  [836, 777],
  [824, 791],
  [817, 808],
  [818, 824],
  [826, 837],
];
const REAR_TRIGGER: Point[] = [
  [772, 787],
  [759, 799],
  [750, 813],
  [748, 826],
  [752, 836],
];
const TRIGGERS = `${band(FRONT_TRIGGER, 6, 3)} ${band(REAR_TRIGGER, 6, 3)}`;

// ---------------------------------------------------------------------------------------------------------
// The forend: its back concave round the knuckle, its top rising over the barrels' lower half, then straight
// (falling a little) to the schnabel at its front; its bottom rising toward the front
const FOREND_BACK_TOP: Point = [1101, 711];
const FOREND_RISE: Point = [1190, 684]; // where its top has risen over the barrels
const forendTop = (x: number) =>
  684 + ((x - 1190) * (705 - 684)) / (1620 - 1190);
const forendBottom = (x: number) =>
  756 + ((x - 1110) * (727 - 756)) / (1620 - 1110);

function forend(front: number): string {
  const top = forendTop(front - 22);
  const bottom = forendBottom(front);
  return (
    `M${fmt(FOREND_BACK_TOP)} C1130,712 1160,700 ${fmt(FOREND_RISE)} ` +
    `L${f1(front - 22)},${f1(top)} C${f1(front - 8)},${f1(top + 1)} ${f1(front)},${f1(top + 8)} ${f1(front)},${f1(top + 15)} ` +
    `C${f1(front)},${f1(bottom - 4)} ${f1(front - 2)},${f1(bottom + 2)} ${f1(front - 8)},${f1(bottom + 3)} ` +
    `C${f1(front - 14)},${f1(bottom + 3)} ${f1(front - 18)},${f1(bottom)} ${f1(front - 26)},${f1(forendBottom(front - 26))} ` +
    `L1112,${f1(forendBottom(1112))} C1112,744 1110,725 ${fmt(FOREND_BACK_TOP)} Z`
  );
}
// Where the forend's raised front part starts, a soft edge down its side
const FOREND_STEP = "M1188,686 C1192,700 1193,725 1189,748";

// ---------------------------------------------------------------------------------------------------------

const OUTLINE = 0.4 / MM_PER_PX;
const RIM_LIGHT = mm(0.8);

/** The gun's materials from its options, the same for both views: steel, wood, the lock plate's metal, the hammers' */
function materials(options: DoubleBarrelOptions): {
  S: Material;
  W: Material;
  P: Material;
  H: Material;
} {
  const S: Material = { ...BLUED_STEEL, ...options.steel };
  const W: Material = { ...WALNUT, ...options.wood };
  const P: Material =
    options.plate === "blued" ? S : { ...GOLDEN_BRASS, ...options.brass };
  const H: Material = options.hammerFinish === "steel" ? S : P;
  return { S, W, P, H };
}

function drawSide(options: DoubleBarrelOptions = {}): string {
  const { S, W, P, H } = materials(options);
  const border: PlateBorder = options.border ?? "single";
  const ring = options.ring ?? border === "single"; // a double border leaves no room for it
  // The border's bands, from the plate's edge in: [how far in each ends, its paint]
  const face = "url(#double-barrel-shotgun-plate)";
  const line = (at: number): [number, string][] => [
    [at, face],
    [at + BORDER_LINE, P.highlight],
    [at + 2 * BORDER_LINE, P.dark],
  ];
  const bands: [number, string][] =
    border === "none"
      ? []
      : border === "single"
        ? line(BORDER_INSET)
        : [
            ...line(DOUBLE_INSET),
            ...line(DOUBLE_INSET + 2 * BORDER_LINE + BORDER_GAP),
          ];
  const muzzle = muzzleAt(options.barrelInches ?? BARREL_INCHES);
  const forendFront = muzzle - mm(options.forendShort ?? FOREND_SHORT);
  const pistol = options.stock === "pistol";
  const stock = pistol ? PISTOL_STOCK : FULL_STOCK;
  const BARREL = barrel(muzzle);
  const FOREND = forend(forendFront);
  const turn = options.hammers === "cocked" ? HAMMER_COCK : 0;
  const PIVOT_FAR: Point = [
    TUMBLER[0] + FAR_HAMMER[0],
    TUMBLER[1] + FAR_HAMMER[1],
  ];
  const hammerPath = (d: string) => turnPath(d, TUMBLER, turn);
  const HAMMER_SHAPE = hammerPath(HAMMER);
  const FAR = turnPath(shiftPath(HAMMER, FAR_HAMMER), PIVOT_FAR, turn);
  const rim = options.rimLight ?? RIM_LIGHT;
  const sawn = options.sawn === undefined ? S.highlight : options.sawn;
  const top = barrelTop(muzzle);
  const bottom = barrelBottom(muzzle);

  const outlines =
    options.outline === false
      ? ""
      : `<!-- The outline: each part's shape stroked under everything, so only its outer half shows -->
  <g id="double-barrel-shotgun-outline" fill="none" stroke-width="${f1(OUTLINE * 2)}">
    <path d="${stock}" stroke="${W.dark}"/>
    <path d="${FOREND}" stroke="${W.dark}"/>
    <path d="${ACTION}" stroke="${S.dark}"/>
    <path d="${BARREL}" stroke="${S.dark}"/>
    <path d="${TOP_LEVER}" stroke="${S.dark}"/>
    <path d="${FAR}" stroke="${H.dark}"/>
    <path d="${HAMMER_SHAPE}" stroke="${H.dark}"/>
    <path d="${TRIGGERS}" stroke="${S.dark}"/>
    <path d="${GUARD_PATH}" stroke="${S.dark}" stroke-width="${f1(GUARD_WIDTH + OUTLINE * 2)}"/>
  </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="1650" viewBox="0 0 2200 1650" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  <defs>
    <!-- Round, polished barrels: the rib's edge and its lit lip, a dark line, the sky's band above the middle,
         the horizon's dark band below it, and the floor's gray under that -->
    ${gradient(
      "double-barrel-shotgun-barrel",
      [1300, BARREL_TOP_BREECH],
      [1300, BARREL_BOTTOM_BREECH],
      [
        [0, S.dark],
        [0.05, mix(S.base, S.light, 0.5)],
        [0.1, S.highlight],
        [0.15, S.dark],
        [0.2, S.dark],
        [0.25, S.highlight],
        [0.36, mix(S.highlight, "#ffffff", 0.4)],
        [0.5, S.light],
        [0.55, S.dark],
        [0.68, S.dark],
        [0.74, S.base],
        [0.92, S.base],
        [1, S.dark],
      ],
    )}
    ${gradient(
      "double-barrel-shotgun-action",
      [0, 640],
      [0, 776],
      [
        [0, S.light],
        [0.2, S.base],
        [0.6, mix(S.base, S.dark, 0.4)],
        [1, S.dark],
      ],
    )}
    <radialGradient id="double-barrel-shotgun-fence" gradientUnits="userSpaceOnUse" cx="${FENCE_CENTER[0]}" cy="${FENCE_CENTER[1]}" r="34">
      <stop offset="0" stop-color="${S.dark}"/>
      <stop offset="0.7" stop-color="${S.base}"/>
      <stop offset="0.9" stop-color="${S.light}"/>
      <stop offset="1" stop-color="${S.base}"/>
    </radialGradient>
    <!-- The plate's face, down it (its own axis is along the gun): lit toward its top, darker toward its bottom -->
    ${gradient(
      "double-barrel-shotgun-plate",
      [0, 698],
      [0, 758],
      [
        [0, P.light],
        [0.45, P.base],
        [1, mix(P.base, P.dark, 0.35)],
      ],
    )}
    <!-- Its beveled edge: lit along the top, shadowed along the bottom -->
    ${gradient(
      "double-barrel-shotgun-plate-bevel",
      [0, 698],
      [0, 758],
      [
        [0, P.highlight],
        [0.45, P.light],
        [1, P.dark],
      ],
    )}
    <!-- The hammer, across its own axis (the neck's): its back dark, lit toward its front -->
    ${gradient(
      "double-barrel-shotgun-hammer",
      [845, 0],
      [903, 0],
      [
        [0, mix(H.base, H.dark, 0.5)],
        [0.3, H.base],
        [0.65, H.light],
        [1, H.base],
      ],
    )}
    ${gradient(
      "double-barrel-shotgun-forend",
      [0, 684],
      [0, 756],
      [
        [0, W.base],
        [0.15, W.light],
        [0.45, mix(W.light, W.base, 0.5)],
        [0.85, W.base],
        [1, mix(W.base, W.dark, 0.5)],
      ],
    )}
    ${gradient(
      "double-barrel-shotgun-stock",
      [0, 700],
      [0, 1032],
      [
        [0, W.light],
        [0.25, mix(W.base, W.light, 0.55)],
        [0.7, mix(W.base, W.light, 0.25)],
        [1, W.base],
      ],
    )}
    <clipPath id="double-barrel-shotgun-stock-clip"><path d="${stock}"/></clipPath>
    <clipPath id="double-barrel-shotgun-barrel-clip"><path d="${BARREL}"/></clipPath>
    <clipPath id="double-barrel-shotgun-action-clip"><path d="${ACTION}"/></clipPath>
    <clipPath id="double-barrel-shotgun-plate-clip"><path d="${PLATE}"/></clipPath>
    <clipPath id="double-barrel-shotgun-hammer-clip"><path d="${HAMMER_SHAPE}"/></clipPath>
    <clipPath id="double-barrel-shotgun-forend-clip"><path d="${FOREND}"/></clipPath>
  </defs>
  ${outlines}
  <!-- The left hammer, on the far side: only its head and spur show over the action -->
  <g id="far-hammer">
    <path d="${FAR}" fill="${mix(H.base, H.dark, 0.35)}"/>
  </g>
  <!-- Walnut, round in section: lit along its top, shaded along its bottom -->
  <g id="stock" clip-path="url(#double-barrel-shotgun-stock-clip)">
    <path d="${stock}" fill="url(#double-barrel-shotgun-stock)"/>
    <g fill="none" stroke-linecap="round">
      <path d="${pistol ? PISTOL_TOP_EDGE : STOCK_TOP_EDGE}" stroke="${W.highlight}" stroke-width="16" opacity="0.6"/>
      <path d="${pistol ? PISTOL_BOTTOM_EDGE : STOCK_BOTTOM_EDGE}" stroke="${W.base}" stroke-width="40" opacity="0.6"/>
      <path d="${pistol ? PISTOL_BOTTOM_EDGE : STOCK_BOTTOM_EDGE}" stroke="${mix(W.base, W.dark, 0.5)}" stroke-width="16"/>
      ${pistol ? `<path d="${PISTOL_CUT}" stroke="${mix(W.light, W.highlight, 0.5)}" stroke-width="16"/>\n      <path d="${PISTOL_CUT}" stroke="${W.dark}" stroke-width="3" opacity="0.6"/>` : ""}
    </g>
    <!-- The wood's raised border round the lock plate's back -->
    <path d="${PLATE_BORDER}" stroke="${W.highlight}" stroke-width="3" fill="none"/>
  </g>
  <!-- The fences, the top tang, the bar to the knuckle and its underside -->
  <g id="action">
    <path d="${ACTION}" fill="url(#double-barrel-shotgun-action)"/>
    <circle cx="${FENCE_CENTER[0]}" cy="${FENCE_CENTER[1]}" r="34" fill="url(#double-barrel-shotgun-fence)" clip-path="url(#double-barrel-shotgun-action-clip)"/>
    <g clip-path="url(#double-barrel-shotgun-action-clip)" fill="none">
      <path d="${TANG_TOP}" stroke="${S.highlight}" stroke-width="${f1(rim * 2)}"/>
      <path d="${FENCE_RIM}" stroke="${S.highlight}" stroke-width="${f1(rim * 2)}"/>
    </g>
    <path d="${FOREND_IRON}" fill="${S.dark}"/>
  </g>
  <!-- Bright steel, stroked: the trigger guard's open bow, and the triggers through it -->
  <g id="triggers">
    <path d="${TRIGGERS}" fill="${S.base}"/>
  </g>
  <g id="trigger-guard">
    <path d="${GUARD_PATH}" stroke="${S.base}" stroke-width="${GUARD_WIDTH}" fill="none"/>
    <path d="${GUARD_PATH}" stroke="${S.light}" stroke-width="1.5" fill="none"/>
  </g>
  <!-- Brass, flush in the stock on the action's side: its face, its beveled edge, the engraved border (bands
       stroked from the widest in, each covering the edge up to where it ends) and the ring round the tail screw,
       and slotted screws brighter than the plate -->
  <g id="lock-plate">
    <path d="${PLATE}" fill="${face}"/>
    <g clip-path="url(#double-barrel-shotgun-plate-clip)" fill="none">
      ${[...bands]
        .reverse()
        .map(
          ([end, paint]) =>
            `<path d="${PLATE}" stroke="${paint}" stroke-width="${f1(2 * end)}"/>`,
        )
        .join("\n      ")}
      ${
        ring
          ? `<path d="${shiftPath(TAIL_RING, [0, BORDER_LINE])}" stroke="${P.dark}" stroke-width="${BORDER_LINE}"/>
      <path d="${TAIL_RING}" stroke="${P.highlight}" stroke-width="${BORDER_LINE}"/>`
          : ""
      }
      <path d="${PLATE}" stroke="url(#double-barrel-shotgun-plate-bevel)" stroke-width="5"/>
    </g>
    ${PLATE_SCREWS.map(
      ([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="5" fill="${P.highlight}" stroke="${P.dark}" stroke-width="1.2"/>\n    ` +
        `<path d="M${x - 3.6},${y + 1.2} L${x + 3.6},${y - 1.2}" stroke="${P.dark}" stroke-width="1.6" stroke-linecap="round"/>`,
    ).join("\n    ")}
  </g>
  <!-- On the top tang, its thumbpiece standing up at its back -->
  <g id="top-lever">
    <path d="${TOP_LEVER}" fill="${S.base}"/>
    <path d="M784,664 C788,658 796,656 802,658" stroke="${S.highlight}" stroke-width="2" fill="none"/>
  </g>
  <!-- The striker in the fence, under the hammer's nose -->
  <circle id="striker" cx="${STRIKER[0]}" cy="${STRIKER[1]}" r="5" fill="${S.light}" stroke="${S.dark}" stroke-width="1.5"/>
  <!-- The hammers, on the side of the gun, so over the top lever: the left one behind the right, its spur lower
       and further back -->
  <g id="hammers">
    <path d="${HAMMER_SHAPE}" fill="url(#double-barrel-shotgun-hammer)"/>
    <g clip-path="url(#double-barrel-shotgun-hammer-clip)" fill="none" stroke-linecap="round">
      <path d="${hammerPath(HAMMER_LIT)}" stroke="${H.highlight}" stroke-width="3.5"/>
      <path d="${hammerPath(HAMMER_SHADE)}" stroke="${H.dark}" stroke-width="5" opacity="0.6"/>
      <path d="${hammerPath(CHECKERING)}" stroke="${H.dark}" stroke-width="1.2"/>
    </g>
    <!-- A dark line all round it, so a brass hammer stands off the brass plate under it -->
    <path d="${HAMMER_SHAPE}" stroke="${H.dark}" stroke-width="2" fill="none"/>
    <!-- The tumbler's round boss, and the screw through it -->
    <circle cx="${TUMBLER[0]}" cy="${TUMBLER[1]}" r="8.5" fill="${H.base}" stroke="${H.dark}" stroke-width="1.2"/>
    <path d="${`M${f1(TUMBLER[0] - 6)},${f1(TUMBLER[1] - 2)} ${arc(TUMBLER, 6.3, 198, 290)}`}" stroke="${H.highlight}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <circle cx="${TUMBLER[0]}" cy="${TUMBLER[1]}" r="3.4" fill="${H.dark}"/>
  </g>
  <!-- Blued, polished, cut square: the sawn steel bright at the muzzle -->
  <g id="barrels">
    <path d="${BARREL}" fill="url(#double-barrel-shotgun-barrel)"/>
    <path d="M${BREECH},${BARREL_TOP_BREECH} L${f1(muzzle)},${f1(top)}" stroke="${S.highlight}" stroke-width="${f1(rim * 2)}" fill="none" clip-path="url(#double-barrel-shotgun-barrel-clip)"/>
    ${sawn ? `<path d="M${f1(muzzle - 2)},${f1(top)} L${f1(muzzle)},${f1(top)} L${f1(muzzle)},${f1(bottom)} L${f1(muzzle - 2)},${f1(bottom)} Z" fill="${sawn}"/>` : ""}
  </g>
  <!-- Walnut, wrapping up the barrels' sides -->
  <g id="forend">
    <path d="${FOREND}" fill="url(#double-barrel-shotgun-forend)"/>
    <path d="${FOREND_STEP}" stroke="${W.dark}" stroke-width="2" fill="none" opacity="0.5" clip-path="url(#double-barrel-shotgun-forend-clip)"/>
  </g>
</svg>
`;
}

// The gun's extent with the default barrels and the full stock: the right hammer's spur, the stock's toe, the
// butt's heel, the muzzle
const FRAME_BACK = BUTT_HEEL_X;
const FRAME_FRONT = Math.ceil(MUZZLE) + 1;

// ---------------------------------------------------------------------------------------------------------
// The top view: the gun as it's held, seen from above, muzzle along +x and its right side +y, in millimeters
// about its middle on the bore, at the same scale as the side view. Lengths along the gun are the side view's
// numbers (sx converts its photo's pixels); widths are the real gun's.
//
// Widths. There's no photo from above, and no spec sheet gives them, so they're a 12 gauge side-by-side's usual
// ones, checked against the side view's heights where it has them:
// - Barrels: two 12 gauge tubes touching, so the pair is twice one barrel's outside diameter: 25 mm at the breech
//   (the side view's 64 px less its rib) to 22.5 mm at the 12" cut (a 0.729" bore with walls thickening toward
//   the chamber), so 50 mm across at the breech, 45 at the muzzle. The concave rib lies in the valley between
//   them, 8 mm wide at the breech to 6 at the muzzle.
// - The action as wide as the barrels at the breech (50 mm); the fences swell out to it from the top tang (14 mm
//   wide, as on most doubles); the lock plates stand 1 mm proud of the stock's head either side.
// - The hammers stand outside the lock plates (about 7 mm thick), their noses reaching in over the fences to the
//   strikers above each bore (12.5 mm either side of the middle), their spurs flaring out to about 35 mm either
//   side ("rabbit ears").
// - The stock: 50 mm at its head (the action's width), 35 mm at the wrist, 40 mm along the comb and 43 at the
//   butt, as on a typical game gun's stock.
// - The forend wraps the barrels' lower halves, so from above it shows only as a millimeter of wood either side.
//
// What moves:
// - `barrels` (with the forend): broken open, they tip down on the hinge pin, which is at the front of the action's
//   bar (the side view's knuckle, x 1088 px: 97 mm) 27 mm under the bore. Tipped 37 degrees, the barrels look 0.8
//   as long from above, and their breech ends swing up and forward about 28 mm: so the game's stretch (0.8) is
//   about T_STRETCH_PIVOT (175 mm), not the hinge pin, which puts both the muzzle and the breech where they'd be.
//   Open, they uncover the action's bar (its flat top, the "water table", with the slot the barrels' lumps drop
//   into), and their breech ends show, tipped up toward us: the chambers with the shells' brass heads in them.
//   Those are drawn at the back of the barrels' group, under the fences while it's shut.
// - `top-lever`: it pivots on a spindle at its front end, just behind the fences (T_LEVER_PIVOT, 5 mm), and the
//   thumb swings its tail to the right (+y) to open the gun, about 35 degrees.

/** A length along the gun from the side view's pixels, in millimeters from the gun's middle */
const sx = (px: number) => (px - (FRAME_BACK + MUZZLE) / 2) * MM_PER_PX;

const T_BUTT = sx(FRAME_BACK);
const T_BREECH = sx(BREECH);
const T_FENCES = sx(862); // where the fences start swelling out from the top tang
const T_FENCES_FULL = 24; // where they're the action's full width
const T_TANG_BACK = sx(TANG_BACK[0]);
const T_TANG_HALF = 7;
const T_ACTION_HALF = 25;
const T_PLATE: [number, number] = [
  sx(PLATE_BACK[0] - PLATE_R),
  sx(PLATE_FRONT[0] + PLATE_R),
];
const T_KNUCKLE = sx(KNUCKLE_X - 8);
const T_STRETCH_PIVOT = 175;
const T_BREECH_OD = 25;
const T_MUZZLE_OD = 22.5;
const T_RIB_BREECH = 8;
const T_RIB_MUZZLE = 6;
const T_FOREND_BACK = sx(FOREND_BACK_TOP[0]);
const T_LEVER_PIVOT = sx(860);
const T_LEVER_TAIL = sx(781);
const T_THUMB_FRONT = sx(812);
// The stock's half width from above, back to front: [x, half]
const T_STOCK: [number, number][] = [
  [T_BUTT, 21.5],
  [sx(300), 20.5],
  [sx(480), 19.5],
  [sx(560), 17.5],
  [sx(640), 18],
  [sx(700), 20],
  [sx(760), 23.5],
  [sx(800), 25],
  [T_BREECH, 25], // under the action and lock plates
];
const T_PISTOL_BACK = sx(486);

const t1 = (v: number) =>
  fixed(v, 2).replace(/0+$/, "").replace(/\.$/, "").replace(/^-0$/, "0");
const tp = (x: number, y: number) => `${t1(x)},${t1(y)}`;
const tpt = ([x, y]: Point) => tp(x, y);

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

/** A gradient across the gun (along y), from y0 to y1 */
function acrossTop(
  id: string,
  y0: number,
  y1: number,
  list: [number, string][],
): string {
  return [
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${t1(y0)}" x2="0" y2="${t1(y1)}">`,
    ...list.map(([o, c]) => `      <stop offset="${o}" stop-color="${c}"/>`),
    "    </linearGradient>",
  ].join("\n    ");
}

/** A smooth outline through points in millimeters, from the first, mirrored for the left side if `mirror` */
function smoothTop(
  points: readonly Point[],
  startDir: Point,
  endDir: Point,
): string {
  // smoothCurve writes to a tenth of a millimeter, plenty for these
  return smoothCurve(points, startDir, endDir);
}

const mirrorY = (points: readonly Point[]) =>
  points.map(([x, y]) => [x, -y] as Point).reverse();

/** The stock from above, back to its head under the action: the full stock or the pistol grip */
function topStock(pistol: boolean): string {
  const half = pistol
    ? T_STOCK.filter(([x]) => x > T_PISTOL_BACK + 8)
    : T_STOCK;
  const back = pistol ? T_PISTOL_BACK : T_BUTT;
  const backHalf = pistol ? 18 : T_STOCK[0][1];
  const right: Point[] = [
    [back + 6, backHalf],
    ...half.slice(pistol ? 0 : 1).map(([x, h]) => [x, h] as Point),
  ];
  const left = mirrorY(right);
  const r = pistol ? 10 : 4; // the pistol grip's cut is rounded off; the butt's corners just eased
  return (
    `M${tpt(left[left.length - 1])} ` +
    `C${tp(back + 6 - r * 0.6, -backHalf)} ${tp(back, -backHalf + r * 0.6)} ${tp(back, -backHalf + r)} ` +
    `L${tp(back, backHalf - r)} C${tp(back, backHalf - r * 0.6)} ${tp(back + 6 - r * 0.6, backHalf)} ${tpt(right[0])} ` +
    `${smoothTop(right, [1, 0], [1, 0])} L${tpt(left[0])} ${smoothTop(left, [-1, 0], [-1, 0])} Z`
  );
}

/** One barrel's outline from above, `side` 1 for the right, -1 the left: from the middle out, breech to muzzle */
function topBarrel(side: 1 | -1, muzzle: number): string {
  const back = T_BREECH;
  return (
    `M${tp(back, 0)} L${tp(muzzle, 0)} L${tp(muzzle, side * T_MUZZLE_OD)} ` +
    `L${tp(back, side * T_BREECH_OD)} Z`
  );
}

/** The action's top: the top tang along the wrist, swelling out over the fences to the action's full width */
function topAction(): string {
  const right: Point[] = [
    [T_FENCES, T_TANG_HALF],
    [T_FENCES + 6, 12],
    [T_FENCES + 12, 19.5],
    [T_FENCES_FULL, T_ACTION_HALF],
  ];
  const left = mirrorY(right);
  return (
    `M${tp(T_TANG_BACK, -T_TANG_HALF + 2)} C${tp(T_TANG_BACK, -T_TANG_HALF + 1)} ${tp(T_TANG_BACK + 1, -T_TANG_HALF)} ${tp(T_TANG_BACK + 2, -T_TANG_HALF)} ` +
    `L${tpt(left[left.length - 1])} ${smoothTop([...left].reverse(), [1, 0], [1, -0.2])} ` +
    `L${tp(T_BREECH, -T_ACTION_HALF)} L${tp(T_BREECH, T_ACTION_HALF)} L${tpt(right[right.length - 1])} ` +
    `${smoothTop([...right].reverse(), [-1, -0.2], [-1, 0])} ` +
    `L${tp(T_TANG_BACK + 2, T_TANG_HALF)} C${tp(T_TANG_BACK + 1, T_TANG_HALF)} ${tp(T_TANG_BACK, T_TANG_HALF - 1)} ${tp(T_TANG_BACK, T_TANG_HALF - 2)} Z`
  );
}

// The right hammer from above (the left is its mirror): its spur flaring out behind, the head over the side of the
// fence, and its nose reaching in to the striker over the bore
// fence, and its nose reaching in to the striker over the bore. A band along its centerline, from the nose (square,
// on the striker) to the spur's round tip; as thick as a hammer (about 6 mm), the head a little thicker.
const T_HAMMER: Point[] = [
  [21, 12.5],
  [22.5, 17],
  [20.5, 22],
  [16, 26],
  [11, 29.5],
  [6.5, 33],
];
const T_HAMMER_PAD: Point[] = [
  [8, 31.6],
  [9.6, 30.5],
  [11.2, 29.4],
];

function topHammer(side: 1 | -1): string {
  return band(
    T_HAMMER.map(([x, y]) => [x, side * y] as Point),
    7,
    5,
  );
}

/** The top lever: a spindle at its front, a tapering arm back along the tang, a round thumbpiece at its tail */
function topLever(): string {
  const p = T_LEVER_PIVOT;
  return (
    `M${tp(p, -5)} C${tp(p + 2.8, -5)} ${tp(p + 5, -2.8)} ${tp(p + 5, 0)} C${tp(p + 5, 2.8)} ${tp(p + 2.8, 5)} ${tp(p, 5)} ` +
    `L${tp(T_THUMB_FRONT, 4)} C${tp(T_THUMB_FRONT - 2, 6.5)} ${tp(T_LEVER_TAIL + 4, 8)} ${tp(T_LEVER_TAIL + 1, 6.5)} ` +
    `C${tp(T_LEVER_TAIL - 0.5, 4)} ${tp(T_LEVER_TAIL - 0.5, -4)} ${tp(T_LEVER_TAIL + 1, -6.5)} ` +
    `C${tp(T_LEVER_TAIL + 4, -8)} ${tp(T_THUMB_FRONT - 2, -6.5)} ${tp(T_THUMB_FRONT, -4)} Z`
  );
}

function drawTop(options: DoubleBarrelOptions = {}): string {
  const { S, W, P, H } = materials(options);
  const outline = options.outline !== false;
  const pistol = options.stock === "pistol";
  const muzzle = sx(muzzleAt(options.barrelInches ?? BARREL_INCHES));
  const forendFront = muzzle - (options.forendShort ?? FOREND_SHORT);
  const sawn = options.sawn === undefined ? S.highlight : options.sawn;
  const odAt = (x: number) =>
    T_BREECH_OD +
    ((T_MUZZLE_OD - T_BREECH_OD) * (x - T_BREECH)) / (muzzle - T_BREECH);
  const ribAt = (x: number) =>
    T_RIB_BREECH +
    ((T_RIB_MUZZLE - T_RIB_BREECH) * (x - T_BREECH)) / (muzzle - T_BREECH);
  const minX = (pistol ? T_PISTOL_BACK : T_BUTT) - 1;
  const maxX = muzzle + 1;
  const half = 37;
  const width = t1(maxX - minX);
  const height = t1(half * 2);
  const edge = (d: string, color: string) =>
    outline
      ? `<path d="${d}" stroke="${color}" stroke-width="${t1(OUTLINE_TOP * 2)}" fill="none"/>\n    `
      : "";
  const STOCK = topStock(pistol);
  const ACTION_TOP = topAction();
  const PAIR = `M${tp(T_BREECH, -T_BREECH_OD)} L${tp(muzzle, -odAt(muzzle))} L${tp(muzzle, odAt(muzzle))} L${tp(T_BREECH, T_BREECH_OD)} Z`;
  const FOREND_TOP =
    `M${tp(T_FOREND_BACK, -odAt(T_FOREND_BACK) - 1)} L${tp(forendFront - 6, -odAt(forendFront) - 1)} ` +
    `C${tp(forendFront - 2, -odAt(forendFront) - 1)} ${tp(forendFront, -odAt(forendFront) + 2)} ${tp(forendFront, -odAt(forendFront) + 5)} ` +
    `L${tp(forendFront, odAt(forendFront) - 5)} C${tp(forendFront, odAt(forendFront) - 2)} ${tp(forendFront - 2, odAt(forendFront) + 1)} ${tp(forendFront - 6, odAt(forendFront) + 1)} ` +
    `L${tp(T_FOREND_BACK, odAt(T_FOREND_BACK) + 1)} Z`;
  const RIB = `M${tp(T_BREECH, -ribAt(T_BREECH) / 2)} L${tp(muzzle, -ribAt(muzzle) / 2)} L${tp(muzzle, ribAt(muzzle) / 2)} L${tp(T_BREECH, ribAt(T_BREECH) / 2)} Z`;
  const BAR = tbox(
    T_BREECH - 2,
    -T_ACTION_HALF + 2,
    T_KNUCKLE,
    T_ACTION_HALF - 2,
    [0, 6, 6, 0],
  );
  const LUMP_SLOT = tbox(T_BREECH + 6, -6, T_KNUCKLE - 10, 6, 5);
  const plates = [-1, 1].map((side) =>
    tbox(
      T_PLATE[0],
      side < 0 ? -T_ACTION_HALF - 1 : T_ACTION_HALF - 1,
      T_PLATE[1],
      side < 0 ? -T_ACTION_HALF + 1 : T_ACTION_HALF + 1,
      1,
    ),
  );
  // The barrels' breech ends, tipped up toward us when it's open: each chamber with a shell's brass head in it
  const breechEnds = [-1, 1].map((side) => {
    const cy = (side * T_BREECH_OD) / 2;
    return `<ellipse cx="${t1(T_BREECH - 6)}" cy="${t1(cy)}" rx="6" ry="${t1(T_BREECH_OD / 2)}" fill="${S.base}" stroke="${S.dark}" stroke-width="${t1(OUTLINE_TOP)}"/>
      <ellipse cx="${t1(T_BREECH - 6)}" cy="${t1(cy)}" rx="5" ry="11" fill="${P.light}" stroke="${P.dark}" stroke-width="0.5"/>
      <ellipse cx="${t1(T_BREECH - 6)}" cy="${t1(cy)}" rx="1.6" ry="3" fill="${P.highlight}" stroke="${P.dark}" stroke-width="0.4"/>`;
  });
  const lever = topLever();
  const hammers = [-1, 1].map((side) => topHammer(side as 1 | -1));
  const pads = [-1, 1].flatMap((side) =>
    T_HAMMER_PAD.map(
      ([x, y]) =>
        `<path d="M${tp(x - 1.6, side * (y - 1.6))} L${tp(x + 1.6, side * (y + 1.6))}"/>`,
    ),
  );
  const sawnEnds = sawn
    ? `<path d="${tbox(muzzle - 1, -odAt(muzzle), muzzle, odAt(muzzle))}" fill="${sawn}"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${t1(minX)} ${t1(-half)} ${width} ${height}" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  ${generatedNote("double-barrel-shotgun")}
  <!-- The sawn-off double from above, as it's held: muzzle along +x, its right side down the page (+y), millimeters
       about its middle on the bore, at the same scale as its side view (the pickup); lengths along it are the side
       view's. Blued barrels and action, walnut, the hammers in the lock plates' golden brass; lit from above. -->
  <defs>
    ${acrossTop("double-barrel-shotgun-top-stock", -25, 25, [
      [0, W.dark],
      [0.12, W.base],
      [0.35, mix(W.base, W.light, 0.7)],
      [0.5, W.light],
      [0.65, mix(W.base, W.light, 0.7)],
      [0.88, W.base],
      [1, W.dark],
    ])}
    ${acrossTop("double-barrel-shotgun-top-forend", -26, 26, [
      [0, W.dark],
      [0.08, W.base],
      [0.5, W.light],
      [0.92, W.base],
      [1, W.dark],
    ])}
    ${acrossTop("double-barrel-shotgun-top-left-barrel", -T_BREECH_OD, 0, [
      [0, S.dark],
      [0.18, S.base],
      [0.42, S.light],
      [0.52, mix(S.highlight, "#ffffff", 0.3)],
      [0.62, S.light],
      [0.85, S.base],
      [1, S.dark],
    ])}
    ${acrossTop("double-barrel-shotgun-top-right-barrel", 0, T_BREECH_OD, [
      [0, S.dark],
      [0.15, S.base],
      [0.38, S.light],
      [0.48, mix(S.highlight, "#ffffff", 0.3)],
      [0.58, S.light],
      [0.82, S.base],
      [1, S.dark],
    ])}
    ${acrossTop(
      "double-barrel-shotgun-top-action",
      -T_ACTION_HALF,
      T_ACTION_HALF,
      [
        [0, S.dark],
        [0.15, S.base],
        [0.5, S.light],
        [0.85, S.base],
        [1, S.dark],
      ],
    )}
    ${acrossTop("double-barrel-shotgun-top-lever", -8, 8, [
      [0, S.base],
      [0.5, S.highlight],
      [1, S.base],
    ])}
    ${acrossTop("double-barrel-shotgun-top-hammer", -36, 36, [
      [0, H.dark],
      [0.15, H.base],
      [0.3, H.light],
      [0.5, H.base],
      [0.7, H.light],
      [0.85, H.base],
      [1, H.dark],
    ])}
  </defs>
  <!-- Walnut: the butt, the comb, the wrist, and the head round the action, with the lock plates' top edges at
       its sides -->
  <g id="stock">
    ${edge(STOCK, W.dark)}<path d="${STOCK}" fill="url(#double-barrel-shotgun-top-stock)"/>
    ${plates.map((d) => `${edge(d, P.dark)}<path d="${d}" fill="${P.light}"/>`).join("\n    ")}
  </g>
  <!-- Under the barrels, seen when they're tipped open: the action's bar, its flat top (the water table) and the
       slot the barrels' lumps drop into -->
  <g id="action-bar">
    ${edge(BAR, S.dark)}<path d="${BAR}" fill="${S.light}"/>
    <path d="${LUMP_SLOT}" fill="${S.dark}"/>
  </g>
  <!-- A break action: the barrels and the forend tip down on the hinge to load, so they look shorter from above.
       At their back, under the fences while it's shut, their breech ends, which tip up into view as it opens: the
       chambers with the shells' brass heads in them -->
  <g id="barrels">
    ${breechEnds.join("\n      ")}
    ${edge(FOREND_TOP, W.dark)}<path id="forend" d="${FOREND_TOP}" fill="url(#double-barrel-shotgun-top-forend)"/>
    ${edge(PAIR, S.dark)}<path id="left-barrel" d="${topBarrel(-1, muzzle)}" fill="url(#double-barrel-shotgun-top-left-barrel)"/>
    <path id="right-barrel" d="${topBarrel(1, muzzle)}" fill="url(#double-barrel-shotgun-top-right-barrel)"/>
    <!-- The concave rib in the valley between them, matte, which is what you aim along -->
    <path id="rib" d="${RIB}" fill="${S.base}" stroke="${S.dark}" stroke-width="0.5"/>
    <path d="M${tp(T_BREECH, 0)} L${tp(muzzle, 0)}" stroke="${S.light}" stroke-width="0.6"/>
    <!-- The sawn ends, bright steel -->
    ${sawnEnds}
  </g>
  <!-- The action's top: the top tang along the wrist, and the fences swelling out to the barrels' breech -->
  <g id="action">
    ${edge(ACTION_TOP, S.dark)}<path d="${ACTION_TOP}" fill="url(#double-barrel-shotgun-top-action)"/>
    <!-- The strikers in the fences, over each bore -->
    <circle cx="${t1(sx(STRIKER[0]))}" cy="${t1(-T_BREECH_OD / 2)}" r="1.6" fill="${S.highlight}"/>
    <circle cx="${t1(sx(STRIKER[0]))}" cy="${t1(T_BREECH_OD / 2)}" r="1.6" fill="${S.highlight}"/>
  </g>
  <!-- On the tang: pushed aside (its tail to the right) to open the gun, about the spindle at its front -->
  <g id="top-lever">
    ${edge(lever, S.dark)}<path d="${lever}" fill="url(#double-barrel-shotgun-top-lever)"/>
    <circle cx="${t1(T_LEVER_PIVOT)}" cy="0" r="2.2" fill="${S.dark}"/>
  </g>
  <!-- The hammers, in the lock plates' brass, outside the plates: their spurs flaring out either side, their noses
       reaching in over the fences to the strikers -->
  <g id="hammers">
    ${hammers.map((d) => `${edge(d, H.dark)}<path d="${d}" fill="url(#double-barrel-shotgun-top-hammer)"/>`).join("\n    ")}
    <g stroke="${H.dark}" stroke-width="0.5" fill="none">
      ${pads.join("\n      ")}
    </g>
  </g>
</svg>
`;
}

const OUTLINE_TOP = 0.4;

const TOP: TopView<DoubleBarrelOptions> = { draw: drawTop };

export const DOUBLE_BARREL_SHOTGUN: GunDrawing<DoubleBarrelOptions> = {
  name: "double-barrel-shotgun",
  photo: {
    file: "hammer-coach-gun.png",
    width: 2200,
    height: 1650,
    about:
      'A side-by-side coach gun with exposed hammers (a Cimarron 1878 kind, 20" barrels) from its right side, muzzle to the right, on white, evenly lit (converted from hammer-coach-gun.avif); the barrels cut to 12 inches in the drawing',
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
  // The origin on the cut-down gun's middle (the butt's heel to the 12" muzzle) on the bore, and the 20" barrels
  // over their 1259 px in the photo
  scale: { origin: [(FRAME_BACK + MUZZLE) / 2, BORE_Y], mmPerPixel: MM_PER_PX },
  frame: {
    top: 614,
    bottom: 1034,
    back: FRAME_BACK,
    front: FRAME_FRONT,
    side: 700,
    pixels: 512,
  },
  comment: `
  <!-- A sawn-off side-by-side shotgun from its right side, cut from a hammer coach gun, muzzle to the right:
       12" barrels cut square, exposed hammers, a brass lock plate, two triggers, walnut. Millimeters, with the
       origin on the gun's middle on the bore, as the guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
  top: TOP,
};
