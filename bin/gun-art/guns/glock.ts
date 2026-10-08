/**
 * The Glock 19 from its right side: a Glock 19 (Gen 5), black polymer frame, black slide. Drawn in the pixels of its photo
 * (1500 by 1051) by named numbers, following the gun-art skill (.claude/skills/gun-art/SKILL.md), with
 * guns/m1911.ts as the worked example. A draft until it goes into the game.
 *
 * The slide is black nitride (BLACK_NITRIDE, here until it moves into lib/style.ts), a little bluer and darker
 * than the polymer frame, so the two separate at 128 px. Light falls from above and a little behind, as on the
 * M1911: top edges and the back strap lit, undersides and the front strap in shadow.
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
} from "../lib/geometry";
import type { GunDrawing } from "../lib/gun";
import type { Material } from "../lib/style";
import { BLACK_POLYMER } from "../lib/style";

/**
 * Black nitride (the Glock's slide, and its steel parts: the slide stop, the takedown lever, the pins): near
 * black, a touch bluer and darker than the polymer frame. A starting point, picked on the materials sheet.
 */
export const BLACK_NITRIDE: Material = {
  base: "#2b2e34",
  dark: "#15161a",
  light: "#41454e",
  highlight: "#5f6570",
};

export interface GlockOptions {
  /** The slide's material, and its steel parts' */
  slide?: Partial<Material>;
  /** The frame's polymer */
  frame?: Partial<Material>;
  /** The grip's studs: how far apart and how big (photo pixels; the real ones are about 16.5 and 9) */
  studPitch?: number;
  studSize?: number;
  /** A thin outline round the silhouette, in each part's own dark (the set's rule; default true) */
  outline?: boolean;
  /** How wide the rim light along the top edges is, in photo px (default RIM_LIGHT) */
  rimLight?: number;
}

// ---------------------------------------------------------------------------------------------------------
// Dimensions. Glock's own table for the G19 Gen 5 (us.glock.com, G19 Gen5 FS): 185 mm long overall, slide 174 mm,
// 128 mm high with the magazine, barrel 102 mm, 34 mm wide overall, slide 25.5 mm wide.
//
// In the photo (`measure runs`), the gun runs from the back of the grip's heel (x 63, at y 858: the grip leans
// back past the frame's tang) to the barrel's crown (x 1456): 1393 px. Glock's 185 mm is that length (it's the
// one that makes the slide come out right): 185 / 1393 = 0.1328 mm a pixel, and then the slide, 134 to 1442,
// 1308 px, is 173.7 mm (174 in the table). The height, sight tops (y 41) to the magazine's base (y 995), is
// 954 px, 126.7 mm (128 in the table). So the photo is a true side view: the slide to 0.2%, the height to 1%.
//
// The origin: halfway along that length, (63 + 1456) / 2, on the bore. The bore's height is the middle of the
// barrel's crown, which stands just proud of the slide's front (x 1443 to 1456, y 91 to 198: 14.2 mm across, a
// 9 mm barrel's muzzle): y 144.5.
const LENGTH_PX = 1456 - 63;
const MM_PER_PX = 185 / LENGTH_PX;
const ORIGIN: Point = [(63 + 1456) / 2, 144.5];

// ---------------------------------------------------------------------------------------------------------
// Construction (from `grid --mode photo`, region by region; both photos)
//
// Two assemblies: the steel slide on top (with the barrel in it), and the polymer frame under it, which is
// everything else: the rails and dust cover, the trigger guard and the grip are one molding.
//
// THE SLIDE. A box with flat sides, its top's corners rounded off (a lit chamfer band along the top, y 74 to
// about 92), the back face square. At the front, the Gen 5's "nose": the slide's side is chamfered from x 1400
// to the front, a plane of its own, darker, and its top front corner is rounded (r about 22). The bottom edge
// is straight (y 240), a dark seam over the frame.
//   - Serrations at both ends (the Gen 5 "FS" has front ones): 11 straight vertical cuts at the back, 211 to
//     460, and 11 at the front, 1094 to 1345, each about 6 px wide (0.8 mm), 38 px apart (5 mm), from y 95 to
//     238, open at the bottom edge but not the top. At 128 px each cut is under a pixel wide: draw them as a
//     band of fewer, wider grooves, or as alternating light and dark stripes, rather than 11 hairlines.
//   - The ejection port: cut from the top of the slide down its right side, x 700 to 920, its bottom at y 166
//     with rounded corners. In it, the barrel's hood (with the serial on it), black like the slide (Glock
//     barrels are nitrided, not polished), and a deep shadow strip behind the hood (x 700 to 715) where the
//     breech face is. The port should survive at 128 px; the serial won't.
//   - Behind the port, the extractor's slot: a pill (round at the back, x 572 to 700, y 110 to 152). Small, but
//     a distinct dark shape; probably survives as a darker pill.
//   - The sights are Glock's polymer ones, black: the rear a trapezoid, 197 to 246 at its base, 210 to 234 on
//     top at y 44 (its notch is only seen from behind); the front a smaller one, 1352 to 1414 at its base, 1362
//     to 1395 on top at y 42.
//   - The "GLOCK" logo and serials are stamped: drop them.
// THE BARREL'S CROWN. Stands just proud of the slide's front (x 1443 to 1456): a short cylinder end, seen from
// the side, so a band with rounded front corners.
// THE FRAME, polymer, finely textured (dull, never black: BLACK_POLYMER). Its planes:
//   - The top of the frame, under the slide, is hidden except at the back, where the frame's tang (the
//     "beavertail") pokes out behind the slide (to x 115) and curves down into the web of the grip.
//   - The upper frame's flat face: from the tang to the dust cover's front, down to an edge (the RIM below)
//     along the top of the trigger guard and down behind it. Over it sit, proud: the slide stop lever (Gen 5:
//     ambidextrous, so it's on this side too; x 507 to 585, y 245 to 290, three grooves) in a recess molded
//     into the frame below it (x 481 to 610, y 294 to 323); the takedown lever, a slanted serrated tab (x 840
//     to 878, y 268 to 332) on a raised oval boss; and the trigger pin (centre 762,322: a dark ring r 17, the
//     pin r 11.5). The trigger housing pin is at the top of the backstrap (centre 281,446, r 11, on a smooth
//     round boss), and the backstrap's seam hooks round it.
//   - The dust cover, under the slide's front, with an accessory rail: a groove along its side (y 300 to 315,
//     x 1160 to 1430) and one cross slot, seen as a notch in its bottom edge (x 1333 to 1368, 15 px deep: 2 mm,
//     too small at 128 px, left out). Its front corner is rounded off below (x 1420 to 1443).
//   - The trigger guard: a lower plane than the face (the face's edge casts a shadow on its top), squared off,
//     with a flat front that leans out a little toward its bottom (x 1007 at y 450 to 1022 at y 548). Its
//     opening is a rounded quadrilateral, not a pill: a straight top rising toward the front, a straight front,
//     a straight bottom, a big round back (the corners' radii below). Its back half runs down into the grip's
//     front strap with a fillet under it (lowest at 640,548).
//   - The trigger: behind the frame, seen through the guard. A curved blade, flat-faced and swept back at the
//     bottom (tip at about 820,522), with the safety lever (a narrower, lighter blade) standing out of its face
//     (x 790 to 832, y 440 to 520). Behind it, slanting up into the frame, its tail (x 668 to 720, y 410 to 450).
//     Both should read at 128 px as one curved trigger; the safety blade as a lighter line down its face.
//   - The grip, Gen 5: NO finger grooves (a straight front strap), and the FLARED MAGWELL: the grip widens to
//     its base, flaring at the heel (x 63 at y 858, the back strap's foot) and at the front strap's foot. The back
//     strap leans back 23° (0.43 x per y), the front strap 20.5° (0.375): the grip is a little wider at the
//     bottom (428 px at y 800, 408 at y 580), as measured; the magazine catch and the texture lean with the
//     front strap. Its base falls toward the front (0.078 y per x), parallel to the magazine's base.
//   - The grip's texture (RTF-style square studs, about 12 px each, 20 apart, in rows along the grip's lean)
//     covers a panel on the side, and the front and back straps (it makes the silhouette's edges bumpy). It
//     stops at a smooth band above (the thumb's place under the slide stop, a shallow recess, x 300 to 560,
//     y 330 to 470), a smooth strip along the backstrap's seam, a smooth rounded plate low down ("MADE IN
//     AUSTRIA"; x 205 to 390, y 745 to 830) and the smooth flared foot. At 128 px the real studs are a pixel
//     or two, so (Simon's call) they're drawn as a field of small dark squares scaled up about 1.5 times (24 px
//     apart, 11 across: DEFAULT_STUD_PITCH, DEFAULT_STUD_SIZE), in even rows and columns along the grip's axis,
//     filling the panel to its smooth borders. All lettering goes, and so does the nameplate (Simon's call).
//   - The magazine release: the Gen 5's button, behind the trigger guard, a square standing proud of the frame
//     (corners 524,460, 598,483, 591,541, 508,522: turned about 16°, a little more upright than the grip).
//     Drawn proud: lit along its top and back, a shadow along its bottom and front.
//   - The backstrap seam: a line from the trigger housing pin down the grip, parallel to the back. Faint at
//     128 px; probably a subtle line.
// THE MAGAZINE's base plate, proud of the grip's base (it's not flush, as the M1911's was): x 148 to 479, 5 mm
// thick, its bottom parallel to the grip's base, its front corner rounded (r about 32), its back a little
// undercut. Black polymer.
//
// From behind (the alternate photo; a MOS model, with an optic plate on the slide, so only for widths): the
// slide is narrower than the grip; the slide stop's lever sticks out on both sides; the grip's back strap is
// textured. Widths for the top view later: slide 25.5 mm, overall 34 mm (Glock's table).

// ---------------------------------------------------------------------------------------------------------
// The slide
const SLIDE_TOP = 74;
const SLIDE_BOTTOM = 240;
const SLIDE_BACK = 134;
const SLIDE_FRONT = 1442;
const SLIDE_BACK_R = 18; // its top back corner
const SLIDE_FRONT_R = 22; // its top front corner
const SLIDE = rounded(
  [
    [SLIDE_BACK, SLIDE_TOP],
    [SLIDE_FRONT, SLIDE_TOP],
    [SLIDE_FRONT, SLIDE_BOTTOM],
    [SLIDE_BACK, SLIDE_BOTTOM],
  ],
  [SLIDE_BACK_R, SLIDE_FRONT_R, 0, 0],
);
// The ejection port: from the top, down to its rounded bottom
const PORT_BACK = 700;
const PORT_FRONT = 920;
const PORT_BOTTOM = 166;
const PORT = rounded(
  [
    [PORT_BACK, SLIDE_TOP],
    [PORT_FRONT, SLIDE_TOP],
    [PORT_FRONT, PORT_BOTTOM],
    [PORT_BACK, PORT_BOTTOM],
  ],
  [0, 0, 30, 40],
);
// The sights: trapezoids on the slide's top, [back, front] at the base and on top, and how high
const REAR_SIGHT = { base: [197, 246], top: [210, 234], height: 44 } as const;
const FRONT_SIGHT = {
  base: [1352, 1414],
  top: [1362, 1395],
  height: 42,
} as const;
function sight(s: {
  base: readonly [number, number];
  top: readonly [number, number];
  height: number;
}): string {
  // Down into the slide a little, so its top corner's curve doesn't show a gap
  return rounded(
    [
      [s.base[0], SLIDE_TOP + 4],
      [s.top[0], s.height],
      [s.top[1], s.height],
      [s.base[1], SLIDE_TOP + 4],
    ],
    [0, 4, 4, 0],
  );
}

// The barrel's crown, just proud of the slide's front
const BARREL_TOP = 91;
const BARREL_BOTTOM = 198;
const CROWN_FRONT = 1456;
const BARREL = rounded(
  [
    [SLIDE_FRONT - 10, BARREL_TOP],
    [CROWN_FRONT, BARREL_TOP],
    [CROWN_FRONT, BARREL_BOTTOM],
    [SLIDE_FRONT - 10, BARREL_BOTTOM],
  ],
  [0, 8, 8, 0],
);

// ---------------------------------------------------------------------------------------------------------
// The grip's axis: the front strap's lean (and the magazine catch's), and its base's fall. The back strap leans
// back a little more (BACK_STRAP below), as measured.
const GRIP = new SlantedAxis(594, 580, -0.375, 0.078); // `back` here is the front strap, at y 580
/** The grip's base (and the magazine's, parallel to it): y at x */
const BASE_AT: Point = [300, 936];
const baseY = (x: number) => BASE_AT[1] + GRIP.fall * (x - BASE_AT[0]);

// The frame's outline, round from the top of the dust cover's front, back under the slide, round the tang,
// down the back strap, round the heel, along the base and up the front strap to the guard
const FRAME_TOP = 236; // under the slide, hidden (up into it a little, so no seam of background shows)
const TANG_TOP = 244; // the tang's top, behind the slide
const TANG_BACK = 115;
const DUST_COVER_FRONT = 1443;
// The tang's underside and the web of the grip, then down the back strap (points on the outside of the texture's
// bumps, from `measure runs rows`)
const BACK_STRAP: Point[] = [
  [128, 293],
  [160, 299],
  [200, 317],
  [222, 338],
  [238, 370],
  [245, 405],
  [238, 450],
  [222, 500],
  [198, 560],
  [150, 640],
  [110, 720],
  [80, 790],
  [66, 835],
  [63, 856],
];
// The heel: the flared foot of the back strap, cut off at a slant down to the base
const HEEL: Point = [140, baseY(140)];
// Up the front strap from its foot (the flare) to where the trigger guard leaves it
const FRONT_FOOT_X = 479;
const FRONT_STRAP: Point[] = [
  [FRONT_FOOT_X, baseY(FRONT_FOOT_X) - 8],
  [480, 900],
  [489, 860],
  [510, 800],
  [533, 740],
  [556, 680],
  [577, 620],
  GRIP.at(0, 580),
];
// The face's edge, where the upper frame steps down to the trigger guard: up from the front strap behind the
// guard's opening, over its top, to the dust cover's underside at the guard's front
const RIM: Point[] = [
  GRIP.at(0, 580),
  [600, 560],
  [614, 520],
  [628, 470],
  [640, 420],
  [668, 382],
  [720, 366],
  [800, 352],
  [900, 340],
  [1000, 342],
  [1060, 352],
];
// Along the dust cover's underside (it rises a little toward the front) to its rounded front corner
const DUST_COVER_BOTTOM: Point[] = [
  [1060, 352],
  [1200, 350],
  [1320, 347],
  [1400, 341],
];

const FRAME =
  `M${DUST_COVER_FRONT},${FRAME_TOP} L${SLIDE_BACK + 6},${FRAME_TOP} L${SLIDE_BACK + 6},${TANG_TOP} ` +
  // The tang: its top under the slide's back, its rounded end, then its underside into the web
  `C${SLIDE_BACK - 4},${TANG_TOP} ${TANG_BACK + 2},${TANG_TOP + 4} ${TANG_BACK},${TANG_TOP + 16} ` +
  `L${TANG_BACK},${280} C${TANG_BACK},${288} ${120},${292} ${fmt(BACK_STRAP[0])} ` +
  smoothCurve(BACK_STRAP, [1, 0.15], [-0.15, 1]) +
  // Round the heel's corner and down its slant to the base
  ` C63,866 66,872 72,878 L${fmt([HEEL[0] - 10, HEEL[1] - 4])} C${fmt([HEEL[0] - 6, HEEL[1] - 1])} ${fmt([HEEL[0] - 3, HEEL[1]])} ${fmt(HEEL)}` +
  ` L${fmt([FRONT_FOOT_X - 6, baseY(FRONT_FOOT_X - 6)])} C${fmt([FRONT_FOOT_X - 2, baseY(FRONT_FOOT_X - 2)])} ` +
  `${FRONT_FOOT_X},${baseY(FRONT_FOOT_X) - 3} ${fmt(FRONT_STRAP[0])} ` +
  smoothCurve(FRONT_STRAP, [0, -1], [GRIP.down[0] * -1, -GRIP.down[1]]) +
  " " +
  smoothCurve(RIM, [0.3, -1], [1, 0.15]) +
  " " +
  smoothCurve(DUST_COVER_BOTTOM, [1, 0], [1, -0.08]) +
  // The dust cover's rounded front corner
  ` C1420,339 1440,330 1442,308 L${DUST_COVER_FRONT},${FRAME_TOP} Z`;

// ---------------------------------------------------------------------------------------------------------
// The trigger guard, on the lower plane under the face (its top tucked under the face's RIM): its outline from the
// dust cover's underside down the flat front, round its bottom corner, along the bottom and back up into the
// front strap, and its opening.
const GUARD_FRONT: Point[] = [
  [1060, 352],
  [1036, 368],
  [1019, 386],
  [1009, 410],
  [1007, 450],
  [1009, 500],
  [1016, 530],
  [1022, 548],
];
const GUARD_UNDER: Point[] = [
  [1000, 571],
  [925, 573],
  [880, 575],
  [800, 577],
  [733, 577],
  [704, 572],
  [688, 566],
  [667, 554],
  [640, 548],
  [619, 554],
  [603, 568],
  GRIP.at(0, 580),
];
// The opening: a rounded quadrilateral, its top rising toward the front, its back a big round
const OPENING_BACK = 654;
const OPENING_FRONT = 966;
const OPENING_BOTTOM = 534;
const OPENING_TOP_BACK = 386; // the top's height at the back and at the front
const OPENING_TOP_FRONT = 345;
const OPENING = rounded(
  [
    [OPENING_BACK, OPENING_TOP_BACK],
    [OPENING_FRONT, OPENING_TOP_FRONT],
    [OPENING_FRONT, OPENING_BOTTOM],
    [OPENING_BACK, OPENING_BOTTOM],
  ],
  [55, 60, 60, 80],
);
const GUARD =
  `M${fmt(GUARD_FRONT[0])} ` +
  smoothCurve(GUARD_FRONT, [-1, 0.6], [0.3, 1]) +
  // Its bottom front corner
  ` C1025,558 1020,569 ${fmt(GUARD_UNDER[0])} ` +
  smoothCurve(GUARD_UNDER, [-1, 0.08], [-0.6, 1]) +
  // Up under the face, hidden
  ` L600,340 L1060,330 Z ${OPENING}`;

// ---------------------------------------------------------------------------------------------------------
// The trigger: down the front of its blade, round its swept-back tip, back up its back edge and its tail, up into
// the frame (hidden above the opening's top)
const TRIGGER_FRONT: Point[] = [
  [771, 360],
  [772, 416],
  [780, 444],
  [800, 464],
  [824, 488],
  [832, 503],
];
const TRIGGER_BACK: Point[] = [
  [800, 527],
  [781, 519],
  [763, 506],
  [737, 482],
  [722, 464],
  [718, 452],
  [712, 430],
  [705, 400],
  [700, 360],
];
const TRIGGER =
  `M${fmt(TRIGGER_FRONT[0])} ` +
  smoothCurve(TRIGGER_FRONT, [0, 1], [0.5, 1]) +
  // The tip, a round end
  ` C835,516 822,528 ${fmt(TRIGGER_BACK[0])} ` +
  smoothCurve(TRIGGER_BACK, [-1, -0.4], [-0.1, -1]) +
  " Z";
// Its tail, a flat bar slanting back up into the frame from behind the shoe
const TRIGGER_TAIL = rounded(
  [
    [668, 410],
    [724, 436],
    [720, 452],
    [668, 438],
  ],
  [3, 0, 0, 3],
);

// ---------------------------------------------------------------------------------------------------------
// The magazine's base plate, under the grip's base (its top hidden under the frame), its bottom parallel to the
// base, its front corner rounded and its back a little undercut
const MAG_BACK_TOP: Point = [160, baseY(160) - 6];
const MAG_FRONT = 479;
const MAG_THICK = 45; // its bottom under the grip's base line (6 mm; the top is hidden under the frame)
const MAG_BASE = rounded(
  [
    MAG_BACK_TOP,
    [MAG_FRONT, baseY(MAG_FRONT) - 6],
    [MAG_FRONT, baseY(MAG_FRONT) + MAG_THICK],
    [149, baseY(149) + MAG_THICK + 1],
  ],
  [0, 0, 36, 6],
);

// ---------------------------------------------------------------------------------------------------------
// Details on the slide

// The serrations: SERRATIONS grooves in each band (the real gun has 11, too fine at 128 px), each a cut with a
// round top, open at the slide's bottom edge, its front wall lit
const SERRATIONS = 6;
const SERRATION_WIDTH = 20;
const SERRATION_TOP = 98;
const REAR_SERRATIONS: [number, number] = [213, 458];
const FRONT_SERRATIONS: [number, number] = [1096, 1343];
function serrationXs([from, to]: [number, number]): number[] {
  const pitch = (to - from - SERRATION_WIDTH) / (SERRATIONS - 1);
  return Array.from({ length: SERRATIONS }, (_, i) => from + i * pitch);
}
function serrationCut(x: number): string {
  const r = SERRATION_WIDTH / 2;
  const center: Point = [x + r, SERRATION_TOP + r];
  return (
    `M${fmt([x, SLIDE_BOTTOM])} L${fmt(on(center, r, 180))} ${arc(center, r, 180, 360)} ` +
    `L${fmt([x + SERRATION_WIDTH, SLIDE_BOTTOM])} Z`
  );
}

// The nose: the side's chamfer from NOSE_BACK to the front, a plane of its own
const NOSE_BACK = 1400;
const NOSE = rounded(
  [
    [NOSE_BACK, 92],
    [SLIDE_FRONT + 2, 92],
    [SLIDE_FRONT + 2, SLIDE_BOTTOM],
    [NOSE_BACK, SLIDE_BOTTOM],
  ],
  [12, 0, 0, 0],
);
// The back face's chamfer, a dark band down the back
const BACK_CHAMFER = 12;

// In the port: the barrel's hood, filling it but for a dark gap behind it (where the breech face is) and under it
const HOOD_BACK = 716;
const HOOD_FRONT = 918;
const HOOD_BOTTOM = 160;
const HOOD =
  `M${HOOD_BACK},${SLIDE_TOP + 2} L${HOOD_FRONT - 6},${SLIDE_TOP + 2} ` +
  `C${HOOD_FRONT - 2},${SLIDE_TOP + 2} ${HOOD_FRONT},${SLIDE_TOP + 5} ${HOOD_FRONT},${SLIDE_TOP + 10} ` +
  `L${HOOD_FRONT},134 C${HOOD_FRONT},149 906,${HOOD_BOTTOM} 890,${HOOD_BOTTOM} L748,${HOOD_BOTTOM} ` +
  `C733,${HOOD_BOTTOM} 722,154 ${HOOD_BACK},146 Z`;
// The port's cut edge down its back, along its bottom and up its front, catching the light
const PORT_EDGE =
  `M${PORT_BACK},${SLIDE_TOP + 2} L${PORT_BACK},126 C${PORT_BACK},148 718,${PORT_BOTTOM} 740,${PORT_BOTTOM} ` +
  `L890,${PORT_BOTTOM} C907,${PORT_BOTTOM} ${PORT_FRONT},153 ${PORT_FRONT},136 L${PORT_FRONT},${SLIDE_TOP + 2}`;

// The extractor's slot behind the port: a pill, round at the back, the extractor in it
const EXTRACTOR_TOP = 107;
const EXTRACTOR_BOTTOM = 150;
const EXTRACTOR_R = (EXTRACTOR_BOTTOM - EXTRACTOR_TOP) / 2;
const EXTRACTOR_CENTER: Point = [586.5, EXTRACTOR_TOP + EXTRACTOR_R];
const EXTRACTOR_SLOT =
  `M${fmt(on(EXTRACTOR_CENTER, EXTRACTOR_R, 270))} L${PORT_BACK},${EXTRACTOR_TOP} L${PORT_BACK},${EXTRACTOR_BOTTOM} ` +
  `L${fmt(on(EXTRACTOR_CENTER, EXTRACTOR_R, 90))} ${arc(EXTRACTOR_CENTER, EXTRACTOR_R, 90, 270)} Z`;
const EXTRACTOR = rounded(
  [
    [593, 112],
    [670, 112],
    [670, 146],
    [593, 146],
  ],
  [4, 0, 0, 4],
);
const EXTRACTOR_LIGHT =
  `M${fmt(on(EXTRACTOR_CENTER, EXTRACTOR_R - 4, 110))} ` +
  arc(EXTRACTOR_CENTER, EXTRACTOR_R - 4, 110, 200);

// ---------------------------------------------------------------------------------------------------------
// Details on the frame

/** x on a list of points (top to bottom) at height y, straight between them */
function xAt(points: readonly Point[], y: number): number {
  const sorted = [...points].sort((a, b) => a[1] - b[1]);
  if (y <= sorted[0][1]) return sorted[0][0];
  for (let i = 1; i < sorted.length; i++) {
    const [x0, y0] = sorted[i - 1];
    const [x1, y1] = sorted[i];
    if (y <= y1) return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
  }
  return sorted[sorted.length - 1][0];
}

// The slide stop lever (Gen 5's, ambidextrous), steel, with three grooves, over its recess in the frame
const SLIDE_STOP_RECESS = rounded(
  [
    [481, 294],
    [610, 294],
    [610, 323],
    [481, 323],
  ],
  [12, 12, 12, 12],
);
const SLIDE_STOP = rounded(
  [
    [508, 254],
    [583, 254],
    [583, 299],
    [508, 299],
  ],
  [8, 8, 8, 8],
);
const SLIDE_STOP_TAB = rounded(
  [
    [540, SLIDE_BOTTOM - 2],
    [590, SLIDE_BOTTOM - 2],
    [590, 256],
    [540, 256],
  ],
  [0, 0, 4, 4],
);
const SLIDE_STOP_GROOVES = [263, 274.5, 286]; // their middles
const SLIDE_STOP_GROOVE: [number, number] = [515, 577];

// The takedown lever, a slanted serrated steel tab, on a raised boss
const TAKEDOWN_BOSS_POINTS: Point[] = [
  [812, 280],
  [832, 262],
  [870, 255],
  [910, 262],
  [930, 285],
  [918, 318],
  [885, 338],
  [845, 348],
  [818, 336],
  [809, 308],
  [812, 280],
];
const TAKEDOWN_BOSS =
  `M${fmt(TAKEDOWN_BOSS_POINTS[0])} ` +
  smoothCurve(TAKEDOWN_BOSS_POINTS, [0.6, -1], [0.6, -1]) +
  " Z";
// Its corners: top back, top front, bottom front, bottom back
const TAKEDOWN_LEVER_CORNERS: Point[] = [
  [861, 268],
  [878, 274],
  [856, 332],
  [840, 327],
];
const TAKEDOWN_LEVER = rounded(TAKEDOWN_LEVER_CORNERS, [3, 3, 3, 3]);
const TAKEDOWN_RIDGES = 7;
function takedownRidges(): { dark: string; light: string } {
  const [a, b, c, d] = TAKEDOWN_LEVER_CORNERS;
  const dark: string[] = [];
  const light: string[] = [];
  for (let i = 1; i <= TAKEDOWN_RIDGES; i++) {
    const t = i / (TAKEDOWN_RIDGES + 1);
    const left: Point = [a[0] + (d[0] - a[0]) * t, a[1] + (d[1] - a[1]) * t];
    const right: Point = [b[0] + (c[0] - b[0]) * t, b[1] + (c[1] - b[1]) * t];
    dark.push(`M${fmt(left)} L${fmt(right)}`);
    light.push(
      `M${fmt([left[0], left[1] + 2.5])} L${fmt([right[0], right[1] + 2.5])}`,
    );
  }
  return { dark: dark.join(" "), light: light.join(" ") };
}

// Pins: the trigger pin, a ring round it in the frame; the trigger housing pin on its round boss
const TRIGGER_PIN: Point = [762, 322];
const HOUSING_PIN: Point = [281, 446];
const HOUSING_BOSS: Point = [283, 447];

// The backstrap's seam: round over the housing pin's boss, then down the grip, parallel to the back; and the arc
// under the boss
const SEAM: Point[] = [
  [268, 414],
  [292, 425],
  [305, 447],
  [299, 475],
  [284, 505],
  [262, 545],
  [242, 580],
  [214, 645],
  [185, 712],
  [160, 785],
  [137, 857],
  [132, 872],
];
const SEAM_PATH = `M${fmt(SEAM[0])} ` + smoothCurve(SEAM, [1, 0.3], [-0.35, 1]);
const SEAM_UNDER = "M256,462 C262,470 276,474 288,471 C294,469 298,466 301,462";

// The magazine release: the Gen 5's square button behind the guard, proud of the frame
const MAG_RELEASE_CORNERS: Point[] = [
  [524, 460],
  [598, 483],
  [591, 541],
  [508, 522],
];
const MAG_RELEASE = rounded(MAG_RELEASE_CORNERS, [5, 5, 5, 5]);
const MAG_RELEASE_SHADOW = rounded(
  MAG_RELEASE_CORNERS.map(([x, y]) => [x + 4, y + 5] as Point),
  [6, 6, 6, 6],
);
const [mrA, mrB, , mrD] = MAG_RELEASE_CORNERS;
const MAG_RELEASE_LIT = `M${fmt([mrD[0] + 1, mrD[1] - 6])} L${fmt([mrA[0] + 2, mrA[1] + 4])} L${fmt([mrB[0] - 6, mrB[1] + 1])}`;

// The thumb's place above the studs: a shallow trough across the grip under a soft ridge. A lens, shaded across
// (a crease along its top, lit below it, in shadow again over the studs), fading out at its top and bottom
const THUMB =
  "M300,420 C350,350 500,334 566,360 C560,430 520,484 330,486 C310,470 302,446 300,420 Z";
const THUMB_TOP = 345;
const THUMB_BOTTOM = 490;

// The grip's studs: a regular grid of small dark squares on the side panel, its columns down the grip's axis and
// its rows square to it, and columns of them along the back and front straps. They're scaled up from the real
// ones (16.5 px apart, 9 across) so they read at 128 px. Studs are only drawn whole, inside the panel's smooth
// borders.
const ROW: Point = GRIP.forward; // along a row, forward (and down, square to the grip's lean)
const COLUMN: Point = GRIP.down; // down a column, along the grip's lean
const STUD_ORIGIN: Point = GRIP.at(0, 580); // on the front strap's line
const DEFAULT_STUD_PITCH = 24;
const DEFAULT_STUD_SIZE = 11;
// The side panel's smooth borders: in front, a band along the front strap (PANEL_FRONT_CLEAR behind its line,
// square to it); behind, a strip in front of the backstrap's seam; above, the thumb's trough; below, the flared
// foot (PANEL_FOOT_CLEAR above the grip's base)
const PANEL_FRONT_CLEAR = 62;
const SEAM_CLEAR = 30;
const PANEL_TOP = 498;
const PANEL_FOOT_CLEAR = 64;
function inPanel([x, y]: Point): boolean {
  const across = (x - STUD_ORIGIN[0]) * ROW[0] + (y - STUD_ORIGIN[1]) * ROW[1];
  return (
    across <= -PANEL_FRONT_CLEAR &&
    x >= xAt(SEAM, y) + SEAM_CLEAR &&
    y >= PANEL_TOP &&
    y <= baseY(x) - PANEL_FOOT_CLEAR
  );
}
// Left smooth round the magazine release
const RELEASE_CLEAR: Point[] = [
  [518, 450],
  [610, 478],
  [602, 552],
  [496, 530],
];

function inside(p: Point, polygon: readonly Point[]): boolean {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (
      yi > p[1] !== yj > p[1] &&
      p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi
    ) {
      hit = !hit;
    }
  }
  return hit;
}

/** A square stud: its middle, its two axes, and its size */
function stud(c: Point, u: Point, v: Point, size: number): Point[] {
  const h = size / 2;
  return [
    [c[0] - u[0] * h - v[0] * h, c[1] - u[1] * h - v[1] * h],
    [c[0] + u[0] * h - v[0] * h, c[1] + u[1] * h - v[1] * h],
    [c[0] + u[0] * h + v[0] * h, c[1] + u[1] * h + v[1] * h],
    [c[0] - u[0] * h + v[0] * h, c[1] - u[1] * h + v[1] * h],
  ];
}
const studPath = (corners: Point[]) => "M" + corners.map(fmt).join(" L") + " Z";

/**
 * The side panel's field: the grid's studs wholly in the panel and clear of the release. Its front column's front
 * edges are on the panel's front border, so that edge is straight.
 */
function panelStuds(pitch: number, size: number): string[] {
  const out: string[] = [];
  const firstAcross = -PANEL_FRONT_CLEAR - size / 2;
  for (let i = 0; i <= 30; i++) {
    for (let j = -30; j <= 30; j++) {
      const across = firstAcross - i * pitch;
      const down = j * pitch;
      const c: Point = [
        STUD_ORIGIN[0] + ROW[0] * across + COLUMN[0] * down,
        STUD_ORIGIN[1] + ROW[1] * across + COLUMN[1] * down,
      ];
      const corners = stud(c, ROW, COLUMN, size);
      if (
        corners.every((p) => inPanel(p)) &&
        !corners.some((p) => inside(p, RELEASE_CLEAR))
      ) {
        out.push(studPath(corners));
      }
    }
  }
  return out;
}

/**
 * Columns of studs along a strap, `offsets` in from its edge (positive forward), squared to the strap's lean,
 * every `pitch` from `from` to `to`, alternate columns staggered by half a pitch
 */
function strapStuds(
  edge: readonly Point[],
  from: number,
  to: number,
  offsets: number[],
  pitch: number,
  size: number,
): string[] {
  const out: string[] = [];
  offsets.forEach((offset, k) => {
    for (let y = from + (k % 2) * (pitch / 2); y <= to; y += pitch) {
      const lean = (xAt(edge, y + 6) - xAt(edge, y - 6)) / 12;
      const length = Math.hypot(lean, 1);
      const down: Point = [lean / length, 1 / length];
      const forward: Point = [down[1], -down[0]];
      const c: Point = [
        xAt(edge, y) + forward[0] * offset,
        y + forward[1] * offset,
      ];
      out.push(studPath(stud(c, forward, down, size)));
    }
  });
  return out;
}

function studs(pitch: number, size: number): string {
  return [
    ...panelStuds(pitch, size),
    ...strapStuds(BACK_STRAP, 486, 810, [11, 11 + pitch * 0.85], pitch, size),
    ...strapStuds(FRONT_STRAP, 600, 880, [-10], pitch, size),
  ].join(" ");
}

// The dust cover's rail: a groove along it, lit along its lower lip
// The rail starts at a step (RAIL_BACK), forward of which its face, over the groove, is a separate, lighter band
const RAIL_BACK = 1150;
const RAIL_GROOVE = rounded(
  [
    [RAIL_BACK + 5, 296],
    [1428, 296],
    [1428, 304],
    [RAIL_BACK + 5, 304],
  ],
  [4, 0, 0, 4],
);
const RAIL_LIP = `M${RAIL_BACK + 8},306 L1426,306`;
const RAIL_FACE = rounded(
  [
    [RAIL_BACK + 3, 256],
    [1400, 256],
    [1400, 294],
    [RAIL_BACK + 3, 294],
  ],
  [0, 6, 0, 0],
);

// The trigger's safety blade, standing out of its face: down the trigger's front, round its own tip, and up its
// back edge
const BLADE_BACK: Point[] = [
  [817, 519],
  [806, 512],
  [794, 492],
  [784, 468],
  [776, 446],
  [772, 428],
];
const BLADE =
  `M${fmt(TRIGGER_FRONT[1])} ` +
  smoothCurve(TRIGGER_FRONT.slice(1), [0.05, 1], [0.5, 1]) +
  ` C835,514 827,520 ${fmt(BLADE_BACK[0])} ` +
  smoothCurve(BLADE_BACK, [-1, -0.6], [-0.15, -1]) +
  " Z";
const BLADE_GAP =
  `M${fmt(BLADE_BACK[0])} ` + smoothCurve(BLADE_BACK, [-1, -0.6], [-0.15, -1]);

// The guard opening's lit inner edge, along its front and bottom
const OPENING_BEVEL =
  `M${OPENING_FRONT},${OPENING_TOP_FRONT + 62} L${OPENING_FRONT},${OPENING_BOTTOM - 60} ` +
  `C${OPENING_FRONT},${OPENING_BOTTOM - 27} ${OPENING_FRONT - 27},${OPENING_BOTTOM} ${OPENING_FRONT - 60},${OPENING_BOTTOM} ` +
  `L${OPENING_BACK + 70},${OPENING_BOTTOM}`;
const GUARD_FRONT_LIT =
  `M${fmt(GUARD_FRONT[3])} ` +
  smoothCurve(GUARD_FRONT.slice(3), [-0.1, 1], [0.3, 1]);

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

// The rim light: the top edges (the slide's top, the tang's top and end, the back strap) catching the light, a
// line RIM_LIGHT px wide just inside the silhouette, stroked twice as wide along the edge and clipped to the part.
// It's what keeps the near-black gun from vanishing on a dark floor.
const RIM_LIGHT = 6; // 0.8 mm: at 2 px (0.27 mm) it was a fifth of a pixel at 128 px, and did nothing on a dark floor
const SLIDE_RIM =
  `M${SLIDE_BACK},${SLIDE_TOP + SLIDE_BACK_R} ` +
  `C${SLIDE_BACK},${SLIDE_TOP + 8} ${SLIDE_BACK + 8},${SLIDE_TOP} ${SLIDE_BACK + SLIDE_BACK_R},${SLIDE_TOP} ` +
  `L${SLIDE_FRONT - SLIDE_FRONT_R},${SLIDE_TOP} ` +
  `C${SLIDE_FRONT - 10},${SLIDE_TOP} ${SLIDE_FRONT},${SLIDE_TOP + 10} ${SLIDE_FRONT},${SLIDE_TOP + SLIDE_FRONT_R}`;
const TANG_RIM =
  `M${SLIDE_BACK + 6},${TANG_TOP} C${SLIDE_BACK - 4},${TANG_TOP} ${TANG_BACK + 2},${TANG_TOP + 4} ` +
  `${TANG_BACK},${TANG_TOP + 16} L${TANG_BACK},280`;

// The outline round the silhouette: OUTLINE_MM wide (the set's rule), in each part's own dark. Each part's shape
// is stroked twice as wide under everything, so the parts cover the inner half and every edge between parts, and
// only the outer half shows, round the outside (and round the guard's opening and the trigger in it)
const OUTLINE_MM = 0.4;
const OUTLINE = OUTLINE_MM / MM_PER_PX;
function outlines(S: Material, P: Material): string {
  const parts: [string, string][] = [
    [SLIDE, S.dark],
    [BARREL, S.dark],
    [sight(REAR_SIGHT), P.dark],
    [sight(FRONT_SIGHT), P.dark],
    [FRAME, P.dark],
    [GUARD, P.dark],
    [MAG_BASE, P.dark],
    [TRIGGER, P.dark],
    [TRIGGER_TAIL, P.dark],
    [BLADE, P.dark],
  ];
  return `<!-- The outline: each part's shape stroked under everything, so only its outer half shows -->
  <g id="glock-outline" fill="none" stroke-width="${f1(OUTLINE * 2)}">
    ${parts.map(([d, color]) => `<path d="${d}" stroke="${color}"/>`).join("\n    ")}
  </g>`;
}

function drawSide(options: GlockOptions = {}): string {
  const S: Material = { ...BLACK_NITRIDE, ...options.slide };
  const P: Material = { ...BLACK_POLYMER, ...options.frame };
  const rim = options.rimLight ?? RIM_LIGHT;
  const studPath = studs(
    options.studPitch ?? DEFAULT_STUD_PITCH,
    options.studSize ?? DEFAULT_STUD_SIZE,
  );
  const ridges = takedownRidges();
  const serrations = [
    ...serrationXs(REAR_SERRATIONS),
    ...serrationXs(FRONT_SERRATIONS),
  ];
  const backStrapLit =
    `M${fmt(BACK_STRAP[5])} ` +
    smoothCurve(BACK_STRAP.slice(5), [-0.15, 1], [-0.15, 1]);
  const backStrapRim = backStrapLit;
  const frontStrapShade =
    `M${fmt(FRONT_STRAP[0])} ` +
    smoothCurve(FRONT_STRAP, [0, -1], [-GRIP.down[0], -GRIP.down[1]]);
  const rimPath = `M${fmt(RIM[0])} ` + smoothCurve(RIM, [0.3, -1], [1, 0.15]);
  const dustCoverShade =
    `M${fmt(DUST_COVER_BOTTOM[0])} ` +
    smoothCurve(DUST_COVER_BOTTOM, [1, 0], [1, -0.08]) +
    " C1420,339 1440,330 1442,308";
  const baseLit = `M${fmt([80, baseY(80) - 30])} L${fmt([FRONT_FOOT_X, baseY(FRONT_FOOT_X) - 30])}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1051" viewBox="0 0 1500 1051" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  <defs>
    <!-- The slide, down its side: the lit top chamfer, the dark crease under it, then the side, darker toward
         its bottom -->
    <linearGradient id="glock-slide-shading" gradientUnits="userSpaceOnUse" x1="0" y1="${SLIDE_TOP}" x2="0" y2="${SLIDE_BOTTOM}">
${stops([0, S.highlight], [0.05, S.light], [0.08, S.base], [0.095, S.dark], [0.125, S.dark], [0.145, S.light], [0.55, S.base], [1, mix(S.base, S.dark, 0.45)])}
    </linearGradient>
    <linearGradient id="glock-hood-shading" gradientUnits="userSpaceOnUse" x1="0" y1="${SLIDE_TOP + 2}" x2="0" y2="${HOOD_BOTTOM}">
${stops([0, S.highlight], [0.08, S.light], [0.5, mix(S.base, S.light, 0.5)], [1, S.base])}
    </linearGradient>
    <linearGradient id="glock-barrel-shading" gradientUnits="userSpaceOnUse" x1="0" y1="${BARREL_TOP}" x2="0" y2="${BARREL_BOTTOM}">
${stops([0, S.dark], [0.1, S.light], [0.18, S.highlight], [0.3, S.base], [1, S.dark])}
    </linearGradient>
    <!-- The frame's upper part: in the slide's shadow just under it, lit along its top edge, then its face -->
    <linearGradient id="glock-frame-top" gradientUnits="userSpaceOnUse" x1="0" y1="${FRAME_TOP}" x2="0" y2="330">
${stops([0, P.dark], [0.12, P.dark], [0.22, P.light], [0.6, P.base])}
    </linearGradient>
    <linearGradient id="glock-lever-shading" gradientUnits="userSpaceOnUse" x1="0" y1="254" x2="0" y2="299">
${stops([0, S.highlight], [0.15, S.light], [1, S.base])}
    </linearGradient>
    <linearGradient id="glock-boss-shading" gradientUnits="userSpaceOnUse" x1="820" y1="335" x2="905" y2="262">
${stops([0, mix(P.base, P.dark, 0.5)], [0.5, P.base], [1, P.light])}
    </linearGradient>
    <linearGradient id="glock-release-shading" gradientUnits="userSpaceOnUse" x1="520" y1="465" x2="590" y2="535">
${stops([0, P.light], [1, P.base])}
    </linearGradient>
    <linearGradient id="glock-magazine-shading" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(baseY(300))}" x2="0" y2="${f1(baseY(300) + MAG_THICK)}">
${stops([0, P.dark], [0.2, P.light], [0.45, P.base], [1, P.dark])}
    </linearGradient>
    <linearGradient id="glock-thumb-shading" gradientUnits="userSpaceOnUse" x1="0" y1="${THUMB_TOP}" x2="0" y2="${THUMB_BOTTOM}">
${stops([0, P.dark, 0], [0.18, P.dark, 0.55], [0.36, P.base, 0], [0.5, P.light, 0.5], [0.66, P.base, 0], [0.82, P.dark, 0.35], [1, P.dark, 0])}
    </linearGradient>
    <clipPath id="glock-slide-clip">
      <path d="${SLIDE}"/>
    </clipPath>
    <clipPath id="glock-frame-clip">
      <path d="${FRAME}"/>
    </clipPath>
    <clipPath id="glock-guard-clip">
      <path d="${GUARD}" clip-rule="evenodd"/>
    </clipPath>
  </defs>
  ${options.outline === false ? "" : outlines(S, P)}
  <!-- The barrel's crown, out of the slide's front -->
  <g id="glock-barrel">
    <path d="${BARREL}" fill="url(#glock-barrel-shading)"/>
  </g>
  <!-- Behind the frame, seen through the guard's opening: the trigger's shoe and tail, and the safety blade
       standing out of its face, lighter -->
  <g id="glock-trigger">
    <path d="${TRIGGER_TAIL}" fill="${P.light}"/>
    <path d="${TRIGGER}" fill="${mix(P.base, P.light, 0.5)}"/>
    <path d="${BLADE}" fill="${mix(P.light, P.highlight, 0.5)}"/>
    <path d="${BLADE_GAP}" stroke="${P.dark}" stroke-width="3" fill="none"/>
    <path d="M${fmt(TRIGGER_FRONT[2])} ${smoothCurve(TRIGGER_FRONT.slice(2), [0.4, 1], [0.5, 1])}" stroke="${P.highlight}" stroke-width="3" fill="none"/>
  </g>
  <!-- The guard's ring, on the lower plane under the frame's face: in the face's shadow along its top, lit round
       the opening's front and bottom and down its front -->
  <g id="glock-trigger-guard">
    <path d="${GUARD}" fill="${P.base}"/>
    <g clip-path="url(#glock-guard-clip)" fill="none">
      <path d="${rimPath}" stroke="${P.dark}" stroke-width="22"/>
      <path d="${OPENING_BEVEL}" stroke="${P.light}" stroke-width="9"/>
      <path d="${GUARD_FRONT_LIT}" stroke="${P.light}" stroke-width="7"/>
    </g>
  </g>
  <!-- The magazine's base plate, proud of the grip's base, in a dark seam under it -->
  <g id="glock-magazine">
    <path d="${MAG_BASE}" fill="url(#glock-magazine-shading)"/>
  </g>
  <!-- The frame: the tang, the face over the trigger, the dust cover and the grip, one molding -->
  <g id="glock-frame">
    <path d="${FRAME}" fill="${P.base}"/>
    <g clip-path="url(#glock-frame-clip)" fill="none">
      <rect x="100" y="${FRAME_TOP}" width="${DUST_COVER_FRONT - 100}" height="${330 - FRAME_TOP}" fill="url(#glock-frame-top)"/>
      <!-- The dust cover's underside, rounding away; the grip's lit back strap, its front strap rounding away,
           and its flared foot, lit -->
      <path d="${dustCoverShade}" stroke="${P.dark}" stroke-width="20" opacity="0.7"/>
      <path d="${backStrapLit}" stroke="${P.light}" stroke-width="18" opacity="0.8"/>
      <path d="${frontStrapShade}" stroke="${P.dark}" stroke-width="44" opacity="0.55"/>
      <path d="${baseLit}" stroke="${P.light}" stroke-width="28" opacity="0.35"/>
      <!-- The frame's front, a little darker as it rounds off -->
      <rect x="1418" y="${FRAME_TOP}" width="30" height="120" fill="${P.dark}" opacity="0.3"/>
      <!-- The thumb's trough above the studs -->
      <path d="${THUMB}" fill="url(#glock-thumb-shading)"/>
      <!-- The rim light: the top edges catching the light, a thin line just inside the silhouette (the tang's
           top and end, and down the back strap), so the gun holds on a dark floor -->
      <path d="${TANG_RIM} ${backStrapRim}" stroke="${P.highlight}" stroke-width="${rim * 2}"/>
    </g>
    <!-- The rail: a step where it starts, its lighter face, the groove along it and its lit lower lip -->
    <path d="${RAIL_FACE}" fill="${P.light}" opacity="0.3"/>
    <path d="M${RAIL_BACK - 4},252 L${RAIL_BACK - 4},340" stroke="${P.dark}" stroke-width="7" fill="none" opacity="0.6" clip-path="url(#glock-frame-clip)"/>
    <path d="M${RAIL_BACK + 1},256 L${RAIL_BACK + 1},336" stroke="${P.light}" stroke-width="2.5" fill="none" opacity="0.6"/>
    <path d="${RAIL_GROOVE}" fill="${P.dark}"/>
    <path d="${RAIL_LIP}" stroke="${P.light}" stroke-width="3" fill="none"/>
    <!-- The grip's studs, and the backstrap's seam -->
    <path id="glock-studs" d="${studPath}" fill="${P.dark}" clip-path="url(#glock-frame-clip)"/>
    <path id="glock-seam" d="${SEAM_PATH} ${SEAM_UNDER}" stroke="${P.dark}" stroke-width="3" fill="none"/>
    <!-- The trigger housing pin's round boss, and the pin -->
    <circle cx="${HOUSING_BOSS[0]}" cy="${HOUSING_BOSS[1]}" r="22" fill="${P.light}" opacity="0.35"/>
    <circle cx="${HOUSING_PIN[0]}" cy="${HOUSING_PIN[1]}" r="11.5" fill="${P.dark}"/>
    <circle cx="${HOUSING_PIN[0]}" cy="${HOUSING_PIN[1]}" r="9" fill="${S.light}"/>
    <!-- The takedown lever's boss -->
    <path d="${TAKEDOWN_BOSS}" fill="url(#glock-boss-shading)"/>
  </g>
  <!-- The magazine release, proud of the frame: its shadow, then the button, lit along its top and back -->
  <g id="glock-magazine-release">
    <path d="${MAG_RELEASE_SHADOW}" fill="${P.dark}" opacity="0.85"/>
    <path d="${MAG_RELEASE}" fill="url(#glock-release-shading)" stroke="${P.dark}" stroke-width="2.5"/>
    <path d="${MAG_RELEASE_LIT}" stroke="${P.highlight}" stroke-width="3" fill="none"/>
  </g>
  <!-- The slide stop lever, steel, over its recess -->
  <g id="glock-slide-stop">
    <path d="${SLIDE_STOP_RECESS}" fill="${P.dark}" opacity="0.65"/>
    <path d="M490,321 L601,321" stroke="${P.light}" stroke-width="3" fill="none" opacity="0.7"/>
    <path d="${SLIDE_STOP_TAB}" fill="${S.dark}"/>
    <path d="${SLIDE_STOP}" fill="url(#glock-lever-shading)" stroke="${S.dark}" stroke-width="3"/>
    ${SLIDE_STOP_GROOVES.map((y) => `<path d="M${SLIDE_STOP_GROOVE[0]},${y} L${SLIDE_STOP_GROOVE[1]},${y}" stroke="${S.dark}" stroke-width="3.5" fill="none"/>`).join("\n    ")}
  </g>
  <!-- The takedown lever, steel, serrated -->
  <g id="glock-takedown">
    <path d="${TAKEDOWN_LEVER}" fill="${S.base}" stroke="${S.dark}" stroke-width="2.5"/>
    <path d="${ridges.dark}" stroke="${S.dark}" stroke-width="2.5" fill="none"/>
    <path d="${ridges.light}" stroke="${S.highlight}" stroke-width="1.5" fill="none" opacity="0.7"/>
  </g>
  <!-- The trigger pin, in its ring -->
  <g id="glock-pins">
    <circle cx="${TRIGGER_PIN[0]}" cy="${TRIGGER_PIN[1]}" r="17" fill="${P.dark}"/>
    <circle cx="${TRIGGER_PIN[0]}" cy="${TRIGGER_PIN[1]}" r="11.5" fill="${S.light}"/>
    <path d="M${fmt(on(TRIGGER_PIN, 8, 200))} ${arc(TRIGGER_PIN, 8, 200, 290)}" stroke="${S.highlight}" stroke-width="2.5" fill="none"/>
  </g>
  <g id="glock-slide">
    <path d="${SLIDE}" fill="url(#glock-slide-shading)"/>
    <g clip-path="url(#glock-slide-clip)">
      <!-- The back face's chamfer, and the nose's chamfered side, both turned away from the light -->
      <rect x="${SLIDE_BACK}" y="${SLIDE_TOP}" width="${BACK_CHAMFER}" height="${SLIDE_BOTTOM - SLIDE_TOP}" fill="${S.dark}" opacity="0.6"/>
      <path d="${NOSE}" fill="${S.dark}" opacity="0.55"/>
      <path d="M${NOSE_BACK},104 L${NOSE_BACK},${SLIDE_BOTTOM - 2}" stroke="${S.light}" stroke-width="2" fill="none" opacity="0.5"/>
      <!-- Grooves to grip it by, at both ends, their front walls lit -->
      <g id="glock-serrations">
        ${serrations.map((x) => `<path d="${serrationCut(x)}" fill="${S.dark}"/>`).join("\n        ")}
        ${serrations.map((x) => `<rect x="${f1(x + SERRATION_WIDTH - 3)}" y="${SERRATION_TOP + 8}" width="3" height="${SLIDE_BOTTOM - SERRATION_TOP - 8}" fill="${S.light}" opacity="0.7"/>`).join("\n        ")}
      </g>
      <!-- The extractor's slot, the extractor in it -->
      <path d="${EXTRACTOR_SLOT}" fill="#0e0f11"/>
      <path d="${EXTRACTOR}" fill="${S.base}"/>
      <path d="M670,112 L692,112 L692,146 L670,146 Z" fill="${S.dark}"/>
      <path d="${EXTRACTOR_LIGHT}" stroke="${S.light}" stroke-width="3" fill="none"/>
      <!-- The ejection port: its dark depths, the barrel's hood in it, and its cut edge catching the light -->
      <path id="glock-port" d="${PORT}" fill="#0e0f11"/>
      <path id="glock-hood" d="${HOOD}" fill="url(#glock-hood-shading)"/>
      <path d="${PORT_EDGE}" stroke="${S.highlight}" stroke-width="3" fill="none"/>
      <!-- The rim light along its top, just inside the edge -->
      <path d="${SLIDE_RIM}" stroke="${S.highlight}" stroke-width="${rim * 2}" fill="none"/>
      <!-- Its bottom edge, a dark seam over the frame -->
      <path d="M${SLIDE_BACK},${SLIDE_BOTTOM - 2} L${SLIDE_FRONT},${SLIDE_BOTTOM - 2}" stroke="${S.dark}" stroke-width="4" fill="none"/>
    </g>
    <!-- Black polymer sights, lit along their tops -->
    <path id="glock-rear-sight" d="${sight(REAR_SIGHT)}" fill="${P.dark}"/>
    <path d="M${REAR_SIGHT.top[0] + 2},${REAR_SIGHT.height + 1.5} L${REAR_SIGHT.top[1] - 2},${REAR_SIGHT.height + 1.5}" stroke="${P.highlight}" stroke-width="3" fill="none"/>
    <path id="glock-front-sight" d="${sight(FRONT_SIGHT)}" fill="${P.dark}"/>
    <path d="M${FRONT_SIGHT.top[0] + 2},${FRONT_SIGHT.height + 1.5} L${FRONT_SIGHT.top[1] - 2},${FRONT_SIGHT.height + 1.5}" stroke="${P.highlight}" stroke-width="3" fill="none"/>
  </g>
</svg>`;
}

export const GLOCK: GunDrawing<GlockOptions> = {
  name: "glock",
  draft: true,
  photo: {
    file: "glock-19.webp",
    width: 1500,
    height: 1051,
    about:
      "A Gen 5 Glock 19 from its right side, muzzle to the right, on white, evenly lit",
  },
  otherPhotos: [
    {
      file: "glock-19-alternate.jpg",
      width: 776,
      height: 776,
      about:
        "From behind and a little above (a MOS model, with an optic plate): the widths of the slide, frame and grip, the rear sight",
    },
  ],
  // The origin halfway along the gun (the grip's heel to the barrel's crown) on the bore, and Glock's 185 mm
  // over the 1393 px they're apart (see the top of the file)
  scale: { origin: ORIGIN, mmPerPixel: MM_PER_PX },
  frame: {
    // The front sight's top, the magazine's base, the grip's heel, the barrel's crown; the square 192 mm, about
    // 4% more than its 185 mm length, as the M1911's 224 for 216
    top: 41,
    bottom: 995,
    back: 63,
    front: CROWN_FRONT,
    side: 192,
    pixels: 256,
  },
  comment: `
  <!-- The Glock 19 (Gen 5) from its right side, muzzle to the right. Millimeters, with the origin on the gun's
       middle on the bore, as the guns' top views in weapons/guns/art/ have it. -->`,
  drawSide,
};
