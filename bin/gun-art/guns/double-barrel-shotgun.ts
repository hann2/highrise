/**
 * A sawn-off side-by-side shotgun from its right side, cut from a coach gun with exposed hammers: blued barrels and
 * steel, a case-hardened lock plate, walnut. Drawn in the pixels of its photo (2200 by 1650) by named numbers,
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
 * - LOCK PLATE (case-hardened), flush in the stock, on the action's side: a long round-ended plate, high under the
 *   hammer and narrow along the bar; screws and the hammer's pivot (the tumbler) on it.
 * - HAMMERS (case-hardened), outside the plate, pivoting on the tumbler, down (at rest), their noses on the
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
import type { GunDrawing } from "../lib/gun";
import type { Material } from "../lib/style";
import { BLUED_STEEL, WALNUT } from "../lib/style";

/** A color case-hardened lock plate: a ground color, mottled with a few flat tones */
export interface CaseColors {
  /** The plate's ground, top to bottom */
  readonly light: string;
  readonly base: string;
  readonly dark: string;
  /** The mottling's tones, in turn */
  readonly mottles: readonly string[];
}

/** The photo's: browns and straw with blue-gray, dulled */
export const CASE_HARDENED: CaseColors = {
  light: "#8a7550",
  base: "#5e4a33",
  dark: "#3a2e24",
  mottles: ["#4b5262", "#9c8455", "#3d3229", "#6e5a6a", "#b39a62"],
};

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
  /** The lock plate and hammers: case-hardened, or blued like the rest */
  lock?: "case" | "blued";
  caseColors?: Partial<CaseColors>;
  /** The sawn muzzle's bright steel, or null for none */
  sawn?: string | null;
  /** A thin outline round the silhouette, in each part's own dark (the set's rule; default true) */
  outline?: boolean;
  /** The lit line along the barrels', fences' and tang's tops, in px (0.8 mm) */
  rimLight?: number;
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
const TUMBLER: Point = [858, 728]; // the ring on the plate the hammer pivots on
const PLATE_SCREWS: Point[] = [
  [788, 727],
  [813, 728],
  [953, 728],
];
// The mottles of the case hardening: [x, y, r], each a tone in turn
const MOTTLES: [number, number, number][] = [
  [800, 745, 22],
  [835, 716, 20],
  [850, 752, 18],
  [895, 742, 24],
  [935, 732, 16],
  [965, 748, 18],
  [995, 731, 17],
  [1012, 752, 14],
  [870, 712, 14],
  [915, 718, 12],
  [778, 733, 12],
  [975, 722, 11],
];

// ---------------------------------------------------------------------------------------------------------
// The hammers, down: a body round the tumbler, a neck up to the head, whose nose rests on the striker in the fence,
// and the spur curling up and back from the head's top. The left hammer is the right one moved back and down.
const HAMMER_NECK: Point[] = [
  [858, 726],
  [862, 710],
  [868, 697],
  [874, 686],
];
const HAMMER_HEAD =
  "M869,664 C876,660 886,659 893,661 C898,663 900,668 899,674 L896,686 C895,691 891,693 885,693 " +
  "L873,693 C869,693 866,690 866,685 L866,670 C866,667 867,665 869,664 Z";
const HAMMER_SPUR: Point[] = [
  [873, 668],
  [874, 652],
  [871, 635],
  [863, 620],
];
const FAR_HAMMER: Point = [-12, 18]; // how far the left hammer is from the right one in the photo

const shift = (points: readonly Point[], [dx, dy]: Point) =>
  points.map(([x, y]) => [x + dx, y + dy] as Point);
const shiftPath = (d: string, [dx, dy]: Point) =>
  d.replace(
    /(-?[\d.]+),(-?[\d.]+)/g,
    (_m, a: string, b: string) =>
      `${f1(parseFloat(a) + dx)},${f1(parseFloat(b) + dy)}`,
  );

/** The left hammer, behind the gun: only its head and spur show over the action */
function farHammer(at: Point): string[] {
  return [shiftPath(HAMMER_HEAD, at), band(shift(HAMMER_SPUR, at), 7, 4)];
}

/** The hammer's pieces, each its own path (they overlap, and the drawing fills by even-odd) */
function hammer(at: Point = [0, 0]): string[] {
  const body = `M${f1(TUMBLER[0] + at[0] + 13)},${f1(TUMBLER[1] + at[1])} ${arc(
    [TUMBLER[0] + at[0], TUMBLER[1] + at[1]],
    13,
    0,
    360,
  )} Z`;
  return [
    body,
    band(shift(HAMMER_NECK, at), 15, 13),
    shiftPath(HAMMER_HEAD, at),
    band(shift(HAMMER_SPUR, at), 7, 4),
  ];
}

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

function drawSide(options: DoubleBarrelOptions = {}): string {
  const S: Material = { ...BLUED_STEEL, ...options.steel };
  const W: Material = { ...WALNUT, ...options.wood };
  const C: CaseColors =
    options.lock === "blued"
      ? {
          light: S.light,
          base: S.base,
          dark: S.dark,
          mottles: [],
        }
      : { ...CASE_HARDENED, ...options.caseColors };
  const muzzle = muzzleAt(options.barrelInches ?? BARREL_INCHES);
  const forendFront = muzzle - mm(options.forendShort ?? FOREND_SHORT);
  const pistol = options.stock === "pistol";
  const stock = pistol ? PISTOL_STOCK : FULL_STOCK;
  const BARREL = barrel(muzzle);
  const FOREND = forend(forendFront);
  const HAMMERS = hammer();
  const FAR = farHammer(FAR_HAMMER);
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
    ${FAR.concat(HAMMERS)
      .map((d) => `<path d="${d}" stroke="${C.dark}"/>`)
      .join("\n    ")}
    <path d="${TRIGGERS}" stroke="${S.dark}"/>
    <path d="${GUARD_PATH}" stroke="${S.dark}" stroke-width="${f1(GUARD_WIDTH + OUTLINE * 2)}"/>
  </g>`;

  const mottles = C.mottles.length
    ? MOTTLES.map(
        ([x, y, r], i) =>
          `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#double-barrel-shotgun-mottle-${i % C.mottles.length})"/>`,
      ).join("\n      ")
    : "";

  // Soft blobs of each tone, fading out at their edges (over each circle's own box, so nothing to convert)
  const mottleGradients = C.mottles
    .map(
      (c, i) =>
        `<radialGradient id="double-barrel-shotgun-mottle-${i}">\n      <stop offset="0" stop-color="${c}" stop-opacity="0.7"/>\n      <stop offset="0.6" stop-color="${c}" stop-opacity="0.45"/>\n      <stop offset="1" stop-color="${c}" stop-opacity="0"/>\n    </radialGradient>`,
    )
    .join("\n    ");

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
    ${gradient(
      "double-barrel-shotgun-plate",
      [0, 698],
      [0, 758],
      [
        [0, C.light],
        [0.45, C.base],
        [1, C.dark],
      ],
    )}
    ${gradient(
      "double-barrel-shotgun-hammer",
      [0, 615],
      [0, 745],
      [
        [0, mix(C.light, "#ffffff", 0.15)],
        [0.5, C.light],
        [1, C.base],
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
    ${mottleGradients}
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
    <clipPath id="double-barrel-shotgun-forend-clip"><path d="${FOREND}"/></clipPath>
  </defs>
  ${outlines}
  <!-- The left hammer, on the far side: only its head and spur show over the action -->
  <g id="far-hammer">
    ${FAR.map((d) => `<path d="${d}" fill="${mix(C.base, C.dark, 0.3)}"/>`).join("\n    ")}
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
  <!-- Case-hardened, flush in the stock on the action's side, its tumbler and screws -->
  <g id="lock-plate">
    <path d="${PLATE}" fill="url(#double-barrel-shotgun-plate)"/>
    <g clip-path="url(#double-barrel-shotgun-plate-clip)">
      ${mottles}
    </g>
    <path d="${PLATE}" stroke="${C.light}" stroke-width="2" fill="none" opacity="0.8"/>
    ${PLATE_SCREWS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${C.light}"/>\n    <path d="M${x - 4},${y + 1} L${x + 4},${y - 1}" stroke="${C.dark}" stroke-width="1.5"/>`).join("\n    ")}
  </g>
  <!-- The hammers, down: the left one behind the right, its spur lower and further back -->
  <g id="hammers">
    ${HAMMERS.map((d) => `<path d="${d}" fill="url(#double-barrel-shotgun-hammer)"/>`).join("\n    ")}
    <circle cx="${TUMBLER[0]}" cy="${TUMBLER[1]}" r="5" fill="${C.dark}"/>
  </g>
  <!-- On the top tang, its thumbpiece standing up at its back -->
  <g id="top-lever">
    <path d="${TOP_LEVER}" fill="${S.base}"/>
    <path d="M784,664 C788,658 796,656 802,658" stroke="${S.highlight}" stroke-width="2" fill="none"/>
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

export const DOUBLE_BARREL_SHOTGUN: GunDrawing<DoubleBarrelOptions> = {
  name: "double-barrel-shotgun",
  draft: true,
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
       12" barrels cut square, exposed hammers, a case-hardened lock, two triggers, walnut. Millimeters, with the
       origin on the gun's middle on the bore, as the guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
};
