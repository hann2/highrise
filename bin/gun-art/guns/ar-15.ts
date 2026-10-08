/**
 * The AR-15 from its right side: a Knight's Armament SR-15 carbine (the base photo) with an M-LOK rail, a Magpul
 * DT-PR Carbine stock and a Vortex AMG UH-1 Gen II holographic sight, each from its own photo. Drawn in the pixels
 * of the base photo (2000 by 2000) by named numbers, following the gun-art skill (.claude/skills/gun-art/SKILL.md),
 * with guns/m1911.ts as the worked example. A draft until it goes into the game.
 *
 * The stock and the optic are drawn by their own functions (`stock`, `optic`), in their own photos' pixels, mapped
 * onto the base photo by a named offset and scale, so another stock or optic can replace them later.
 *
 * Light falls from above, as on the other guns: top edges and top facets lit, undersides in shadow, round things
 * (the buffer tube, the barrel) banded along their length.
 */
import type { Point } from "../lib/geometry";
import { arc, fixed, fmt, on, rounded, smoothCurve } from "../lib/geometry";
import type { GunDrawing } from "../lib/gun";
import type { Material, Stops } from "../lib/style";
import { linear } from "../lib/style";

// ---------------------------------------------------------------------------------------------------------
// Dimensions
//
// THE SCALE comes from the Picatinny rail, whose slots are 0.394" (10.008 mm) apart (MIL-STD-1913): the
// handguard's top rail has its lugs at x 1183, 1208, ... 1803 in the photo (`measure runs rows 780 780`), 25
// pitches in 620 px, 0.4035 mm a pixel. Checks: the buffer tube (a mil-spec carbine receiver extension, 1.148",
// 29.2 mm across) is 73 px across (y 820 to 893): 29.5 mm. The upper receiver's lugs (855 to 1106, 10 pitches)
// give 0.399, within a pixel.
//
// THE PHOTO'S GUN is not a 16" carbine. From the butt of its stock (x 9) to the end of its flash hider (x 1983)
// it's 786 mm (30.9"), and its URX 4 handguard (the upper's front at x 1162 to its end cap at 1850) is 278 mm,
// KAC's 10.75" one. The bolt face sits about 0.7" behind the upper's front (x 1118) and the barrel's muzzle about
// half an inch inside the 3-prong hider (its back at 1852): a barrel of about 12" (`PHOTO_BARREL_IN`), so the photo
// is KAC's short-barrelled SR-15 (sold with 11.5"). KAC's 16" SR-15 E3 Mod 2 is listed at 33.5" to 36.5"
// (kfarmory.com, operationparts.com: 16" barrel, 6.55 lb), with a 13" handguard.
//
// THE GAME'S AR-15 has a 16" barrel, so by default the barrel is drawn 16" (`barrel`, an option in inches): the
// hider moves forward by the difference and the barrel shows between it and the handguard's end. The handguard is
// left at the photo's 10.75" (a question for Simon: the 16" SR-15 comes with a 13" one). With the DT-PR one notch
// out, the gun is then 847 mm (33.3") long, KAC's 33.5" collapsed with its own stock.
//
// THE STOCK, Magpul's DT-PR Carbine (magpul.com: 7.4" long, 5.3" high, 1.6" wide; length of pull 10.9" to 14.2" on
// a mil-spec carbine tube, in 6 positions, so 0.66" a notch). Its photo shows its left side (butt to the right), so
// it's mirrored: stocks are near enough symmetric (the latch lever is under it). In its photo it runs from its
// front (x 132) to the back of its butt pad (x 1054), 922 px for 7.4" (0.2039 mm a pixel); it's 652 px high, 133
// mm (5.3" is 134.6: 1%). The tube runs through its top box, whose axis is about y 400 there. On the base photo it
// goes on the tube's axis (y 856.5), and its butt where the length of pull puts it: from the trigger's face (x 855)
// back 10.9" collapsed plus 0.66" a notch (`stockNotch`, default 1: one notch out). Collapsed, its front meets the
// castle nut (x 630) to 10 px, which checks the placing.
//
// THE OPTIC, Vortex's AMG UH-1 Gen II (Vortex's table: 3.9" long, 2.7" high, 2.1" wide; 11 oz). The photo with its
// windage and elevation dials is its right side (recoilweb.com's review: "both the elevation and windage adjustments
// sit in the right side of the housing"), so it's drawn as photographed, front to the right: its big front window's
// hood on the right, the grooved slope of its back on the left. Its size and seat are worked out in its own section
// below, from Vortex's numbers and checked against a photo of a UH-1 on an AR-15: round 1 had scaled the 3.9" to
// the housing without its battery cap, and by its length alone, which drew it 12% too long and 18% too tall.
const MM_PER_PX = (25 * 10.008) / (1803 - 1183);
const PX_PER_IN = 25.4 / MM_PER_PX;
const BORE_Y = 856.5;
/** The trigger's face, where the length of pull is measured from */
const TRIGGER_FACE = 855;
/** Where the bolt face is (inside the upper), and the photo's barrel's length */
const BOLT_FACE = 1118;
const HIDER_BACK = 1852;
const PHOTO_BARREL_IN = (HIDER_BACK + 0.5 * PX_PER_IN - BOLT_FACE) / PX_PER_IN;
const DEFAULT_BARREL_IN = 16;
const HIDER_END = 1983;

// The stock's length of pull (Magpul's numbers)
const LOP_COLLAPSED_IN = 10.9;
const LOP_NOTCH_IN = (14.2 - 10.9) / 5;
const DEFAULT_NOTCH = 1;

/** Where the butt goes for a notch */
function buttX(notch: number): number {
  return TRIGGER_FACE - (LOP_COLLAPSED_IN + notch * LOP_NOTCH_IN) * PX_PER_IN;
}

const DEFAULT_BACK = buttX(DEFAULT_NOTCH);
const DEFAULT_FRONT =
  HIDER_END + (DEFAULT_BARREL_IN - PHOTO_BARREL_IN) * PX_PER_IN;
const ORIGIN: Point = [(DEFAULT_BACK + DEFAULT_FRONT) / 2, BORE_Y];

// ---------------------------------------------------------------------------------------------------------
// Construction (from `grid --mode photo`, region by region, in all four photos)
//
// Layers, back to front: the barrel (seen through the handguard's slots and out of its front) and the gas block;
// the flash hider; the handguard over the barrel; the buffer tube with the castle nut and end plate; the stock over
// the tube; the magazine, up into the magazine well; the trigger, seen through the guard's opening; the grip,
// tucked under the lower's grip boss; the lower receiver; the upper receiver on the lower (their seam at y 897);
// the charging handle; the folded sights; the optic on the upper's rail.
//
// THE UPPER RECEIVER (black anodized aluminium). A long box from x 700 to the handguard (1162), its rail along the
// top: the rail's spine (787 to 800) with twelve lugs on it (780 to 787, 25.1 px apart from 855; a long one at the
// front), a plain stretch behind them (702 to 845) under the rear sight. Its side, top to bottom: a flat band (800
// to 822) with a crease along its bottom; behind, a long round boss (the bolt carrier's housing, 705 to 880, y 828
// to 880), proud, lit along its top; a dark recess in front of it (880 to 925, where a forward assist would be; the
// E3 upper has none); the ejection port's dust cover, closed (925 to 1130, y 825 to 870), a raised panel with two
// stiffening panels and its catch's bump; under it the cover's hinge rod (y 873) with its spring showing bright in
// the middle; and the upper's lower lip down to the seam. Lettering dropped.
// THE CHARGING HANDLE's latch over the upper's back (686 to 760, y 783 to 812), its T handle behind the upper.
// THE LOWER RECEIVER (black anodized, one forging). Its outline: the rear tang under the buffer tube (627 to 700),
// the grip boss (its bottom at y 985), the trigger guard's rear ear and the guard (a separate part pinned between
// the ears, its bar dropping to y 1074 at x 885 and rising to the front pin at 1100,1050), the magazine well's front
// with the flared lip at its bottom (1132 to 1139, y 1015 to 1035), and the pivot pin's boss at its top front. The
// guard's opening is a hole (the floor shows): straight along its top (the grip boss), round at its front. On its
// side: the safety selector (a lever 738 to 800 at y 934 to 954 on a round hub at 794,941), the takedown pin's head (738,912),
// the bolt catch's paddle and rod (KAC's ambidextrous one: 892 to 990, y 900 to 926), the magazine release in its
// raised fence (927 to 973, y 922 to 978), the magazine well's raised flat panel (the lettering on it dropped), and
// pins.
// THE BUFFER TUBE (anodized), y 820 to 893, round: banded. Its threads (610 to 630) show in front of the castle nut
// (630 to 660, y 812 to 896, staked), which holds the end plate (627 to 668, down to 945, with its QD sling socket at
// 646,921) against the lower's ring (668 to 700, from y 812).
// THE GRIP (an A2 grip, black polymer): it leans back about 32°; a horn for the middle finger on its front (794 at
// y 1120); its bottom slopes from the heel (596,1200) to the toe (732,1222). A checkered panel on its side, along
// its lean.
// THE MAGAZINE (an aluminium GI magazine, gray anodized): curved, its back edge from 963 at y 1060 to 1016 at 1320,
// its front from 1122 at 1040 to 1169 at 1285; its floor plate slopes down to the back. Four ribs pressed along it.
// THE TRIGGER: a curved blade, bright steel (KAC's two-stage trigger), hanging from the lower into the opening.
// THE HANDGUARD (KAC URX 4, M-LOK, anodized), 1162 to 1850: the rail on top (lugs 780 to 787 every 24.8 px from
// 1183), and a long octagon in section: the upper facet (800 to 835, lit), the side (835 to 880), the lower facet
// (880 to 912, in shadow). Its M-LOK slots, in rows: short ones high up (791 to 804), the top row (813 to 830), a
// middle row (838 to 858) and a bottom row (882 to 899). They're holes: the top and bottom rows and the short ones
// see right through (the barrel is between them), the middle row shows the barrel, and the top row the gas block
// (its front edge at 1619 to 1700). Two textured M-LOK covers (Magpul's, 1428 to 1640, y 831 to 916) over the middle
// and bottom rows, and KAC's 5-slot rail section under the front (1645 to 1847, y 906 to 933, its back sloped). A QD
// socket at the back (1229,846). Lettering dropped.
// THE BARREL (black steel), 47 px (0.75") across about the bore, seen through the middle slots and between the
// handguard's end and the hider (when it's longer than the photo's).
// THE FLASH HIDER (KAC's 3-prong, black steel): a collar (1852 to 1880, y 830 to 880) with two set screws, a ring,
// then three prongs (to 1983): from the side, the top prong (833 to 855, spiral flutes on it), a slot right through
// (855 to 866, open at the front, a hole) and the bottom prong (866 to 878); a notch at the top prong's end.
// THE SIGHTS (KAC's flip-ups): with an optic they're folded down, so they're drawn folded: the rear's base on the
// upper's rail behind the optic (762 to 818), its leaf lying forward; the front's base on the handguard's front
// (1785 to 1835), its post lying back.
// THE STOCK and THE OPTIC: see their own sections below.

// ---------------------------------------------------------------------------------------------------------
// Materials: each a base, a dark (shadowed faces, edges, the outline), a light (lit faces) and a highlight (the
// bright line where an edge catches the light). All of them are options, so a skin is a set of them.

export interface Ar15Options {
  /** The receivers' and the handguard's anodized aluminium (and the buffer tube's) */
  receiver?: Partial<Material>;
  /** The handguard, if not the receivers' */
  handguard?: Partial<Material>;
  /** The stock's and the grip's polymer */
  furniture?: Partial<Material>;
  /** The optic's housing */
  optic?: Partial<Material>;
  /** The magazine */
  magazine?: Partial<Material>;
  /** The barrel's, the flash hider's and the small steel parts' */
  steel?: Partial<Material>;
  /** The trigger's bright steel */
  trigger?: Partial<Material>;
  /** The barrel's length in inches (default 16, the game's; PHOTO_BARREL_IN is the photo's) */
  barrel?: number;
  /** How far out the stock is, in notches from collapsed (0 to 5; default 1) */
  stockNotch?: number;
  /** Leave the optic off (the folded sights stay folded) */
  noOptic?: boolean;
  /** A thin outline round the silhouette, in each part's own dark (the set's rule; default true) */
  outline?: boolean;
  /** The outline's width in millimeters (default OUTLINE_MM) */
  outlineMm?: number;
  /** How wide the rim light along the top edges is, in millimeters (default RIM_LIGHT_MM) */
  rimLightMm?: number;
}

/** Anodized aluminium as a charcoal, a step lighter than the photo's near black so it holds on the dark floor (Simon's pick, round 2: variant B) */
export const AR_ANODIZED: Material = {
  base: "#41444b",
  dark: "#1f2125",
  light: "#5d616a",
  highlight: "#8a8f99",
};

/** The stock's and grip's polymer: Magpul black as a charcoal, warmer and flatter than the anodizing */
export const AR_POLYMER: Material = {
  base: "#45464a",
  dark: "#232427",
  light: "#5c5e63",
  highlight: "#7a7c82",
};

/** The UH-1's housing: anodized like the receivers, a step lighter, its machined bevels pale gray in the photo */
export const AR_OPTIC: Material = {
  base: "#4a4d55",
  dark: "#24262a",
  light: "#666a73",
  highlight: "#a0a4ad",
};

/** The aluminium GI magazine: gray anodized, as photographed (110 to 150 gray) */
export const AR_MAGAZINE: Material = {
  base: "#55585e",
  dark: "#2e3034",
  light: "#73767c",
  highlight: "#979aa0",
};

/** Black steel: the barrel, the hider, the castle nut, pins */
export const AR_STEEL: Material = {
  base: "#45474d",
  dark: "#1f2023",
  light: "#686b72",
  highlight: "#8e929a",
};

/** The trigger: bright steel */
export const AR_TRIGGER: Material = {
  base: "#8d9199",
  dark: "#4e5258",
  light: "#a9adb3",
  highlight: "#c4c7cc",
};

const OUTLINE_MM = 0.4;
const RIM_LIGHT_MM = 1.0;

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

/** A box from x0,y0 to x1,y1 */
function box(x0: number, y0: number, x1: number, y1: number): string {
  return `M${f1(x0)},${f1(y0)} L${f1(x1)},${f1(y0)} L${f1(x1)},${f1(y1)} L${f1(x0)},${f1(y1)} Z`;
}

/** A box with its corners rounded by r (back-top, front-top, front-bottom, back-bottom) */
function rbox(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number | [number, number, number, number],
): string {
  const radii = typeof r === "number" ? [r, r, r, r] : r;
  return rounded(
    [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ],
    radii,
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

/** A circle as a path */
function circle(c: Point, r: number): string {
  return `M${fmt(on(c, r, 0))} ${arc(c, r, 0, 360)} Z`;
}

/** A smooth closed shape through points */
function closedCurve(points: Point[], startDir: Point, endDir: Point): string {
  return `M${fmt(points[0])} ${smoothCurve(points, startDir, endDir)} Z`;
}

/** Gradient stops for a face lit from above: highlight at its top edge, then light, base, and dark at its bottom */
function faceStops(m: Material, bottomDark = 0.6): Stops {
  return [
    [0, m.highlight],
    [0.04, m.light],
    [0.25, mix(m.base, m.light, 0.4)],
    [0.7, m.base],
    [1, mix(m.base, m.dark, bottomDark)],
  ];
}

/** A cylinder along x, banded: dark edges, a streak above its middle, darker below */
function roundStops(m: Material): Stops {
  return [
    [0, m.dark],
    [0.12, m.base],
    [0.25, m.light],
    [0.32, m.highlight],
    [0.42, m.light],
    [0.65, m.base],
    [1, m.dark],
  ];
}

// ---------------------------------------------------------------------------------------------------------
// The barrel, the gas block and the flash hider. `shift` is how far the hider moves forward for a longer barrel.

const BARREL_TOP = BORE_Y - 23.5;
const BARREL_BOTTOM = BORE_Y + 23.5;
const BARREL_BACK = 1162;
const GAS_BLOCK: [number, number] = [1619, 1700];
const GAS_TOP = 812;
const COLLAR: [number, number] = [HIDER_BACK, 1880];
const COLLAR_TOP = 830;
const COLLAR_BOTTOM = 880;
const RING_FRONT = 1888;
const PRONG_TOP = 833;
const SLOT_TOP = 855;
const SLOT_BOTTOM = 866;
const PRONG_BOTTOM = 878;
const SLOT_BACK = 1900;

function hiderShapes(shift: number) {
  const x = (v: number) => v + shift;
  const body = rounded(
    [
      [x(COLLAR[0]), COLLAR_TOP],
      [x(COLLAR[1]), COLLAR_TOP],
      [x(COLLAR[1]), PRONG_TOP - 1],
      [x(HIDER_END), PRONG_TOP],
      [x(HIDER_END), PRONG_BOTTOM],
      [x(COLLAR[1]), PRONG_BOTTOM + 1],
      [x(COLLAR[1]), COLLAR_BOTTOM],
      [x(COLLAR[0]), COLLAR_BOTTOM],
    ],
    [2, 2, 0, 4, 4, 0, 2, 2],
  );
  // The slot through between the top and bottom prongs, open at the front, and the notch at the top prong's end
  const slot =
    `M${f1(x(HIDER_END) + 2)},${SLOT_TOP} L${f1(x(SLOT_BACK) + SLOT_BOTTOM / 2 - SLOT_TOP / 2)},${SLOT_TOP} ` +
    `${arc([x(SLOT_BACK) + (SLOT_BOTTOM - SLOT_TOP) / 2, (SLOT_TOP + SLOT_BOTTOM) / 2], (SLOT_BOTTOM - SLOT_TOP) / 2, 270, 90)} ` +
    `L${f1(x(HIDER_END) + 2)},${SLOT_BOTTOM} Z`;
  const notch = box(x(HIDER_END) - 18, 841, x(HIDER_END) + 2, 848);
  return { body, slot, notch };
}

// ---------------------------------------------------------------------------------------------------------
// The handguard

const HG_BACK = 1162;
const HG_FRONT = 1850;
const HG_TOP = 787; // the rail's spine
const HG_FACE = 800; // under the rail
const HG_UPPER_FACET = 835;
const HG_LOWER_FACET = 880;
const HG_BOTTOM = 912;
const RAIL_LUG_TOP = 780;
const HG_LUGS = { first: 1183, pitch: 24.8, count: 26, width: 12.5 };
const UPPER_LUGS = { first: 855, pitch: 25.1, count: 11, width: 11.5 };
const HANDGUARD = rounded(
  [
    [HG_BACK, HG_TOP],
    [HG_FRONT - 4, HG_TOP],
    [HG_FRONT, HG_FACE],
    [HG_FRONT, HG_BOTTOM - 8],
    [HG_FRONT - 10, HG_BOTTOM],
    [HG_BACK, HG_BOTTOM],
  ],
  [0, 2, 0, 6, 4, 0],
);
// The slots, back to front, each [x0, x1]
const SHORT_SLOTS: [number, number][] = [
  [1377, 1429],
  [1483, 1536],
  [1695, 1747],
];
const TOP_SLOTS: [number, number][] = [
  [1298, 1371],
  [1399, 1470],
  [1500, 1569],
  [1600, 1667],
  [1702, 1766],
  [1802, 1822],
];
const MIDDLE_SLOTS: [number, number][] = [
  [1300, 1330],
  [1350, 1426],
  [1655, 1730],
  [1754, 1831],
];
const BOTTOM_SLOTS: [number, number][] = [
  [1298, 1371],
  [1398, 1470],
  [1499, 1569],
  [1599, 1668],
  [1700, 1767],
  [1800, 1816],
];
const SHORT_ROW: [number, number] = [791, 804];
const TOP_ROW: [number, number] = [813, 830];
const MIDDLE_ROW: [number, number] = [838, 858];
const BOTTOM_ROW: [number, number] = [882, 899];
const row = (slots: [number, number][], [y0, y1]: [number, number]) =>
  slots.map(([x0, x1]) => pill(x0, x1, y0, y1)).join(" ");
const THROUGH_SLOTS =
  row(SHORT_SLOTS, SHORT_ROW) +
  " " +
  row(TOP_SLOTS, TOP_ROW) +
  " " +
  row(BOTTOM_SLOTS, BOTTOM_ROW);
const BARREL_SLOTS = row(MIDDLE_SLOTS, MIDDLE_ROW);
const COVERS: [number, number][] = [
  [1428, 1531],
  [1533, 1640],
];
const COVER_TOP = 831;
const COVER_BOTTOM = 918;
const BOTTOM_RAIL = rounded(
  [
    [1645, 905],
    [1847, 905],
    [1847, 925],
    [1702, 925],
  ],
  [2, 2, 2, 4],
);
const BOTTOM_RAIL_LUGS = [0, 1, 2, 3, 4]
  .map((i) => rbox(1712 + i * 26, 924, 1727 + i * 26, 933, [0, 0, 2, 2]))
  .join(" ");
const HG_QD: Point = [1229, 846];

function lugs(spec: typeof HG_LUGS, top: number, bottom: number): string {
  const out: string[] = [];
  for (let i = 0; i < spec.count; i++) {
    const x = spec.first + i * spec.pitch;
    out.push(rbox(x, top, x + spec.width, bottom, [1.5, 1.5, 0, 0]));
  }
  return out.join(" ");
}

/** The covers' stipple: small dots, the same every build (a fixed sequence, not the game's random) */
function stipple(x0: number, x1: number, y0: number, y1: number): string {
  let seed = 1234567;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const out: string[] = [];
  for (let y = y0 + 4; y < y1 - 3; y += 6) {
    for (let x = x0 + 4; x < x1 - 3; x += 6) {
      const cx = x + (next() - 0.5) * 4;
      const cy = y + (next() - 0.5) * 4;
      out.push(box(cx - 1.4, cy - 1.4, cx + 1.4, cy + 1.4));
    }
  }
  return out.join(" ");
}

// ---------------------------------------------------------------------------------------------------------
// The upper receiver and the charging handle

const UPPER_BACK = 700;
const UPPER_FRONT = 1162;
const SEAM = 897; // between the upper and the lower
const UPPER_BODY = rounded(
  [
    [UPPER_BACK, HG_TOP],
    [UPPER_FRONT, HG_TOP],
    [UPPER_FRONT, SEAM],
    [UPPER_BACK, SEAM],
  ],
  [3, 0, 0, 2],
);
const UPPER_RAIL_FLAT = box(UPPER_BACK + 2, 783, 845, HG_TOP + 1);
const UPPER_CREASE = 822;
const BOSS = pill(705, 880, 828, 880);
const RECESS = rounded(
  [
    [880, 805],
    [925, 805],
    [925, 870],
    [880, 870],
  ],
  [14, 0, 0, 6],
);
const DUST_COVER = rbox(925, 825, 1130, 870, 8);
const DUST_PANELS =
  rbox(935, 834, 1008, 864, 5) + " " + rbox(1045, 834, 1122, 864, 5);
const DUST_CATCH = rbox(1013, 850, 1040, 860, 3);
const HINGE_Y = 873;
const CHARGING_HANDLE = rounded(
  [
    [686, 783],
    [760, 783],
    [760, 812],
    [686, 812],
  ],
  [8, 2, 2, 8],
);

// ---------------------------------------------------------------------------------------------------------
// The lower receiver, its controls, the trigger guard's opening

const LOWER_POINTS: Point[] = [
  [627, SEAM],
  [1158, SEAM],
  [1162, 912],
  [1150, 930],
  [1134, 940],
  [1132, 1008],
  [1139, 1018],
  [1139, 1030],
  [1128, 1037],
  [1121, 1042],
  [1116, 1052],
  [1095, 1059],
  [885, 1074],
  [840, 1064],
  [806, 1063],
  [800, 1055],
  [800, 985],
  [722, 985],
  [719, 972],
  [708, 958],
  [693, 948],
  [640, 946],
  [627, 939],
];
const LOWER = rounded(
  LOWER_POINTS,
  [2, 0, 6, 8, 2, 0, 3, 3, 3, 2, 4, 6, 10, 8, 4, 2, 0, 0, 6, 8, 6, 6, 2],
);
const OPENING = rounded(
  [
    [828, 983],
    [945, 983],
    [958, 1040],
    [918, 1056],
    [846, 1052],
    [829, 1040],
  ],
  [3, 36, 16, 10, 8, 6],
);
// The opening's ring: lit round its front and bottom
const OPENING_BEVEL = `M945,994 C957,1006 961,1030 952,1043 C940,1054 930,1058 915,1059`;
const RING: [number, number, number, number] = [668, 812, 700, SEAM];
const MAGWELL_PANEL = rounded(
  [
    [1000, 926],
    [1128, 926],
    [1128, 1012],
    [1000, 1022],
  ],
  [6, 2, 2, 6],
);
const MAG_FENCE = rbox(927, 922, 973, 978, 10);
const MAG_BUTTON = rbox(940, 936, 962, 966, 10);
const BOLT_PADDLE = rbox(892, 900, 926, 926, 9);
const BOLT_ROD = rbox(920, 906, 990, 917, 5);
const SELECTOR_LEVER = rbox(738, 934, 800, 954, 10);
const SELECTOR_HUB: Point = [794, 941];
const SELECTOR_POINTER = `M810,931 L832,941 L810,951 Z`;
const TAKEDOWN_PIN: Point = [738, 912];
const PIVOT_PIN: Point = [1148, 914];
const SMALL_PINS: Point[] = [
  [845, 962],
  [920, 935],
];

// The trigger: a curved blade, its back and front faces through points from the photo
const TRIGGER = `M858,980 ${smoothCurve(
  [
    [858, 980],
    [855, 1005],
    [856, 1022],
    [861, 1035],
    [870, 1047],
    [884, 1054],
  ],
  [0, 1],
  [1, 0.4],
)} ${smoothCurve(
  [
    [884, 1054],
    [875, 1041],
    [868, 1028],
    [867, 1012],
    [871, 998],
    [880, 980],
  ],
  [-0.6, -1],
  [0.4, -1],
)} Z`;
const TRIGGER_LIT = `M862,990 ${smoothCurve(
  [
    [862, 990],
    [860, 1008],
    [862, 1025],
    [869, 1040],
  ],
  [0, 1],
  [0.6, 1],
)}`;

// ---------------------------------------------------------------------------------------------------------
// The buffer tube, the castle nut and the end plate

const TUBE_TOP = 820;
const TUBE_BOTTOM = 893;
const TUBE_FRONT = 630;
const THREADS: [number, number] = [610, 630];
const CASTLE = rbox(630, 812, 660, 896, 3);
const END_PLATE = rounded(
  [
    [655, 807],
    [668, 807],
    [668, 946],
    [633, 946],
    [627, 938],
    [627, 896],
    [655, 896],
  ],
  [2, 0, 0, 6, 2, 0, 0],
);
const QD_SOCKET: Point = [646, 921];

// ---------------------------------------------------------------------------------------------------------
// The grip (A2), along its lean

const GRIP_POINTS_BACK: Point[] = [
  [722, 985],
  [719, 1000],
  [712, 1020],
  [684, 1060],
  [657, 1100],
  [629, 1140],
  [602, 1180],
  [596, 1197],
];
const GRIP = `M800,985 L800,1060 ${smoothCurve(
  [
    [800, 1060],
    [793, 1080],
    [786, 1100],
  ],
  [0, 1],
  [-0.3, 1],
)} C790,1108 795,1116 794,1122 C793,1128 780,1129 768,1131 ${smoothCurve(
  [
    [768, 1131],
    [753, 1150],
    [737, 1180],
    [728, 1205],
  ],
  [-0.5, 1],
  [-0.1, 1],
)} C730,1214 734,1222 726,1230 C720,1234 712,1234 704,1232 L606,1205 C597,1203 594,1200 596,1197 ${smoothCurve(
  [...GRIP_POINTS_BACK].reverse(),
  [0.35, -1],
  [0.05, -1],
)} Z`;
// The checkered panel along the grip's lean: lines across it in two directions
const GRIP_LEAN = -0.62; // x per y down the grip
const GRIP_PANEL = rounded(
  [
    [712, 1040],
    [772, 1040],
    [690, 1194],
    [613, 1194],
  ],
  [8, 10, 10, 8],
);

function checkering(): string {
  const lines: string[] = [];
  const axis = Math.atan2(1, GRIP_LEAN);
  for (const spread of [-0.5, 0.5]) {
    const a = axis + spread;
    const dir: Point = [Math.cos(a), Math.sin(a)];
    const n: Point = [-dir[1], dir[0]];
    const c: Point = [710, 1100];
    for (let k = -30; k <= 30; k++) {
      const off = k * 7;
      const px = c[0] + n[0] * off;
      const py = c[1] + n[1] * off;
      lines.push(
        `M${f1(px - dir[0] * 160)},${f1(py - dir[1] * 160)} L${f1(px + dir[0] * 160)},${f1(py + dir[1] * 160)}`,
      );
    }
  }
  return lines.join(" ");
}

// ---------------------------------------------------------------------------------------------------------
// The magazine

const MAG_BACK: Point[] = [
  [963, 1000],
  [963, 1060],
  [966, 1110],
  [970, 1140],
  [975, 1170],
  [982, 1200],
  [989, 1230],
  [998, 1260],
  [1006, 1290],
  [1013, 1318],
];
const MAG_FRONT: Point[] = [
  [1122, 1000],
  [1122, 1040],
  [1126, 1100],
  [1132, 1140],
  [1141, 1180],
  [1149, 1210],
  [1158, 1240],
  [1164, 1260],
  [1168, 1282],
];
const MAGAZINE = `M${fmt(MAG_BACK[0])} L${fmt(MAG_FRONT[0])} ${smoothCurve(MAG_FRONT, [0, 1], [0.2, 1])} L1173,1285 L1018,1324 L${fmt(MAG_BACK[MAG_BACK.length - 1])} ${smoothCurve([...MAG_BACK].reverse(), [-0.25, -1], [0, -1])} Z`;
const FLOOR_PLATE = `M1012,1314 L1170,1276 L1175,1285 L1018,1325 Z`;

/** A line along the magazine `t` of the way from its back to its front */
function magLine(t: number, y0 = 1042, y1 = 1300): string {
  const back = MAG_BACK.filter((p) => p[1] >= y0 - 1 && p[1] <= y1 + 25);
  const pts: Point[] = back.map((b) => {
    const fx = interpolateX(MAG_FRONT, b[1]);
    return [b[0] + (fx - b[0]) * t, b[1]];
  });
  const clipped = pts.filter((p) => p[1] <= y1 - t * 40);
  return `M${fmt(clipped[0])} ${smoothCurve(clipped, [0.05, 1], [0.25, 1])}`;
}

function interpolateX(points: Point[], y: number): number {
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    if (y >= y0 && y <= y1) {
      return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
    }
  }
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  return last[0] + ((last[0] - prev[0]) * (y - last[1])) / (last[1] - prev[1]);
}

// ---------------------------------------------------------------------------------------------------------
// The folded sights (KAC's micro flip-ups, folded down under the optic)

const REAR_SIGHT_BASE = rounded(
  [
    [762, 787],
    [764, 772],
    [800, 768],
    [818, 772],
    [818, 787],
  ],
  [0, 4, 4, 3, 0],
);
const REAR_SIGHT_LEAF = rbox(790, 762, 850, 772, [5, 4, 2, 2]);
const FRONT_SIGHT_BASE = rounded(
  [
    [1785, 780],
    [1790, 768],
    [1830, 766],
    [1838, 772],
    [1838, 780],
  ],
  [0, 4, 6, 3, 0],
);
const FRONT_SIGHT_POST = rbox(1736, 762, 1806, 771, [4, 3, 2, 3]);

// ---------------------------------------------------------------------------------------------------------
// The stock: Magpul's DT-PR Carbine, drawn in its own photo's pixels (ar-15-stock.jpg, 1200 by 1200, its left
// side, butt to the right), mirrored onto the base photo.
//
// Construction (its photo): one molding. A box along the top round the buffer tube (from its front, x 132, to the
// butt pad; top y 311, flat), its lower edge a crease at y 470, below which the latch's housing is set back under
// its front (to y 527). Two shallow pockets along its side (420 to 449: 293 to 437 and 734 to 881). Below the box,
// a frame round a big opening (a hole): a front leg (its front edge down from 323,540 to 345,705, a step out to a
// rounded toe at 318,730 to 330,795), a bottom edge sloping down to the back (from 330,795 to 860,959), and the
// back where the butt pad is; the opening's top is the box (y 538), its front the leg (476 to 491), its bottom
// parallel to the stock's (from 491,710 to 785,808), a chamfered corner at its bottom back (838,785 to 858,765), and
// its back straight up (865) to a web holding the sling ring (a raised ring round a hole, 835,565, r 20); behind
// that a slot right through (pill, 905,610 to 892,748, 22 across). The latch lever lies across the opening's top,
// pivoted at its front on a round boss (509,516, r 21), widening to its ribbed tip (696,571 to 696,583). The butt
// pad: rubber, its back ribbed (from 1052,340 to 971,940, round at the toe), a seam at its front (994,312 to
// 962,950). Lettering dropped.
//
// Mapped: the stock photo's x 1053 (the back of the pad) goes to the butt's x, its y 400 (the tube's axis) to the
// bore, at STOCK_SCALE base pixels a stock pixel, mirrored.

const STOCK_MM_PER_PX = (7.4 * 25.4) / (1054 - 132);
const STOCK_SCALE = STOCK_MM_PER_PX / MM_PER_PX;
const STOCK_BUTT_SX = 1053;
const STOCK_AXIS_SY = 400;

function stockMapper(butt: number) {
  const p = ([x, y]: Point): Point => [
    butt + (STOCK_BUTT_SX - x) * STOCK_SCALE,
    BORE_Y + (y - STOCK_AXIS_SY) * STOCK_SCALE,
  ];
  const d = ([x, y]: Point): Point => [-x, y];
  return { p, d, r: (v: number) => v * STOCK_SCALE };
}

function stockShapes(butt: number) {
  const { p, d, r } = stockMapper(butt);
  const ps = (pts: Point[]) => pts.map(p);
  const roundedS = (pts: Point[], radii: number[]) =>
    rounded(
      ps(pts),
      radii.map((v) => r(v)),
    );
  const body = `M${fmt(p([136, 311]))} L${fmt(p([1000, 311]))} C${fmt(p([1030, 311]))} ${fmt(p([1044, 316]))} ${fmt(p([1050, 330]))} ${smoothCurve(
    ps([
      [1050, 330],
      [1054, 400],
      [1044, 500],
      [1023, 600],
      [1010, 700],
      [1002, 840],
      [985, 905],
      [966, 945],
    ]),
    d([0.1, 1]),
    d([-0.5, 1]),
  )} C${fmt(p([958, 960]))} ${fmt(p([945, 963]))} ${fmt(p([930, 962]))} L${fmt(p([880, 960]))} ${smoothCurve(
    ps([
      [880, 960],
      [860, 957],
      [800, 913],
      [600, 860],
      [400, 812],
      [336, 798],
    ]),
    d([-1, -0.1]),
    d([-1, -0.2]),
  )} C${fmt(p([322, 795]))} ${fmt(p([318, 785]))} ${fmt(p([318, 770]))} L${fmt(p([318, 735]))} C${fmt(p([318, 724]))} ${fmt(p([330, 716]))} ${fmt(p([345, 705]))} ${smoothCurve(
    ps([
      [345, 705],
      [344, 660],
      [338, 610],
      [330, 562],
      [318, 538],
    ]),
    d([0, -1]),
    d([-0.6, -0.8]),
  )} C${fmt(p([312, 530]))} ${fmt(p([305, 527]))} ${fmt(p([295, 527]))} L${fmt(p([160, 528]))} C${fmt(p([146, 530]))} ${fmt(p([138, 532]))} ${fmt(p([136, 528]))} Z`;
  const opening = roundedS(
    [
      [476, 538],
      [793, 538],
      [795, 602],
      [866, 618],
      [858, 765],
      [838, 786],
      [785, 808],
      [491, 712],
      [477, 690],
    ],
    [6, 2, 8, 6, 6, 6, 10, 10, 4],
  );
  const ringCenter = p([835, 565]);
  const ringHole = circle(ringCenter, r(20.5));
  const ringBoss = circle(ringCenter, r(33));
  // The slot: a pill along its own lean, from 905,610 to 892,748
  const slotTop = p([905, 621]);
  const slotBottom = p([892, 737]);
  const slotR = r(11);
  const slotAngle = (Math.atan2(slotBottom[1] - slotTop[1], slotBottom[0] - slotTop[0]) * 180) / Math.PI;
  const slot =
    `M${fmt(on(slotTop, slotR, slotAngle + 90))} ${arc(slotTop, slotR, slotAngle + 90, slotAngle + 270)} ` +
    `L${fmt(on(slotBottom, slotR, slotAngle - 90))} ${arc(slotBottom, slotR, slotAngle - 90, slotAngle + 90)} Z`;
  const pad = `M${fmt(p([994, 311]))} L${fmt(p([1000, 311]))} C${fmt(p([1030, 311]))} ${fmt(p([1044, 316]))} ${fmt(p([1050, 330]))} ${smoothCurve(
    ps([
      [1050, 330],
      [1054, 400],
      [1044, 500],
      [1023, 600],
      [1010, 700],
      [1002, 840],
      [985, 905],
      [966, 945],
    ]),
    d([0.1, 1]),
    d([-0.5, 1]),
  )} C${fmt(p([958, 960]))} ${fmt(p([945, 963]))} ${fmt(p([930, 962]))} L${fmt(p([925, 960]))} L${fmt(p([962, 950]))} ${smoothCurve(
    ps([
      [962, 950],
      [972, 700],
      [985, 450],
      [994, 312],
    ]),
    d([0.1, -1]),
    d([0.05, -1]),
  )} Z`;
  // Ribs across the pad's back
  const ribs: string[] = [];
  for (let y = 350; y <= 920; y += 22) {
    const x = interpolateX(
      [
        [1054, 340],
        [1054, 400],
        [1044, 500],
        [1023, 600],
        [1010, 700],
        [1002, 840],
        [985, 905],
        [966, 945],
      ],
      y,
    );
    ribs.push(`M${fmt(p([x - 1, y]))} L${fmt(p([x - 14, y + 3]))}`);
  }
  const crease = `M${fmt(p([140, 470]))} L${fmt(p([980, 470]))}`;
  const underBox = `M${fmt(p([136, 474]))} L${fmt(p([310, 474]))} L${fmt(p([318, 527]))} L${fmt(p([136, 528]))} Z`;
  const pockets =
    roundedS(
      [
        [293, 420],
        [437, 420],
        [437, 449],
        [293, 449],
      ],
      [12, 12, 12, 12],
    ) +
    " " +
    roundedS(
      [
        [734, 420],
        [881, 420],
        [881, 449],
        [734, 449],
      ],
      [12, 12, 12, 12],
    );
  const lever = roundedS(
    [
      [380, 482],
      [520, 497],
      [694, 545],
      [697, 584],
      [520, 540],
      [384, 504],
    ],
    [8, 0, 4, 4, 0, 8],
  );
  const leverRibs: string[] = [];
  for (let x = 590; x <= 680; x += 12) {
    const top = 515 + ((x - 520) * (545 - 497)) / (694 - 520);
    leverRibs.push(`M${fmt(p([x, top + 8]))} L${fmt(p([x + 4, top + 28]))}`);
  }
  const pivot = circle(p([509, 516]), r(21));
  return {
    body,
    opening,
    ringHole,
    ringBoss,
    slot,
    pad,
    ribs: ribs.join(" "),
    crease,
    underBox,
    pockets,
    lever,
    leverRibs: leverRibs.join(" "),
    pivot,
    top: p([136, 311])[1],
    bottom: p([930, 962])[1],
    front: p([136, 311])[0],
  };
}

function stock(butt: number, F: Material, rim: number): string {
  const s = stockShapes(butt);
  return `<!-- The stock: Magpul's DT-PR, mirrored from its photo (its left side) onto the tube -->
  <g id="ar-15-stock">
    <path d="${s.body} ${s.opening} ${s.slot} ${s.ringHole}" fill="url(#ar-15-stock-shading)"/>
    <g clip-path="url(#ar-15-stock-clip)" fill="none">
      <!-- The latch's housing, set back under the box's front -->
      <path d="${s.underBox}" fill="${F.dark}" opacity="0.55"/>
      <!-- The crease along the box's bottom: a shadow under it, the frame below lit along its top -->
      <path d="${s.crease}" stroke="${F.dark}" stroke-width="4"/>
      <!-- The opening's and slot's cut edges, lit at their bottoms -->
      <path d="${s.opening}" stroke="${F.light}" stroke-width="4" opacity="0.7"/>
      <path d="${s.slot}" stroke="${F.light}" stroke-width="3" opacity="0.6"/>
      <!-- The rim light along the top -->
      <path d="M${fmt([s.front, s.top])} L${fmt([butt + 10, s.top])}" stroke="${F.highlight}" stroke-width="${f1(rim * 2)}"/>
    </g>
    <!-- Shallow pockets along the box -->
    <path d="${s.pockets}" fill="${F.dark}" opacity="0.5"/>
    <!-- The sling ring's boss round its hole -->
    <path d="${s.ringBoss} ${s.ringHole}" fill="${mix(F.base, F.light, 0.5)}"/>
    <!-- The butt pad, rubber, ribbed across its back -->
    <path d="${s.pad}" fill="${mix(F.base, F.dark, 0.45)}"/>
    <path d="${s.ribs}" stroke="${F.dark}" stroke-width="2.5" fill="none"/>
    <!-- The latch lever across the opening's top, on its pivot -->
    <path d="${s.lever}" fill="${F.base}" stroke="${F.dark}" stroke-width="2"/>
    <path d="${s.leverRibs}" stroke="${F.dark}" stroke-width="2" fill="none"/>
    <path d="${s.pivot}" fill="${F.light}" stroke="${F.dark}" stroke-width="2"/>
  </g>`;
}

// ---------------------------------------------------------------------------------------------------------
// The optic: Vortex's AMG UH-1 Gen II, drawn in its own photo's pixels (ar-15-optic.webp, 1000 by 1000, its right
// side, front to the right), mapped onto the upper's rail.
//
// Construction (its photo, and the other side's): two blocks on a mount. THE HOOD on top, round the big front
// window: its top (y 143) flat from 340 to 958, sloping down at its back (to 108,182) with two grooves along the
// slope; its front face standing out at its top (to 982 at y 240), then sloping back in (945 at y 350 to 440); a
// pale machined bevel along its upper side (225 to 300), the flat side below it (300 to 540) with a recessed
// panel at its back (100 to 320, 305 to 475), and its bottom edge a lit lip (y 540). THE BODY under it (556 to 760),
// set in a little from the hood, its back rounding out to the battery cap (to x 13); on its right side the
// elevation and windage dials (425,665 and 735,728, r 62, coin slotted) in a raised plate, a slot along its top
// back, and cooling fins at its back below. THE MOUNT under the body: its clamp on the rail, the jaw's bottom at y
// 861 from 203 to 562, rising to the front (803,780); the cross bolt's nut in a plate (360,808). Logo and
// lettering dropped. From the side the window isn't seen: the hood's sides are solid.

// Its size (round 2), from a photo of a UH-1 on an AR-15 (ar-15-with-uh1.png, from its left side). There the
// rail's slots give 0.6268 mm a pixel (30 slots in 479 px; the buffer tube, 46 px, comes out 28.8 mm), and the
// optic is 154 px long overall (x 701 to 855, battery cap and all), 96.5 mm, and 107 px from its hood's top to its
// mount's bottom (y 243.7 to 351), 67.3 mm. Vortex's table says 3.9" by 2.7" (99 by 68.6 mm: vortexcanada.net,
// nightvisionguys.com), 2% to 2.5% more, about a pixel or two of the reference's soft edges; the drawing follows the
// reference, as Simon asked. In its own photo the same extents are x 13 to 982 (969 px) and y 143 to 861 (718
// px): the close-up photo makes it a little taller than it is (969:718 is 1.35, the reference's 1.44), so it's
// mapped with one scale along and another up and down, each from the reference. Round 1 had scaled Vortex's 3.9" to
// the housing without its battery cap (890 px) and used that one scale both ways: 12% too long and 18% too tall.
// Its seat: the mount's bottom is 13.4 px (8.4 mm) below the rail's top in the reference, which puts the rail's top
// at y 771 in its photo; and its front sits just behind the upper's long front lug, 5 px (3 mm) behind it.
const REF_MM_PER_PX = (30 * 10.008) / 479;
const OPTIC_MM_PER_PX_X = (REF_MM_PER_PX * (855 - 701)) / (982 - 13);
const OPTIC_MM_PER_PX_Y = (REF_MM_PER_PX * (351 - 243.7)) / (861 - 143);
const OPTIC_SCALE_X = OPTIC_MM_PER_PX_X / MM_PER_PX;
const OPTIC_SCALE_Y = OPTIC_MM_PER_PX_Y / MM_PER_PX;
/** The optic photo's housing front (x 982) goes here, 3 mm behind the upper's long front lug */
const OPTIC_FRONT_X = 1131 - 3 / MM_PER_PX;
const OPTIC_FRONT_OX = 982;
/** The rail's top in the optic's photo: 8.4 mm above its mount's bottom (y 861) */
const OPTIC_RAIL_OY = 861 - 8.4 / OPTIC_MM_PER_PX_Y;

function opticMapper() {
  const p = ([x, y]: Point): Point => [
    OPTIC_FRONT_X + (x - OPTIC_FRONT_OX) * OPTIC_SCALE_X,
    RAIL_LUG_TOP + (y - OPTIC_RAIL_OY) * OPTIC_SCALE_Y,
  ];
  // Round things (the dials, the nut) by the mean of the two
  return { p, r: (v: number) => v * Math.sqrt(OPTIC_SCALE_X * OPTIC_SCALE_Y) };
}

function opticShapes() {
  const { p, r } = opticMapper();
  const ps = (pts: Point[]) => pts.map(p);
  const roundedO = (pts: Point[], radii: number[]) =>
    rounded(
      ps(pts),
      radii.map((v) => r(v)),
    );
  const hood = roundedO(
    [
      [108, 182],
      [215, 158],
      [340, 143],
      [958, 143],
      [982, 235],
      [978, 290],
      [962, 350],
      [958, 548],
      [80, 548],
      [93, 280],
    ],
    [10, 20, 10, 10, 6, 20, 20, 6, 6, 12],
  );
  const body = roundedO(
    [
      [92, 365],
      [940, 548],
      [940, 600],
      [900, 640],
      [858, 760],
      [83, 760],
      [37, 742],
      [16, 690],
      [14, 640],
      [30, 560],
      [60, 430],
    ],
    [10, 4, 20, 20, 10, 6, 20, 20, 20, 30, 20],
  );
  const mount = roundedO(
    [
      [83, 756],
      [858, 756],
      [803, 780],
      [707, 840],
      [562, 861],
      [203, 861],
      [127, 800],
    ],
    [4, 4, 20, 20, 10, 10, 20],
  );
  const bevel = roundedO(
    [
      [100, 225],
      [976, 225],
      [980, 262],
      [960, 300],
      [96, 300],
    ],
    [4, 4, 10, 4, 4],
  );
  const panel = roundedO(
    [
      [100, 305],
      [320, 312],
      [292, 472],
      [82, 478],
    ],
    [14, 14, 14, 14],
  );
  const grooves = `M${fmt(p([220, 168]))} L${fmt(p([330, 154]))} M${fmt(p([222, 192]))} L${fmt(p([330, 180]))}`;
  const lip = `M${fmt(p([82, 540]))} L${fmt(p([958, 540]))}`;
  const elevation = p([425, 665]);
  const windage = p([735, 728]);
  const dialR = r(60);
  const dials = circle(elevation, dialR) + " " + circle(windage, dialR);
  const dialSlots = [elevation, windage]
    .map((c) => `M${fmt(on(c, dialR * 0.75, 125))} L${fmt(on(c, dialR * 0.75, -55))}`)
    .join(" ");
  const plate = roundedO(
    [
      [340, 610],
      [500, 600],
      [880, 680],
      [820, 800],
      [640, 800],
      [345, 720],
    ],
    [30, 30, 40, 30, 30, 30],
  );
  const topSlot = roundedO(
    [
      [150, 580],
      [360, 580],
      [360, 610],
      [150, 610],
    ],
    [15, 15, 15, 15],
  );
  const fins: string[] = [];
  for (let i = 0; i < 5; i++) {
    const x = 140 + i * 45;
    fins.push(`M${fmt(p([x + 20, 645]))} L${fmt(p([x, 755]))}`);
  }
  const nut = circle(p([360, 812]), r(30));
  const nutPlate = roundedO(
    [
      [290, 785],
      [440, 785],
      [440, 858],
      [290, 858],
    ],
    [16, 16, 10, 10],
  );
  return {
    hood,
    body,
    mount,
    bevel,
    panel,
    grooves,
    lip,
    dials,
    dialSlots,
    plate,
    topSlot,
    fins: fins.join(" "),
    nut,
    nutPlate,
    top: p([0, 143])[1],
    hoodBottom: p([0, 548])[1],
    bodyBottom: p([0, 760])[1],
    jawBottom: p([0, 861])[1],
    back: p([13, 0])[0],
    front: p([982, 0])[0],
    width: r(1),
    p,
  };
}

function optic(O: Material, rim: number): string {
  const o = opticShapes();
  return `<!-- The optic: Vortex's AMG UH-1 Gen II, from its right side, on the upper's rail -->
  <g id="ar-15-optic">
    <path d="${o.mount}" fill="url(#ar-15-optic-mount-shading)"/>
    <path d="${o.nutPlate}" fill="${O.dark}" opacity="0.6"/>
    <path d="${o.nut}" fill="${AR_STEEL.light}" stroke="${O.dark}" stroke-width="1.5"/>
    <path d="${o.body}" fill="url(#ar-15-optic-body-shading)"/>
    <g clip-path="url(#ar-15-optic-body-clip)" fill="none">
      <path d="${o.fins}" stroke="${O.dark}" stroke-width="4"/>
      <path d="${o.topSlot}" fill="${O.dark}" opacity="0.7"/>
      <path d="${o.plate}" fill="${O.light}" opacity="0.35"/>
      <path d="${o.dials}" fill="${O.dark}" stroke="${O.light}" stroke-width="1.5"/>
      <path d="${o.dialSlots}" stroke="${O.base}" stroke-width="3"/>
    </g>
    <path d="${o.hood}" fill="url(#ar-15-optic-hood-shading)"/>
    <g clip-path="url(#ar-15-optic-hood-clip)" fill="none">
      <!-- The pale machined bevel along its upper side -->
      <path d="${o.bevel}" fill="url(#ar-15-optic-bevel-shading)"/>
      <path d="${o.panel}" fill="${O.dark}" opacity="0.45"/>
      <path d="${o.grooves}" stroke="${O.highlight}" stroke-width="2.5"/>
      <path d="${o.lip}" stroke="${O.light}" stroke-width="3"/>
      <!-- The rim light along its top -->
      <path d="M${fmt([o.back, o.top])} L${fmt([o.front, o.top])}" stroke="${O.highlight}" stroke-width="${f1(rim * 2)}"/>
    </g>
  </g>`;
}

// ---------------------------------------------------------------------------------------------------------
// The side view

function drawSide(options: Ar15Options = {}): string {
  const R: Material = { ...AR_ANODIZED, ...options.receiver };
  const H: Material = { ...R, ...options.handguard };
  const F: Material = { ...AR_POLYMER, ...options.furniture };
  const O: Material = { ...AR_OPTIC, ...options.optic };
  const M: Material = { ...AR_MAGAZINE, ...options.magazine };
  const S: Material = { ...AR_STEEL, ...options.steel };
  const T: Material = { ...AR_TRIGGER, ...options.trigger };
  const shift = ((options.barrel ?? DEFAULT_BARREL_IN) - PHOTO_BARREL_IN) * PX_PER_IN;
  const butt = buttX(options.stockNotch ?? DEFAULT_NOTCH);
  const outlinePx = (options.outlineMm ?? OUTLINE_MM) / MM_PER_PX;
  const rim = (options.rimLightMm ?? RIM_LIGHT_MM) / MM_PER_PX;
  const hider = hiderShapes(shift);
  const barrel = box(BARREL_BACK, BARREL_TOP, HIDER_BACK + shift + 2, BARREL_BOTTOM);
  const st = stockShapes(butt);
  const op = opticShapes();
  const tube = box(butt + 40, TUBE_TOP, TUBE_FRONT, TUBE_BOTTOM);
  const flutes: string[] = [];
  for (let x = RING_FRONT + 6; x < HIDER_END - 22; x += 9) {
    flutes.push(`M${f1(x + shift)},${PRONG_TOP + 3} L${f1(x + shift + 6)},${SLOT_TOP - 3}`);
  }
  const threads: string[] = [];
  for (let x = THREADS[0] + 2; x < THREADS[1]; x += 5) {
    threads.push(`M${f1(x)},${TUBE_TOP} L${f1(x + 2)},${TUBE_BOTTOM}`);
  }

  const outlineParts: [string, string][] = [
    [barrel, S.dark],
    [hider.body, S.dark],
    [HANDGUARD, H.dark],
    [lugs(HG_LUGS, RAIL_LUG_TOP, HG_TOP + 1), H.dark],
    [BOTTOM_RAIL + " " + BOTTOM_RAIL_LUGS, H.dark],
    [COVERS.map(([a, b]) => rbox(a, COVER_TOP, b, COVER_BOTTOM, 4)).join(" "), F.dark],
    [tube, R.dark],
    [CASTLE, S.dark],
    [END_PLATE, R.dark],
    [st.body, F.dark],
    [MAGAZINE, M.dark],
    [GRIP, F.dark],
    [TRIGGER, T.dark],
    [LOWER, R.dark],
    [UPPER_BODY + " " + UPPER_RAIL_FLAT, R.dark],
    [lugs(UPPER_LUGS, RAIL_LUG_TOP, HG_TOP + 1), R.dark],
    [rbox(1131, RAIL_LUG_TOP, 1159, HG_TOP + 1, [1.5, 1.5, 0, 0]), R.dark],
    [CHARGING_HANDLE, R.dark],
    [REAR_SIGHT_BASE + " " + REAR_SIGHT_LEAF, R.dark],
    [FRONT_SIGHT_BASE + " " + FRONT_SIGHT_POST, H.dark],
  ];
  if (!options.noOptic) {
    outlineParts.push([op.mount + " " + op.body + " " + op.hood, O.dark]);
  }
  const outlines = `<!-- The outline: each part's shape stroked under everything, so only its outer half shows -->
  <g id="ar-15-outline" fill="none" stroke-width="${f1(outlinePx * 2)}">
    ${outlineParts.map(([d, c]) => `<path d="${d}" stroke="${c}"/>`).join("\n    ")}
  </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="2000" viewBox="0 0 2400 2000" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  <defs>
    ${linear("ar-15-barrel-shading", [0, BARREL_TOP], [0, BARREL_BOTTOM], roundStops(S))}
    ${linear("ar-15-hider-shading", [0, COLLAR_TOP], [0, COLLAR_BOTTOM], roundStops(S))}
    ${linear("ar-15-tube-shading", [0, TUBE_TOP], [0, TUBE_BOTTOM], roundStops(R))}
    ${linear("ar-15-castle-shading", [0, 812], [0, 896], roundStops(S))}
    <!-- The handguard, down its side: the upper facet lit, the side, the lower facet in shadow -->
    ${linear("ar-15-handguard-shading", [0, HG_TOP], [0, HG_BOTTOM], [
      [0, H.dark],
      [(HG_FACE - HG_TOP) / (HG_BOTTOM - HG_TOP), H.base],
      [(HG_FACE - HG_TOP + 1) / (HG_BOTTOM - HG_TOP), H.highlight],
      [(HG_FACE - HG_TOP + 4) / (HG_BOTTOM - HG_TOP), H.light],
      [(HG_UPPER_FACET - HG_TOP) / (HG_BOTTOM - HG_TOP), mix(H.base, H.light, 0.6)],
      [(HG_UPPER_FACET - HG_TOP + 1) / (HG_BOTTOM - HG_TOP), H.base],
      [(HG_LOWER_FACET - HG_TOP) / (HG_BOTTOM - HG_TOP), mix(H.base, H.dark, 0.2)],
      [(HG_LOWER_FACET - HG_TOP + 1) / (HG_BOTTOM - HG_TOP), mix(H.base, H.dark, 0.55)],
      [1, H.dark],
    ])}
    <!-- The upper, down its side: the spine dark under the lugs, the flat band lit, the side, the lip -->
    ${linear("ar-15-upper-shading", [0, HG_TOP], [0, SEAM], [
      [0, R.dark],
      [(HG_FACE - HG_TOP) / (SEAM - HG_TOP), R.base],
      [(HG_FACE - HG_TOP + 1) / (SEAM - HG_TOP), R.highlight],
      [(HG_FACE - HG_TOP + 4) / (SEAM - HG_TOP), R.light],
      [(UPPER_CREASE - HG_TOP) / (SEAM - HG_TOP), mix(R.base, R.light, 0.5)],
      [(UPPER_CREASE - HG_TOP + 1) / (SEAM - HG_TOP), R.dark],
      [(UPPER_CREASE - HG_TOP + 4) / (SEAM - HG_TOP), R.base],
      [0.85, R.base],
      [1, mix(R.base, R.dark, 0.5)],
    ])}
    ${linear("ar-15-boss-shading", [0, 828], [0, 880], roundStops(R))}
    ${linear("ar-15-lower-shading", [0, SEAM], [0, 1075], [
      [0, R.light],
      [0.03, mix(R.base, R.light, 0.6)],
      [0.4, R.base],
      [1, mix(R.base, R.dark, 0.5)],
    ])}
    ${linear("ar-15-dust-cover-shading", [0, 825], [0, 870], faceStops(R, 0.3))}
    ${linear("ar-15-charging-shading", [0, 783], [0, 812], faceStops(R, 0.4))}
    ${linear("ar-15-magwell-shading", [0, 926], [0, 1022], [
      [0, R.highlight],
      [0.04, R.light],
      [0.5, mix(R.base, R.light, 0.3)],
      [1, R.base],
    ])}
    <!-- The grip, across it square to its lean: its back lit, its front rounding away -->
    ${linear("ar-15-grip-shading", [640, 1080], [790, 1160], [
      [0, F.light],
      [0.25, mix(F.base, F.light, 0.5)],
      [0.65, F.base],
      [1, F.dark],
    ])}
    <!-- The magazine, across it: lit at its back, its front turning away -->
    ${linear("ar-15-magazine-shading", [970, 1150], [1135, 1150], [
      [0, M.light],
      [0.15, mix(M.base, M.light, 0.5)],
      [0.6, M.base],
      [1, mix(M.base, M.dark, 0.6)],
    ])}
    ${linear("ar-15-trigger-shading", [855, 0], [884, 0], [
      [0, T.highlight],
      [0.4, T.light],
      [1, T.base],
    ])}
    ${linear("ar-15-stock-shading", [0, st.top], [0, st.bottom], [
      [0, F.highlight],
      [0.02, F.light],
      [0.15, mix(F.base, F.light, 0.4)],
      [0.45, F.base],
      [1, mix(F.base, F.dark, 0.5)],
    ])}
    ${linear("ar-15-cover-shading", [0, COVER_TOP], [0, COVER_BOTTOM], [
      [0, F.light],
      [0.08, mix(F.base, F.light, 0.5)],
      [0.6, F.base],
      [1, F.dark],
    ])}
    ${linear("ar-15-optic-hood-shading", [0, op.top], [0, op.hoodBottom], [
      [0, O.light],
      [0.2, mix(O.base, O.light, 0.4)],
      [0.21, O.base],
      [0.8, O.base],
      [1, mix(O.base, O.dark, 0.4)],
    ])}
    ${linear("ar-15-optic-bevel-shading", [0, op.p([0, 225])[1]], [0, op.p([0, 300])[1]], [
      [0, O.highlight],
      [0.5, mix(O.light, O.highlight, 0.5)],
      [1, O.light],
    ])}
    ${linear("ar-15-optic-body-shading", [0, op.hoodBottom], [0, op.bodyBottom], [
      [0, O.dark],
      [0.1, O.base],
      [0.7, O.base],
      [1, mix(O.base, O.dark, 0.5)],
    ])}
    ${linear("ar-15-optic-mount-shading", [0, op.bodyBottom], [0, op.jawBottom], [
      [0, O.dark],
      [0.15, O.light],
      [0.6, O.base],
      [1, O.dark],
    ])}
    <clipPath id="ar-15-handguard-clip">
      <path d="${HANDGUARD}"/>
    </clipPath>
    <clipPath id="ar-15-upper-clip">
      <path d="${UPPER_BODY}"/>
    </clipPath>
    <clipPath id="ar-15-lower-clip">
      <path d="${LOWER} ${OPENING}"/>
    </clipPath>
    <clipPath id="ar-15-grip-clip">
      <path d="${GRIP}"/>
    </clipPath>
    <clipPath id="ar-15-grip-panel-clip">
      <path d="${GRIP_PANEL}"/>
    </clipPath>
    <clipPath id="ar-15-magazine-clip">
      <path d="${MAGAZINE}"/>
    </clipPath>
    <clipPath id="ar-15-stock-clip">
      <path d="${st.body} ${st.opening} ${st.slot} ${st.ringHole}"/>
    </clipPath>
    <clipPath id="ar-15-optic-hood-clip">
      <path d="${op.hood}"/>
    </clipPath>
    <clipPath id="ar-15-optic-body-clip">
      <path d="${op.body}"/>
    </clipPath>
  </defs>
  ${options.outline === false ? "" : outlines}
  <!-- The barrel: through the handguard's middle slots, and out of its front to the hider -->
  <g id="ar-15-barrel">
    <path d="${barrel}" fill="url(#ar-15-barrel-shading)"/>
    <path d="${box(GAS_BLOCK[0], GAS_TOP, GAS_BLOCK[1], BARREL_BOTTOM + 2)}" fill="${S.base}"/>
    <path d="M${GAS_BLOCK[0]},${GAS_TOP + 1} L${GAS_BLOCK[1]},${GAS_TOP + 1}" stroke="${S.light}" stroke-width="2" fill="none"/>
  </g>
  <!-- KAC's 3-prong flash hider: a collar with two set screws, a ring, then the prongs; the slot between the top
       and bottom prongs is a hole -->
  <g id="ar-15-flash-hider">
    <path d="${hider.body} ${hider.slot} ${hider.notch}" fill="url(#ar-15-hider-shading)"/>
    <path d="M${f1(COLLAR[1] + shift)},${COLLAR_TOP + 2} L${f1(COLLAR[1] + shift)},${COLLAR_BOTTOM - 2} M${f1(RING_FRONT + shift)},${PRONG_TOP + 1} L${f1(RING_FRONT + shift)},${PRONG_BOTTOM - 1}" stroke="${S.dark}" stroke-width="2.5" fill="none"/>
    <path d="${flutes.join(" ")}" stroke="${S.dark}" stroke-width="2" fill="none"/>
    <path d="${circle([1866 + shift, 838], 4)} ${circle([1866 + shift, 862], 5.5)}" fill="${S.dark}"/>
  </g>
  <!-- The handguard: KAC's URX 4, its rail along the top, M-LOK slots through it in rows -->
  <g id="ar-15-handguard">
    <path d="${HANDGUARD} ${THROUGH_SLOTS}" fill="url(#ar-15-handguard-shading)"/>
    <path d="${lugs(HG_LUGS, RAIL_LUG_TOP, HG_TOP + 1)}" fill="${H.base}"/>
    <path d="${lugs(HG_LUGS, RAIL_LUG_TOP, RAIL_LUG_TOP + 2)}" fill="${H.highlight}"/>
    <g clip-path="url(#ar-15-handguard-clip)" fill="none">
      <!-- The middle row: the barrel through them, in the handguard's shadow -->
      <path d="${BARREL_SLOTS}" fill="${S.dark}" opacity="0.3"/>
      <!-- The slots' cut edges: lit along their bottoms, in shadow along their tops -->
      <path d="${THROUGH_SLOTS} ${BARREL_SLOTS}" stroke="${H.dark}" stroke-width="3"/>
      <!-- The QD socket at the back -->
      <path d="${circle(HG_QD, 18)}" fill="${H.light}" stroke="${H.dark}" stroke-width="2"/>
      <path d="${circle(HG_QD, 11)}" fill="${H.dark}"/>
      <!-- The rim light along the rail's spine -->
      <path d="M${HG_BACK},${HG_TOP + rim / 2} L${HG_FRONT - 3},${HG_TOP + rim / 2}" stroke="${H.highlight}" stroke-width="${f1(rim)}" opacity="0.6"/>
    </g>
    <!-- KAC's rail section under the front -->
    <path d="${BOTTOM_RAIL} ${BOTTOM_RAIL_LUGS}" fill="${mix(H.base, H.dark, 0.3)}"/>
    <path d="M1650,907 L1845,907" stroke="${H.light}" stroke-width="2" fill="none"/>
    <!-- Magpul's M-LOK covers, stippled -->
    ${COVERS.map(([a, b]) => `<path d="${rbox(a, COVER_TOP, b, COVER_BOTTOM, 4)}" fill="url(#ar-15-cover-shading)"/>`).join("\n    ")}
    ${COVERS.map(([a, b]) => `<path d="${stipple(a, b, COVER_TOP, COVER_BOTTOM)}" fill="${F.dark}" opacity="0.55"/>`).join("\n    ")}
  </g>
  <!-- The folded front sight on the handguard's front -->
  <g id="ar-15-front-sight">
    <path d="${FRONT_SIGHT_BASE}" fill="${H.base}"/>
    <path d="${FRONT_SIGHT_POST}" fill="${mix(H.base, H.light, 0.5)}"/>
    <path d="M1740,763 L1802,763" stroke="${H.highlight}" stroke-width="2" fill="none"/>
    <path d="${circle([1812, 774], 4)}" fill="${H.dark}"/>
  </g>
  <!-- The buffer tube, its threads in front of the castle nut, the end plate and its QD socket -->
  <g id="ar-15-buffer-tube">
    <path d="${tube}" fill="url(#ar-15-tube-shading)"/>
    <path d="${threads.join(" ")}" stroke="${R.dark}" stroke-width="2" fill="none"/>
    <path d="${END_PLATE}" fill="${mix(R.base, R.dark, 0.2)}"/>
    <path d="${circle(QD_SOCKET, 14)}" fill="${R.dark}"/>
    <path d="${circle(QD_SOCKET, 9)}" fill="${S.base}"/>
    <path d="${CASTLE}" fill="url(#ar-15-castle-shading)"/>
    <path d="M630,830 L660,830 M630,882 L660,882" stroke="${S.dark}" stroke-width="2" fill="none"/>
    <path d="${circle([645, 845], 3)}" fill="${S.dark}"/>
  </g>
  ${stock(butt, F, rim)}
  <!-- The magazine, up into the magazine well: pressed ribs along it, its floor plate -->
  <g id="ar-15-magazine">
    <path d="${MAGAZINE}" fill="url(#ar-15-magazine-shading)"/>
    <g clip-path="url(#ar-15-magazine-clip)" fill="none">
      ${[0.1, 0.33, 0.62, 0.86].map((t) => `<path d="${magLine(t)}" stroke="${M.dark}" stroke-width="4"/><path d="${magLine(t + 0.03)}" stroke="${M.light}" stroke-width="3" opacity="0.8"/>`).join("\n      ")}
    </g>
    <path d="${FLOOR_PLATE}" fill="${mix(M.base, M.dark, 0.4)}"/>
  </g>
  <!-- The trigger, hanging into the guard's opening -->
  <g id="ar-15-trigger">
    <path d="${TRIGGER}" fill="url(#ar-15-trigger-shading)"/>
    <path d="${TRIGGER_LIT}" stroke="${T.highlight}" stroke-width="2" fill="none"/>
  </g>
  <!-- The grip: an A2, leaning back, a checkered panel along its lean -->
  <g id="ar-15-grip">
    <path d="${GRIP}" fill="url(#ar-15-grip-shading)"/>
    <g clip-path="url(#ar-15-grip-clip)" fill="none">
      <path d="${GRIP_PANEL}" fill="${F.dark}" opacity="0.25"/>
      <g clip-path="url(#ar-15-grip-panel-clip)">
        <path d="${checkering()}" stroke="${F.dark}" stroke-width="2" opacity="0.6"/>
      </g>
      <path d="${GRIP_PANEL}" stroke="${F.light}" stroke-width="2" opacity="0.6"/>
      <path d="M${fmt(GRIP_POINTS_BACK[1])} ${smoothCurve(GRIP_POINTS_BACK.slice(1), [-0.2, 1], [-0.3, 1])}" stroke="${F.highlight}" stroke-width="${f1(rim * 2)}" opacity="0.7"/>
    </g>
  </g>
  <!-- The lower receiver: the trigger guard's opening a hole -->
  <g id="ar-15-lower">
    <path d="${LOWER} ${OPENING}" fill="url(#ar-15-lower-shading)"/>
    <path d="${box(RING[0], RING[1], RING[2], RING[3])}" fill="${R.base}"/>
    <path d="M${RING[0]},${RING[1] + 1} L${RING[2]},${RING[1] + 1}" stroke="${R.highlight}" stroke-width="2" fill="none"/>
    <g clip-path="url(#ar-15-lower-clip)" fill="none">
      <path d="${OPENING}" stroke="${R.dark}" stroke-width="5"/>
      <path d="${OPENING_BEVEL}" stroke="${R.light}" stroke-width="3"/>
      <!-- The seam under the upper, in its shadow -->
      <path d="M627,${SEAM + 2} L1162,${SEAM + 2}" stroke="${R.dark}" stroke-width="4"/>
    </g>
    <!-- The magazine well's raised panel, and the magazine release in its fence -->
    <path d="${MAGWELL_PANEL}" fill="url(#ar-15-magwell-shading)" stroke="${R.dark}" stroke-width="2"/>
    <path d="${MAG_FENCE}" fill="${R.base}" stroke="${R.light}" stroke-width="2.5"/>
    <path d="${MAG_BUTTON}" fill="${mix(R.base, R.dark, 0.5)}" stroke="${R.dark}" stroke-width="2"/>
    <path d="${circle([951, 951], 5)}" fill="${R.light}"/>
    <!-- The bolt catch: its paddle and rod -->
    <path d="${BOLT_ROD}" fill="${R.base}" stroke="${R.dark}" stroke-width="2"/>
    <path d="${BOLT_PADDLE}" fill="${R.light}" stroke="${R.dark}" stroke-width="2"/>
    <path d="M900,905 L900,921 M906,904 L906,922 M912,904 L912,922 M918,905 L918,921" stroke="${R.dark}" stroke-width="1.5" fill="none"/>
    <!-- The safety selector: lever, hub and pointer -->
    <path d="${SELECTOR_LEVER}" fill="${mix(R.light, R.highlight, 0.4)}" stroke="${R.dark}" stroke-width="2"/>
    <path d="${circle(SELECTOR_HUB, 19)} ${SELECTOR_POINTER}" fill="${R.light}" stroke="${R.dark}" stroke-width="2"/>
    <path d="${circle(SELECTOR_HUB, 6)}" fill="${R.dark}"/>
    <!-- Pins -->
    <path d="${circle(TAKEDOWN_PIN, 12)} ${circle(PIVOT_PIN, 10)}" fill="${R.light}" stroke="${R.dark}" stroke-width="2"/>
    <path d="${SMALL_PINS.map((c) => circle(c, 5)).join(" ")}" fill="${R.light}" stroke="${R.dark}" stroke-width="1.5"/>
  </g>
  <!-- The upper receiver: its rail, the bolt carrier's boss, the recess, the closed dust cover on its hinge -->
  <g id="ar-15-upper">
    <path d="${UPPER_BODY}" fill="url(#ar-15-upper-shading)"/>
    <path d="${UPPER_RAIL_FLAT}" fill="${R.base}"/>
    <path d="${lugs(UPPER_LUGS, RAIL_LUG_TOP, HG_TOP + 1)} ${rbox(1131, RAIL_LUG_TOP, 1159, HG_TOP + 1, [1.5, 1.5, 0, 0])}" fill="${R.base}"/>
    <path d="${lugs(UPPER_LUGS, RAIL_LUG_TOP, RAIL_LUG_TOP + 2)} ${box(1131, RAIL_LUG_TOP, 1159, RAIL_LUG_TOP + 2)} ${box(UPPER_BACK + 2, 783, 845, 785)}" fill="${R.highlight}"/>
    <g clip-path="url(#ar-15-upper-clip)" fill="none">
      <path d="${BOSS}" fill="url(#ar-15-boss-shading)"/>
      <path d="${BOSS}" stroke="${R.dark}" stroke-width="2"/>
      <path d="${RECESS}" fill="${R.dark}"/>
      <path d="M884,868 L925,868" stroke="${R.light}" stroke-width="2"/>
      <path d="${DUST_COVER}" fill="url(#ar-15-dust-cover-shading)" stroke="${R.dark}" stroke-width="2.5"/>
      <path d="${DUST_PANELS}" stroke="${R.dark}" stroke-width="2" opacity="0.8"/>
      <path d="${DUST_CATCH}" fill="${R.light}"/>
      <!-- The hinge rod, its spring bright in the middle -->
      <path d="M915,${HINGE_Y} L1160,${HINGE_Y}" stroke="${R.dark}" stroke-width="7"/>
      <path d="M915,${HINGE_Y - 1} L1160,${HINGE_Y - 1}" stroke="${R.light}" stroke-width="2.5"/>
      <path d="M1006,${HINGE_Y} L1050,${HINGE_Y}" stroke="${T.light}" stroke-width="6"/>
      <!-- The front: a step down to the handguard -->
      <path d="M1158,800 L1158,897" stroke="${R.dark}" stroke-width="4"/>
    </g>
  </g>
  <!-- The charging handle's latch over the upper's back -->
  <g id="ar-15-charging-handle">
    <path d="${CHARGING_HANDLE}" fill="url(#ar-15-charging-shading)"/>
    <path d="M736,792 L752,792 L752,804 L736,804 Z" fill="${R.dark}"/>
  </g>
  <!-- The rear sight, folded down behind the optic -->
  <g id="ar-15-rear-sight">
    <path d="${REAR_SIGHT_BASE}" fill="${R.base}"/>
    <path d="${REAR_SIGHT_LEAF}" fill="${mix(R.base, R.light, 0.5)}"/>
    <path d="M794,763 L846,763" stroke="${R.highlight}" stroke-width="2" fill="none"/>
    <path d="${circle([780, 778], 5)}" fill="${R.dark}"/>
  </g>
  ${options.noOptic ? "" : optic(O, rim)}
</svg>`;
}

const DEFAULT_OPTIC = opticShapes();

export const AR_15: GunDrawing<Ar15Options> = {
  name: "ar-15",
  draft: true,
  photo: {
    file: "ar-15.jpg",
    width: 2000,
    height: 2000,
    about:
      "A Knight's Armament SR-15 carbine from its right side, muzzle to the right, on white, evenly lit: the base, but its stock and sights aren't the ones we draw",
  },
  otherPhotos: [
    {
      file: "ar-15-stock.jpg",
      width: 1200,
      height: 1200,
      about:
        "The Magpul DT-PR Carbine stock on its own, from its left side (butt to the right): mirrored onto the base photo's buffer tube",
    },
    {
      file: "ar-15-optic.webp",
      width: 1000,
      height: 1000,
      about:
        "The Vortex AMG UH-1 Gen II from its right side (its windage and elevation dials), front to the right, on a transparent background: drawn as it is",
    },
    {
      file: "ar-15-optic-alternate.jpg",
      width: 1200,
      height: 1200,
      about:
        "The Vortex AMG UH-1 Gen II from its left side, with its quick-detach lever: a check on its shape",
    },
    {
      file: "ar-15-with-uh1.png",
      width: 1350,
      height: 900,
      about:
        "An FDE AR-15 from its left side (muzzle left) with a UH-1 on its upper: the optic's size against the rail's slots, and where it sits",
    },
  ],
  // The origin on the gun's middle on the bore (from the butt, one notch out, to the hider's end with a 16"
  // barrel), and the rail's pitch for the scale
  scale: { origin: ORIGIN, mmPerPixel: MM_PER_PX },
  frame: {
    // The optic's top, the magazine's floor plate, the butt, the hider's end (16")
    top: DEFAULT_OPTIC.top,
    bottom: 1325,
    back: DEFAULT_BACK,
    front: DEFAULT_FRONT,
    side: 880,
    pixels: 512,
  },
  comment: `
  <!-- The AR-15 from its right side, muzzle to the right: a Knight's Armament SR-15 with a 16" barrel, KAC's
       M-LOK handguard, a Magpul DT-PR stock one notch out and a Vortex UH-1 holographic sight, its flip-up sights
       folded. Millimeters, with the origin on the gun's middle on the bore, as the guns' top views in
       weapons/guns/art/ have it; drawn over photos, then simplified. -->`,
  drawSide,
};

/**
 * How the stock's and the optic's photos map onto the base photo's pixels, as the affine matrices [a, b, c, d, e,
 * f] (base = a·x + c·y + e, b·x + d·y + f), for laying those photos under the drawing to check it
 */
export function partPhotoMaps(notch = DEFAULT_NOTCH): Record<
  "stock" | "optic",
  { file: string; matrix: [number, number, number, number, number, number] }
> {
  return {
    stock: {
      file: "ar-15-stock.jpg",
      matrix: [
        -STOCK_SCALE,
        0,
        0,
        STOCK_SCALE,
        buttX(notch) + STOCK_BUTT_SX * STOCK_SCALE,
        BORE_Y - STOCK_AXIS_SY * STOCK_SCALE,
      ],
    },
    optic: {
      file: "ar-15-optic.webp",
      matrix: [
        OPTIC_SCALE_X,
        0,
        0,
        OPTIC_SCALE_Y,
        OPTIC_FRONT_X - OPTIC_FRONT_OX * OPTIC_SCALE_X,
        RAIL_LUG_TOP - OPTIC_RAIL_OY * OPTIC_SCALE_Y,
      ],
    },
  };
}
