/**
 * The FN P90 from its right side: black polymer, the standard model with its ring sight housing and the rails
 * on top. Drawn in the pixels of its photo (1920 by 949) by named numbers, following the gun-art skill
 * (.claude/skills/gun-art/SKILL.md), with guns/m1911.ts as the worked example. A draft until it goes into the game.
 *
 * Every color is an option (`P90Options`), so a skin is a set of them: the polymer, the magazine's smoke, the
 * rounds' brass and the muzzle's steel.
 */
import type { Point } from "../lib/geometry";
import { arc, fixed, fmt, on, polygon, rounded, smoothCurve } from "../lib/geometry";
import type { GunDrawing } from "../lib/gun";
import type { Material } from "../lib/style";
import { BLACK_POLYMER } from "../lib/style";

// ---------------------------------------------------------------------------------------------------------
// Dimensions. FN's own figures for the P90 (fnamerica.com, P90 / fnherstal.com): 500 mm long, 210 mm high,
// 55 mm wide, a 264 mm (10.4") barrel, a 50-round magazine of 5.7x28 mm lying across the gun on top of it.
//
// In the photo (`measure runs`), the gun runs from the butt plate's top corner (x 45, at y 300; the butt is a
// little concave, 57 at its middle) to the flash hider's front corner (x 1862, at y 458): 1817 px, so 500 mm is
// 0.2752 mm a pixel. The height then comes out at 56 (the sight housing's two little posts; its top is 63) to 792
// (the bottom of the front grip): 736 px, 203 mm, against FN's 210: 3% short. The photo is from a little way
// off, and a hair below the gun's middle (we see the top of the ring sight's aperture from below, see WINDOW),
// so its height and length don't quite agree; the length is the one the game uses, so it's the one we keep.
// The cartridges' heads in the magazine agree: 28.6 px apart (7.9 mm; a 5.7x28's case head is 7.95 mm).
//
// The origin: halfway along that length, (45 + 1862) / 2, on the bore. The bore's height is the middle of the
// flash hider, y 388 to 465: 426.5.
const BACK = 45;
const MUZZLE = 1862;
const MM_PER_PX = 500 / (MUZZLE - BACK);
const ORIGIN: Point = [(BACK + MUZZLE) / 2, 426.5];

// ---------------------------------------------------------------------------------------------------------
// Construction (from `grid --mode photo`, region by region; there's only the one photo)
//
// Three assemblies, drawn in this order:
//
// - The barrel group's muzzle: the barrel just shows between the receiver's front and a collar (the flash
//   hider's lock nut), then a ring, a neck, and the flash hider: a cylinder with its front face cut on a slant,
//   slotted top and bottom (a dark slot along its top, and a port through it, see-through, in its middle). All
//   round, so shaded as a cylinder along the bore.
// - The shell: the stock, the thumbhole grip, the trigger's opening, the front grip and the hand stop at the
//   front are all one molding, from the butt plate to the receiver's front face (x 1705). Its sides are on two
//   levels split by a long groove (y 470 to 496, from the butt to the cocking handle's slot): the upper half
//   bulges out over it, so the groove reads as the shadow under it, with the lower half's lit lip just below.
//   Behind the grips the lower half is a flat panel (to x 527), and the grips' frame steps up from it there. The
//   thumbhole and the trigger's opening are holes (the floor shows); the thumbhole is a rounded slot leaning
//   down to the back, the trigger's opening round with its back filled by the trigger. The rubber butt plate
//   is its own part across the back (a seam at x 74). On top, behind the magazine, the stock's top runs flat at
//   y 291 to x 598, then steps down into the magazine's well: from there to the front the receiver's top is at
//   y 371, under the magazine, with three thin see-through slits between them (y 371 to 375).
// - The magazine, on top of the receiver from x 616 to 1567: translucent smoky plastic, its 50 rounds lying
//   across the gun in two staggered rows, so we see their heads (brass circles, 28.6 px apart, the rows half a
//   pitch apart). At its back the rotary feed (darker, amber through the plastic) turns them a quarter turn into
//   one row; the rounds there are in a third row. Under its body a dark rail (y 362 to 371) it slides on. It's
//   drawn under the sight housing, which comes down over it at the back of the housing (the rear leg) and wraps
//   round its front. Behind it, the magazine catch (a ridged block in a recess in the stock's top) and a round
//   boss under the catch, standing proud of the receiver.
// - The ring sight's housing, the upper receiver: over the front of the gun, from the rear leg (down over the
//   magazine to y 426) up to the sight's box on top and down the front to the receiver's front face. Its parts:
//   the box's top (y 63, with two small posts), a carrying window through its back (WINDOW: we see the
//   aperture's lit top wall above the see-through part), a Picatinny rail on its side with five slots and two
//   screws, a big round cap at its front (a hex socket in it), the strut from the window down to the front that
//   leaves a see-through gap above the magazine, the hook round the magazine's front (a small see-through D),
//   and a recessed window in its front block.
// - Over the shell at the front: the cocking handle's slot (dark), the guide rod in it (round, lit along its
//   top) and the handle at its front, a loop with a slot through it. Under the housing, in the trigger's
//   opening: the trigger, a crescent filling its back half (shown through the hole's back), and the fire
//   selector under it, a ridged disc seen edge on.
//
// Light comes from above: top faces lit, the undersides of the grips and the shell's lower edges dark. The photo
// is a studio shot, so the gun reads mid gray in it; it's drawn in the set's black polymer.

// ---------------------------------------------------------------------------------------------------------
// Options

export interface Smoke {
  /** The plastic's color, over the floor where it's empty */
  readonly color: string;
  /** How much of the floor it hides where it's empty (0 clear, 1 opaque) */
  readonly opacity: number;
  /** How much it tints the rounds behind it */
  readonly tint: number;
  /** Its edges and the rail under it */
  readonly edge: string;
}

export interface P90Options {
  /** The shell's and the sight housing's polymer */
  body?: Partial<Material>;
  /** The magazine's smoky plastic */
  magazine?: Partial<Smoke>;
  /** The rounds' brass */
  brass?: Partial<Material>;
  /** The flash hider, its collar and the barrel */
  muzzle?: Partial<Material>;
  /** A thin outline round the silhouette, in each part's own dark (the set's rule; default true) */
  outline?: boolean;
  /** How wide the rim light along the top edges is, in photo px (default RIM_LIGHT) */
  rimLight?: number;
  /**
   * Whether the floor shows through the magazine's empty plastic. Off (the default) it's backed by the smoke's
   * edge color, as on the materials sheet Simon picked variant C from; on, only its rail is solid
   */
  clearMagazine?: boolean;
}

/** Clear, light smoky plastic, a little warm, as the photo's magazine (Simon's pick: variant C of the first sheet) */
export const P90_SMOKE: Smoke = {
  color: "#b8ad9e",
  opacity: 0.35,
  tint: 0.1,
  edge: "#3a352f",
};

/** The rounds: brass case heads, lit from above */
export const P90_BRASS: Material = {
  base: "#c49a5c",
  dark: "#7c5a2e",
  light: "#e2c08a",
  highlight: "#f3dcb0",
};

/** The muzzle's steel: dark phosphate, a little warm, as the photo's flash hider */
export const P90_PHOSPHATE: Material = {
  base: "#4f4b47",
  dark: "#26231f",
  light: "#7c7770",
  highlight: "#a19b93",
};

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

function stops(...list: [number, string, number?][]): string {
  return list
    .map(
      ([o, c, a]) =>
        `      <stop offset="${o}" stop-color="${c}"${a === undefined ? "" : ` stop-opacity="${a}"`}/>`,
    )
    .join("\n");
}

/** A vertical gradient from y0 to y1 */
function vertical(id: string, y0: number, y1: number, list: [number, string, number?][]): string {
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(y0)}" x2="0" y2="${f1(y1)}">
${stops(...list)}
    </linearGradient>`;
}

/** A closed loop smoothly through `points`, starting and ending at the first, leaving and arriving along `dir` */
function loop(points: readonly Point[], dir: Point): string {
  return `M${fmt(points[0])} ${smoothCurve([...points, points[0]], dir, dir)} Z`;
}

/** A rectangle with all corners rounded by r */
function box(x0: number, y0: number, x1: number, y1: number, r = 0): string {
  return rounded(
    [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ],
    [r, r, r, r],
  );
}

/** A circle as a path (for outlines and clips, which take paths) */
function circlePath(c: Point, r: number): string {
  return `M${fmt(on(c, r, 0))} ${arc(c, r, 0, 360)} Z`;
}

// ---------------------------------------------------------------------------------------------------------
// The shell

const STOCK_TOP = 291;
const STOCK_BOTTOM = 717;
const WELL_STEP = 598; // where the stock's top steps down into the magazine's well
const WELL_BACK = 616; // the well's back, behind the magazine
const RECEIVER_TOP = 371; // the receiver's top under the magazine
const FRONT = 1705; // the receiver's front face
// Round the barrel the front face is set back, so the barrel comes out of a recess
const RECESS_BACK = 1677;
const RECESS_TOP = 399;
const RECESS_BOTTOM = 467;
const GROOVE_TOP = 470;
const GROOVE_BOTTOM = 496;
const BUTT_SEAM = 74; // the rubber butt plate's front edge
const PANEL_END = 527; // where the grips' frame steps up from the stock's flat lower panel
const GRIP_BOTTOM = 791;
const FOREGRIP_BOTTOM = 792;
const NOTCH = 661; // the bottom of the shell between the grips (the trigger's housing)

// The butt, a little concave: its back edge from the bottom corner up to the top one
const BUTT_BACK: Point[] = [
  [47, 708],
  [50, 660],
  [55, 590],
  [57, 500],
  [54, 400],
  [49, 340],
  [45, 304],
];
// The pistol grip's front edge, from the notch between the grips round down to its bottom
const GRIP_FRONT: Point[] = [
  [1182, NOTCH],
  [1160, 670],
  [1140, 690],
  [1120, 709],
  [1100, 725],
  [1080, 738],
  [1060, 750],
  [1040, 760],
  [1020, 768],
  [1000, 775],
  [980, 781],
  [955, 786],
  [920, 790],
  [880, GRIP_BOTTOM],
];
// The front grip's front edge, from the top of the gap before the hand stop down round its bottom
const FOREGRIP_FRONT: Point[] = [
  [1541, 592],
  [1534, 640],
  [1521, 680],
  [1500, 715],
  [1480, 739],
  [1460, 757],
  [1440, 770],
  [1420, 779],
  [1400, 786],
  [1375, 791],
  [1350, FOREGRIP_BOTTOM],
];
// The front grip's back edge, leaning forward, from its bottom corner up into the notch
const FOREGRIP_BACK: Point[] = [
  [1250, 782],
  [1251, 760],
  [1256, 730],
  [1262, 702],
  [1265, 684],
];
// The stock's bottom slopes down from its step (x 540) to the back of the pistol grip
const SLOPE_FROM: Point = [540, 703];
const SLOPE_TO: Point = [768, 774];

const BODY_OUTLINE =
  `M58,${STOCK_TOP - 1} L${WELL_STEP},${STOCK_TOP} L${WELL_STEP + 3},297 L${WELL_BACK},297 ` +
  `L${WELL_BACK},${RECEIVER_TOP} L${FRONT},${RECEIVER_TOP} L${FRONT},${RECESS_TOP} L${RECESS_BACK},${RECESS_TOP} ` +
  `L${RECESS_BACK},${RECESS_BOTTOM} L${FRONT + 1},${RECESS_BOTTOM} L${FRONT + 1},480 ` +
  // The hand stop at the front: its front edge leaning back, round under it, up its back
  `C${FRONT},530 1698,600 1690,640 C1688,650 1683,653 1676,653 L1657,653 C1649,653 1645,648 1645,640 L1645,598 ` +
  `C1645,582 1636,573 1620,573 L1562,573 C1550,573 1542,580 1541,592 ` +
  smoothCurve(FOREGRIP_FRONT, [0, 1], [-1, 0]) +
  ` L1268,${FOREGRIP_BOTTOM} C1256,${FOREGRIP_BOTTOM} 1250,789 1250,782 ` +
  smoothCurve(FOREGRIP_BACK, [0, -1], [0.15, -1]) +
  ` C1267,672 1258,${NOTCH} 1244,${NOTCH} L${GRIP_FRONT[0][0]},${NOTCH} ` +
  smoothCurve(GRIP_FRONT, [-1, 0.5], [-1, 0]) +
  ` L805,${GRIP_BOTTOM} C788,${GRIP_BOTTOM} 778,786 ${fmt(SLOPE_TO)} L${fmt(SLOPE_FROM)} L512,703 L508,${STOCK_BOTTOM} ` +
  `L60,${STOCK_BOTTOM + 1} C52,${STOCK_BOTTOM + 1} 47,714 ${fmt(BUTT_BACK[0])} ` +
  smoothCurve(BUTT_BACK, [0, -1], [-0.05, -1]) +
  ` C45,296 50,${STOCK_TOP - 1} 58,${STOCK_TOP - 1} Z`;

// The thumbhole: a rounded slot, its flat top at y 498, its bottom leaning down toward the back. Its upper half
// (back over the top) and its lower half (the grip's top, lit), so the lit half can be stroked on its own.
const THUMBHOLE_TOP: Point[] = [
  [776, 585],
  [783, 540],
  [810, 510],
  [858, 498],
  [940, 498],
  [990, 503],
  [1015, 521],
  [1027, 556],
];
const THUMBHOLE_BOTTOM: Point[] = [
  [1027, 556],
  [1019, 583],
  [998, 607],
  [940, 634],
  [890, 657],
  [850, 663],
  [810, 650],
  [784, 620],
  [776, 585],
];
const THUMBHOLE =
  `M${fmt(THUMBHOLE_TOP[0])} ${smoothCurve(THUMBHOLE_TOP, [0, -1], [0, 1])} ` +
  `${smoothCurve(THUMBHOLE_BOTTOM, [0, 1], [0, -1])} Z`;
const THUMBHOLE_LIT = `M${fmt(THUMBHOLE_BOTTOM[0])} ${smoothCurve(THUMBHOLE_BOTTOM, [0, 1], [0, -1])}`;

// The trigger's opening: round, a little flattened at its top front (a notch in its edge there)
const OPENING_CENTER: Point = [1350, 575];
const OPENING_TOP: Point[] = [
  [1278, 572],
  [1279, 540],
  [1288, 524],
  [1300, 512],
  [1332, 505],
  [1355, 508],
  [1369, 516],
  [1380, 526],
  [1387, 533],
  [1397, 540],
  [1407, 548],
  [1416, 563],
  [1421, 582],
];
const OPENING_BOTTOM: Point[] = [
  [1421, 582],
  [1417, 612],
  [1399, 636],
  [1370, 646],
  [1340, 641],
  [1310, 622],
  [1288, 600],
  [1278, 572],
];
const OPENING =
  `M${fmt(OPENING_TOP[0])} ${smoothCurve(OPENING_TOP, [0, -1], [0, 1])} ` +
  `${smoothCurve(OPENING_BOTTOM, [0, 1], [0, -1])} Z`;
const OPENING_LIT = `M${fmt(OPENING_BOTTOM[0])} ${smoothCurve(OPENING_BOTTOM, [0, 1], [0, -1])}`;

// See-through slits between the magazine's rail and the receiver's top
const SLITS: [number, number][] = [
  [804, 825],
  [874, 934],
  [952, 1059],
];
const SLIT_TOP = 371.5;
const SLIT_BOTTOM = 375;
const SLIT_HOLES = SLITS.map(([a, b]) => box(a, SLIT_TOP, b, SLIT_BOTTOM, 1.5)).join(" ");

const BODY = `${BODY_OUTLINE} ${THUMBHOLE} ${OPENING}`;
// The body's fill shape: its outline with the holes cut (the slits only in the fill: they're too thin to outline)
const BODY_FILL = `${BODY} ${SLIT_HOLES}`;

// The lower edges, rounding away under the grips and the stock (shaded dark inside the edge)
const UNDERSIDE =
  `M${FRONT + 1},480 C${FRONT},530 1698,600 1690,640 C1688,650 1683,653 1676,653 L1657,653 ` +
  `M1541,592 ${smoothCurve(FOREGRIP_FRONT, [0, 1], [-1, 0])} L1268,${FOREGRIP_BOTTOM} ` +
  `C1256,${FOREGRIP_BOTTOM} 1250,789 1250,782 ` +
  `M${fmt(GRIP_FRONT[0])} ${smoothCurve(GRIP_FRONT, [-1, 0.5], [-1, 0])} L805,${GRIP_BOTTOM} ` +
  `C788,${GRIP_BOTTOM} 778,786 ${fmt(SLOPE_TO)} L${fmt(SLOPE_FROM)} L512,703 L508,${STOCK_BOTTOM} L60,${STOCK_BOTTOM + 1}`;
// The step where the grips' frame rises from the stock's lower panel: down from the groove, round into the
// stock's bottom
const PANEL_STEP = `M${PANEL_END + 22},${GROOVE_BOTTOM + 2} C${PANEL_END + 6},${GROOVE_BOTTOM + 2} ${PANEL_END},${GROOVE_BOTTOM + 10} ${PANEL_END},${GROOVE_BOTTOM + 26} L${PANEL_END},700`;

// Screws through the shell (and two in the sight housing's rail, below)
const SCREWS: Point[] = [
  [116, 395],
  [336, 375],
  [237, 674],
  [503, 645],
  [805, 717],
  [1012, 700],
  [1095, 532],
  [1360, 720],
  [1510, 530],
  [1682, 532],
];
const SCREW_R = 11;

// ---------------------------------------------------------------------------------------------------------
// The magazine

const MAG_BACK = WELL_BACK;
const MAG_FRONT = 1567;
const MAG_TOP = 293;
const MAG_BOTTOM = 362; // the body; its rail under it to the receiver's top
const MAG = box(MAG_BACK, MAG_TOP, MAG_FRONT, RECEIVER_TOP, 3);
const MAG_BODY = box(MAG_BACK, MAG_TOP, MAG_FRONT, MAG_BOTTOM, 3);
// The rotary feed at its back, seen through the plastic
const FEED = box(MAG_BACK + 2, 300, 708, 369, 6);
// The rounds' heads: two rows, half a pitch apart, and the feed's few at the back
const PITCH = 28.6;
const HEAD_R = 12;
const UPPER_ROW = 318;
const LOWER_ROW = 346;
const ROUNDS: Point[] = [
  [700, 317],
  [729, 317],
  [752, 337],
  ...Array.from({ length: 22 }, (_, i): Point => [775.5 + i * PITCH, UPPER_ROW]),
  ...Array.from({ length: 22 }, (_, i): Point => [790 + i * PITCH, LOWER_ROW]),
];

// The magazine catch behind it, in a recess in the stock's top, and the boss under it
const CATCH_RECESS = box(512, 325, 560, 377, 3);
const CATCH = box(555, 329, WELL_BACK + 2, 377, 3);
const BOSS = rounded(
  [
    [616, 381],
    [718, 381],
    [716, 412],
    [700, 429],
    [636, 429],
    [618, 412],
  ],
  [4, 4, 6, 6, 6, 6],
);

// ---------------------------------------------------------------------------------------------------------
// The sight housing (the upper receiver)

const HOUSING_TOP = 63;
const LEG_BOTTOM = 426;
const LEG_RIGHT: Point[] = [
  [1197, 384],
  [1201, 366],
  [1210, 340],
  [1221, 300],
  [1228, 284],
  [1236, 268],
  [1245, 246],
];
const REAR_EDGE: Point[] = [
  [1160, 141],
  [1150, 158],
  [1138, 180],
  [1123, 212],
  [1110, 236],
  [1098, 260],
  [1087, 284],
  [1080, 302],
  [1076, 340],
  [1075, 400],
];
const FRONT_EDGE: Point[] = [
  [FRONT + 1, 300],
  [1702, 280],
  [1697, 236],
  [1691, 196],
  [1686, 172],
  [1678, 152],
];
const UNDERSIDE_FROM: Point = [1245, 244];
const UNDERSIDE_TO: Point = [1518, 283];
const JAW_BOTTOM = 398;
const BLOCK_LEFT = 1592;
const BLOCK_BOTTOM = 480;
const HOUSING_OUTLINE =
  `M1075,405 C1075,418 1082,${LEG_BOTTOM} 1094,${LEG_BOTTOM} L1197,${LEG_BOTTOM} L${fmt(LEG_RIGHT[0])} ` +
  smoothCurve(LEG_RIGHT, [0.1, -1], [0.4, -1]) +
  ` L${fmt(UNDERSIDE_TO)} C1521,286 1522,${MAG_TOP - 1} 1526,${MAG_TOP - 1} L${MAG_FRONT},${MAG_TOP - 1} ` +
  `L${MAG_FRONT},${MAG_BOTTOM + 4} L1508,${MAG_BOTTOM + 4} C1496,${MAG_BOTTOM + 4} 1492,380 1498,390 ` +
  `C1502,396 1508,${JAW_BOTTOM} 1518,${JAW_BOTTOM} L${BLOCK_LEFT},${JAW_BOTTOM} L${BLOCK_LEFT},${BLOCK_BOTTOM} ` +
  `L${RECESS_BACK},${BLOCK_BOTTOM} L${RECESS_BACK},${RECESS_TOP} L${FRONT + 1},${RECESS_TOP} L${fmt(FRONT_EDGE[0])} ` +
  smoothCurve(FRONT_EDGE, [0, -1], [-0.6, -1]) +
  ` C1670,144 1662,142 1650,142 L1626,141 L1600,127 L1575,112 L1552,90 L1546,${HOUSING_TOP + 3} ` +
  `C1545,${HOUSING_TOP} 1543,${HOUSING_TOP} 1540,${HOUSING_TOP} L1325,${HOUSING_TOP} L1300,85 L1275,108 ` +
  `C1268,113 1258,117 1250,119 L1200,134 L${fmt(REAR_EDGE[0])} ` +
  smoothCurve(REAR_EDGE, [-0.45, 1], [0, 1]) +
  " Z";
// The sight's two little posts on top
const POSTS = [1330, 1533]
  .map((x) => box(x - 4, HOUSING_TOP - 8, x + 4, HOUSING_TOP + 2, 3))
  .join(" ");
// The carrying window through its back: the see-through part, and the aperture's lit top wall above it
const WINDOW_TOP = 160;
const WINDOW_THROUGH = 192;
const WINDOW_BOTTOM = 221;
const WINDOW = rounded(
  [
    [1154, WINDOW_THROUGH],
    [1266, WINDOW_THROUGH],
    [1266, WINDOW_BOTTOM],
    [1200, WINDOW_BOTTOM],
    [1152, 211],
  ],
  [2, 3, 3, 4, 3],
);
const WINDOW_WALL = rounded(
  [
    [1160, WINDOW_TOP],
    [1268, WINDOW_TOP],
    [1268, WINDOW_THROUGH + 2],
    [1153, WINDOW_THROUGH + 2],
  ],
  [6, 6, 0, 0],
);
// The gap under the strut, over the magazine
const GAP = `M${fmt(UNDERSIDE_FROM)} L${fmt(UNDERSIDE_TO)} C1521,286 1522,${MAG_TOP - 1} 1526,${MAG_TOP} L1224,${MAG_TOP} ${smoothCurve(
  [
    [1224, MAG_TOP],
    [1228, 284],
    [1236, 268],
    [1245, 246],
  ],
  [0.3, -1],
  [0.4, -1],
)} Z`;
// The hook round the magazine's front: a small see-through D
const HOOK = `M${MAG_FRONT},296 L1576,296 C1580,296 1581,300 1581,306 L1581,318 C1581,326 1576,332 1569,333 L${MAG_FRONT},333 Z`;
const HOUSING = `${HOUSING_OUTLINE} ${WINDOW} ${HOOK}`;

// The rail on its side: a block, five slots across it, two screws
const RAIL = box(1282, 170, 1564, 239, 3);
const RAIL_SLOTS: [number, number][] = [
  [1342, 1362],
  [1379, 1397],
  [1414, 1434],
  [1451, 1469],
  [1487, 1505],
];
const RAIL_SCREWS: Point[] = [
  [1314, 206],
  [1534, 206],
];
// The cap at its front, with a hex socket
const CAP_CENTER: Point = [1612, 194];
const CAP_R = 44;
const CAP_FACE_R = 31;
// The recessed window in its front block
const FRONT_RECESS = box(1592, 300, 1696, 378, 10);
const FRONT_PANEL = box(1600, 309, 1688, 370, 6);

// ---------------------------------------------------------------------------------------------------------
// The cocking handle, its slot and guide rod

const SLOT = box(1188, 417, 1600, 471, 8);
const ROD_TOP = 426;
const ROD_BOTTOM = 467;
const ROD = box(1198, ROD_TOP, 1508, ROD_BOTTOM, 12);
const HANDLE_CENTER: Point = [1566, 446];
const HANDLE_R = 27;
const HANDLE =
  `M1498,421 L${fmt(on(HANDLE_CENTER, HANDLE_R, -90))} ${arc(HANDLE_CENTER, HANDLE_R, -90, 90)} ` +
  "L1498,473 C1494,473 1492,470 1492,466 L1492,428 C1492,424 1494,421 1498,421 Z";
const HANDLE_SLOT = box(1508, 439, 1534, 457, 9);

// ---------------------------------------------------------------------------------------------------------
// The trigger and the selector

// A crescent filling the back of the opening: the inside of a circle behind it, outside the opening
const TRIGGER_CENTER: Point = [1262, 572];
const TRIGGER_R = 62;
const TRIGGER = circlePath(TRIGGER_CENTER, TRIGGER_R);
const SELECTOR = box(1220, 605, 1318, 632, 6);
const SELECTOR_RIDGES = Array.from({ length: 13 }, (_, i) => 1247 + i * 4.6);

// ---------------------------------------------------------------------------------------------------------
// The muzzle

const BORE = ORIGIN[1];
const BARREL = box(RECESS_BACK - 4, 398, 1710, 466, 0);
const COLLAR = box(1708, 388, 1734, 465, 3);
const COLLAR_GROOVE = box(1732, 393, 1743, 460, 0);
const RING = box(1741, 388, 1754, 465, 3);
const NECK = box(1752, 398, 1767, 456, 0);
const HIDER =
  "M1765,397 L1783,397 L1785,389 L1797,389 C1802,389 1803,395 1807,395 C1811,395 1813,389 1818,389 L1845,389 " +
  "C1849,389 1851,392 1852,396 L1862,452 C1863,459 1859,465 1853,465 L1820,465 C1815,465 1813,459 1807,459 " +
  "C1801,459 1800,465 1795,465 L1765,465 Z";
const HIDER_SLOT = box(1778, 395, 1840, 405, 4);
const HIDER_PORT_RECESS = box(1778, 426, 1838, 447, 6);
const HIDER_PORT = box(1790, 429, 1826, 441, 6);

// ---------------------------------------------------------------------------------------------------------
// Rim light and outline

// The rim light: the top edges catching the light, a line just inside the silhouette (stroked twice as wide
// along the edge, clipped to the part). It's what keeps the near-black gun from vanishing on a dark floor; at
// 1.4 mm it's wider than the Glock's 0.8, since the P90's pickup shows it at about half the Glock's scale.
const RIM_LIGHT = 5;
const STOCK_RIM = `M47,330 C45,300 50,${STOCK_TOP - 1} 58,${STOCK_TOP - 1} L${WELL_STEP},${STOCK_TOP}`;
const HOUSING_RIM =
  `M1080,302 ${smoothCurve(REAR_EDGE.slice(0, 8).reverse(), [0.45, -1], [0.45, -1])} ` +
  `L1200,134 L1250,119 C1258,117 1268,113 1275,108 L1300,85 L1325,${HOUSING_TOP} L1540,${HOUSING_TOP} ` +
  `M1626,141 L1650,142 C1662,142 1670,144 1678,152`;

// The outline round the silhouette: 0.4 mm (the set's rule), in each part's own dark, each shape stroked twice
// as wide under everything, so only the outer half shows (round the gun, and round the holes)
const OUTLINE = 0.4 / MM_PER_PX;

function outlines(P: Material, M: Material, smoke: Smoke): string {
  const parts: [string, string][] = [
    [BARREL, M.dark],
    [COLLAR, M.dark],
    [RING, M.dark],
    [NECK, M.dark],
    [HIDER, M.dark],
    [HIDER_PORT, M.dark],
    [BODY, P.dark],
    [MAG, smoke.edge],
    [CATCH, P.dark],
    [BOSS, P.dark],
    [HOUSING, P.dark],
    [GAP, P.dark],
    [POSTS, P.dark],
  ];
  return `<!-- The outline: each part's shape stroked under everything, so only its outer half shows -->
  <g id="p90-outline" fill="none" stroke-width="${f1(OUTLINE * 2)}">
    ${parts.map(([d, color]) => `<path d="${d}" stroke="${color}"/>`).join("\n    ")}
  </g>`;
}

function screw(c: Point, P: Material, r = SCREW_R): string {
  return `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r}" fill="${P.dark}"/>
      <circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(r - 3)}" fill="${P.base}"/>
      <circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(r * 0.38)}" fill="${P.dark}"/>`;
}

function round(c: Point, B: Material): string {
  const [x, y] = c;
  return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${HEAD_R}" fill="url(#p90-head)"/>
      <circle cx="${f1(x)}" cy="${f1(y)}" r="${HEAD_R - 3}" fill="none" stroke="${B.dark}" stroke-width="1.5" opacity="0.6"/>
      <circle cx="${f1(x)}" cy="${f1(y)}" r="3.6" fill="${B.light}" stroke="${B.dark}" stroke-width="1"/>`;
}

function drawSide(options: P90Options = {}): string {
  const P: Material = { ...BLACK_POLYMER, ...options.body };
  const B: Material = { ...P90_BRASS, ...options.brass };
  const M: Material = { ...P90_PHOSPHATE, ...options.muzzle };
  const smoke: Smoke = { ...P90_SMOKE, ...options.magazine };
  const rim = options.rimLight ?? RIM_LIGHT;
  const lower = mix(P.base, P.dark, 0.45);
  const gy = (y: number) => fixed((y - STOCK_TOP) / (GRIP_BOTTOM - STOCK_TOP), 3);
  const railSlots = RAIL_SLOTS.map(([a, b]) => box(a, 168, b, 241, 1)).join(" ");
  const railTeeth = RAIL_SLOTS.map(([, b]) => `M${b + 1},171 L${b + 1},238`).join(" ");
  const ridges = SELECTOR_RIDGES.map((x) => `M${f1(x)},609 L${f1(x)},629`).join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="949" viewBox="0 0 1920 949" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  <defs>
    <!-- The shell, down its side: the top's edge, lit just under it, the upper half darkening toward the groove,
         the groove in its shadow, the lower half's lit lip, then darker toward the bottom -->
    ${vertical("p90-body-shading", STOCK_TOP, GRIP_BOTTOM, [
      [0, P.dark],
      [+gy(296), P.highlight],
      [+gy(305), P.light],
      [+gy(350), mix(P.light, P.highlight, 0.3)],
      [+gy(400), P.light],
      [+gy(450), mix(P.light, P.base, 0.6)],
      [+gy(GROOVE_TOP - 2), mix(P.base, P.dark, 0.5)],
      [+gy(GROOVE_TOP + 6), P.dark],
      [+gy(GROOVE_BOTTOM - 3), P.dark],
      [+gy(GROOVE_BOTTOM + 2), P.highlight],
      [+gy(GROOVE_BOTTOM + 10), P.light],
      [+gy(560), mix(P.light, P.base, 0.5)],
      [+gy(640), P.base],
      [1, lower],
    ])}
    <!-- The receiver's top under the magazine: in its shadow, lit along the edge just below -->
    ${vertical("p90-receiver-top", RECEIVER_TOP, 404, [
      [0, P.dark],
      [0.25, P.dark],
      [0.4, P.light],
      [1, mix(P.light, P.base, 0.6)],
    ])}
    <!-- The housing, down its side: lit along its top, the box's face, darker toward the bottom -->
    ${vertical("p90-housing-shading", HOUSING_TOP, BLOCK_BOTTOM, [
      [0, P.highlight],
      [0.025, mix(P.light, P.highlight, 0.5)],
      [0.2, P.light],
      [0.24, P.base],
      [0.45, mix(P.base, P.dark, 0.3)],
      [0.55, P.base],
      [1, mix(P.base, P.dark, 0.3)],
    ])}
    ${vertical("p90-rail-shading", 170, 239, [
      [0, P.light],
      [0.06, P.base],
      [0.2, mix(P.base, P.dark, 0.5)],
      [1, P.dark],
    ])}
    ${vertical("p90-rod-shading", ROD_TOP, ROD_BOTTOM, [
      [0, M.dark],
      [0.08, M.highlight],
      [0.25, M.light],
      [0.6, M.base],
      [1, M.dark],
    ])}
    ${vertical("p90-muzzle-shading", 388, 465, [
      [0, M.dark],
      [0.06, M.light],
      [0.2, M.highlight],
      [0.4, M.light],
      [0.7, M.base],
      [1, M.dark],
    ])}
    ${vertical("p90-mag-shading", MAG_TOP, MAG_BOTTOM, [
      [0, smoke.edge, 0.9],
      [0.06, mix(smoke.color, "#ffffff", 0.35), smoke.tint + 0.15],
      [0.2, smoke.color, smoke.tint],
      [0.85, smoke.color, smoke.tint],
      [1, smoke.edge, smoke.tint + 0.3],
    ])}
    ${vertical("p90-feed-shading", 300, 369, [
      [0, mix(smoke.edge, B.dark, 0.5)],
      [0.5, mix(B.dark, smoke.color, 0.4)],
      [1, smoke.edge],
    ])}
    <radialGradient id="p90-head" cx="0.4" cy="0.35" r="0.7">
${stops([0, B.highlight], [0.45, B.light], [1, B.base])}
    </radialGradient>
    ${vertical("p90-trigger-shading", 510, 630, [
      [0, P.highlight],
      [0.5, P.light],
      [1, P.base],
    ])}
    <clipPath id="p90-body-clip">
      <path d="${BODY_FILL}" clip-rule="evenodd"/>
    </clipPath>
    <clipPath id="p90-housing-clip">
      <path d="${HOUSING}" clip-rule="evenodd"/>
    </clipPath>
    <clipPath id="p90-mag-clip">
      <path d="${MAG_BODY}"/>
    </clipPath>
    <clipPath id="p90-outside-opening">
      <path d="M1100,450 L1500,450 L1500,700 L1100,700 Z ${OPENING}" clip-rule="evenodd"/>
    </clipPath>
  </defs>
  ${options.outline === false ? "" : outlines(P, M, smoke)}
  <!-- The muzzle: the barrel just showing out of the receiver, the flash hider's collar and ring, its neck, and
       the flash hider, its front cut on a slant, a slot along its top and a port through its middle -->
  <g id="p90-muzzle">
    <path d="${BARREL}" fill="url(#p90-muzzle-shading)"/>
    <!-- In the recess's shadow -->
    <path d="${box(RECESS_BACK - 4, 398, 1686, 466)}" fill="${M.dark}" opacity="0.5"/>
    <path d="${COLLAR}" fill="url(#p90-muzzle-shading)"/>
    <path d="${COLLAR_GROOVE}" fill="${M.dark}"/>
    <path d="${RING}" fill="url(#p90-muzzle-shading)"/>
    <path d="${NECK}" fill="url(#p90-muzzle-shading)"/>
    <path d="${NECK}" fill="${M.dark}" opacity="0.4"/>
    <path d="${HIDER} ${HIDER_PORT}" fill="url(#p90-muzzle-shading)"/>
    <path d="${HIDER_SLOT}" fill="${M.dark}"/>
    <path d="M1782,404 L1836,404" stroke="${M.light}" stroke-width="2" fill="none"/>
    <path d="${HIDER_PORT_RECESS} ${HIDER_PORT}" fill="${M.dark}"/>
    <path d="M1853,396 L1862,452" stroke="${M.dark}" stroke-width="3" opacity="0.6" fill="none"/>
  </g>
  <!-- The shell: stock, grips and hand stop, one molding, the thumbhole and the trigger's opening through it -->
  <g id="p90-shell">
    <path d="${BODY_FILL}" fill="url(#p90-body-shading)"/>
    <g clip-path="url(#p90-body-clip)" fill="none">
      <!-- The receiver's top under the magazine -->
      <path d="${box(WELL_BACK, RECEIVER_TOP, FRONT + 2, 404)}" fill="url(#p90-receiver-top)"/>
      <!-- A low step along the receiver, under the magazine -->
      <path d="M718,401 L1078,401" stroke="${P.dark}" stroke-width="3" opacity="0.7"/>
      <path d="M718,404 L1078,404" stroke="${P.light}" stroke-width="2" opacity="0.6"/>
      <!-- The undersides rounding away, and the holes' lower edges (the grips' tops) lit -->
      <path d="${UNDERSIDE}" stroke="${P.dark}" stroke-width="40" opacity="0.55"/>
      <path d="${UNDERSIDE}" stroke="${P.dark}" stroke-width="14" opacity="0.6"/>
      <path d="${THUMBHOLE} ${OPENING}" stroke="${P.dark}" stroke-width="22" opacity="0.6"/>
      <path d="${THUMBHOLE_LIT} ${OPENING_LIT}" stroke="${P.light}" stroke-width="30" opacity="0.45"/>
      <!-- The butt's back rounding away, and the butt plate's seam -->
      <path d="M47,708 ${smoothCurve(BUTT_BACK, [0, -1], [-0.05, -1])}" stroke="${P.dark}" stroke-width="16" opacity="0.5"/>
      <path d="M${BUTT_SEAM},294 L${BUTT_SEAM},715" stroke="${P.dark}" stroke-width="4"/>
      <path d="M${BUTT_SEAM + 3},300 L${BUTT_SEAM + 3},708" stroke="${P.light}" stroke-width="2" opacity="0.7"/>
      <!-- The grips' frame stepping up from the stock's flat lower panel -->
      <path d="${PANEL_STEP}" stroke="${P.dark}" stroke-width="10" opacity="0.8"/>
      <path d="M${PANEL_END + 6},${GROOVE_BOTTOM + 30} L${PANEL_END + 6},694" stroke="${P.light}" stroke-width="2" opacity="0.5"/>
      <!-- The rim light along the stock's top -->
      <path d="${STOCK_RIM}" stroke="${P.highlight}" stroke-width="${rim * 2}"/>
    </g>
    <!-- A sling slot low in the stock, its lower lip lit -->
    <path d="${box(123, 687, 219, 701, 7)}" fill="${P.dark}"/>
    <path d="M128,699 L214,699" stroke="${P.light}" stroke-width="2" opacity="0.8" fill="none"/>
    <g id="p90-screws">
      ${SCREWS.map((c) => screw(c, P)).join("\n      ")}
    </g>
  </g>
  <!-- In the trigger's opening: the trigger filling its back, a crescent, and the selector under it, a ridged disc -->
  <g id="p90-trigger">
    <g clip-path="url(#p90-outside-opening)">
      <path d="${TRIGGER}" fill="${P.dark}"/>
      <path d="${circlePath(TRIGGER_CENTER, TRIGGER_R - 4)}" fill="url(#p90-trigger-shading)"/>
    </g>
    <path d="${SELECTOR}" fill="${P.dark}"/>
    <path d="${box(1247, 609, 1310, 629, 3)}" fill="${P.base}"/>
    <path d="${ridges}" stroke="${P.dark}" stroke-width="2" fill="none"/>
    <path d="M1224,608 L1314,608" stroke="${P.light}" stroke-width="2" opacity="0.7" fill="none"/>
  </g>
  <!-- The cocking handle's slot, the guide rod in it, and the handle at its front -->
  <g id="p90-cocking-handle">
    <path d="${SLOT}" fill="${P.dark}"/>
    <path d="${ROD}" fill="url(#p90-rod-shading)"/>
    <path d="${HANDLE}" fill="${P.dark}"/>
    <path d="${HANDLE_SLOT}" fill="${mix(P.dark, "#000000", 0.4)}"/>
    <path d="M1498,421 L${fmt(on(HANDLE_CENTER, HANDLE_R, -90))} ${arc(HANDLE_CENTER, HANDLE_R, -90, 90)} L1498,473" stroke="${P.light}" stroke-width="5" fill="none"/>
    <path d="${HANDLE_SLOT}" stroke="${P.light}" stroke-width="3" fill="none"/>
    <path d="M1498,423 L${fmt(on(HANDLE_CENTER, HANDLE_R - 2, -90))} ${arc(HANDLE_CENTER, HANDLE_R - 2, -90, -20)}" stroke="${P.highlight}" stroke-width="3" fill="none"/>
  </g>
  <!-- Behind the magazine: the catch in its recess in the stock's top, and the boss under it -->
  <g id="p90-magazine-catch">
    <path d="${CATCH_RECESS}" fill="${P.dark}"/>
    <path d="M516,329 L516,374" stroke="${P.light}" stroke-width="4" opacity="0.6" fill="none"/>
    <path d="${CATCH}" fill="${P.base}"/>
    <path d="M559,331 L${WELL_BACK - 2},331" stroke="${P.light}" stroke-width="3" fill="none"/>
    <path d="M601,334 L601,374 M606,334 L606,374 M611,334 L611,374" stroke="${P.dark}" stroke-width="2" fill="none"/>
    <path d="${BOSS}" fill="${P.base}"/>
    <path d="M620,384 L714,384" stroke="${P.light}" stroke-width="3" fill="none"/>
    <path d="M622,414 L638,428 L698,428 L714,414" stroke="${P.dark}" stroke-width="6" opacity="0.7" fill="none"/>
  </g>
  <!-- The magazine: smoky plastic, empty where the floor shows through, its rounds' heads in two rows and the
       rotary feed at its back seen through it; its rail under it -->
  <g id="p90-magazine">
    <!-- Backed by its edge color, or (clearMagazine) only its rail solid, so the floor shows through where it's empty -->
    <path d="${options.clearMagazine ? box(MAG_BACK, MAG_BOTTOM - 3, MAG_FRONT, RECEIVER_TOP, 2) : MAG}" fill="${smoke.edge}"/>
    <path d="${MAG_BODY}" fill="${smoke.color}" opacity="${smoke.opacity}"/>
    <g clip-path="url(#p90-mag-clip)">
      <path d="${FEED}" fill="url(#p90-feed-shading)"/>
      <path d="M686,304 L686,364" stroke="${B.light}" stroke-width="4" opacity="0.35" fill="none"/>
      ${ROUNDS.map((c) => round(c, B)).join("\n      ")}
    </g>
    <path d="${MAG_BODY}" fill="url(#p90-mag-shading)"/>
    <path d="M${MAG_BACK + 4},298 L${MAG_FRONT - 4},298" stroke="#ffffff" stroke-width="2" opacity="0.35" fill="none"/>
    <path d="M${MAG_BACK + 3},${MAG_BOTTOM + 2} L${MAG_FRONT - 3},${MAG_BOTTOM + 2}" stroke="${mix(smoke.edge, "#ffffff", 0.25)}" stroke-width="2" fill="none"/>
  </g>
  <!-- The ring sight's housing: the rear leg down over the magazine, the box with its window and rail, the cap,
       the strut over the gap, the hook round the magazine's front, and the front block down to the receiver -->
  <g id="p90-housing">
    <path d="${POSTS}" fill="${P.base}"/>
    <path d="${HOUSING}" fill="url(#p90-housing-shading)"/>
    <g clip-path="url(#p90-housing-clip)" fill="none">
      <!-- The window's lit top wall, seen from a little below -->
      <path d="${WINDOW_WALL}" fill="${mix(P.light, "#ffffff", 0.1)}"/>
      <path d="M1158,${WINDOW_TOP + 2} L1266,${WINDOW_TOP + 2}" stroke="${P.dark}" stroke-width="5"/>
      <!-- The rear leg, a step proud of the magazine's sides: its edges -->
      <path d="M${fmt(LEG_RIGHT[0])} ${smoothCurve(LEG_RIGHT, [0.1, -1], [0.4, -1])}" stroke="${P.dark}" stroke-width="10" opacity="0.6"/>
      <path d="M1094,${LEG_BOTTOM} L1197,${LEG_BOTTOM}" stroke="${P.dark}" stroke-width="14" opacity="0.6"/>
      <!-- The rear leg's top, where it steps out from under the window, lit -->
      <path d="M1112,237 L1244,241" stroke="${P.dark}" stroke-width="5" opacity="0.6"/>
      <path d="M1112,241 L1242,245" stroke="${P.light}" stroke-width="2.5" opacity="0.8"/>
      <path d="M${fmt(UNDERSIDE_FROM)} L${fmt(UNDERSIDE_TO)}" stroke="${P.dark}" stroke-width="10" opacity="0.7"/>
      <!-- The front block: a recessed window in it, and its edge stepping down to the receiver -->
      <path d="${FRONT_RECESS}" fill="${P.dark}"/>
      <path d="${FRONT_PANEL}" fill="${P.base}"/>
      <path d="M1604,311 L1684,311" stroke="${P.light}" stroke-width="3"/>
      <path d="M${BLOCK_LEFT},${JAW_BOTTOM} L${BLOCK_LEFT},${BLOCK_BOTTOM} L${FRONT + 1},${BLOCK_BOTTOM}" stroke="${P.dark}" stroke-width="8" opacity="0.8"/>
      <path d="M1498,390 C1502,396 1508,${JAW_BOTTOM} 1518,${JAW_BOTTOM} L${BLOCK_LEFT},${JAW_BOTTOM}" stroke="${P.dark}" stroke-width="8" opacity="0.8"/>
      <!-- The rim light along its top edges -->
      <path d="${HOUSING_RIM}" stroke="${P.highlight}" stroke-width="${rim * 2}"/>
    </g>
    <!-- The rail on its side, five slots across it, two screws -->
    <path d="${RAIL}" fill="url(#p90-rail-shading)"/>
    <path d="${railSlots}" fill="${P.dark}"/>
    <path d="${railTeeth}" stroke="${P.light}" stroke-width="2" opacity="0.7" fill="none"/>
    <path d="M1284,172 L1562,172" stroke="${P.light}" stroke-width="2" opacity="0.8" fill="none"/>
    ${RAIL_SCREWS.map((c) => screw(c, P, 14)).join("\n    ")}
    <!-- The cap at its front, a hex socket in its face -->
    <circle cx="${CAP_CENTER[0]}" cy="${CAP_CENTER[1]}" r="${CAP_R}" fill="${P.dark}"/>
    <circle cx="${CAP_CENTER[0]}" cy="${CAP_CENTER[1]}" r="${CAP_R - 5}" fill="${P.light}"/>
    <circle cx="${CAP_CENTER[0]}" cy="${CAP_CENTER[1]}" r="${CAP_FACE_R}" fill="${mix(P.base, P.dark, 0.45)}"/>
    <path d="M${fmt(on(CAP_CENTER, CAP_R - 3, 200))} ${arc(CAP_CENTER, CAP_R - 3, 200, 300)}" stroke="${P.light}" stroke-width="3" fill="none"/>
    <path d="${polygon([0, 60, 120, 180, 240, 300].map((a) => on(CAP_CENTER, 9, a)))}" fill="${P.dark}"/>
  </g>
</svg>`;
}

export const P90: GunDrawing<P90Options> = {
  name: "p90",
  draft: true,
  photo: {
    file: "p90.webp",
    width: 1920,
    height: 949,
    about:
      "A P90 from its right side, muzzle to the right, on a transparent (shown black) background; the magazine's rounds show through",
  },
  // The origin on the gun's middle on the bore, and the real gun's 500 mm over its 1817 px in the photo
  scale: { origin: ORIGIN, mmPerPixel: MM_PER_PX },
  frame: {
    // The sight's posts, the bottom of the front grip, the butt, the flash hider's front
    top: HOUSING_TOP - 8,
    bottom: FOREGRIP_BOTTOM,
    back: BACK,
    front: MUZZLE,
    side: 510,
    pixels: 512,
  },
  comment: `
  <!-- The FN P90 from its right side, muzzle to the right: the standard model in black polymer, with its ring
       sight's housing and the rails on top, and a full magazine of 50 rounds showing through its smoky plastic.
       Millimeters, with the origin on the gun's middle on the bore, as the guns' top views in weapons/guns/art/
       have it; drawn over a photo, then simplified. The square is the pickup's, as the other pickups'. -->`,
  drawSide,
};
