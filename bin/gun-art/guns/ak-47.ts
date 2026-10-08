/**
 * The AK-47 from its right side: a classic milled AK-47 (the "Type 3" receiver) with wooden stock, pistol grip and
 * handguards, blued steel, and a steel 30-round magazine. Drawn in the pixels of its photo (1920 by 1200) by named
 * numbers, following the gun-art skill (.claude/skills/gun-art/SKILL.md), with guns/m1911.ts as the worked
 * example. A draft until it goes into the game.
 *
 * The photo is a worn rifle (tape on the magazine, a sticker on the stock, worn bluing): drawn clean. Every color
 * is an option (`AkOptions`), so a skin is a set of them. Light falls from above, as on the pistols: top edges
 * lit, undersides in shadow.
 */
import type { Point } from "../lib/geometry";
import { arc, fixed, fmt, on, rounded, smoothCurve } from "../lib/geometry";
import type { GunDrawing, TopView } from "../lib/gun";
import { generatedNote } from "../lib/gun";
import type { Material } from "../lib/style";
import { BRIGHT_STEEL } from "../lib/style";

export interface AkOptions {
  /** The receiver, dust cover, sights, barrel, gas tube and the other steel parts */
  steel?: Partial<Material>;
  /** The stock, pistol grip and both handguards */
  wood?: Partial<Material>;
  /** The magazine (stamped steel, a touch darker than the receiver by default) */
  magazine?: Partial<Material>;
  /** Small bright steel: the selector's pivot, the trigger guard, the pins' heads */
  bright?: Partial<Material>;
  /** A thin outline round the silhouette, in each part's own dark (the set's rule; default true) */
  outline?: boolean;
  /** How wide the rim light along the top edges is, in photo px (default RIM_LIGHT) */
  rimLight?: number;
}

// ---------------------------------------------------------------------------------------------------------
// Dimensions. The AK-47 (Type 3, milled receiver, fixed wooden stock): 870 mm long overall, barrel 415 mm (16.3",
// as the game's stats have it). Sources: the specification tables reproduced from Wikipedia's AK-47 article and
// the technical data sheets give 870 mm for the AK-47 with the fixed stock (some copies give 880 mm, which is the
// AKM's); the barrel's 415 mm is the same everywhere.
//
// In the photo (`measure runs`, `measure edges`), the gun runs from the butt plate's top heel (x 119, y 574) to the
// front of the muzzle nut (x 1818): 1699 px, so 870 / 1699 = 0.512 mm a pixel. Checks: the barrel, from the
// chamber (just ahead of the magazine's lips, about x 1010) to the muzzle (x 1806, behind the nut), is 796 px,
// 408 mm (415 real, so the photo's within 2%); the magazine's top is 112 px, 57 mm across (a 7.62x39 magazine is
// about 58 mm long at its top); the height, rear sight (y 447) to the magazine's bottom corner (y 948) is 501 px,
// 257 mm. So 870 is the length that fits, and the photo's a true side view: the bore is level (the barrel's middle
// is at y 549.5 by the receiver and 549.5 at the muzzle).
//
// The origin: halfway along that length, (119 + 1818) / 2, on the bore (the muzzle nut's middle, y 551; the
// barrel's 549.5): y 550.
const LENGTH_PX = 1818 - 119;
const MM_PER_PX = 870 / LENGTH_PX;
const ORIGIN: Point = [(119 + 1818) / 2, 550];

// ---------------------------------------------------------------------------------------------------------
// Construction (from `grid --mode photo`, region by region, both photos and the 3D model's right side, `model
// ak-47 --from +x`)
//
// Assemblies, back to front: the buttstock, the receiver (with the dust cover on top, the pistol grip, trigger,
// guard and magazine catch under it, and the rear sight block at its front), the lower handguard on the barrel, the
// gas tube with the upper handguard over it, the gas block, the barrel, the cleaning rod under it, and the front
// sight and muzzle nut. The magazine goes up into the receiver.
//
// THE BUTTSTOCK, wood, slab-sided: its top a gentle straight line rising to the comb (highest at x 400), then a
// small dip (the comb's front edge, 9 px deep) and the wrist's straight top rising to the receiver. Its bottom one
// straight line (measured: y 748 at x 200, 621 at x 560). Its front a slanted line against the receiver's rear
// socket (x 577 to 588). At the back a steel butt plate, about 6 mm thick, slanted with the stock's back. The
// sticker, wear and grain go.
// THE RECEIVER, milled steel, flat-sided: the side from y 520 (under the dust cover's edge) to its bottom at y 607,
// from the stock (x 580) to the front trunnion (x 1086). What's on it:
//   - Flush: the lightening cut over the magazine (a milled recess, a rounded rectangle x 919 to 1076, y 548 to
//     598): its top wall in shadow, its bottom edge lit. Pins: two plain heads (rivets, x 743 and 780) and two
//     ringed pins (the trigger and hammer pins, x 819 and 848).
//   - Proud: the safety selector, a long stamped lever pivoting on a round boss at the back (697,553) and reaching
//     forward along the top to its tab at x 896, which closes the dust cover's slot. It stands proud (a shadow
//     under its lower edge) and is folded along its lower edge (a narrow flange, darker).
//   - Over it, on top: THE DUST COVER, stamped sheet steel: rounded down at the back (from y 470 to the socket at
//     x 586), its side down to y 519, cut away at the front (x 888 to 1040, its edge up at y 497) for the
//     ejection port; a stamped crease along its side (y 486), and its lower lip a step out over the receiver's
//     rail (y 502).
//   - In the port, the bolt carrier (steel, lit along its top), and the charging handle's round knob at its front
//     end (1039,517) on its stem.
//   - The stamped markings and serials go.
// THE REAR SIGHT BLOCK, on the trunnion (x 1040 to 1170, top y 470): the sight leaf lying on it (x 1040 to
// 1150, y 451 to 459) with its slider's round checkered knob at the back, and the leaf spring's round cap at the
// front. The block's front a vertical face.
// UNDER THE RECEIVER:
//   - The pistol grip, wood, leaning back about 14°, a little fuller toward the front (the palm swell), its bottom
//     rounded. It goes up into the receiver (its top hidden under the receiver's bottom).
//   - The trigger guard: a narrow stamped strip, seen edge on as a thin bright line: from the grip's top front,
//     round a rounded back corner, along the bottom (y 671) to its front, then straight up to the receiver (x
//     822). What's inside it is a hole.
//   - The trigger: a crescent, curving down and forward from the receiver, seen through the guard.
//   - The magazine catch: a block ahead of the guard (x 822 to 858), its paddle reaching down behind the magazine,
//     its pin a ring.
// THE MAGAZINE, stamped steel, curved (each edge one smooth curve; the photo's measured both): its top in the
//   receiver, ribs stamped down its side following the curve, the floor plate at the bottom (a seam across it).
//   The tape goes.
// THE HANDGUARDS, wood:
//   - The lower one, a U round the barrel: from its steel ferrule at the receiver (x 1086 to 1101) to its steel
//     retainer at the front (x 1384 to 1400), its top straight (y 519), its bottom falling toward the back (y 586
//     at the front to 605 at the back), its front bottom corner rounded. Through the slot between it and the upper
//     one, the far side of the handguard, dark.
//   - The upper one, on the gas tube: a round-ended cylinder (y 466 to 512) between two steel caps.
// THE GAS TUBE (x 1399 to 1505, y 481 to 519), round, with four vent holes, into the GAS BLOCK, whose top slopes
//   down to the barrel in front (x 1552 to 1600) and whose bottom wraps the barrel. A steel band round the barrel
//   and cleaning rod at x 1541 to 1554 (the bayonet lug's ring).
// THE BARREL, round: thicker behind the gas block (y 532 to 567) than in front (y 536 to 563). Between the gas
//   tube and the barrel, and between the barrel and the cleaning rod (y 573 to 581), are holes.
// THE FRONT SIGHT: a collar round the barrel (x 1727 to 1793), and the tower: its front straight up, its back
//   sloping up to the rounded top (y 452); the window in it is a hole (the post's guards), the elevation drum a
//   round boss above it.
// THE MUZZLE NUT, a short cylinder (x 1793 to 1818, y 535 to 568), a groove at its back for the detent.

// ---------------------------------------------------------------------------------------------------------
// The buttstock
const BUTT_PLATE = rounded(
  [
    [119, 575],
    [132, 570],
    [158, 760],
    [146, 763],
  ],
  [3, 2, 2, 4],
);
const STOCK_TOP: Point[] = [
  [131, 571],
  [200, 562.5],
  [300, 550.5],
  [380, 542.5],
  [402, 541],
  [418, 545],
  [432, 549],
  [448, 548.5],
  [500, 540],
  [580, 526],
];
const STOCK_FRONT_BOTTOM: Point = [588, 612];
const STOCK_BOTTOM_BACK: Point = [156, 761];
const STOCK =
  `M${fmt(STOCK_TOP[0])} ${smoothCurve(STOCK_TOP, [1, -0.125], [1, -0.175])} ` +
  `L${fmt(STOCK_FRONT_BOTTOM)} L${fmt(STOCK_BOTTOM_BACK)} Z`;
// Its long axis (for the shading): from the butt's middle to the wrist's
const STOCK_SHADE_FROM: Point = [345, 543];
const STOCK_SHADE_TO: Point = [376, 696];

// ---------------------------------------------------------------------------------------------------------
// The receiver
const REC_BACK = 580;
const REC_FRONT = 1086;
const REC_TOP = 517;
const REC_BOTTOM = 607;
const RECEIVER = rounded(
  [
    [REC_BACK - 3, REC_TOP],
    [REC_FRONT, REC_TOP],
    [REC_FRONT, REC_BOTTOM],
    [STOCK_FRONT_BOTTOM[0], REC_BOTTOM],
  ],
  [0, 0, 2, 2],
);
// The dust cover: rounded down at the back, its side to COVER_BOTTOM, cut up to PORT_TOP over the port
const COVER_TOP = 470;
const COVER_BOTTOM = 519;
const COVER_FRONT = 1042;
const PORT_BACK = 888;
const PORT_TOP = 497;
const COVER_REAR: Point[] = [
  [640, COVER_TOP],
  [622, 474.5],
  [604, 488],
  [589, 503],
  [584, 512],
];
const COVER =
  `M${fmt(COVER_REAR[COVER_REAR.length - 1])} L${fmt([584, COVER_BOTTOM])} ` +
  `L${PORT_BACK - 6},${COVER_BOTTOM} C${PORT_BACK - 1},${COVER_BOTTOM} ${PORT_BACK},${COVER_BOTTOM - 4} ${PORT_BACK},${COVER_BOTTOM - 8} ` +
  `L${PORT_BACK},${PORT_TOP + 4} C${PORT_BACK},${PORT_TOP} ${PORT_BACK + 2},${PORT_TOP} ${PORT_BACK + 6},${PORT_TOP} ` +
  `L${COVER_FRONT},${PORT_TOP} L${COVER_FRONT},${COVER_TOP + 3} L${fmt(COVER_REAR[0])} ` +
  smoothCurve(COVER_REAR, [-1, 0], [-0.35, 1]) +
  " Z";
// The crease stamped along the cover's side
const CREASE_Y = 486;
// The cover's lower lip, where it steps out over the receiver's rail
const LIP_Y = 502;
// The port: the bolt carrier in it, and the charging handle's knob at its front
const CARRIER_TOP = PORT_TOP;
const KNOB: Point = [1035, 516];
const KNOB_R = 11;
// The lightening cut over the magazine
const CUT = rounded(
  [
    [919, 548],
    [1076, 548],
    [1076, 598],
    [919, 598],
  ],
  [10, 10, 10, 10],
);
// The safety selector: its pivot, the lever's top and bottom edges, the tab at its front
const SELECTOR_PIVOT: Point = [697, 553];
const SELECTOR_BOSS_R = 17;
const SELECTOR = (() => {
  const p = SELECTOR_PIVOT;
  const r = SELECTOR_BOSS_R;
  return (
    `M${fmt(on(p, r, 110))} ${arc(p, r, 110, 260)} ` +
    `C${fmt([706, 535])} ${fmt([722, 528])} ${fmt([738, 521])} ` +
    `L${fmt([765, 515.5])} L${fmt([858, 515.5])} L${fmt([860, 511])} L${fmt([893, 511])} ` +
    `C${fmt([896, 511])} ${fmt([897, 513])} ${fmt([897, 516])} L${fmt([897, 532])} ` +
    `C${fmt([897, 535])} ${fmt([895, 537])} ${fmt([892, 537])} L${fmt([868, 538])} ` +
    `L${fmt([708, 568])} C${fmt([705, 569])} ${fmt([700, 570])} ${fmt(on(p, r, 110))} Z`
  );
})();
// The lever's folded lower flange, a narrow strip along its bottom edge
const SELECTOR_FLANGE = `M${fmt([868, 538])} L${fmt([708, 568])} L${fmt([712, 561])} L${fmt([866, 531])} Z`;
const PINS: { at: Point; ringed: boolean }[] = [
  { at: [743, 591], ringed: false },
  { at: [780, 589], ringed: false },
  { at: [819, 580], ringed: true },
  { at: [848, 588], ringed: true },
  { at: [869, 525], ringed: true }, // the tab's rivet
];

// ---------------------------------------------------------------------------------------------------------
// The rear sight
const SIGHT_BLOCK = rounded(
  [
    [1038, 519],
    [1038, 471],
    [1140, 469],
    [1170, 466],
    [1171, 517],
  ],
  [0, 3, 10, 3, 0],
);
const LEAF = rounded(
  [
    [1040, 450],
    [1150, 460],
    [1150, 467],
    [1040, 457],
  ],
  [2, 0, 0, 2],
);
const SLIDER: Point = [1053, 455];
const SLIDER_R = 7.5;
const LEAF_CAP: Point = [1156, 462];
const LEAF_CAP_R = 10;

// ---------------------------------------------------------------------------------------------------------
// The handguards, gas tube and gas block
const UPPER_TOP = 464;
const UPPER_BOTTOM = 514;
const UPPER = rounded(
  [
    [1185, UPPER_TOP],
    [1388, UPPER_TOP + 1],
    [1388, UPPER_BOTTOM],
    [1185, UPPER_BOTTOM],
  ],
  [7, 7, 7, 7],
);
const UPPER_REAR_CAP = rounded(
  [
    [1171, 468],
    [1187, 465],
    [1187, 514],
    [1171, 512],
  ],
  [3, 2, 2, 3],
);
const UPPER_FRONT_CAP = rounded(
  [
    [1386, 468],
    [1400, 470],
    [1400, 521],
    [1386, 521],
  ],
  [2, 3, 2, 2],
);
const GAS_TUBE_TOP = 481;
const GAS_TUBE_BOTTOM = 519;
const GAS_TUBE = rounded(
  [
    [1399, GAS_TUBE_TOP],
    [1510, GAS_TUBE_TOP],
    [1510, GAS_TUBE_BOTTOM],
    [1399, GAS_TUBE_BOTTOM],
  ],
  [0, 0, 0, 0],
);
const VENTS: Point[] = [
  [1439, 490],
  [1455, 490],
  [1471, 490],
  [1487, 490],
];
const VENT_R = 3.2;
const GAS_BLOCK =
  `M1505,${GAS_TUBE_TOP} L1550,${GAS_TUBE_TOP} ` +
  `C1560,${GAS_TUBE_TOP} 1566,484 1572,494 ` +
  "C1580,507 1588,521 1598,527 C1604,530 1608,531 1612,533 " +
  "L1612,566 L1553,567 L1553,519 L1505,519 Z";
const BAND = rounded(
  [
    [1541, 526],
    [1554, 526],
    [1554, 585],
    [1541, 585],
  ],
  [3, 3, 4, 4],
);
const LOWER_TOP = 519;
const LOWER =
  `M1101,${LOWER_TOP} L1384,${LOWER_TOP} L1384,570 ` +
  "C1384,580 1379,586 1368,587.5 " +
  smoothCurve(
    [
      [1368, 587.5],
      [1300, 590.5],
      [1220, 592],
      [1160, 596],
      [1101, 605],
    ],
    [-1, 0.02],
    [-1, 0.2],
  ) +
  " Z";
const LOWER_FERRULE = rounded(
  [
    [1086, 518],
    [1102, 518],
    [1102, 606],
    [1088, 604],
  ],
  [2, 0, 3, 4],
);
const LOWER_RETAINER = rounded(
  [
    [1383, 518],
    [1400, 518],
    [1400, 584],
    [1383, 588],
  ],
  [2, 2, 4, 3],
);
// The slot between the handguards, where the lower one's far side shows
const SLOT = rounded(
  [
    [1180, 509],
    [1390, 509],
    [1390, 521],
    [1180, 521],
  ],
  [0, 0, 0, 0],
);

// ---------------------------------------------------------------------------------------------------------
// The barrel, cleaning rod, front sight and muzzle nut
const BARREL_REAR = rounded(
  [
    [1395, 532],
    [1556, 532],
    [1556, 567],
    [1395, 567],
  ],
  [0, 0, 0, 0],
);
const BARREL_FRONT = rounded(
  [
    [1600, 536],
    [1800, 536],
    [1800, 563],
    [1600, 563],
  ],
  [0, 0, 0, 0],
);
const ROD = rounded(
  [
    [1395, 573],
    [1785, 573],
    [1785, 581],
    [1395, 581],
  ],
  [0, 3, 3, 0],
);
const FS_BACK = 1727;
const FS_FRONT = 1793;
const FS_TOP = 452;
const FS_BOTTOM = 579;
const FRONT_SIGHT_BACK_EDGE: Point[] = [
  [FS_BACK, 534],
  [1736, 510],
  [1746, 484],
  [1754, 464],
  [1766, FS_TOP],
];
const FRONT_SIGHT =
  `M${fmt([FS_BACK + 4, FS_BOTTOM])} C${FS_BACK + 1},${FS_BOTTOM} ${FS_BACK},${FS_BOTTOM - 2} ${FS_BACK},${FS_BOTTOM - 6} ` +
  `L${fmt(FRONT_SIGHT_BACK_EDGE[0])} ` +
  smoothCurve(FRONT_SIGHT_BACK_EDGE, [0.3, -1], [1, -0.05]) +
  ` L1786,${FS_TOP} C1789.5,${FS_TOP} 1791,${FS_TOP + 2} 1791,${FS_TOP + 6} ` +
  `L1791,532 L${FS_FRONT},533 L${FS_FRONT},${FS_BOTTOM - 4} ` +
  `C${FS_FRONT},${FS_BOTTOM - 1} ${FS_FRONT - 2},${FS_BOTTOM + 3} ${FS_FRONT - 8},${FS_BOTTOM + 4} ` +
  `L1765,${FS_BOTTOM + 4} L1758,${FS_BOTTOM} Z`;
const FS_WINDOW = rounded(
  [
    [1749, 503],
    [1779, 503],
    [1779, 527],
    [1745, 527],
  ],
  [6, 6, 6, 6],
);
const FS_DRUM: Point = [1773, 481];
const FS_DRUM_R = 10;
const NUT = rounded(
  [
    [1793, 535],
    [1818, 535],
    [1818, 568],
    [1793, 568],
  ],
  [0, 3, 3, 0],
);
const NUT_GROOVE = rounded(
  [
    [1796, 537],
    [1801, 537],
    [1801, 566],
    [1796, 566],
  ],
  [0, 0, 0, 0],
);

// ---------------------------------------------------------------------------------------------------------
// Under the receiver: the pistol grip, trigger, guard and magazine catch
const GRIP_FRONT: Point[] = [
  [719, 606],
  [719, 640],
  [711, 656],
  [694, 672],
  [682, 692],
  [675, 714],
  [671, 742],
  [660, 772],
  [657, 795],
  [650, 809],
  [632, 815],
  [604, 813],
  [586, 804],
  [579, 784],
  [582, 760],
  [590, 728],
  [598, 700],
  [604, 677],
  [606, 650],
  [604, 625],
  [603, 606],
];
const GRIP =
  `M${fmt(GRIP_FRONT[0])} ` + smoothCurve(GRIP_FRONT, [0, 1], [0, -1]) + " Z";
// The grip's shading runs across it, square to its lean (about 14° back)
const GRIP_SHADE_FROM: Point = [590, 700];
const GRIP_SHADE_TO: Point = [676, 721];
const GUARD =
  "M710,654 C717,666 728,671 746,671 L808,671 C818,671 822,666 822,656 L822,606";
const GUARD_WIDTH = 4.5;
const TRIGGER =
  "M735,606 C736,630 750,650 772,658 C775,659 776,655 773,652 C761,642 754,627 753,606 Z";
const CATCH =
  `M822,606 L858,606 L858,646 C858,656 852,662 848,664 L846,690 ` +
  "C845.5,694 840.5,694 840,690 L838,664 C830,662 822,656 822,646 Z";
const CATCH_PIN: Point = [843, 641];

// ---------------------------------------------------------------------------------------------------------
// The magazine: its back and front edges, in pairs (each pair across the magazine, so ribs can be drawn between
// them at fractions of the way across), from its top in the receiver to its bottom corners
const MAG_BACK: Point[] = [
  [866, 604],
  [865, 640],
  [872, 680],
  [888, 725],
  [910, 770],
  [938, 815],
  [975, 862],
  [1020, 908],
  [1072, 948],
];
const MAG_FRONT: Point[] = [
  [978, 604],
  [988, 630],
  [1000, 662],
  [1016, 698],
  [1036, 738],
  [1062, 775],
  [1095, 805],
  [1125, 830],
  [1143, 845],
];
const MAG =
  `M${fmt(MAG_BACK[0])} ` +
  smoothCurve(MAG_BACK, [-0.05, 1], [0.8, 0.6]) +
  ` C1077,951 1082,950 1085,946 L1140,856 C1143,852 1145,848 1143,845 ` +
  `L${fmt(MAG_FRONT[MAG_FRONT.length - 1])} ` +
  smoothCurve([...MAG_FRONT].reverse(), [-0.78, -0.62], [-0.3, -1]) +
  " Z";
/** A point a fraction `t` of the way across the magazine, at its edges' pair `i` */
function magAcross(i: number, t: number): Point {
  const a = MAG_BACK[i];
  const b = MAG_FRONT[i];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
/** A rib down the magazine at `t` across, from pair `from` to `to` (fractions between pairs allowed) */
function magRib(t: number, from: number, to: number): string {
  const points: Point[] = [];
  for (let i = from; i <= to; i++) {
    points.push(magAcross(i, t));
  }
  const dir = (k: number): Point => {
    const a = points[Math.max(0, k - 1)];
    const b = points[Math.min(points.length - 1, k + 1)];
    return [b[0] - a[0], b[1] - a[1]];
  };
  return `M${fmt(points[0])} ${smoothCurve(points, dir(0), dir(points.length - 1))}`;
}
const MAG_RIBS = [0.2, 0.36, 0.52, 0.68];
// The floor plate's seam, parallel to the bottom edge
const MAG_PLATE_SEAM = "M1046,934 L1124,826";

// ---------------------------------------------------------------------------------------------------------
// Colors

/** The wood (Simon's pick, variant B of round 1): the worn photo's dark brown */
export const AK_WOOD: Material = {
  base: "#4a3127",
  dark: "#24160f",
  light: "#6a4a3b",
  highlight: "#86624f",
};
/** The steel (Simon's pick, variant B of round 1): the worn photo's grayer, worn bluing */
export const AK_STEEL: Material = {
  base: "#565851",
  dark: "#2c2d29",
  light: "#73756d",
  highlight: "#8c8e86",
};
/**
 * The magazine: stamped steel, close to the receiver's (Simon: near-black was too dark), only a touch darker and
 * cooler so it separates from the receiver
 */
export const AK_MAGAZINE: Material = {
  base: "#4e514e",
  dark: "#282a28",
  light: "#6a6d69",
  highlight: "#848782",
};

/** A color between two hex colors */
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

const f1 = (v: number) => fixed(v, 1);

/** A gradient from one point to another, in the photo's pixels */
function gradient(
  id: string,
  from: Point,
  to: Point,
  list: [number, string, number?][],
): string {
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f1(from[0])}" y1="${f1(from[1])}" x2="${f1(to[0])}" y2="${f1(to[1])}">
${stops(...list)}
    </linearGradient>`;
}

/** A horizontal cylinder's shading, top to bottom: a lit streak near its top, dark underneath */
function roundShading(id: string, top: number, bottom: number, m: Material) {
  return gradient(
    id,
    [0, top],
    [0, bottom],
    [
      [0, m.dark],
      [0.14, m.light],
      [0.24, m.highlight],
      [0.36, m.light],
      [0.6, m.base],
      [1, m.dark],
    ],
  );
}

// The rim light: the top edges catching the light, a line just inside the silhouette (stroked twice as wide along
// the edge and clipped to the part), so the dark gun holds on a dark floor
const RIM_LIGHT = 1.6; // 0.8 mm, as the Glock's
// The outline round the silhouette, OUTLINE_MM wide (the set's rule), in each part's own dark: each part's shape
// stroked twice as wide under everything, so only the outer half shows
const OUTLINE_MM = 0.4;
const OUTLINE = OUTLINE_MM / MM_PER_PX;

function drawSide(options: AkOptions = {}): string {
  const S: Material = { ...AK_STEEL, ...options.steel };
  const W: Material = { ...AK_WOOD, ...options.wood };
  const M: Material = { ...AK_MAGAZINE, ...options.magazine };
  const B: Material = { ...BRIGHT_STEEL, ...options.bright };
  const rim = options.rimLight ?? RIM_LIGHT;
  const outlineParts: [string, string][] = [
    [BUTT_PLATE, S.dark],
    [STOCK, W.dark],
    [GRIP, W.dark],
    [MAG, M.dark],
    [CATCH, S.dark],
    [TRIGGER, S.dark],
    [RECEIVER, S.dark],
    [COVER, S.dark],
    [SIGHT_BLOCK, S.dark],
    [LEAF, S.dark],
    [LOWER_FERRULE, S.dark],
    [LOWER, W.dark],
    [LOWER_RETAINER, S.dark],
    [UPPER_REAR_CAP, S.dark],
    [UPPER, W.dark],
    [UPPER_FRONT_CAP, S.dark],
    [GAS_TUBE, S.dark],
    [GAS_BLOCK, S.dark],
    [BAND, S.dark],
    [BARREL_REAR, S.dark],
    [BARREL_FRONT, S.dark],
    [ROD, S.dark],
    [FRONT_SIGHT, S.dark],
    [NUT, S.dark],
  ];
  const outline =
    options.outline === false
      ? ""
      : `<!-- The outline: each part's shape stroked under everything, so only its outer half shows (and the guard's
       strip, a little wider than itself) -->
  <g id="ak-47-outline" fill="none" stroke-width="${f1(OUTLINE * 2)}">
    ${outlineParts.map(([d, c]) => `<path d="${d}" stroke="${c}"/>`).join("\n    ")}
    <path d="${GUARD}" stroke="${S.dark}" stroke-width="${f1(GUARD_WIDTH + OUTLINE * 2)}"/>
    <circle cx="${SLIDER[0]}" cy="${SLIDER[1]}" r="${SLIDER_R}" stroke="${S.dark}"/>
    <circle cx="${LEAF_CAP[0]}" cy="${LEAF_CAP[1]}" r="${LEAF_CAP_R}" stroke="${S.dark}"/>
  </g>`;
  const ribs = MAG_RIBS.map((t) => magRib(t, 1, 6));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1200" viewBox="0 0 1920 1200" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  <defs>
    <!-- The stock, across its long axis: lit along its top, its slab side, darker toward its bottom -->
    ${gradient("ak-47-stock-shading", STOCK_SHADE_FROM, STOCK_SHADE_TO, [
      [0, W.base],
      [0.06, W.light],
      [0.3, mix(W.light, W.base, 0.4)],
      [0.75, W.base],
      [1, mix(W.base, W.dark, 0.6)],
    ])}
    <!-- The grip, across it, square to its lean: the back lit, the front rounding into shadow -->
    ${gradient("ak-47-grip-shading", GRIP_SHADE_FROM, GRIP_SHADE_TO, [
      [0, W.base],
      [0.1, W.light],
      [0.45, mix(W.light, W.base, 0.5)],
      [0.8, W.base],
      [1, mix(W.base, W.dark, 0.6)],
    ])}
    <!-- The handguards: the upper one round, the lower one's side flat, lit along its top lip and rounding away
         underneath -->
    ${roundShading("ak-47-upper-shading", UPPER_TOP, UPPER_BOTTOM, W)}
    ${gradient(
      "ak-47-lower-shading",
      [0, LOWER_TOP],
      [0, 605],
      [
        [0, W.dark],
        [0.06, W.highlight],
        [0.14, W.light],
        [0.55, mix(W.light, W.base, 0.6)],
        [0.85, W.base],
        [1, W.dark],
      ],
    )}
    <!-- The dust cover, down its side: its rounded top lit, the crease, then the side -->
    ${gradient(
      "ak-47-cover-shading",
      [0, COVER_TOP],
      [0, COVER_BOTTOM],
      [
        [0, S.highlight],
        [0.1, S.light],
        [0.24, S.base],
        [(CREASE_Y - 2 - COVER_TOP) / (COVER_BOTTOM - COVER_TOP), S.base],
        [(CREASE_Y - COVER_TOP) / (COVER_BOTTOM - COVER_TOP), S.dark],
        [(CREASE_Y + 2 - COVER_TOP) / (COVER_BOTTOM - COVER_TOP), S.light],
        [0.7, mix(S.light, S.base, 0.5)],
        [1, mix(S.base, S.dark, 0.4)],
      ],
    )}
    <!-- The receiver's side: in the dust cover's shadow just under it, then lit, darker toward its bottom -->
    ${gradient(
      "ak-47-receiver-shading",
      [0, REC_TOP],
      [0, REC_BOTTOM],
      [
        [0, S.dark],
        [0.07, S.dark],
        [0.14, S.light],
        [0.5, mix(S.light, S.base, 0.6)],
        [1, mix(S.base, S.dark, 0.4)],
      ],
    )}
    ${gradient(
      "ak-47-carrier-shading",
      [0, CARRIER_TOP],
      [0, COVER_BOTTOM + 1],
      [
        [0, S.dark],
        [0.25, S.light],
        [0.4, S.highlight],
        [0.55, S.base],
        [1, S.dark],
      ],
    )}
    ${gradient(
      "ak-47-block-shading",
      [0, 466],
      [0, 519],
      [
        [0, S.highlight],
        [0.08, S.light],
        [0.5, S.base],
        [1, mix(S.base, S.dark, 0.5)],
      ],
    )}
    ${gradient(
      "ak-47-selector-shading",
      [0, 511],
      [0, 570],
      [
        [0, S.highlight],
        [0.12, S.light],
        [1, S.base],
      ],
    )}
    ${gradient(
      "ak-47-cut-shading",
      [0, 548],
      [0, 598],
      [
        [0, S.dark],
        [0.22, S.dark],
        [0.4, mix(S.base, S.dark, 0.3)],
        [0.9, S.base],
        [1, S.light],
      ],
    )}
    ${roundShading("ak-47-tube-shading", GAS_TUBE_TOP, GAS_TUBE_BOTTOM, S)}
    ${roundShading("ak-47-barrel-rear-shading", 532, 567, S)}
    ${roundShading("ak-47-barrel-front-shading", 536, 563, S)}
    ${roundShading("ak-47-rod-shading", 573, 581, S)}
    ${roundShading("ak-47-nut-shading", 535, 568, S)}
    ${roundShading("ak-47-band-shading", 526, 585, S)}
    ${roundShading("ak-47-cap-shading", 465, 521, S)}
    ${gradient(
      "ak-47-lower-cap-shading",
      [0, 518],
      [0, 606],
      [
        [0, S.highlight],
        [0.08, S.light],
        [0.5, S.base],
        [1, S.dark],
      ],
    )}
    ${gradient(
      "ak-47-gas-block-shading",
      [0, GAS_TUBE_TOP],
      [0, 567],
      [
        [0, S.dark],
        [0.06, S.highlight],
        [0.16, S.light],
        [0.5, S.base],
        [1, S.dark],
      ],
    )}
    ${gradient(
      "ak-47-front-sight-shading",
      [FS_BACK, 0],
      [FS_FRONT, 0],
      [
        [0, S.light],
        [0.35, S.base],
        [1, mix(S.base, S.dark, 0.5)],
      ],
    )}
    ${gradient(
      "ak-47-butt-plate-shading",
      [119, 0],
      [158, 0],
      [
        [0, S.dark],
        [0.4, S.light],
        [1, S.base],
      ],
    )}
    <!-- The magazine, across it from its back to its front: a flat stamped side, a little lit toward the back -->
    ${gradient(
      "ak-47-mag-shading",
      [880, 640],
      [1010, 610],
      [
        [0, mix(M.base, M.dark, 0.3)],
        [0.15, M.light],
        [0.5, M.base],
        [1, mix(M.base, M.dark, 0.4)],
      ],
    )}
    <clipPath id="ak-47-stock-clip"><path d="${STOCK}"/></clipPath>
    <clipPath id="ak-47-grip-clip"><path d="${GRIP}"/></clipPath>
    <clipPath id="ak-47-receiver-clip"><path d="${RECEIVER}"/></clipPath>
    <clipPath id="ak-47-cover-clip"><path d="${COVER}"/></clipPath>
    <clipPath id="ak-47-mag-clip"><path d="${MAG}"/></clipPath>
    <clipPath id="ak-47-upper-clip"><path d="${UPPER}"/></clipPath>
    <clipPath id="ak-47-lower-clip"><path d="${LOWER}"/></clipPath>
    <clipPath id="ak-47-block-clip"><path d="${SIGHT_BLOCK}"/></clipPath>
    <clipPath id="ak-47-front-sight-clip"><path d="${FRONT_SIGHT}"/></clipPath>
    <clipPath id="ak-47-gas-block-clip"><path d="${GAS_BLOCK}"/></clipPath>
  </defs>
  ${outline}
  <!-- Behind the barrel's front parts: the cleaning rod under the barrel, then the barrel -->
  <g id="ak-47-rod">
    <path d="${ROD}" fill="url(#ak-47-rod-shading)"/>
  </g>
  <g id="ak-47-barrel">
    <path d="${BARREL_REAR}" fill="url(#ak-47-barrel-rear-shading)"/>
    <path d="${BARREL_FRONT}" fill="url(#ak-47-barrel-front-shading)"/>
  </g>
  <!-- The muzzle nut, with the detent's groove at its back -->
  <g id="ak-47-muzzle-nut">
    <path d="${NUT}" fill="url(#ak-47-nut-shading)"/>
    <path d="${NUT_GROOVE}" fill="${S.dark}"/>
  </g>
  <!-- The front sight: the tower and its collar round the barrel, the window through it (a hole), the elevation
       drum above it -->
  <g id="ak-47-front-sight">
    <path d="${FRONT_SIGHT} ${FS_WINDOW}" fill="url(#ak-47-front-sight-shading)"/>
    <g clip-path="url(#ak-47-front-sight-clip)" fill="none">
      <path d="M${FS_BACK},534 ${smoothCurve(FRONT_SIGHT_BACK_EDGE, [0.3, -1], [1, -0.05])} L1791,${FS_TOP}" stroke="${S.highlight}" stroke-width="${f1(rim * 2)}"/>
      <path d="M${FS_BACK},532.5 L${FS_FRONT},532.5" stroke="${S.dark}" stroke-width="2.5"/>
      <path d="M${FS_BACK},577 L${FS_FRONT},577" stroke="${S.dark}" stroke-width="4" opacity="0.6"/>
    </g>
    <path d="${FS_WINDOW}" fill="none" stroke="${S.dark}" stroke-width="2"/>
    <path d="M1751,526 L1777,526" stroke="${S.light}" stroke-width="1.5" fill="none"/>
    <circle cx="${FS_DRUM[0]}" cy="${FS_DRUM[1]}" r="${FS_DRUM_R}" fill="${S.base}" stroke="${S.dark}" stroke-width="2"/>
    <path d="M${fmt(on(FS_DRUM, FS_DRUM_R - 2, 190))} ${arc(FS_DRUM, FS_DRUM_R - 2, 190, 290)}" stroke="${S.light}" stroke-width="2" fill="none"/>
  </g>
  <!-- The band round the barrel and cleaning rod, then the gas block over the barrel -->
  <g id="ak-47-band">
    <path d="${BAND}" fill="url(#ak-47-band-shading)"/>
  </g>
  <g id="ak-47-gas-block">
    <path d="${GAS_BLOCK}" fill="url(#ak-47-gas-block-shading)"/>
    <g clip-path="url(#ak-47-gas-block-clip)" fill="none">
      <path d="M1505,${GAS_TUBE_TOP} L1550,${GAS_TUBE_TOP} C1560,${GAS_TUBE_TOP} 1566,484 1572,494 C1580,507 1588,521 1598,527 C1604,530 1608,531 1612,533" stroke="${S.highlight}" stroke-width="${f1(rim * 2)}"/>
      <path d="M1553,519 L1553,567" stroke="${S.dark}" stroke-width="3"/>
    </g>
  </g>
  <!-- The gas tube, its vent holes, and its joint into the block -->
  <g id="ak-47-gas-tube">
    <path d="${GAS_TUBE}" fill="url(#ak-47-tube-shading)"/>
    ${VENTS.map((v) => `<circle cx="${v[0]}" cy="${v[1]}" r="${VENT_R}" fill="${S.dark}"/>`).join("\n    ")}
    <path d="M1505,${GAS_TUBE_TOP + 1} L1505,${GAS_TUBE_BOTTOM - 1}" stroke="${S.dark}" stroke-width="2.5" fill="none"/>
  </g>
  <!-- The slot between the handguards: the lower one's far side, in shadow -->
  <path id="ak-47-slot" d="${SLOT}" fill="${mix(W.dark, "#000000", 0.3)}"/>
  <!-- The lower handguard, between its ferrule and retainer -->
  <g id="ak-47-lower-handguard">
    <path d="${LOWER}" fill="url(#ak-47-lower-shading)"/>
  </g>
  <g id="ak-47-lower-ferrule">
    <path d="${LOWER_FERRULE}" fill="url(#ak-47-lower-cap-shading)"/>
    <path d="${LOWER_RETAINER}" fill="url(#ak-47-lower-cap-shading)"/>
    <path d="M1384,520 L1384,586" stroke="${S.dark}" stroke-width="2" fill="none"/>
    <path d="M1101,520 L1101,605" stroke="${S.dark}" stroke-width="2" fill="none"/>
  </g>
  <!-- The upper handguard on the gas tube, between its caps -->
  <g id="ak-47-upper-handguard">
    <path d="${UPPER}" fill="url(#ak-47-upper-shading)"/>
    <path d="${UPPER_REAR_CAP}" fill="url(#ak-47-cap-shading)"/>
    <path d="${UPPER_FRONT_CAP}" fill="url(#ak-47-cap-shading)"/>
  </g>
  <!-- The magazine, up into the receiver: ribs stamped down its side (each a lit edge and a shadowed one), the floor
       plate's seam -->
  <g id="ak-47-magazine">
    <path d="${MAG}" fill="url(#ak-47-mag-shading)"/>
    <g clip-path="url(#ak-47-mag-clip)" fill="none">
      ${ribs.map((d) => `<path d="${d}" stroke="${M.dark}" stroke-width="7" stroke-linecap="round"/>`).join("\n      ")}
      ${ribs.map((d) => `<path d="${d}" stroke="${M.light}" stroke-width="3.5" stroke-linecap="round"/>`).join("\n      ")}
      <path d="${MAG_PLATE_SEAM}" stroke="${M.dark}" stroke-width="3"/>
      <path d="M1050,936 L1128,828" stroke="${M.light}" stroke-width="1.5"/>
      <path d="M${fmt(MAG_BACK[0])} ${smoothCurve(MAG_BACK, [-0.05, 1], [0.8, 0.6])}" stroke="${M.highlight}" stroke-width="${f1(rim * 2)}" opacity="0.8"/>
      <path d="M${fmt(MAG_FRONT[0])} ${smoothCurve(MAG_FRONT, [0.3, 1], [0.78, 0.62])}" stroke="${M.dark}" stroke-width="6"/>
    </g>
  </g>
  <!-- The magazine catch, its paddle down behind the magazine -->
  <g id="ak-47-catch">
    <path d="${CATCH}" fill="${S.base}"/>
    <path d="M824,610 L856,610" stroke="${S.dark}" stroke-width="5" fill="none"/>
    <path d="M824,614 L824,646" stroke="${S.light}" stroke-width="2" fill="none"/>
    <circle cx="${CATCH_PIN[0]}" cy="${CATCH_PIN[1]}" r="6" fill="${S.dark}"/>
    <circle cx="${CATCH_PIN[0]}" cy="${CATCH_PIN[1]}" r="3.5" fill="${S.light}"/>
  </g>
  <!-- The trigger, behind the guard -->
  <g id="ak-47-trigger">
    <path d="${TRIGGER}" fill="${S.base}"/>
    <path d="M737,609 C738,630 751,648 770,656" stroke="${S.light}" stroke-width="2.5" fill="none"/>
  </g>
  <!-- The trigger guard, a stamped strip seen edge on -->
  <path id="ak-47-guard" d="${GUARD}" stroke="${B.dark}" stroke-width="${GUARD_WIDTH}" fill="none"/>
  <path d="${GUARD}" stroke="${B.base}" stroke-width="${GUARD_WIDTH - 2}" fill="none"/>
  <!-- The pistol grip -->
  <g id="ak-47-grip">
    <path d="${GRIP}" fill="url(#ak-47-grip-shading)"/>
    <g clip-path="url(#ak-47-grip-clip)" fill="none">
      <path d="M600,608 L722,608" stroke="${W.dark}" stroke-width="12" opacity="0.7"/>
    </g>
  </g>
  <!-- The buttstock and its steel butt plate -->
  <g id="ak-47-stock">
    <path d="${STOCK}" fill="url(#ak-47-stock-shading)"/>
    <g clip-path="url(#ak-47-stock-clip)" fill="none">
      <path d="M${fmt(STOCK_TOP[0])} ${smoothCurve(STOCK_TOP, [1, -0.125], [1, -0.175])}" stroke="${W.highlight}" stroke-width="${f1(rim * 2)}"/>
      <path d="M${fmt(STOCK_BOTTOM_BACK)} L${fmt(STOCK_FRONT_BOTTOM)}" stroke="${W.dark}" stroke-width="8" opacity="0.6"/>
      <path d="M578,520 L590,620" stroke="${W.dark}" stroke-width="8" opacity="0.5"/>
    </g>
  </g>
  <g id="ak-47-butt-plate">
    <path d="${BUTT_PLATE}" fill="url(#ak-47-butt-plate-shading)"/>
  </g>
  <!-- The receiver's side: the lightening cut, the pins, and the selector over it -->
  <g id="ak-47-receiver">
    <path d="${RECEIVER}" fill="url(#ak-47-receiver-shading)"/>
    <g clip-path="url(#ak-47-receiver-clip)" fill="none">
      <!-- The rear socket round the stock's front, and the trunnion's seam at the front -->
      <path d="M583,520 L592,607" stroke="${S.dark}" stroke-width="3"/>
      <path d="M1088,520 L1088,607" stroke="${S.dark}" stroke-width="2.5"/>
      <path d="M${REC_BACK},${REC_BOTTOM - 2} L${REC_FRONT},${REC_BOTTOM - 2}" stroke="${S.dark}" stroke-width="4"/>
    </g>
    <path d="${CUT}" fill="url(#ak-47-cut-shading)"/>
    <path d="M926,598 L1069,598" stroke="${S.highlight}" stroke-width="2" fill="none"/>
    ${PINS.map(({ at, ringed }) =>
      ringed
        ? `<circle cx="${at[0]}" cy="${at[1]}" r="6.5" fill="${S.dark}"/><circle cx="${at[0]}" cy="${at[1]}" r="4" fill="${S.light}"/>`
        : `<circle cx="${at[0]}" cy="${at[1]}" r="5.5" fill="${B.base}" stroke="${S.dark}" stroke-width="1.5"/>`,
    ).join("\n    ")}
  </g>
  <!-- The selector, proud of the receiver: its shadow, the lever, its folded flange, its round pivot -->
  <g id="ak-47-selector">
    <path d="M897,537 L868,540 L708,570 C700,573 690,572 684,566" stroke="${S.dark}" stroke-width="6" fill="none" opacity="0.6"/>
    <path d="${SELECTOR}" fill="url(#ak-47-selector-shading)" stroke="${S.dark}" stroke-width="1.5"/>
    <path d="${SELECTOR_FLANGE}" fill="${mix(S.base, S.dark, 0.5)}"/>
    <circle cx="${SELECTOR_PIVOT[0]}" cy="${SELECTOR_PIVOT[1]}" r="10" fill="${B.base}" stroke="${S.dark}" stroke-width="2"/>
    <path d="M${fmt(on(SELECTOR_PIVOT, 7, 200))} ${arc(SELECTOR_PIVOT, 7, 200, 290)}" stroke="${B.highlight}" stroke-width="2.5" fill="none"/>
    <circle cx="${PINS[4].at[0]}" cy="${PINS[4].at[1]}" r="4" fill="${S.dark}"/>
  </g>
  <!-- The port: the bolt carrier under the dust cover, and the charging handle's knob -->
  <g id="ak-47-bolt-carrier">
    <path d="M${PORT_BACK},${CARRIER_TOP} L${COVER_FRONT},${CARRIER_TOP} L${COVER_FRONT},${COVER_BOTTOM + 1} L${PORT_BACK},${COVER_BOTTOM + 1} Z" fill="url(#ak-47-carrier-shading)"/>
    <path d="M${PORT_BACK},${KNOB[1]} L${KNOB[0]},${KNOB[1]}" stroke="${S.dark}" stroke-width="5" fill="none"/>
    <circle cx="${KNOB[0]}" cy="${KNOB[1]}" r="${KNOB_R + 1.5}" fill="${S.dark}"/>
    <circle cx="${KNOB[0]}" cy="${KNOB[1]}" r="${KNOB_R}" fill="${S.base}"/>
    <path d="M${fmt(on(KNOB, KNOB_R - 3, 190))} ${arc(KNOB, KNOB_R - 3, 190, 300)}" stroke="${S.highlight}" stroke-width="3" fill="none"/>
  </g>
  <!-- The dust cover, over the receiver's top: its lit top, the stamped crease, a shadow along its bottom edge -->
  <g id="ak-47-dust-cover">
    <path d="${COVER}" fill="url(#ak-47-cover-shading)"/>
    <g clip-path="url(#ak-47-cover-clip)" fill="none">
      <path d="M${fmt(COVER_REAR[COVER_REAR.length - 1])} ${smoothCurve([...COVER_REAR].reverse(), [0.35, -1], [1, 0])} L${COVER_FRONT},${COVER_TOP}" stroke="${S.highlight}" stroke-width="${f1(rim * 2)}"/>
      <path d="M584,${COVER_BOTTOM - 1} L${PORT_BACK},${COVER_BOTTOM - 1}" stroke="${S.dark}" stroke-width="3"/>
      <path d="M${PORT_BACK},${PORT_TOP + 1} L${COVER_FRONT},${PORT_TOP + 1}" stroke="${S.dark}" stroke-width="2.5"/>
      <!-- The cover's lower lip, a step out over the receiver's rail: lit along its top, in shadow under it -->
      <path d="M592,${LIP_Y} L${PORT_BACK},${LIP_Y}" stroke="${S.dark}" stroke-width="2.5"/>
      <path d="M592,${LIP_Y + 2} L${PORT_BACK},${LIP_Y + 2}" stroke="${S.light}" stroke-width="2"/>
    </g>
  </g>
  <!-- The rear sight: the block on the trunnion, the leaf lying on it with its slider, the leaf spring's cap -->
  <g id="ak-47-rear-sight">
    <path d="${SIGHT_BLOCK}" fill="url(#ak-47-block-shading)"/>
    <g clip-path="url(#ak-47-block-clip)" fill="none">
      <path d="M1038,471 L1140,469 C1150,468 1160,467 1170,466" stroke="${S.highlight}" stroke-width="${f1(rim * 2)}"/>
      <path d="M1042,519 L1042,472" stroke="${S.dark}" stroke-width="3"/>
      <path d="M1040,516 L1171,516" stroke="${S.dark}" stroke-width="4" opacity="0.7"/>
    </g>
    <circle cx="${LEAF_CAP[0]}" cy="${LEAF_CAP[1]}" r="${LEAF_CAP_R}" fill="${S.base}"/>
    <path d="M${fmt(on(LEAF_CAP, LEAF_CAP_R - 3, 190))} ${arc(LEAF_CAP, LEAF_CAP_R - 3, 190, 300)}" stroke="${S.highlight}" stroke-width="3" fill="none"/>
    <path d="${LEAF}" fill="${S.light}"/>
    <path d="M1042,451.5 L1148,461.5" stroke="${S.highlight}" stroke-width="1.5" fill="none"/>
    <circle cx="${SLIDER[0]}" cy="${SLIDER[1]}" r="${SLIDER_R}" fill="${S.base}"/>
    <circle cx="${SLIDER[0]}" cy="${SLIDER[1]}" r="${SLIDER_R - 2.5}" fill="none" stroke="${S.dark}" stroke-width="2" stroke-dasharray="1.5 1.5"/>
    <path d="M${fmt(on(SLIDER, SLIDER_R - 1, 190))} ${arc(SLIDER, SLIDER_R - 1, 190, 290)}" stroke="${S.highlight}" stroke-width="1.5" fill="none"/>
  </g>
</svg>`;
}

// ---------------------------------------------------------------------------------------------------------
// The top view: the gun as it's held, seen from above, muzzle along +x and its right side +y (down the page), in
// millimeters about its middle on the bore, at the same scale as the side view. Lengths along the gun are the side
// view's numbers (sx converts its photo's pixels); widths are the real gun's.
//
// Widths. From the 3D model's top view (`model ak-47 --from +y --up -x`, references/ak-47/model-py.png, 0.377 mm a
// pixel along the gun when its 2307 px are 870 mm), checked against the side view where a part is round (a round
// part is as wide as it's tall) and against the real gun:
//   - The stock: 43 mm at the butt in the model; the real butt plate is about 42. It tapers to about 34 at the
//     wrist (the model keeps it nearly straight; the real stock narrows into the receiver's socket).
//   - The receiver: 42.6 mm in the model over its side rails and rivet heads, but the model's round parts come out
//     about 17% fatter than the side view's (its barrel 16.2 mm against the side view's 13.8), so 36 mm; the
//     milled receiver is about 1.4" (36 mm). The dust cover on top of it, a dome, 32 (the model's 34, less its
//     overstatement, against the receiver's 36: about 2 mm in from each side, as the model shows).
//   - The rear sight block: 28 mm (the model's 30). The leaf on it 15, its slider 19.
//   - The lower handguard: 38 mm at its back to 34 at its front (the model's 39 to 34, a U round the barrel that
//     narrows forward). The upper handguard over the gas tube: 30 (round, a little narrower than it's tall in the
//     side view, 25 mm; the model draws them as one). The steel caps and ferrules a little wider than the wood.
//   - The gas tube 19.5 and the barrel 17.9 behind the gas block and 13.8 in front of it, the muzzle nut 16.9: as
//     tall as the side view has them, since they're round. The gas block 22 (the model's 20 under its
//     overstatement is about 17; the block is wider than the tube it holds, so 22 as the old art's proportions).
//     The front sight's collar 20, its two ears 2 mm thick either side of the post.
//   - The safety lever lies along the receiver's right side, standing about 2.5 mm out, its pivot boss and its
//     tab about 4.5. The charging handle sticks out of the right side by about 22 mm to the end of its knob (the
//     model's 28, less its overstatement), its knob 11 mm across (the side view's).
//   - Under the receiver and out of sight from above: the pistol grip (about 30 mm wide), the trigger guard and the
//     magazine (about 30 mm thick, narrower than the receiver, and its forward curve under the lower handguard).
//
// What moves: the charging handle, on the bolt carrier, straight back with each shot, its stroke the carrier's.
// It's drawn under the receiver, so its root goes into the receiver's side. Nothing shows under it when it's back:
// it runs along the outside of the receiver, over the selector's lever (which lies flat), so it uncovers only the
// receiver's side.

/** A length along the gun from the side view's pixels, in millimeters from the gun's middle */
const sx = (px: number) => (px - ORIGIN[0]) * MM_PER_PX;

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
function across(
  id: string,
  half: number,
  list: [number, string][],
  center = 0,
): string {
  return [
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${t1(center - half)}" x2="0" y2="${t1(center + half)}">`,
    ...list.map(([o, c]) => `      <stop offset="${o}" stop-color="${c}"/>`),
    "    </linearGradient>",
  ].join("\n    ");
}

/** A round part's shading from above: dark at its sides, a highlight along its top */
function roundAcross(m: Material): [number, string][] {
  return [
    [0, m.dark],
    [0.2, m.base],
    [0.4, m.light],
    [0.5, m.highlight],
    [0.62, m.light],
    [0.85, m.base],
    [1, m.dark],
  ];
}

// Lengths, from the side view
const T_BUTT = sx(119);
const T_BUTT_PLATE = sx(132);
const T_STOCK_FRONT = sx(582);
const T_REC_BACK = sx(578);
const T_REC_FRONT = sx(REC_FRONT);
const T_COVER_BACK = sx(586);
const T_COVER_FRONT = sx(COVER_FRONT);
const T_BLOCK_BACK = sx(1038);
const T_BLOCK_FRONT = sx(1171);
const T_LEAF = [sx(1040), sx(1150)] as const;
const T_SLIDER = [sx(1046), sx(1060)] as const;
const T_LEAF_CAP = [sx(1146), sx(1167)] as const;
const T_FERRULE = [sx(1086), sx(1101)] as const;
const T_LOWER = [sx(1101), sx(1384)] as const;
const T_RETAINER = [sx(1384), sx(1400)] as const;
const T_UPPER_REAR_CAP = [sx(1171), sx(1187)] as const;
const T_UPPER = [sx(1187), sx(1388)] as const;
const T_UPPER_FRONT_CAP = [sx(1386), sx(1400)] as const;
const T_TUBE = [sx(1399), sx(1510)] as const;
const T_GAS_BLOCK = [sx(1505), sx(1612)] as const;
const T_GAS_SLOPE = sx(1556); // where its top slopes down to the barrel
const T_BARREL_REAR = [sx(1395), sx(1600)] as const;
const T_BARREL_FRONT = [sx(1600), sx(1800)] as const;
const T_SIGHT_COLLAR = [sx(FS_BACK), sx(FS_FRONT)] as const;
const T_SIGHT_EARS = [sx(1752), sx(1791)] as const;
const T_NUT = [sx(1793), sx(1818)] as const;
const T_NUT_GROOVE = [sx(1796), sx(1801)] as const;
const T_HANDLE_X = sx(KNOB[0]);
const T_SELECTOR = [sx(690), sx(897)] as const;
const T_SELECTOR_BOSS = [
  sx(SELECTOR_PIVOT[0] - 14),
  sx(SELECTOR_PIVOT[0] + 14),
] as const;
const T_SELECTOR_TAB = [sx(860), sx(897)] as const;
const T_SPRING_BUTTON = [sx(598), sx(612)] as const; // the recoil spring guide's catch, through the cover's back
// Half widths
const T_BUTT_HALF = 21;
const T_WRIST_HALF = 17;
const T_REC_HALF = 18;
const T_COVER_HALF = 16;
const T_BLOCK_HALF = 14;
const T_LEAF_HALF = 7.5;
const T_SLIDER_HALF = 9.5;
const T_LOWER_HALF: [number, number] = [19, 17];
const T_FERRULE_HALF = 19.5;
const T_RETAINER_HALF = 18;
const T_UPPER_HALF = 15;
const T_CAP_HALF = 15.5;
const T_TUBE_HALF = 9.75;
const T_GAS_BLOCK_HALF = 11;
const T_BARREL_REAR_HALF = 8.95;
const T_BARREL_FRONT_HALF = 6.9;
const T_COLLAR_HALF = 10;
const T_EAR = 2; // the front sight's ears' thickness
const T_NUT_HALF = 8.45;
const T_SELECTOR_OUT = 2.5;
const T_SELECTOR_BOSS_OUT = 4.5;
const T_HANDLE_OUT = 22; // from the receiver's side to the end of the knob
const T_KNOB_R = 5.5;
const T_STEM_HALF = 2.6;
const T_OUTLINE = OUTLINE_MM;

// The stock: tapering from the butt to the wrist, its butt's corners rounded
const T_STOCK =
  `M${tp(T_BUTT_PLATE, -T_BUTT_HALF)} L${tp(T_STOCK_FRONT, -T_WRIST_HALF)} L${tp(T_STOCK_FRONT, T_WRIST_HALF)} ` +
  `L${tp(T_BUTT_PLATE, T_BUTT_HALF)} Z`;
const T_PLATE = tbox(
  T_BUTT,
  -T_BUTT_HALF - 0.3,
  T_BUTT_PLATE + 0.5,
  T_BUTT_HALF + 0.3,
  [5, 0, 0, 5],
);
// The lower handguard, narrowing forward
const T_LOWER_PATH =
  `M${tp(T_LOWER[0], -T_LOWER_HALF[0])} L${tp(T_LOWER[1], -T_LOWER_HALF[1])} L${tp(T_LOWER[1], T_LOWER_HALF[1])} ` +
  `L${tp(T_LOWER[0], T_LOWER_HALF[0])} Z`;
// The charging handle: its stem out of the receiver's side, swept a little back, and the knob on its end
const T_KNOB_C: [number, number] = [
  T_HANDLE_X - 2,
  T_REC_HALF + T_HANDLE_OUT - T_KNOB_R,
];
const T_STEM =
  `M${tp(T_HANDLE_X - T_STEM_HALF, T_REC_HALF - 4)} L${tp(T_HANDLE_X + T_STEM_HALF, T_REC_HALF - 4)} ` +
  `L${tp(T_KNOB_C[0] + T_STEM_HALF, T_KNOB_C[1])} L${tp(T_KNOB_C[0] - T_STEM_HALF, T_KNOB_C[1])} Z`;
const T_KNOB = tbox(
  T_KNOB_C[0] - T_KNOB_R,
  T_KNOB_C[1] - T_KNOB_R - 2,
  T_KNOB_C[0] + T_KNOB_R,
  T_KNOB_C[1] + T_KNOB_R,
  [3, 3, 4, 4],
);
// The gas block from above: its flat top, then the slope down to the barrel, lit, rounding off at the front
const T_GAS_BLOCK_PATH = tbox(
  T_GAS_BLOCK[0],
  -T_GAS_BLOCK_HALF,
  T_GAS_BLOCK[1],
  T_GAS_BLOCK_HALF,
  [0, 4, 4, 0],
);
const T_GAS_SLOPE_PATH = tbox(
  T_GAS_SLOPE,
  -T_GAS_BLOCK_HALF + 1.2,
  T_GAS_BLOCK[1] - 1,
  T_GAS_BLOCK_HALF - 1.2,
  [0, 3, 3, 0],
);
// The front sight from above: the collar round the barrel, the two ears and the post between them
const T_COLLAR = tbox(
  T_SIGHT_COLLAR[0],
  -T_COLLAR_HALF,
  T_SIGHT_COLLAR[1],
  T_COLLAR_HALF,
  2,
);
const T_EARS = [
  tbox(
    T_SIGHT_EARS[0],
    -T_COLLAR_HALF,
    T_SIGHT_EARS[1],
    -T_COLLAR_HALF + T_EAR,
    [1, 1, 0, 0],
  ),
  tbox(
    T_SIGHT_EARS[0],
    T_COLLAR_HALF - T_EAR,
    T_SIGHT_EARS[1],
    T_COLLAR_HALF,
    [0, 0, 1, 1],
  ),
];
const T_POST = tbox(sx(1770), -1.2, sx(1778), 1.2, 0.6);
// The selector's lever along the receiver's right side: its boss at the back, the tab at the front
const T_SELECTOR_PATH =
  `M${tp(T_SELECTOR_BOSS[0], T_REC_HALF)} L${tp(T_SELECTOR_BOSS[0] + 2, T_REC_HALF + T_SELECTOR_BOSS_OUT)} ` +
  `L${tp(T_SELECTOR_BOSS[1], T_REC_HALF + T_SELECTOR_BOSS_OUT)} L${tp(T_SELECTOR_BOSS[1] + 4, T_REC_HALF + T_SELECTOR_OUT)} ` +
  `L${tp(T_SELECTOR_TAB[0], T_REC_HALF + T_SELECTOR_OUT)} L${tp(T_SELECTOR_TAB[0] + 2, T_REC_HALF + T_SELECTOR_BOSS_OUT)} ` +
  `L${tp(T_SELECTOR_TAB[1] - 1.5, T_REC_HALF + T_SELECTOR_BOSS_OUT)} L${tp(T_SELECTOR_TAB[1], T_REC_HALF + 2)} ` +
  `L${tp(T_SELECTOR_TAB[1], T_REC_HALF)} Z`;

function drawTop(options: AkOptions = {}): string {
  const S: Material = { ...AK_STEEL, ...options.steel };
  const W: Material = { ...AK_WOOD, ...options.wood };
  const outline = options.outline !== false;
  const minX = T_BUTT - 1;
  const maxX = T_NUT[1] + 1;
  const half = T_REC_HALF + T_HANDLE_OUT + 1;
  const width = t1(maxX - minX);
  const height = t1(half * 2);
  // Each part's own outline: its silhouette stroked twice as wide under its fill, in its own dark, so it moves with
  // the part
  const edge = (d: string, color: string) =>
    outline
      ? `<path d="${d}" stroke="${color}" stroke-width="${t1(T_OUTLINE * 2)}" fill="none"/>\n    `
      : "";
  const coverTop = tbox(
    T_COVER_BACK,
    -T_COVER_HALF,
    T_COVER_FRONT,
    T_COVER_HALF,
    [7, 0, 0, 7],
  );
  const receiver = tbox(
    T_REC_BACK,
    -T_REC_HALF,
    T_REC_FRONT,
    T_REC_HALF,
    [2, 0, 0, 2],
  );
  const block = tbox(
    T_BLOCK_BACK,
    -T_BLOCK_HALF,
    T_BLOCK_FRONT,
    T_BLOCK_HALF,
    [1, 3, 3, 1],
  );
  const upper = tbox(T_UPPER[0], -T_UPPER_HALF, T_UPPER[1], T_UPPER_HALF, 3);
  const caps = [
    tbox(
      T_UPPER_REAR_CAP[0],
      -T_CAP_HALF,
      T_UPPER_REAR_CAP[1],
      T_CAP_HALF,
      1.5,
    ),
    tbox(
      T_UPPER_FRONT_CAP[0],
      -T_CAP_HALF,
      T_UPPER_FRONT_CAP[1],
      T_CAP_HALF,
      1.5,
    ),
  ];
  const ferrule = tbox(
    T_FERRULE[0],
    -T_FERRULE_HALF,
    T_FERRULE[1],
    T_FERRULE_HALF,
    1.5,
  );
  const retainer = tbox(
    T_RETAINER[0],
    -T_RETAINER_HALF,
    T_RETAINER[1],
    T_RETAINER_HALF,
    1.5,
  );
  const tube = tbox(T_TUBE[0], -T_TUBE_HALF, T_TUBE[1], T_TUBE_HALF);
  const barrelRear = tbox(
    T_BARREL_REAR[0],
    -T_BARREL_REAR_HALF,
    T_BARREL_REAR[1],
    T_BARREL_REAR_HALF,
  );
  const barrelFront = tbox(
    T_BARREL_FRONT[0],
    -T_BARREL_FRONT_HALF,
    T_BARREL_FRONT[1],
    T_BARREL_FRONT_HALF,
  );
  const nut = tbox(
    T_NUT[0],
    -T_NUT_HALF,
    T_NUT[1],
    T_NUT_HALF,
    [0, 1.5, 1.5, 0],
  );
  const leaf = tbox(T_LEAF[0], -T_LEAF_HALF, T_LEAF[1], T_LEAF_HALF, 1);
  const leafCap = tbox(
    T_LEAF_CAP[0],
    -T_LEAF_HALF - 1,
    T_LEAF_CAP[1],
    T_LEAF_HALF + 1,
    [2, 4, 4, 2],
  );
  const slider = tbox(
    T_SLIDER[0],
    -T_SLIDER_HALF,
    T_SLIDER[1],
    T_SLIDER_HALF,
    1.5,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${t1(minX)} ${t1(-half)} ${width} ${height}" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  ${generatedNote("ak-47")}
  <!-- The AK-47 from above, as it's held: muzzle along +x, its right side down the page (+y), millimeters about its
       middle on the bore, at the same scale as its side view (the pickup); lengths along it are the side view's.
       Worn steel and dark wood, as the side view; lit from above, the tops of round parts brightest. -->
  <defs>
    ${across("ak-47-top-stock", T_BUTT_HALF, [
      [0, W.dark],
      [0.1, W.base],
      [0.3, W.light],
      [0.5, mix(W.light, W.highlight, 0.4)],
      [0.7, W.light],
      [0.9, W.base],
      [1, W.dark],
    ])}
    ${across("ak-47-top-lower", T_LOWER_HALF[0], [
      [0, W.dark],
      [0.12, W.base],
      [0.22, W.light],
      [0.78, W.light],
      [0.88, W.base],
      [1, W.dark],
    ])}
    ${across("ak-47-top-upper", T_UPPER_HALF, roundAcross(W))}
    ${across("ak-47-top-receiver", T_REC_HALF, [
      [0, S.dark],
      [0.08, S.light],
      [0.2, S.base],
      [0.8, S.base],
      [0.92, S.light],
      [1, S.dark],
    ])}
    ${across("ak-47-top-cover", T_COVER_HALF, roundAcross(S))}
    ${across("ak-47-top-block", T_BLOCK_HALF, [
      [0, S.dark],
      [0.15, S.base],
      [0.5, S.light],
      [0.85, S.base],
      [1, S.dark],
    ])}
    ${across("ak-47-top-steel-cap", T_FERRULE_HALF, roundAcross(S))}
    ${across("ak-47-top-tube", T_TUBE_HALF, roundAcross(S))}
    ${across("ak-47-top-barrel-rear", T_BARREL_REAR_HALF, roundAcross(S))}
    ${across("ak-47-top-barrel-front", T_BARREL_FRONT_HALF, roundAcross(S))}
    ${across("ak-47-top-nut", T_NUT_HALF, roundAcross(S))}
    ${across("ak-47-top-gas-block", T_GAS_BLOCK_HALF, [
      [0, S.dark],
      [0.15, S.base],
      [0.5, S.light],
      [0.85, S.base],
      [1, S.dark],
    ])}
    <!-- The knob is a short cylinder along the stem (across the gun), so from above it's shaded along the gun -->
    <linearGradient id="ak-47-top-knob" gradientUnits="userSpaceOnUse" x1="${t1(T_KNOB_C[0] - T_KNOB_R)}" y1="0" x2="${t1(T_KNOB_C[0] + T_KNOB_R)}" y2="0">
      ${roundAcross(S)
        .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
        .join("\n      ")}
    </linearGradient>
  </defs>
  <!-- The barrel, under the gas tube and handguards: thicker behind the gas block, then out to the muzzle nut -->
  <g id="barrel">
    ${edge(barrelRear, S.dark)}${edge(barrelFront, S.dark)}${edge(nut, S.dark)}<path d="${barrelRear}" fill="url(#ak-47-top-barrel-rear)"/>
    <path d="${barrelFront}" fill="url(#ak-47-top-barrel-front)"/>
    <path id="muzzle-nut" d="${nut}" fill="url(#ak-47-top-nut)"/>
    <path d="${tbox(T_NUT_GROOVE[0], -T_NUT_HALF + 0.6, T_NUT_GROOVE[1], T_NUT_HALF - 0.6)}" fill="${S.dark}"/>
  </g>
  <!-- The front sight: its collar round the barrel, the two ears guarding the post -->
  <g id="front-sight">
    ${edge(T_COLLAR, S.dark)}<path d="${T_COLLAR}" fill="url(#ak-47-top-gas-block)"/>
    <path d="${tbox(T_SIGHT_EARS[0], -T_COLLAR_HALF + T_EAR, T_SIGHT_EARS[1], T_COLLAR_HALF - T_EAR)}" fill="${S.dark}"/>
    <g fill="${S.light}">
      ${T_EARS.map((d) => `<path d="${d}"/>`).join("\n      ")}
    </g>
    <path id="front-sight-post" d="${T_POST}" fill="${S.highlight}"/>
  </g>
  <!-- The gas block over the barrel: its flat top, and its front sloping down to the barrel, facing up, lit -->
  <g id="gas-block">
    ${edge(T_GAS_BLOCK_PATH, S.dark)}<path d="${T_GAS_BLOCK_PATH}" fill="url(#ak-47-top-gas-block)"/>
    <path d="${T_GAS_SLOPE_PATH}" fill="${S.light}" opacity="0.6"/>
    <path d="M${tp(T_GAS_SLOPE, -T_GAS_BLOCK_HALF + 1.2)} L${tp(T_GAS_SLOPE, T_GAS_BLOCK_HALF - 1.2)}" stroke="${S.highlight}" stroke-width="0.5" fill="none"/>
  </g>
  <!-- The gas tube, from the upper handguard into the gas block -->
  <g id="gas-tube">
    ${edge(tube, S.dark)}<path d="${tube}" fill="url(#ak-47-top-tube)"/>
  </g>
  <!-- The handguards: the lower one, a U round the barrel, narrowing forward between its ferrule and its retainer
       band; over it the upper one round the gas tube, between its steel caps -->
  <g id="handguard">
    ${edge(T_LOWER_PATH, W.dark)}${edge(ferrule, S.dark)}${edge(retainer, S.dark)}<path d="${T_LOWER_PATH}" fill="url(#ak-47-top-lower)"/>
    <path id="handguard-ferrule" d="${ferrule}" fill="url(#ak-47-top-steel-cap)"/>
    <path id="handguard-retainer" d="${retainer}" fill="url(#ak-47-top-steel-cap)"/>
    ${edge(upper, W.dark)}<path id="upper-handguard" d="${upper}" fill="url(#ak-47-top-upper)"/>
    <g fill="url(#ak-47-top-steel-cap)">
      ${caps.map((d) => `${edge(d, S.dark)}<path d="${d}"/>`).join("\n      ")}
    </g>
  </g>
  <!-- The stock, narrowing from the butt to the wrist, and its steel butt plate -->
  <g id="stock">
    ${edge(T_STOCK, W.dark)}${edge(T_PLATE, S.dark)}<path d="${T_STOCK}" fill="url(#ak-47-top-stock)"/>
    <path id="butt-plate" d="${T_PLATE}" fill="${S.base}"/>
  </g>
  <!-- On the bolt carrier: out of the receiver's right side (its root under the receiver), back and forward with it -->
  <g id="charging-handle">
    ${edge(T_STEM, S.dark)}${edge(T_KNOB, S.dark)}<path d="${T_STEM}" fill="${S.base}"/>
    <path d="${T_KNOB}" fill="url(#ak-47-top-knob)"/>
  </g>
  <!-- The milled receiver, the dust cover's dome on it (the recoil spring guide's catch through its back), the rear
       sight block at its front with the leaf lying on it, and the selector's lever along its right side -->
  <g id="receiver">
    ${edge(receiver, S.dark)}${edge(T_SELECTOR_PATH, S.dark)}<path d="${receiver}" fill="url(#ak-47-top-receiver)"/>
    <path id="selector" d="${T_SELECTOR_PATH}" fill="${S.light}"/>
    <path id="dust-cover" d="${coverTop}" fill="url(#ak-47-top-cover)" stroke="${S.dark}" stroke-width="${t1(T_OUTLINE)}"/>
    <path id="spring-catch" d="${tbox(T_SPRING_BUTTON[0], -4, T_SPRING_BUTTON[1], 4, 1)}" fill="${S.dark}"/>
    <g id="rear-sight">
      ${edge(block, S.dark)}<path d="${block}" fill="url(#ak-47-top-block)"/>
      <path d="${leafCap}" fill="${S.base}" stroke="${S.dark}" stroke-width="${t1(T_OUTLINE)}"/>
      <path d="${leaf}" fill="${S.light}" stroke="${S.dark}" stroke-width="${t1(T_OUTLINE)}"/>
      <!-- The notch, down the middle of the leaf's back end -->
      <path d="${tbox(T_LEAF[0], -1, T_LEAF[0] + 3, 1)}" fill="${S.dark}"/>
      <path d="${slider}" fill="${S.base}" stroke="${S.dark}" stroke-width="${t1(T_OUTLINE)}"/>
    </g>
  </g>
</svg>
`;
}

// The model's top view, registered: its length (x 46 to 2353) is the gun's 870 mm, and its widths are taken as
// 17% fat (see the widths above), so 105 px across its middle (y 10 to 115) is 33.8 mm
const MODEL_TOP_HALF = (52.5 * (870 / 2307)) / 1.17;
const TOP: TopView<AkOptions> = {
  draw: drawTop,
  registrations: [
    {
      file: "model-py.png",
      points: [
        [
          [46, 10],
          [-435, -MODEL_TOP_HALF],
        ],
        [
          [2353, 10],
          [435, -MODEL_TOP_HALF],
        ],
        [
          [2353, 115],
          [435, MODEL_TOP_HALF],
        ],
        [
          [46, 115],
          [-435, MODEL_TOP_HALF],
        ],
      ],
    },
  ],
};

export const AK_47: GunDrawing<AkOptions> = {
  name: "ak-47",
  photo: {
    file: "ak-47-worn.jpg",
    width: 1920,
    height: 1200,
    about:
      "A worn real AK-47 from its right side, muzzle to the right, on white, evenly lit: dark wood, a taped magazine and a sticker (drawn clean)",
  },
  otherPhotos: [
    {
      file: "ak-47.jpg",
      width: 900,
      height: 332,
      about:
        "Another AK-47 from its right side, cleaner and lighter wood, smaller",
    },
    {
      file: "model-px.png",
      width: 2400,
      height: 710,
      about:
        "The 3D model (Sketchfab, standard license; reference only) from its right side, `model ak-47 --from +x`: the gun is along z, up +y",
    },
    {
      file: "model-py.png",
      width: 2400,
      height: 193,
      about:
        "The 3D model from above, `model ak-47 --from +y --up -x`: muzzle to the right, its right side down. For widths (its round parts come out about 17% fat against the side view)",
    },
    {
      file: "model-ak-47s-scifi",
      width: 0,
      height: 0,
      about:
        "A stylized AK-47S model: not the gun we're drawing, only a last resort for shapes",
    },
  ],
  // The origin halfway along the gun on the bore, and the AK-47's 870 mm over the 1699 px it is in the photo (see
  // the top of the file)
  scale: { origin: ORIGIN, mmPerPixel: MM_PER_PX },
  frame: {
    // The rear sight's top, the magazine's bottom corner, the butt plate, the muzzle nut; the square 900 mm, about
    // 3.5% more than its 870 mm length, as the pistols'
    top: 447,
    bottom: 951,
    back: 119,
    front: 1818,
    side: 900,
    pixels: 512,
  },
  comment: `
  <!-- The AK-47 (milled receiver, wood furniture) from its right side, muzzle to the right. Millimeters, with the
       origin on the gun's middle on the bore, as the guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
  top: TOP,
};
