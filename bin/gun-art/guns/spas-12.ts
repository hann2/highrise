/**
 * The Franchi SPAS-12 from its right side, with no stock (Simon: it looks most like a zombie film that way): its
 * pistol grip, the black receiver, the parkerized perforated heat shield over the barrel, the big ribbed pump, the
 * magazine tube and the barrel. Drawn in the pixels of its photo (2400 by 1350) by named numbers, following the
 * gun-art skill (.claude/skills/gun-art/SKILL.md), with guns/m1911.ts as the worked example. A draft until it goes
 * into the game.
 *
 * Light falls from above, as on the pistols: top edges and top faces lit, undersides in shadow, round things (the
 * barrel, the magazine tube) banded along their length with a bright streak above their middle.
 */
import type { Point } from "../lib/geometry";
import { arc, fixed, fmt, on, rounded, smoothCurve } from "../lib/geometry";
import type { GunDrawing, TopView } from "../lib/gun";
import { generatedNote } from "../lib/gun";
import type { Material, Stops } from "../lib/style";
import { linear } from "../lib/style";

// ---------------------------------------------------------------------------------------------------------
// Dimensions
//
// Franchi's SPAS-12 with the folding stock: 1041 mm long with the stock out, 820 mm folded (Wikipedia, "Franchi
// SPAS-12", from Franchi's figures); barrels of 18", 19 7/8", 21 1/2" and 24"; the game's is the 21 1/2" (546 mm,
// SPAS12.ts), the standard one, which is what the photo has.
//
// In the photo (`measure runs`), with the stock out, the gun runs from the stock's butt plate (x 21) to the end of
// the thread protector on the muzzle (x 2379): 2358 px for 1041 mm, 0.4415 mm a pixel. Checks:
//   - The barrel, 546 mm, is 1237 px back from the muzzle: x 1142, just behind the receiver's front (the heat
//     shield's back, x 1153) and in front of the ejection port: where the breech face sits with the bolt closed.
//   - Without the stock, the gun runs from the back of the grip's hump (x 570) to the muzzle: 1809 px, 799 mm. The
//     folded length (820 mm) is that plus the folded stock's hinge and butt hook, which stand a little behind the
//     hump: the 3D model (stockless) and the render (folded) agree on where the hump ends, to 15 px.
//   - The barrel is 48 px across (21 mm, a 12 gauge barrel's 18.5 mm bore and its wall), the magazine tube 57
//     (25 mm).
//
// The origin: halfway along the stockless gun, (570 + 2379) / 2, on the bore. The bore's height is the barrel's
// middle where it's out in the open (y 508 to 556): y 532.
const MM_PER_PX = 1041 / (2379 - 21);
const BACK = 570; // the back of the grip's hump
const MUZZLE = 2379;
const BORE_Y = 532;
const ORIGIN: Point = [(BACK + MUZZLE) / 2, BORE_Y];

// ---------------------------------------------------------------------------------------------------------
// Construction (from `grid --mode photo`, region by region, with the folded render and the stockless 3D model for
// what the stock hides)
//
// Four assemblies, back to front, each on its own plane:
//
// THE GRIP AND ITS HUMP (black polymer, a little lighter and bluer than the receiver; one molding). The pistol grip,
// leaning back, with a swelling at its foot and a small toe forward at its bottom front; six grooves across it for
// the fingers, and two screws. Above it, behind the receiver, the grip's molding rises into a HUMP to the
// receiver's top: that's where the folding stock's hinge goes (its pivot pin through the hump, the sling loop on
// its top). With no stock, the hump is what's there (the 3D model has no stock and shows it, and the folded render
// shows its back and its loop): a block, its back nearly vertical (x 570), its top rising forward into the
// receiver's top line, a sling loop (a wire ring, x 610 to 660) standing up off its top, and the stock's pivot
// pin through it (663,547). The hump meets the receiver at a seam that leans with the grip's front, from the
// receiver's top (703,498) down to the trigger guard's back (741,641). Below the guard, the grip's front runs down
// from (743,700). In the photo the stock's arm and hinge plate hide the hump's back and top: drawn from the model
// and the render, scaled to the photo by the heat shield and the muzzle.
//
// THE RECEIVER (black anodized aluminium, matte, near black). A long box, flat sided: top y 494, rounded at its back
// corner where it meets the hump; bottom y 637, a darker chamfer band along it (620 to 637) where the side turns
// under. Its front is under the heat shield's back (x 1153); just before it, the bottom steps down 4 px (the
// shield's mount). On its side, proud or cut:
//   - The ejection port: a window with rounded top corners (x 944 to 1114, y 512 to 549), the bolt in it (lighter
//     steel, a darker band along its top, a small slot), cut into the side, so a shadow along its top edge.
//   - Under it, the slot the operating handle runs in (x 833 to 1040, y 547 to 559, a black pill), the operating
//     rod in its front half and the handle's knob standing out of it (x 1062 to 1086).
//   - The bolt release (a serrated button, x 1112 to 1146, y 600 to 619) just behind the shield, two pins.
//   - Lettering ("SPAS 12 FRANCHI S.p.A. BRESCIA ITALY", the serial): dropped.
// THE TRIGGER GROUP (parkerized steel, the heat shield's gray), under the receiver: the guard, a ring whose back
// runs down the grip's front and whose bottom is a flat curve (outer bottom y 717), and in front of it the trigger
// housing, its bottom rising forward to the receiver at x 953. The safety's round button (the crossbolt, S and F)
// on the housing. The guard's opening is a hole (the floor shows through); the trigger, bright steel, hangs in it
// from the receiver, curved and swept forward to its tip.
//
// THE HEAT SHIELD (parkerized steel, a warm gray, matte), over the barrel and the magazine tube from the receiver
// (x 1153) to x 1913. Its top is higher over its back third (y 483, to x 1420) and steps down along a short slope
// to y 493 for the rest. Along its top a row of eight pill-shaped slots (y 512 to 528; the first shorter), through
// which the barrel shows (it's right behind them: the slots are at the barrel's height). Its face below that is
// mostly hidden by the pump; behind the pump's back, at its bottom back, a flat raised panel (x 1163 to 1345, y 533
// to 570, lit, a shadow under its bottom edge), and below it three staggered rows of short slots (y 580 to 641)
// through which the gas system's return spring shows, coiled round the magazine tube (brassy). Its front end has
// its corner rounded off at the top. The rear sight stands on its top over the receiver (an aperture's post and
// block, x 1218 to 1270), and a small button on its top near the front (x 1855 to 1880).
//
// THE PUMP (black polymer, a step bluer and lighter than the receiver), over the shield's lower part from x 1328 to
// x 1916: a long block, its top straight (y 533), its front top corner cut off at a slant, its bottom sagging
// toward its front (y 665 at the back to 687 at x 1700); at its back a lip that stands down below its bottom and
// out behind it (x 1327 to 1352, down to y 685), to stop the hand. Fourteen grooves down its side (x 1387 + 27.4 i,
// y 538 to 655), each a dark cut with its lower edge lit. A round hole near its front bottom (a pin, (1884,648)).
//
// THE BARREL (black, matte; shown through the shield's slots in shadow, and out of its front), from the shield's
// front to the muzzle: the front sight (a blade on a base, x 2205 to 2266, its top y 458), a collar (x 2252 to
// 2292) and the thread protector (x 2292 to 2379, knurled 2318 to 2352, its end rounded off).
// THE MAGAZINE TUBE (black), under the barrel with a gap between them (y 556 to 572, a hole: the floor shows), out
// of the pump's front: its cap's knurled nut (x 1937 to 2000), a flange (2000 to 2020), then the tube to its
// rounded end at x 2349. A band clamps the barrel to the tube in front of the shield (x 1980 to 2002).

// ---------------------------------------------------------------------------------------------------------
// Materials: each a base, a dark (shadowed faces, edges, the outline), a light (lit faces) and a highlight (the
// bright line where an edge catches the light). All of them are options, so a skin is a set of them.

export interface Spas12Options {
  /** The receiver's black, and the barrel's and magazine tube's steel */
  receiver?: Partial<Material>;
  /** The black polymer of the grip and its hump */
  grip?: Partial<Material>;
  /** The pump's black polymer */
  pump?: Partial<Material>;
  /** The heat shield's and the trigger group's parkerized gray */
  shield?: Partial<Material>;
  /** The barrel's and magazine tube's black steel */
  steel?: Partial<Material>;
  /**
   * The return spring (coiled round the magazine tube) seen through the shield's lower slots: in brass, in the
   * barrel's dark steel, or not at all (the slots plain dark)
   */
  spring?: "brass" | "steel" | "none";
  /** How strongly the pump's grooves show: 0 is barely, 1 the default, 2 bold */
  ribs?: number;
  /** A thin outline round the silhouette, in each part's own dark (the set's rule; default true) */
  outline?: boolean;
  /** The outline's width in millimeters (default OUTLINE_MM) */
  outlineMm?: number;
  /** How wide the rim light along the top edges is, in millimeters (default RIM_LIGHT_MM) */
  rimLightMm?: number;
}

/** Black anodized aluminium, a touch cool: from the photo's receiver (32,30,35 shadowed to 51,49,55 lit) */
export const SPAS_RECEIVER: Material = {
  base: "#2c2b31",
  dark: "#141317",
  light: "#403f47",
  highlight: "#66656f",
};

/** The grip's polymer: lighter and bluer than the receiver (75,73,82 to 94,91,100 in the photo) */
export const SPAS_GRIP: Material = {
  base: "#3f3d45",
  dark: "#242329",
  light: "#55535d",
  highlight: "#7a7883",
};

/** The pump's polymer: between the two (67,68,72 to 93,93,103) */
export const SPAS_PUMP: Material = {
  base: "#3a3b42",
  dark: "#1c1d21",
  light: "#52535c",
  highlight: "#767782",
};

/** Parkerized steel, a warm gray (91,83,81 to 117,106,110 in the photo) */
export const PARKERIZED: Material = {
  base: "#5e5552",
  dark: "#352f2d",
  light: "#776d69",
  highlight: "#9a908a",
};

/** The barrel's and the magazine tube's black steel, a touch lighter than the receiver (94,88,92 to 121,123,145 on its streak) */
export const SPAS_STEEL: Material = {
  base: "#45434a",
  dark: "#1e1d21",
  light: "#66646d",
  highlight: "#8d8b97",
};

/** The return spring through the shield's lower slots: brassy */
const SPRING = "#6e6046";
const SPRING_DARK = "#1e1a14";

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

/** A pill from y0 to y1, x0 to x1, round at both ends (standing up) */
function upright(x0: number, x1: number, y0: number, y1: number): string {
  const r = (x1 - x0) / 2;
  const top: Point = [x0 + r, y0 + r];
  const bottom: Point = [x0 + r, y1 - r];
  return (
    `M${fmt(on(top, r, 180))} ${arc(top, r, 180, 360)} L${fmt(on(bottom, r, 0))} ` +
    `${arc(bottom, r, 0, 180)} Z`
  );
}

/** A box from x0,y0 to x1,y1 */
function box(x0: number, y0: number, x1: number, y1: number): string {
  return `M${f1(x0)},${f1(y0)} L${f1(x1)},${f1(y0)} L${f1(x1)},${f1(y1)} L${f1(x0)},${f1(y1)} Z`;
}

// ---------------------------------------------------------------------------------------------------------
// The barrel and the magazine tube

const BARREL_TOP = 508;
const BARREL_BOTTOM = 556;
const BARREL_BACK = 1150; // inside the shield, from the receiver
const COLLAR: [number, number] = [2252, 2292];
const COLLAR_TOP = 505;
const COLLAR_BOTTOM = 559;
const PROTECTOR_TOP = 503;
const PROTECTOR_BOTTOM = 561;
const KNURL: [number, number] = [2318, 2352];
const BARREL = box(BARREL_BACK, BARREL_TOP, COLLAR[0] + 2, BARREL_BOTTOM);
const COLLAR_SHAPE = rounded(
  [
    [COLLAR[0], COLLAR_TOP],
    [COLLAR[1], COLLAR_TOP],
    [COLLAR[1], COLLAR_BOTTOM],
    [COLLAR[0], COLLAR_BOTTOM],
  ],
  [3, 0, 0, 3],
);
const PROTECTOR = rounded(
  [
    [COLLAR[1] - 1, PROTECTOR_TOP],
    [MUZZLE, PROTECTOR_TOP],
    [MUZZLE, PROTECTOR_BOTTOM],
    [COLLAR[1] - 1, PROTECTOR_BOTTOM],
  ],
  [0, 10, 10, 0],
);
// The front sight: a blade on a saddle on the barrel
const SIGHT_BASE = rounded(
  [
    [2204, BARREL_TOP + 2],
    [2213, 500],
    [2262, 500],
    [2268, BARREL_TOP + 2],
  ],
  [0, 3, 3, 0],
);
const SIGHT_BLADE = rounded(
  [
    [2216, 502],
    [2224, 458],
    [2249, 458],
    [2257, 502],
  ],
  [0, 2, 2, 0],
);

const TUBE_TOP = 572;
const TUBE_BOTTOM = 630;
const TUBE_END = 2349;
const TUBE = rounded(
  [
    [BARREL_BACK, TUBE_TOP],
    [TUBE_END, TUBE_TOP],
    [TUBE_END, TUBE_BOTTOM],
    [BARREL_BACK, TUBE_BOTTOM],
  ],
  [0, 12, 12, 0],
);
// The cap's nut, out of the pump's front: two knurled rings with a narrower one between, then a flange
const NUT: [number, number] = [1925, 2000];
const NUT_TOP = 569;
const NUT_BOTTOM = 634;
const NUT_SHAPE = rounded(
  [
    [NUT[0], NUT_TOP],
    [NUT[1], NUT_TOP],
    [NUT[1], NUT_BOTTOM],
    [NUT[0], NUT_BOTTOM],
  ],
  [4, 4, 4, 4],
);
const NUT_WAIST: [number, number] = [1962, 1974];
const FLANGE: [number, number] = [2000, 2022];
const FLANGE_SHAPE = rounded(
  [
    [FLANGE[0], 562],
    [FLANGE[1], 566],
    [FLANGE[1], 636],
    [FLANGE[0], 640],
  ],
  [3, 4, 4, 3],
);
// The band clamping the barrel to the tube
const BAND = rounded(
  [
    [1979, BARREL_BOTTOM - 4],
    [2003, BARREL_BOTTOM - 4],
    [2003, TUBE_TOP + 4],
    [1979, TUBE_TOP + 4],
  ],
  [2, 2, 2, 2],
);

// ---------------------------------------------------------------------------------------------------------
// The heat shield

const SHIELD_BACK = 1153;
const SHIELD_FRONT = 1913;
const SHIELD_TOP_BACK = 483; // over its back third
const SHIELD_TOP = 493; // the rest
const SHIELD_STEP: [number, number] = [1420, 1442]; // the slope between them
const SHIELD_BOTTOM = 651;
const SHIELD_FRONT_R = 16; // its top front corner
const SHIELD_OUTLINE: Point[] = [
  [SHIELD_BACK, SHIELD_TOP_BACK],
  [SHIELD_STEP[0], SHIELD_TOP_BACK],
  [SHIELD_STEP[1], SHIELD_TOP],
  [SHIELD_FRONT, SHIELD_TOP],
  [SHIELD_FRONT, SHIELD_BOTTOM],
  [SHIELD_BACK, SHIELD_BOTTOM],
];
const SHIELD = rounded(SHIELD_OUTLINE, [9, 6, 6, SHIELD_FRONT_R, 0, 4]);
// The top row of slots, the barrel behind them
const SLOT_TOP = 512;
const SLOT_BOTTOM = 528;
const TOP_SLOTS: [number, number][] = [
  [1183, 1243],
  [1269, 1342],
  [1356, 1428],
  [1443, 1516],
  [1531, 1604],
  [1618, 1692],
  [1706, 1780],
  [1795, 1867],
];
// The raised panel behind the pump, and the slots below it, in three staggered rows (the pump's lip hides their
// ends)
const PANEL = box(1163, 533, 1352, 570);
const LOW_SLOTS: [number, number, number, number][] = [
  [1225, 1312, 580, 593],
  [1320, 1370, 580, 593],
  [1183, 1256, 601, 615],
  [1269, 1350, 601, 615],
  [1225, 1312, 628, 641],
  [1320, 1370, 628, 641],
];
const TOP_SLOT_PATH = TOP_SLOTS.map(([a, b]) =>
  pill(a, b, SLOT_TOP, SLOT_BOTTOM),
).join(" ");
const LOW_SLOT_PATH = LOW_SLOTS.map(([a, b, c, d]) => pill(a, b, c, d)).join(
  " ",
);
// The rear sight on its top: a post at the back and a block in front, with a knob on its side
const REAR_SIGHT = rounded(
  [
    [1216, SHIELD_TOP_BACK + 1],
    [1218, 450],
    [1227, 450],
    [1230, 466],
    [1262, 466],
    [1272, SHIELD_TOP_BACK + 1],
  ],
  [0, 2, 2, 3, 3, 0],
);
const SHIELD_BUTTON = rounded(
  [
    [1853, SHIELD_TOP + 1],
    [1857, 486],
    [1878, 486],
    [1882, SHIELD_TOP + 1],
  ],
  [0, 3, 3, 0],
);

// ---------------------------------------------------------------------------------------------------------
// The pump

const PUMP_TOP = 533;
const PUMP_BACK = 1352; // its body's back, under the lip
const PUMP_CHAMFER: [number, number] = [1840, 562]; // the top front corner cut off from x 1840 down to y 562
// Its front, round from the chamfer's foot: bulging forward over the magazine cap's nut, back to its bottom
const PUMP_NOSE: Point[] = [
  [1910, 562],
  [1932, 600],
  [1940, 625],
  [1936, 655],
  [1925, 672],
];
const LIP: [number, number] = [1327, 685]; // the lip's back and bottom
const LIP_TOP = 567;
// Its bottom, from the front back to the lip: sagging toward the front
const PUMP_BOTTOM: Point[] = [
  [1925, 672],
  [1880, 677],
  [1790, 683],
  [1700, 687],
  [1620, 681],
  [1540, 669],
  [1450, 665],
  [1365, 666],
];
const PUMP =
  `M${PUMP_BACK},${PUMP_TOP} L${PUMP_CHAMFER[0]},${PUMP_TOP} L${fmt(PUMP_NOSE[0])} ` +
  smoothCurve(PUMP_NOSE, [0.6, 1], [-0.8, 1]) +
  " " +
  smoothCurve(PUMP_BOTTOM, [-1, 0.1], [-1, 0]) +
  ` C1358,666 1354,${LIP[1]} 1344,${LIP[1]} L1338,${LIP[1]} C1331,${LIP[1]} ${LIP[0]},${LIP[1] - 5} ${LIP[0]},${LIP[1] - 12} ` +
  `L${LIP[0]},${LIP_TOP + 6} C${LIP[0]},${LIP_TOP + 2} ${LIP[0] + 3},${LIP_TOP} ${LIP[0] + 8},${LIP_TOP} ` +
  `L${PUMP_BACK},${LIP_TOP} Z`;
const RIB_FIRST = 1387;
const RIB_PITCH = 27.4;
const RIBS = 14;
const RIB_TOP = 538;
const RIB_BOTTOM = 655;
const RIB_WIDTH = 6;
const PUMP_PIN: Point = [1889, 646];

// ---------------------------------------------------------------------------------------------------------
// The receiver

const RECEIVER_TOP = 494;
const RECEIVER_BOTTOM = 637;
const RECEIVER_CHAMFER = 620; // where its side turns under
const RECEIVER_FRONT = SHIELD_BACK + 4; // under the shield's back
// The seam with the hump, leaning with the grip's front, from the receiver's top down to the guard's back
const SEAM: Point[] = [
  [741, RECEIVER_BOTTOM + 3],
  [725, 620],
  [712, 590],
  [707, 560],
  [704, 520],
];
const RECEIVER =
  `M${fmt(SEAM[0])} ` +
  smoothCurve(SEAM, [-0.6, -1], [0, -1]) +
  ` C704,505 708,${RECEIVER_TOP} 722,${RECEIVER_TOP} L${RECEIVER_FRONT},${RECEIVER_TOP} ` +
  `L${RECEIVER_FRONT},641 L1108,641 L1103,${RECEIVER_BOTTOM} L${SEAM[0][0]},${RECEIVER_BOTTOM} Z`;
// The ejection port, with the bolt in it, and the operating handle's slot under it
const PORT: [number, number, number, number] = [944, 1114, 512, 549];
const PORT_R = 14;
const PORT_SHAPE = rounded(
  [
    [PORT[0], PORT[3]],
    [PORT[0], PORT[2]],
    [PORT[1], PORT[2]],
    [PORT[1], PORT[3]],
  ],
  [0, PORT_R, PORT_R, 0],
);
const HANDLE_SLOT = pill(833, 1042, 547, 559);
const HANDLE_ROD = box(930, 550, 1062, 556.5);
const HANDLE_KNOB =
  "M1062,546 L1068,546 C1078,548 1086,552 1087,555.5 C1086,559 1078,563 1068,565 L1062,565 Z";
const RELEASE = rounded(
  [
    [1112, 600],
    [1146, 600],
    [1146, 619],
    [1112, 619],
  ],
  [3, 3, 3, 3],
);

// ---------------------------------------------------------------------------------------------------------
// The trigger group: the guard and the trigger housing, one part, with the guard's opening cut out

const GUARD_OUTER: Point[] = [
  [739, RECEIVER_BOTTOM - 2],
  [746, 668],
  [756, 695],
  [772, 711],
  [795, 717],
  [822, 716],
  [846, 708],
  [866, 694],
  [900, 678],
  [930, 668],
  [944, 659],
  [951, 646],
];
const TRIGGER_GROUP =
  `M${fmt(GUARD_OUTER[0])} ` +
  smoothCurve(GUARD_OUTER.slice(0, 8), [0.15, 1], [0.85, -0.5]) +
  " " +
  smoothCurve(GUARD_OUTER.slice(7), [0.85, -0.5], [0.4, -1]) +
  ` L953,${RECEIVER_BOTTOM - 2} Z`;
// The opening: a rounded quadrilateral, round at the back and bottom, its front going up into the housing
const OPENING: Point[] = [
  [762, RECEIVER_BOTTOM],
  [760, 664],
  [767, 688],
  [783, 700],
  [806, 703],
  [832, 700],
  [851, 690],
  [860, 672],
  [857, 652],
  [850, RECEIVER_BOTTOM],
];
const OPENING_SHAPE =
  `M${fmt(OPENING[0])} ` +
  smoothCurve(OPENING, [-0.1, 1], [-0.4, -1]) +
  ` L${fmt(OPENING[0])} Z`;
// A hook: down and back from the receiver, then curving forward to its tip, hollow at the front
const TRIGGER_BACK: Point[] = [
  [768, RECEIVER_BOTTOM],
  [761, 660],
  [765, 680],
  [779, 692],
  [794, 696],
];
const TRIGGER_FRONT: Point[] = [
  [794, 696],
  [783, 686],
  [775, 670],
  [777, 652],
  [783, RECEIVER_BOTTOM],
];
const TRIGGER =
  `M${fmt(TRIGGER_BACK[0])} ${smoothCurve(TRIGGER_BACK, [-0.4, 1], [1, 0.2])} ` +
  `${smoothCurve(TRIGGER_FRONT, [-1, -0.8], [0.3, -1])} Z`;
const SAFETY: Point = [918, 648];
const SAFETY_R = 11;

// ---------------------------------------------------------------------------------------------------------
// The grip and its hump, one molding: round from the seam's foot, down the grip's front, round its toe and its
// base, up its back, the hump's back and top, to the receiver

const GRIP_FRONT: Point[] = [
  [745, 700],
  [737, 720],
  [727, 742],
  [718, 762],
  [710, 782],
  [704, 802],
  [699, 822],
  [694, 838],
  [700, 852],
  [710, 862],
];
const GRIP_BACK: Point[] = [
  [592, 885],
  [580, 875],
  [572, 858],
  [569, 840],
  [572, 820],
  [579, 800],
  [587, 780],
  [597, 760],
  [608, 740],
  [622, 720],
  [632, 700],
  [632, 682],
  [620, 662],
  [597, 645],
  [580, 625],
  [572, 600],
  [BACK, 570],
];
const HUMP_TOP_CORNER: Point = [BACK + 6, 540];
const GRIP =
  `M${fmt(SEAM[0])} L${fmt(GRIP_FRONT[0])} ` +
  smoothCurve(GRIP_FRONT, [-0.35, 1], [1, 0.6]) +
  " C716,868 712,880 702,884 C690,887 640,888 610,888 C600,888 595,887 592,885 " +
  smoothCurve(GRIP_BACK, [-1, -0.6], [0, -1]) +
  ` L${BACK},${HUMP_TOP_CORNER[1] + 8} C${BACK},${HUMP_TOP_CORNER[1] + 2} ${BACK + 2},${HUMP_TOP_CORNER[1]} ${fmt(HUMP_TOP_CORNER)} ` +
  `C600,530 650,513 704,500 L${fmt(SEAM[SEAM.length - 1])} ` +
  smoothCurve([...SEAM].reverse(), [0, 1], [0.6, 1]) +
  " Z";
// The finger grooves, across the grip (from back to front at their heights)
const GROOVES: [number, number, number][] = [
  [716, 652, 704],
  [742, 637, 693],
  [768, 621, 682],
  [795, 606, 673],
  [821, 595, 665],
  [847, 590, 660],
];
const GRIP_SCREWS: Point[] = [
  [685, 676],
  [629, 834],
];
const PIVOT: Point = [663, 547];
// The sling loop, a wire ring standing up off the hump's top
const LOOP = `M612,528 C612,512 622,502 635,502 C648,502 658,512 658,526`;
const LOOP_WIDTH = 7;

// ---------------------------------------------------------------------------------------------------------

function cylinder(id: string, top: number, bottom: number, m: Material) {
  const stops: Stops = [
    [0, m.dark],
    [0.08, m.light],
    [0.2, m.highlight],
    [0.32, m.light],
    [0.6, m.base],
    [1, m.dark],
  ];
  return linear(id, [0, top], [0, bottom], stops);
}

function drawSide(options: Spas12Options = {}): string {
  const R: Material = { ...SPAS_RECEIVER, ...options.receiver };
  const G: Material = { ...SPAS_GRIP, ...options.grip };
  const P: Material = { ...SPAS_PUMP, ...options.pump };
  const S: Material = { ...PARKERIZED, ...options.shield };
  const T: Material = { ...SPAS_STEEL, ...options.steel };
  const ribs = options.ribs ?? 1;
  const spring = options.spring ?? "brass";
  const outline = (options.outlineMm ?? OUTLINE_MM) / MM_PER_PX;
  const rim = (options.rimLightMm ?? RIM_LIGHT_MM) / MM_PER_PX;

  // The pump's grooves: a dark cut, its lower (right) edge lit
  const ribPaths: string[] = [];
  const ribLights: string[] = [];
  for (let i = 0; i < RIBS; i++) {
    const x = RIB_FIRST + i * RIB_PITCH;
    ribPaths.push(upright(x, x + RIB_WIDTH, RIB_TOP, RIB_BOTTOM));
    ribLights.push(
      `M${f1(x + RIB_WIDTH + 1.5)},${RIB_TOP + 4} L${f1(x + RIB_WIDTH + 1.5)},${RIB_BOTTOM - 4}`,
    );
  }
  // The grip's grooves: thin pills across it, each lit along its lower edge
  const groovePaths = GROOVES.map(([y, a, b]) => pill(a, b, y - 2.5, y + 2.5));
  const grooveLights = GROOVES.map(
    ([y, a, b]) => `M${a + 3},${y + 4} L${b - 3},${y + 4}`,
  );
  // The knurling on the nut and the thread protector: fine lines across
  const knurl = (x0: number, x1: number, y0: number, y1: number, step = 3) => {
    const lines: string[] = [];
    for (let x = x0 + step / 2; x < x1; x += step) {
      lines.push(`M${f1(x)},${y0} L${f1(x)},${y1}`);
    }
    return lines.join(" ");
  };
  // The return spring through the lower slots: coils leaning across the tube
  const coils: string[] = [];
  for (let x = 1172; x < 1370; x += 22) {
    coils.push(
      `M${x},${TUBE_TOP - 2} C${x + 7},${TUBE_TOP + 12} ${x + 9},${TUBE_BOTTOM - 12} ${x + 4},${TUBE_BOTTOM + 4}`,
    );
  }

  const rimPaths = {
    // The hump's top, the receiver's top, the shield's top, the barrel's top beyond it
    receiver: `M${BACK},${HUMP_TOP_CORNER[1] + 8} C${BACK},${HUMP_TOP_CORNER[1] + 2} ${BACK + 2},${HUMP_TOP_CORNER[1]} ${fmt(HUMP_TOP_CORNER)} C600,530 650,513 704,500 C704,505 708,${RECEIVER_TOP} 722,${RECEIVER_TOP} L${RECEIVER_FRONT},${RECEIVER_TOP}`,
    shield: `M${SHIELD_BACK},${SHIELD_BOTTOM - 10} L${SHIELD_BACK},${SHIELD_TOP_BACK} L${SHIELD_STEP[0]},${SHIELD_TOP_BACK} L${SHIELD_STEP[1]},${SHIELD_TOP} L${SHIELD_FRONT - SHIELD_FRONT_R},${SHIELD_TOP} C${SHIELD_FRONT - 6},${SHIELD_TOP} ${SHIELD_FRONT},${SHIELD_TOP + 6} ${SHIELD_FRONT},${SHIELD_TOP + SHIELD_FRONT_R}`,
    pump: `M${LIP[0]},${LIP[1] - 12} L${LIP[0]},${LIP_TOP + 6} C${LIP[0]},${LIP_TOP + 2} ${LIP[0] + 3},${LIP_TOP} ${LIP[0] + 8},${LIP_TOP} L${PUMP_BACK},${LIP_TOP} L${PUMP_BACK},${PUMP_TOP} L${PUMP_CHAMFER[0]},${PUMP_TOP} L${fmt(PUMP_NOSE[0])}`,
  };

  const outlines = () => {
    const parts: [string, string][] = [
      [TUBE, T.dark],
      [NUT_SHAPE, T.dark],
      [FLANGE_SHAPE, T.dark],
      [BAND, T.dark],
      [BARREL, T.dark],
      [COLLAR_SHAPE, T.dark],
      [PROTECTOR, T.dark],
      [SIGHT_BASE, T.dark],
      [SIGHT_BLADE, T.dark],
      [TRIGGER_GROUP + " " + OPENING_SHAPE, S.dark],
      [TRIGGER, S.dark],
      [GRIP, G.dark],
      [RECEIVER, R.dark],
      [SHIELD, S.dark],
      [REAR_SIGHT, S.dark],
      [SHIELD_BUTTON, S.dark],
      [PUMP, P.dark],
    ];
    return `<!-- The outline: each part's shape stroked under everything, so only its outer half shows -->
  <g id="spas-12-outline" fill="none" stroke-width="${f1(outline * 2)}">
    ${parts.map(([d, c]) => `<path d="${d}" stroke="${c}"/>`).join("\n    ")}
    <path d="${LOOP}" stroke="${R.dark}" stroke-width="${f1(LOOP_WIDTH + outline * 2)}" stroke-linecap="round"/>
  </g>`;
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1350" viewBox="0 0 2400 1350" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  <defs>
    ${cylinder("spas-12-barrel-shading", BARREL_TOP, BARREL_BOTTOM, T)}
    ${cylinder("spas-12-collar-shading", COLLAR_TOP, COLLAR_BOTTOM, T)}
    ${cylinder("spas-12-protector-shading", PROTECTOR_TOP, PROTECTOR_BOTTOM, T)}
    ${cylinder("spas-12-tube-shading", TUBE_TOP, TUBE_BOTTOM, T)}
    ${cylinder("spas-12-nut-shading", NUT_TOP, NUT_BOTTOM, T)}
    <!-- The barrel in the shield's shadow, through its top slots -->
    ${linear("spas-12-barrel-shadowed", [0, SLOT_TOP], [0, SLOT_BOTTOM], [
      [0, T.dark],
      [0.35, mix(T.dark, T.base, 0.6)],
      [1, mix(T.dark, T.base, 0.3)],
    ])}
    ${linear("spas-12-sight-shading", [2216, 0], [2257, 0], [
      [0, T.light],
      [0.3, T.base],
      [1, T.dark],
    ])}
    <!-- The receiver, down its side: its rounded top lit, the side, then the dark band where it turns under -->
    ${linear("spas-12-receiver-shading", [0, RECEIVER_TOP], [0, RECEIVER_BOTTOM], [
      [0, R.highlight],
      [0.04, R.light],
      [0.12, mix(R.base, R.light, 0.5)],
      [0.55, R.base],
      [(RECEIVER_CHAMFER - RECEIVER_TOP) / (RECEIVER_BOTTOM - RECEIVER_TOP) - 0.01, mix(R.base, R.dark, 0.3)],
      [(RECEIVER_CHAMFER - RECEIVER_TOP) / (RECEIVER_BOTTOM - RECEIVER_TOP), R.dark],
      [1, R.dark],
    ])}
    ${linear("spas-12-bolt-shading", [0, PORT[2]], [0, PORT[3]], [
      [0, R.dark],
      [0.3, R.dark],
      [0.34, T.light],
      [0.6, T.base],
      [1, mix(T.base, T.dark, 0.5)],
    ])}
    <!-- The grip, across it square to its lean: its back lit, its front rounding away -->
    ${linear("spas-12-grip-shading", [600, 760], [720, 800], [
      [0, G.light],
      [0.25, mix(G.base, G.light, 0.5)],
      [0.65, G.base],
      [1, G.dark],
    ])}
    <!-- The hump, lit along its top -->
    ${linear("spas-12-hump-shading", [0, 500], [0, 640], [
      [0, G.highlight],
      [0.08, G.light],
      [0.5, G.base],
      [1, G.base],
    ])}
    <!-- The shield, down its face: its top lit, the face, darker toward its bottom -->
    ${linear("spas-12-shield-shading", [0, SHIELD_TOP_BACK], [0, SHIELD_BOTTOM], [
      [0, S.highlight],
      [0.04, S.light],
      [0.3, mix(S.base, S.light, 0.4)],
      [0.7, S.base],
      [1, mix(S.base, S.dark, 0.5)],
    ])}
    ${linear("spas-12-guard-shading", [0, RECEIVER_BOTTOM], [0, 717], [
      [0, S.dark],
      [0.15, S.base],
      [0.6, S.base],
      [1, mix(S.base, S.dark, 0.5)],
    ])}
    <!-- The pump, down its side: its top edge lit, the side, its bottom rounding under -->
    ${linear("spas-12-pump-shading", [0, LIP_TOP - 34], [0, 687], [
      [0, P.highlight],
      [0.03, P.light],
      [0.15, mix(P.base, P.light, 0.5)],
      [0.65, P.base],
      [1, P.dark],
    ])}
    ${linear("spas-12-trigger-shading", [764, 0], [796, 0], [
      [0, mix(S.light, S.highlight, 0.6)],
      [0.5, S.light],
      [1, S.base],
    ])}
    <clipPath id="spas-12-shield-clip">
      <path d="${SHIELD}"/>
    </clipPath>
    <clipPath id="spas-12-receiver-clip">
      <path d="${RECEIVER}"/>
    </clipPath>
    <clipPath id="spas-12-grip-clip">
      <path d="${GRIP}"/>
    </clipPath>
    <clipPath id="spas-12-pump-clip">
      <path d="${PUMP}"/>
    </clipPath>
    <clipPath id="spas-12-low-slots-clip">
      <path d="${LOW_SLOT_PATH}"/>
    </clipPath>
    <clipPath id="spas-12-tube-clip">
      <path d="${TUBE}"/>
    </clipPath>
  </defs>
  ${options.outline === false ? "" : outlines()}
  <!-- The magazine tube under the barrel, from the receiver to its rounded end, and its cap's nut out of the
       pump's front: knurled rings and a flange -->
  <g id="spas-12-magazine-tube">
    <path d="${TUBE}" fill="url(#spas-12-tube-shading)"/>
    <path d="M${TUBE_END - 10},${TUBE_TOP + 3} C${TUBE_END - 3},${TUBE_TOP + 8} ${TUBE_END - 1},${TUBE_BOTTOM - 14} ${TUBE_END - 4},${TUBE_BOTTOM - 6}" stroke="${T.light}" stroke-width="3" fill="none" opacity="0.6"/>
    <path d="${NUT_SHAPE}" fill="url(#spas-12-nut-shading)"/>
    <path d="${knurl(NUT[0] + 4, NUT_WAIST[0], NUT_TOP + 2, NUT_BOTTOM - 2)} ${knurl(NUT_WAIST[1], NUT[1] - 3, NUT_TOP + 2, NUT_BOTTOM - 2)}" stroke="${T.dark}" stroke-width="1.5" fill="none" opacity="0.7"/>
    <path d="${box(NUT_WAIST[0], NUT_TOP, NUT_WAIST[1], NUT_BOTTOM)}" fill="${T.dark}" opacity="0.55"/>
    <path d="${FLANGE_SHAPE}" fill="url(#spas-12-nut-shading)"/>
    <path d="M${FLANGE[1] - 2},568 L${FLANGE[1] - 2},634" stroke="${T.dark}" stroke-width="3" fill="none"/>
    <path d="${BAND}" fill="${T.base}"/>
  </g>
  <!-- The barrel, from inside the shield to the muzzle: the collar, the knurled thread protector, the front sight -->
  <g id="spas-12-barrel">
    <path d="${BARREL}" fill="url(#spas-12-barrel-shading)"/>
    <path d="${COLLAR_SHAPE}" fill="url(#spas-12-collar-shading)"/>
    <path d="M${COLLAR[0] + 14},${COLLAR_TOP} L${COLLAR[0] + 14},${COLLAR_BOTTOM} M${COLLAR[0] + 22},${COLLAR_TOP} L${COLLAR[0] + 22},${COLLAR_BOTTOM}" stroke="${T.dark}" stroke-width="2.5" fill="none"/>
    <path d="${PROTECTOR}" fill="url(#spas-12-protector-shading)"/>
    <path d="${knurl(KNURL[0], KNURL[1], PROTECTOR_TOP + 2, PROTECTOR_BOTTOM - 2)}" stroke="${T.dark}" stroke-width="1.5" fill="none" opacity="0.7"/>
    <path d="M${COLLAR[1] + 1},${PROTECTOR_TOP} L${COLLAR[1] + 1},${PROTECTOR_BOTTOM}" stroke="${T.dark}" stroke-width="3" fill="none"/>
    <path d="${SIGHT_BASE}" fill="${T.base}"/>
    <path d="${SIGHT_BLADE}" fill="url(#spas-12-sight-shading)"/>
  </g>
  <!-- The heat shield: its top row of slots shows the barrel in its shadow behind them, its lower slots the return
       spring coiled round the magazine tube -->
  <g id="spas-12-shield">
    <path d="${SHIELD} ${TOP_SLOT_PATH} ${LOW_SLOT_PATH}" fill="url(#spas-12-shield-shading)"/>
    <path d="${TOP_SLOT_PATH}" fill="url(#spas-12-barrel-shadowed)"/>
    <g clip-path="url(#spas-12-low-slots-clip)">
      <path d="${box(1150, TUBE_TOP - 10, 1370, TUBE_BOTTOM + 14)}" fill="${spring === "none" ? T.dark : SPRING_DARK}"/>
      ${spring === "none" ? "" : `<path d="${coils.join(" ")}" stroke="${spring === "steel" ? T.light : SPRING}" stroke-width="3.5" fill="none"/>`}
    </g>
    <!-- The slots' cut edges: a shadow along their tops, lit along their bottoms -->
    <g fill="none" stroke-width="2">
      ${TOP_SLOTS.map(([a, b]) => `<path d="M${a + 6},${SLOT_TOP + 1.5} L${b - 6},${SLOT_TOP + 1.5}" stroke="${S.dark}"/>`).join("\n      ")}
      ${TOP_SLOTS.map(([a, b]) => `<path d="M${a + 6},${SLOT_BOTTOM + 1} L${b - 6},${SLOT_BOTTOM + 1}" stroke="${S.light}"/>`).join("\n      ")}
      ${LOW_SLOTS.map(([a, b, c, d]) => `<path d="M${a + 5},${d + 1} L${b - 5},${d + 1}" stroke="${S.light}"/>`).join("\n      ")}
    </g>
    <!-- The flat raised panel behind the pump: lit along its top, a shadow under it -->
    <path d="${PANEL}" fill="${S.light}" opacity="0.55"/>
    <path d="M1163,${533 + 1} L1352,${533 + 1}" stroke="${S.highlight}" stroke-width="2" fill="none" opacity="0.7"/>
    <path d="M1163,${570 + 2} L1352,${570 + 2}" stroke="${S.dark}" stroke-width="4" fill="none"/>
    <!-- The step down along its top, lit -->
    <path d="M${SHIELD_STEP[0]},${SHIELD_TOP_BACK + 1} L${SHIELD_STEP[1]},${SHIELD_TOP + 1}" stroke="${S.highlight}" stroke-width="3" fill="none"/>
    <path d="M${SHIELD_BACK + 4},${SHIELD_TOP_BACK + 4} L${SHIELD_BACK + 4},${SHIELD_BOTTOM - 4}" stroke="${S.light}" stroke-width="3" fill="none" opacity="0.6"/>
    <path d="${REAR_SIGHT}" fill="${S.base}"/>
    <path d="M1219,452 L1225,452 M1231,468 L1260,468" stroke="${S.light}" stroke-width="2" fill="none"/>
    <path d="${SHIELD_BUTTON}" fill="${S.light}"/>
    <!-- The rim light along its top -->
    <path d="${rimPaths.shield}" stroke="${S.highlight}" stroke-width="${f1(rim * 2)}" fill="none" clip-path="url(#spas-12-shield-clip)"/>
  </g>
  <!-- The trigger group under the receiver: the guard (its opening a hole) and the housing, with the safety's
       button; the trigger hangs in the opening -->
  <g id="spas-12-trigger-group">
    <path d="${TRIGGER}" fill="url(#spas-12-trigger-shading)"/>
    <path d="${TRIGGER_GROUP} ${OPENING_SHAPE}" fill="url(#spas-12-guard-shading)"/>
    <path d="M${fmt(OPENING[3])} ${smoothCurve(OPENING.slice(3, 8), [1, 0.1], [0.2, -1])}" stroke="${S.light}" stroke-width="3" fill="none"/>
    <circle cx="${SAFETY[0]}" cy="${SAFETY[1]}" r="${SAFETY_R}" fill="${S.base}" stroke="${S.dark}" stroke-width="2"/>
    <circle cx="${SAFETY[0] - 2}" cy="${SAFETY[1] - 2}" r="${SAFETY_R - 5}" fill="${S.light}" opacity="0.6"/>
  </g>
  <!-- The grip and the hump behind the receiver, one molding: finger grooves, two screws, the stock's pivot pin
       through the hump, and the sling loop on its top -->
  <g id="spas-12-grip">
    <path d="${LOOP}" stroke="${mix(R.base, R.light, 0.5)}" stroke-width="${LOOP_WIDTH}" stroke-linecap="round" fill="none"/>
    <path d="${GRIP}" fill="url(#spas-12-grip-shading)"/>
    <g clip-path="url(#spas-12-grip-clip)">
      <path d="${box(560, 495, 760, 655)}" fill="url(#spas-12-hump-shading)"/>
      <path d="M${BACK + 3},${HUMP_TOP_CORNER[1] + 10} L${BACK + 3},600" stroke="${G.light}" stroke-width="6" fill="none" opacity="0.6"/>
      <path d="${groovePaths.join(" ")}" fill="${G.dark}"/>
      <path d="${grooveLights.join(" ")}" stroke="${G.light}" stroke-width="2" fill="none"/>
      <path d="${rimPaths.receiver}" stroke="${G.highlight}" stroke-width="${f1(rim * 2)}" fill="none"/>
    </g>
    ${GRIP_SCREWS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${G.dark}"/>`).join("\n    ")}
    <circle cx="${PIVOT[0]}" cy="${PIVOT[1]}" r="10" fill="${R.base}" stroke="${R.dark}" stroke-width="2"/>
    <circle cx="${PIVOT[0]}" cy="${PIVOT[1]}" r="3.5" fill="${R.dark}"/>
  </g>
  <!-- The receiver: the ejection port with the bolt in it, the operating handle's slot and knob, the bolt
       release, pins -->
  <g id="spas-12-receiver">
    <path d="${RECEIVER}" fill="url(#spas-12-receiver-shading)"/>
    <path d="${PORT_SHAPE}" fill="url(#spas-12-bolt-shading)"/>
    <path d="${box(1092, 531, 1108, 538)}" fill="${R.dark}"/>
    <path d="M${PORT[0]},${PORT[3] + 1} L${PORT[1]},${PORT[3] + 1}" stroke="${R.light}" stroke-width="2" fill="none"/>
    <path d="${HANDLE_SLOT}" fill="#0c0b0e"/>
    <path d="${HANDLE_ROD}" fill="${T.base}"/>
    <path d="${HANDLE_KNOB}" fill="${T.light}"/>
    <path d="M1066,548 L1066,563" stroke="${T.dark}" stroke-width="2" fill="none"/>
    <path d="M840,560.5 L1036,560.5" stroke="${R.light}" stroke-width="2" fill="none"/>
    <path d="${RELEASE}" fill="${R.light}"/>
    <path d="${knurl(1114, 1144, 602, 617, 5)}" stroke="${R.dark}" stroke-width="2" fill="none"/>
    <circle cx="760" cy="610" r="4" fill="${R.light}"/>
    <circle cx="869" cy="610" r="4" fill="${R.light}"/>
    <!-- The rim light along its top -->
    <path d="${rimPaths.receiver}" stroke="${R.highlight}" stroke-width="${f1(rim * 2)}" fill="none" clip-path="url(#spas-12-receiver-clip)"/>
  </g>
  <!-- The pump over the shield's lower part: grooves down its side, the lip at its back, a pin near its front -->
  <g id="spas-12-pump">
    <path d="${PUMP}" fill="url(#spas-12-pump-shading)"/>
    <g clip-path="url(#spas-12-pump-clip)">
      <path d="${ribPaths.join(" ")}" fill="${P.dark}" opacity="${Math.min(1, 0.45 + 0.45 * ribs)}"/>
      <path d="${ribLights.join(" ")}" stroke="${P.highlight}" stroke-width="2.5" fill="none" opacity="${Math.min(1, 0.35 * ribs)}"/>
      <!-- The lip's face, a step down from the body: lit along its back -->
      <path d="M${LIP[0] + 3},${LIP_TOP + 6} L${LIP[0] + 3},${LIP[1] - 12}" stroke="${P.light}" stroke-width="4" fill="none"/>
      <path d="M${PUMP_BACK},${PUMP_TOP} L${PUMP_BACK},${LIP_TOP}" stroke="${P.light}" stroke-width="3" fill="none"/>
      <!-- The slanted face at its front top, turned up to the light -->
      <path d="M${PUMP_CHAMFER[0]},${PUMP_TOP} L${fmt(PUMP_NOSE[0])}" stroke="${P.light}" stroke-width="5" fill="none"/>
      <path d="${rimPaths.pump}" stroke="${P.highlight}" stroke-width="${f1(rim * 2)}" fill="none"/>
    </g>
    <circle cx="${PUMP_PIN[0]}" cy="${PUMP_PIN[1]}" r="10" fill="${P.dark}"/>
    <circle cx="${PUMP_PIN[0] + 1}" cy="${PUMP_PIN[1] + 1}" r="5" fill="#0c0b0e"/>
  </g>
</svg>
`;
}

// ---------------------------------------------------------------------------------------------------------
// The top view: the gun as it's held, seen from above, muzzle along +x and its right side +y, in millimeters
// about its middle on the bore, at the same scale as the side view. Lengths along it come from the side view's
// numbers (`sx`); widths across it from the 3D model seen from above and from behind (`model spas-12 --from +y
// --up -z`, `--from -x`), at its own scale along the gun (its heat shield, 973 px, is the photo's 760 px: 0.348
// mm a pixel), except the round parts (barrel, magazine tube, cap, muzzle), which are the side view's diameters.
// No spec sheet gives the SPAS-12's widths.
//
//   - The grip's hump and the receiver: 31 mm across (the model: 89 px from above, 364 px from behind at its
//     finer scale). The operating handle's knob stands 9.6 mm out of the receiver's right side (from behind).
//   - The heat shield: 36 mm across (103 px), over the barrel. Its top is flat, with three rows of slots: one down
//     the middle, and one either side 9.2 mm out, staggered with it (the model; the side view's slots are on its
//     sides, under the top's edges, so they don't show from above). Round the rear sight, an oval plate (the step
//     down from its higher back third doesn't show from above). Under it, through the slots: the barrel, and the shield's dark inside.
//   - The pump: 41 mm across (118 px), so it shows 2.5 mm either side of the shield, with its grooves notching its
//     edges; its nose out in front of the shield, rounding in, over the magazine tube's cap.
//   - The barrel 21.2 mm, the collar 23.8, the thread protector 25.6, the magazine tube 25.2, its cap's nut 30,
//     the flange 34.4 (the side view's heights, as they're round).
//
// What moves: the pump, straight back along the magazine tube. Its stroke is how far it can go before its lip
// meets the receiver's front, 174 px (77 mm), which is about the ejection port's length (75 mm), what the bolt
// has to travel: 0.075 m. It slides under the heat shield, the barrel and the receiver (drawn after it), and
// uncovers the magazine tube and its cap in front of it (drawn before it).

/** A length along the gun from the side view's pixels, in millimeters from the gun's middle */
const sx = (px: number) => (px - ORIGIN[0]) * MM_PER_PX;
/** The model's pixels along the gun (from above) to the photo's: their heat shields' ends */
const fromModel = (mx: number) =>
  SHIELD_BACK + ((mx - 824) * (SHIELD_FRONT - SHIELD_BACK + 7)) / (1797 - 824);
const MODEL_MM = 0.348; // the model's millimeters a pixel, across

const T_HUMP_BACK = sx(BACK);
const T_SEAM = sx(704);
const T_RECEIVER_FRONT = sx(RECEIVER_FRONT);
const T_BODY_HALF = 31 / 2; // the hump and the receiver
const T_KNOB = [sx(1062), sx(1087)] as const;
const T_KNOB_OUT = T_BODY_HALF + 9.6;
const T_LOOP = [sx(612), sx(658)] as const;
const T_LOOP_HALF = 5;
const T_PIVOT = sx(PIVOT[0]);
const T_SHIELD_BACK = sx(SHIELD_BACK);
const T_SHIELD_FRONT = sx(SHIELD_FRONT);
const T_SHIELD_HALF = 36 / 2;
const T_PLATE = [sx(fromModel(850)), sx(fromModel(990))] as const;
const T_PLATE_HALF = 25 * MODEL_MM;
const T_REAR_SIGHT = [sx(1216), sx(1272)] as const;
const T_REAR_POST = sx(1227);
const T_REAR_SIGHT_HALF = 6;
const T_BUTTON: Point = [sx(1867), 4.5];
// The slots from above, in the model's pixels along the gun: the middle row, and the outer rows either side
const T_SLOT_PITCH = 103.4;
const T_MIDDLE_SLOTS = [0, 1, 2, 3, 4, 5, 6].map((i) => [
  sx(fromModel(998 + i * T_SLOT_PITCH)),
  sx(fromModel(1091 + i * T_SLOT_PITCH)),
]);
const T_OUTER_SLOTS = [0, 1, 2, 3, 4, 5, 6].map((i) => [
  sx(fromModel(1042 + i * T_SLOT_PITCH)),
  sx(fromModel(1137 + i * T_SLOT_PITCH)),
]);
const T_SLOT_HALF = 3; // 6 mm across
const T_OUTER_SLOT_Y = 9.2;
const T_BARREL_BACK = sx(BARREL_BACK);
const T_BARREL_HALF = ((BARREL_BOTTOM - BARREL_TOP) * MM_PER_PX) / 2;
const T_COLLAR = [sx(COLLAR[0]), sx(COLLAR[1])] as const;
const T_COLLAR_HALF = ((COLLAR_BOTTOM - COLLAR_TOP) * MM_PER_PX) / 2;
const T_PROTECTOR_HALF = ((PROTECTOR_BOTTOM - PROTECTOR_TOP) * MM_PER_PX) / 2;
const T_MUZZLE = sx(MUZZLE);
const T_KNURL = [sx(KNURL[0]), sx(KNURL[1])] as const;
const T_SIGHT_BASE = [sx(2204), sx(2268)] as const;
const T_SIGHT_BASE_HALF = 5;
const T_SIGHT_BLADE = [sx(2216), sx(2257)] as const;
const T_SIGHT_BLADE_HALF = 1.5;
const T_TUBE_END = sx(TUBE_END);
const T_TUBE_HALF = ((TUBE_BOTTOM - TUBE_TOP) * MM_PER_PX) / 2;
const T_NUT = [sx(NUT[0]), sx(NUT[1])] as const;
const T_NUT_HALF = 15;
const T_NUT_WAIST = [sx(NUT_WAIST[0]), sx(NUT_WAIST[1])] as const;
const T_FLANGE = [sx(FLANGE[0]), sx(FLANGE[1])] as const;
const T_FLANGE_HALF = 17.2;
const T_PUMP_BACK = sx(LIP[0]);
const T_LIP_FRONT = sx(PUMP_BACK);
const T_PUMP_NOSE = sx(1905); // where its nose starts rounding in
const T_PUMP_FRONT = sx(1940);
const T_PUMP_HALF = 41 / 2;
const T_LIP_HALF = 21.5;
const T_NOSE_HALF = 15;
const T_OUTLINE = OUTLINE_MM;

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

/** A pill along the gun, from x0 to x1, `half` either side of y */
function tpill(x0: number, x1: number, y: number, half: number): string {
  return tbox(x0, y - half, x1, y + half, half);
}

/** A gradient across the gun (along y), from its left edge to its right */
function across(id: string, half: number, list: Stops): string {
  return [
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${t1(-half)}" x2="0" y2="${t1(half)}">`,
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
  [0.08, m.base],
  [0.2, m.light],
  [0.5, mix(m.light, m.highlight, 0.4)],
  [0.8, m.light],
  [0.92, m.base],
  [1, m.dark],
];

// The shapes
const T_HUMP = tbox(T_HUMP_BACK, -T_BODY_HALF, T_SEAM + 2, T_BODY_HALF, [
  7, 0, 0, 7,
]);
const T_RECEIVER = tbox(
  T_SEAM,
  -T_BODY_HALF,
  T_RECEIVER_FRONT,
  T_BODY_HALF,
  [2, 0, 0, 2],
);
const T_KNOB_SHAPE = tbox(
  T_KNOB[0],
  T_BODY_HALF - 1,
  T_KNOB[1],
  T_KNOB_OUT,
  [0, 0, 4, 4],
);
const T_SHIELD = tbox(
  T_SHIELD_BACK,
  -T_SHIELD_HALF,
  T_SHIELD_FRONT,
  T_SHIELD_HALF,
  [2, 6, 6, 2],
);
const T_SLOTS = [
  ...T_MIDDLE_SLOTS.map(([a, b]) => tpill(a, b, 0, T_SLOT_HALF)),
  ...T_OUTER_SLOTS.flatMap(([a, b]) => [
    tpill(a, b, -T_OUTER_SLOT_Y, T_SLOT_HALF),
    tpill(a, b, T_OUTER_SLOT_Y, T_SLOT_HALF),
  ]),
].join(" ");
const T_PLATE_SHAPE = tpill(T_PLATE[0], T_PLATE[1], 0, T_PLATE_HALF);
const T_BARREL = tbox(
  T_BARREL_BACK,
  -T_BARREL_HALF,
  T_COLLAR[0] + 1,
  T_BARREL_HALF,
);
const T_COLLAR_SHAPE = tbox(
  T_COLLAR[0],
  -T_COLLAR_HALF,
  T_COLLAR[1],
  T_COLLAR_HALF,
  [1, 0, 0, 1],
);
const T_PROTECTOR = tbox(
  T_COLLAR[1] - 0.5,
  -T_PROTECTOR_HALF,
  T_MUZZLE,
  T_PROTECTOR_HALF,
  [0, 3, 3, 0],
);
const T_TUBE = tbox(T_BARREL_BACK, -T_TUBE_HALF, T_TUBE_END, T_TUBE_HALF, [
  0, 5, 5, 0,
]);
const T_NUT_SHAPE = tbox(T_NUT[0], -T_NUT_HALF, T_NUT[1], T_NUT_HALF, 2);
const T_FLANGE_SHAPE = tbox(
  T_FLANGE[0],
  -T_FLANGE_HALF,
  T_FLANGE[1],
  T_FLANGE_HALF,
  2,
);
// The pump from above: its lip at the back a little wider, its body, and its nose rounding in to the front
const T_PUMP =
  `M${tp(T_PUMP_BACK + 3, -T_LIP_HALF)} L${tp(T_LIP_FRONT, -T_LIP_HALF)} L${tp(T_LIP_FRONT + 1, -T_PUMP_HALF)} ` +
  `L${tp(T_PUMP_NOSE, -T_PUMP_HALF)} C${tp(T_PUMP_NOSE + 20, -T_PUMP_HALF)} ${tp(T_PUMP_FRONT, -T_NOSE_HALF - 4)} ${tp(T_PUMP_FRONT, -T_NOSE_HALF)} ` +
  `L${tp(T_PUMP_FRONT, T_NOSE_HALF)} C${tp(T_PUMP_FRONT, T_NOSE_HALF + 4)} ${tp(T_PUMP_NOSE + 20, T_PUMP_HALF)} ${tp(T_PUMP_NOSE, T_PUMP_HALF)} ` +
  `L${tp(T_LIP_FRONT + 1, T_PUMP_HALF)} L${tp(T_LIP_FRONT, T_LIP_HALF)} L${tp(T_PUMP_BACK + 3, T_LIP_HALF)} ` +
  `C${tp(T_PUMP_BACK + 1, T_LIP_HALF)} ${tp(T_PUMP_BACK, T_LIP_HALF - 1)} ${tp(T_PUMP_BACK, T_LIP_HALF - 3)} ` +
  `L${tp(T_PUMP_BACK, -T_LIP_HALF + 3)} C${tp(T_PUMP_BACK, -T_LIP_HALF + 1)} ${tp(T_PUMP_BACK + 1, -T_LIP_HALF)} ${tp(T_PUMP_BACK + 3, -T_LIP_HALF)} Z`;
// Its grooves, notching its edges where they show beside the shield
const T_PUMP_GROOVES = Array.from({ length: RIBS }, (_, i) => {
  const x0 = sx(RIB_FIRST + i * RIB_PITCH);
  const x1 = sx(RIB_FIRST + i * RIB_PITCH + RIB_WIDTH);
  return (
    tbox(x0, -T_PUMP_HALF, x1, -T_PUMP_HALF + 1.4) +
    " " +
    tbox(x0, T_PUMP_HALF - 1.4, x1, T_PUMP_HALF)
  );
}).join(" ");
const T_FRONT_SIGHT_BASE = tbox(
  T_SIGHT_BASE[0],
  -T_SIGHT_BASE_HALF,
  T_SIGHT_BASE[1],
  T_SIGHT_BASE_HALF,
  2,
);
const T_FRONT_SIGHT_BLADE = tbox(
  T_SIGHT_BLADE[0],
  -T_SIGHT_BLADE_HALF,
  T_SIGHT_BLADE[1],
  T_SIGHT_BLADE_HALF,
  1,
);
const T_REAR_SIGHT_SHAPE = tbox(
  T_REAR_SIGHT[0],
  -T_REAR_SIGHT_HALF,
  T_REAR_SIGHT[1],
  T_REAR_SIGHT_HALF,
  [1, 3, 3, 1],
);

function drawTop(options: Spas12Options = {}): string {
  const R: Material = { ...SPAS_RECEIVER, ...options.receiver };
  const G: Material = { ...SPAS_GRIP, ...options.grip };
  const P: Material = { ...SPAS_PUMP, ...options.pump };
  const S: Material = { ...PARKERIZED, ...options.shield };
  const T: Material = { ...SPAS_STEEL, ...options.steel };
  const ribs = options.ribs ?? 1;
  const outlineWidth = options.outlineMm ?? T_OUTLINE;
  const outline = options.outline !== false;
  const minX = T_HUMP_BACK - 1;
  const maxX = T_MUZZLE + 1;
  const half = T_KNOB_OUT + 1;
  const width = t1(maxX - minX);
  const height = t1(half * 2);
  // Each group's own outline: its silhouette stroked twice as wide under its fill, in its own dark, so it moves
  // with the part
  const edge = (d: string, color: string) =>
    outline
      ? `<path d="${d}" stroke="${color}" stroke-width="${t1(outlineWidth * 2)}" fill="none"/>\n    `
      : "";
  const knurl = (x0: number, x1: number, h: number, step = 1.3) => {
    const lines: string[] = [];
    for (let x = x0 + step / 2; x < x1; x += step) {
      lines.push(`M${tp(x, -h)} L${tp(x, h)}`);
    }
    return lines.join(" ");
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${t1(minX)} ${t1(-half)} ${width} ${height}" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  ${generatedNote("spas-12")}
  <!-- The Franchi SPAS-12 from above, as it's held, with no stock: muzzle along +x, its right side down the page
       (+y), millimeters about its middle on the bore, at the same scale as its side view (the pickup); lengths
       along it are the side view's, widths the 3D model's. Lit from above, the top faces brightest. -->
  <defs>
    ${across("spas-12-top-hump", T_BODY_HALF, flatAcross(G))}
    ${across("spas-12-top-receiver", T_BODY_HALF, flatAcross(R))}
    ${across("spas-12-top-shield", T_SHIELD_HALF, flatAcross(S))}
    ${across("spas-12-top-pump", T_PUMP_HALF, flatAcross(P))}
    ${across("spas-12-top-barrel", T_BARREL_HALF, roundAcross(T))}
    ${across("spas-12-top-collar", T_PROTECTOR_HALF, roundAcross(T))}
    ${across("spas-12-top-tube", T_TUBE_HALF, roundAcross(T))}
    ${across("spas-12-top-nut", T_FLANGE_HALF, roundAcross(T))}
  </defs>
  <!-- Under the barrel and a little wider: the magazine tube, out in front of the pump to its rounded end, and its
       cap's knurled nut and flange, uncovered as the pump comes back -->
  <g id="magazine-tube">
    ${edge(T_TUBE, T.dark)}<path d="${T_TUBE}" fill="url(#spas-12-top-tube)"/>
    ${edge(T_FLANGE_SHAPE, T.dark)}<path d="${T_FLANGE_SHAPE}" fill="url(#spas-12-top-nut)"/>
    ${edge(T_NUT_SHAPE, T.dark)}<path id="magazine-cap" d="${T_NUT_SHAPE}" fill="url(#spas-12-top-nut)"/>
    <path d="${knurl(T_NUT[0] + 1, T_NUT_WAIST[0], T_NUT_HALF - 0.5)} ${knurl(T_NUT_WAIST[1], T_NUT[1] - 1, T_NUT_HALF - 0.5)}" stroke="${T.dark}" stroke-width="0.45" fill="none" opacity="0.7"/>
    <path d="${tbox(T_NUT_WAIST[0], -T_NUT_HALF, T_NUT_WAIST[1], T_NUT_HALF)}" fill="${T.dark}" opacity="0.55"/>
  </g>
  <!-- Slides back along the magazine tube to work the action, under the heat shield, the barrel and the
       receiver: its sides show beside the shield, notched by its grooves, and its nose out in front of it -->
  <g id="pump">
    ${edge(T_PUMP, P.dark)}<path d="${T_PUMP}" fill="url(#spas-12-top-pump)"/>
    <path id="pump-grooves" d="${T_PUMP_GROOVES}" fill="${P.dark}" opacity="${Math.min(1, 0.45 + 0.45 * ribs)}"/>
  </g>
  <!-- The barrel, through the heat shield's slots and out of its front to the collar, the knurled thread
       protector and the front sight; and under the shield, its dark inside, seen through the slots beside the barrel -->
  <path id="shield-inside" d="${tbox(T_SHIELD_BACK + 1, -T_SHIELD_HALF + 1, T_SHIELD_FRONT - 1, T_SHIELD_HALF - 1)}" fill="#0c0b0e"/>
  <g id="barrel">
    ${edge(T_BARREL, T.dark)}<path d="${T_BARREL}" fill="url(#spas-12-top-barrel)"/>
    <!-- In the shield's shadow, under it -->
    <path d="${tbox(T_BARREL_BACK, -T_BARREL_HALF, T_SHIELD_FRONT, T_BARREL_HALF)}" fill="#0c0b0e" opacity="0.55"/>
    ${edge(T_COLLAR_SHAPE, T.dark)}<path d="${T_COLLAR_SHAPE}" fill="url(#spas-12-top-collar)"/>
    <path d="M${tp(T_COLLAR[0] + 6.2, -T_COLLAR_HALF)} L${tp(T_COLLAR[0] + 6.2, T_COLLAR_HALF)} M${tp(T_COLLAR[0] + 9.7, -T_COLLAR_HALF)} L${tp(T_COLLAR[0] + 9.7, T_COLLAR_HALF)}" stroke="${T.dark}" stroke-width="1.1" fill="none"/>
    ${edge(T_PROTECTOR, T.dark)}<path id="muzzle" d="${T_PROTECTOR}" fill="url(#spas-12-top-collar)"/>
    <path d="${knurl(T_KNURL[0], T_KNURL[1], T_PROTECTOR_HALF - 0.5)}" stroke="${T.dark}" stroke-width="0.45" fill="none" opacity="0.7"/>
    <g id="front-sight">
      ${edge(T_FRONT_SIGHT_BASE, T.dark)}<path d="${T_FRONT_SIGHT_BASE}" fill="${T.base}"/>
      <path d="${T_FRONT_SIGHT_BLADE}" fill="${T.light}"/>
    </g>
  </g>
  <!-- The heat shield over the barrel: its flat top's three rows of slots, the oval plate round the rear sight, and a button near its front -->
  <g id="heat-shield">
    ${edge(T_SHIELD, S.dark)}<path d="${T_SHIELD} ${T_SLOTS}" fill="url(#spas-12-top-shield)"/>
    <path id="vents" d="${T_SLOTS}" fill="none" stroke="${S.dark}" stroke-width="0.6"/>
    <path d="${T_PLATE_SHAPE}" fill="none" stroke="${S.dark}" stroke-width="0.6"/>
    <circle cx="${t1(T_BUTTON[0])}" cy="${t1(T_BUTTON[1])}" r="3" fill="${S.light}" stroke="${S.dark}" stroke-width="0.5"/>
    <g id="rear-sight">
      ${edge(T_REAR_SIGHT_SHAPE, S.dark)}<path d="${T_REAR_SIGHT_SHAPE}" fill="${S.base}"/>
      <path d="${tbox(T_REAR_SIGHT[0], -T_REAR_SIGHT_HALF, T_REAR_POST, T_REAR_SIGHT_HALF, 1)}" fill="${S.light}"/>
    </g>
  </g>
  <!-- The receiver, black, its flat top lit; the operating handle's knob out of its right side -->
  <g id="receiver">
    ${edge(T_KNOB_SHAPE, T.dark)}<path id="operating-handle" d="${T_KNOB_SHAPE}" fill="${T.light}"/>
    ${edge(T_RECEIVER, R.dark)}<path d="${T_RECEIVER}" fill="url(#spas-12-top-receiver)"/>
  </g>
  <!-- The grip's hump behind the receiver (the grip itself is under it), where a folding stock would hinge: the
       pivot pin's ends either side, and the sling loop on its top -->
  <g id="grip">
    ${edge(T_HUMP, G.dark)}<path d="${T_HUMP}" fill="url(#spas-12-top-hump)"/>
    <path d="${tbox(T_PIVOT - 4.5, -T_BODY_HALF - 1, T_PIVOT + 4.5, -T_BODY_HALF + 1, 1)} ${tbox(T_PIVOT - 4.5, T_BODY_HALF - 1, T_PIVOT + 4.5, T_BODY_HALF + 1, 1)}" fill="${R.light}" stroke="${R.dark}" stroke-width="0.4"/>
    <path id="sling-loop" d="${tpill(T_LOOP[0], T_LOOP[1], 0, T_LOOP_HALF)}" fill="none" stroke="${R.dark}" stroke-width="${t1(LOOP_WIDTH * MM_PER_PX + outlineWidth * 2)}"/>
    <path d="${tpill(T_LOOP[0], T_LOOP[1], 0, T_LOOP_HALF)}" fill="none" stroke="${mix(R.base, R.light, 0.5)}" stroke-width="${t1(LOOP_WIDTH * MM_PER_PX)}"/>
  </g>
</svg>
`;
}

const TOP: TopView<Spas12Options> = {
  draw: drawTop,
  registrations: [
    {
      // The heat shield's corners in the model from above
      file: "model-py.png",
      points: [
        [
          [824, 10],
          [T_SHIELD_BACK, -T_SHIELD_HALF],
        ],
        [
          [824, 113],
          [T_SHIELD_BACK, T_SHIELD_HALF],
        ],
        [
          [1797, 10],
          [T_SHIELD_FRONT, -T_SHIELD_HALF],
        ],
        [
          [1797, 113],
          [T_SHIELD_FRONT, T_SHIELD_HALF],
        ],
      ],
    },
  ],
};

export const SPAS_12: GunDrawing<Spas12Options> = {
  name: "spas-12",
  photo: {
    file: "spas-12-unfolded.jpg",
    width: 2400,
    height: 1350,
    about:
      "A SPAS-12 from its right side with its stock out, muzzle to the right, on white, evenly lit; drawn without the stock",
  },
  otherPhotos: [
    {
      file: "spas-12-folded.webp",
      width: 2000,
      height: 2000,
      about:
        "A SPAS-12 render with its stock folded over the top: the receiver's back, the grip",
    },
    {
      file: "model-pz.png",
      width: 2400,
      height: 579,
      about:
        "The 3D model (model/) rendered from its right side straight on (`model spas-12 --from +z`): the receiver's back end and the grip without a stock",
    },
    {
      file: "model-py.png",
      width: 2400,
      height: 157,
      about:
        "The 3D model from above, muzzle to the right and its right side down (`model spas-12 --from +y --up -z`): the widths, the shield's slots from above",
    },
    {
      file: "model-mx.png",
      width: 651,
      height: 2400,
      about: "The 3D model from behind (`model spas-12 --from -x`): the widths of the hump, the receiver and the shield",
    },
    {
      file: "model",
      width: 0,
      height: 0,
      about:
        "A 3D model with no stock (Sketchfab, CC-BY-NC; reference only): render it with `model spas-12` (from +z is the right side, from +y above, from -x behind)",
    },
  ],
  // The origin on the stockless gun's middle on the bore, and 1041 mm (the gun with its stock out) over the 2358 px
  // it's long in the photo
  scale: { origin: ORIGIN, mmPerPixel: MM_PER_PX },
  frame: {
    // The front sight's top, the grip's base, the hump's back, the muzzle
    top: 458,
    bottom: 888,
    back: BACK,
    front: MUZZLE,
    side: 820,
    pixels: 512,
  },
  comment: `
  <!-- The Franchi SPAS-12 from its right side, muzzle to the right, with no stock: the pistol grip and the hump
       behind the receiver where the folding stock's hinge would go, the black receiver, the parkerized heat
       shield, the ribbed pump, the magazine tube and the 21.5" barrel. Millimeters, with the origin on the gun's
       middle on the bore, as the guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
  top: TOP,
};
