/**
 * The Glock 19 from its right side: a Glock 19 (Gen 5), black polymer frame, black slide. Drawn in the pixels of its photo
 * (1500 by 1051) by named numbers, following the gun-art skill (.claude/skills/gun-art/SKILL.md), with
 * guns/m1911.ts as the worked example. A draft until it goes into the game.
 *
 * Round 1: construction notes and a blockout (the main silhouettes in flat colors, measured). No shading or
 * detail yet.
 */
import type { Point } from "../lib/geometry";
import { fmt, rounded, SlantedAxis, smoothCurve } from "../lib/geometry";
import type { GunDrawing } from "../lib/gun";
import { BLACK_POLYMER, BLUED_STEEL } from "../lib/style";

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
//     into the frame below it (x 485 to 610, y 288 to 322); the takedown lever, a slanted serrated tab (x 830
//     to 900, y 265 to 335) on a raised oval boss; and the trigger pin (a circle, centre 775,323, r 17). The
//     trigger housing pin is at the top of the backstrap (centre 268,445, r 15), and the backstrap's seam hooks
//     round it.
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
//     AUSTRIA"; x 205 to 390, y 745 to 830) and the smooth flared foot. At 128 px the studs are a pixel or two:
//     the panel should read as a slightly different tone (or a faint fine grid) inside a smooth border, not as
//     studs; the plate's lettering goes, the plate itself might stay as a smooth patch.
//   - The magazine catch: on the left side, but its end shows on this side as a square, square to the grip
//     (x 490 to 570, y 463 to 540). Survives as a square.
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
];
const TRIGGER =
  `M${fmt(TRIGGER_FRONT[0])} ` +
  smoothCurve(TRIGGER_FRONT, [0, 1], [0.5, 1]) +
  // The tip, a round end
  ` C835,516 822,528 ${fmt(TRIGGER_BACK[0])} ` +
  smoothCurve(TRIGGER_BACK, [-1, -0.4], [-0.3, -1]) +
  // Its tail, slanting back up into the frame
  " L692,447 L668,438 L667,414 L690,360 Z";

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

// Flat colors for the blockout
const SLIDE_COLOR = BLUED_STEEL.base;
const FRAME_COLOR = BLACK_POLYMER.base;
const GUARD_COLOR = BLACK_POLYMER.dark;

function drawSide(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1051" viewBox="0 0 1500 1051" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  <!-- The barrel's crown, out of the slide's front -->
  <g id="glock-barrel">
    <path d="${BARREL}" fill="${BLUED_STEEL.dark}"/>
  </g>
  <!-- Behind the frame, seen through the guard's opening -->
  <g id="glock-trigger">
    <path d="${TRIGGER}" fill="${BLACK_POLYMER.light}"/>
  </g>
  <!-- The guard's ring, on the lower plane under the frame's face -->
  <g id="glock-trigger-guard">
    <path d="${GUARD}" fill="${GUARD_COLOR}"/>
  </g>
  <!-- The magazine's base plate, proud of the grip's base -->
  <g id="glock-magazine">
    <path d="${MAG_BASE}" fill="${GUARD_COLOR}"/>
  </g>
  <!-- The frame: the tang, the face over the trigger, the dust cover and the grip, one molding -->
  <g id="glock-frame">
    <path d="${FRAME}" fill="${FRAME_COLOR}"/>
  </g>
  <g id="glock-slide">
    <path d="${SLIDE}" fill="${SLIDE_COLOR}"/>
    <path id="glock-port" d="${PORT}" fill="${BLUED_STEEL.dark}"/>
    <path id="glock-rear-sight" d="${sight(REAR_SIGHT)}" fill="${BLUED_STEEL.dark}"/>
    <path id="glock-front-sight" d="${sight(FRONT_SIGHT)}" fill="${BLUED_STEEL.dark}"/>
  </g>
</svg>`;
}

export const GLOCK: GunDrawing = {
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
