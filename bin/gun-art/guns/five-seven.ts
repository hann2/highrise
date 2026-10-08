/**
 * The Five-seven from its right side: an FN Five-seven MK3 (MRD), flat dark earth frame and slide. Drawn in the pixels of its photo
 * (2560 by 1967) by named numbers, following the gun-art skill (.claude/skills/gun-art/SKILL.md), with
 * guns/m1911.ts as the worked example. A draft until it goes into the game.
 *
 * Round 1 is a blockout: the main silhouettes as their own shapes in drawing order, flat colors, measured
 * (`measure runs`/`edges`: the numbers below are the photo's, read off those, not by eye).
 *
 * HOW IT'S BUILT (the construction pass, from the three photos)
 *
 * Two assemblies, the slide over the frame, meeting along one straight seam (SLIDE_BOTTOM/FRAME_TOP, a dark
 * gap of about 7 px). Both are FDE polymer-looking: the frame is polymer, the slide is steel finished FDE; in
 * the photos they're the same color, the slide a touch smoother.
 *
 * The slide (y 306 to 543), a box with faceted ends:
 * - Its top is flat the whole way (306; over the ejection port about 4 px lower, the port wrapping round the
 *   top corner a little, too little to draw). Its back-top corner is a rounded chamfer (REAR_CHAMFER), its rear
 *   face leans forward going up (149 at the bottom, 167 at 400). Its nose is the same: a rounded chamfer from the
 *   top into a front face that leans back going down (2463 to 2446).
 * - Its side is on two planes, the step a long line: behind the ejection port the side is flat from top to
 *   bottom; ahead of it, the upper part (the top slab, down to about y 405) is the full width and everything
 *   below is set in, the step sweeping up from the port's front bottom corner (1575,445) to 405 by about
 *   x 1700 and then running straight to the nose. That step is the MK3's look; it must survive at 128 px.
 * - Rear serrations: slanted grooves (tops leaning forward) across the whole side, from the optic cut to
 *   the back, behind a scooped finger pocket at the very back (x 200 to 300, y 330 to 480).
 *   Front serrations: five slanted notches cut down from the step into the lower plane (x 1650 to 2350),
 *   each a stair: a short flat at the step, then a slanted cut to the slide's bottom. At 128 px the
 *   serrations are a few pixels each: draw them as plain dark/light pairs, maybe fewer, in round 2.
 * - The optic cut (MRD): a pocket in the slide's top from x 515 to 1045, about 44 px deep. The photo has a red
 *   dot on an adapter plate in it; we draw the cover plate instead. In the photo without an optic
 *   (alternate-2) the cover plate is flush with the slide's top, FDE like the slide, with two screws on top
 *   (seen only from above) and a thin seam at each end; at its front it meets the slide's raised section
 *   round the port at a small angled step. So in side view it's the slide's own top line, with a seam at
 *   each end of the pocket and the plate's bottom edge as a faint line. Drawn as its own shape (COVER).
 * - The rear sight is on the slide behind the cut (in both photos): black steel, a block whose top slopes
 *   down to the front, its back the windage screw's rounded head overhanging the slide.
 *   The front sight is a black blade at the nose, its back leaning, its top falling a little to the front.
 * - The ejection port: a rounded rectangle (1127 to 1569, 335 to 447). In it, the barrel: the chamber (bright
 *   steel, marked "5.7x28") from the port's back to about 1340, the barrel ahead of it darker; above the
 *   barrel, the dark inside of the slide (335 to 368).
 *
 * The frame (polymer), on two planes too:
 * - The upper part, under the slide (550 down to about 690 at the back, 676 at the dust cover's front), is a
 *   flat face: the pins, the slide stop (a black round pivot and a black ridged lever, with a small FDE
 *   plate round its pin and the red indicator dot), a shallow recessed rectangle (616 to 1072, 552 to 672,
 *   a marking panel), a small slot (734 to 784, 722 to 732).
 * - Under the dust cover's front, the rail: a lower, set-in plane (1690 to 2300, down to 768), with the
 *   steel serial plate (1780 to 2120, 685 to 735) on it and the rail's lugs below it (five slots, 110 px
 *   apart: RAIL_SLOTS). The dust cover's front face ends at 676; the rail's front is set back to 2302.
 * - The grip is wider than the frame's upper part, so where they meet there's a ledge: from the beavertail's
 *   top (y 685 at the back) along to about x 380, then angling down to the stippled panel's top corner. The
 *   beavertail is the frame's (no separate grip safety), its underside nearly straight (150,787) to
 *   (310,842), then curving into the back of the grip at its deepest (367, 940).
 * - The grip leans back by about 0.235 x per y (GRIP_LEAN): the front strap, the stippled panels and the
 *   magazine release are all square to it. Its side (from the photos, three textures, which
 *   can't all survive at 128 px):
 *   - two stippled panels (FDE, rough texture), the upper one above the thumb rest (470 to 940, 745 to 905)
 *     and the big lower one with the FN logo (about 300 to 780, 1110 to 1800), both standing a hair proud
 *     of the grip with a crisp edge: keep their outlines and a flat darker fill with a few speckles;
 *   - the backstrap and the front strap: horizontal grooves (ridges stand out of the silhouette by about 6 px;
 *     the silhouette here is the ridges' envelope) and columns of small pyramids beside them: keep the grooves
 *     as short dark lines, lose the pyramids (or a faint column of dots);
 *   - a sculpted thumb rest between the panels: smooth, shaded only.
 * - The trigger guard is square-ish: a front that leans back like the grip (with grooves on its front face),
 *   a bottom that falls to the back (0.115), and a fillet up into the front strap under the magazine release.
 *   The opening is its own shape (a hole in the frame): its top is the frame's bottom, a chamfer at its top
 *   front corner, a rounded bottom front corner, its back the front strap under the trigger.
 * - The magazine release is a black button standing proud of the grip's front, in front of the thumb rest,
 *   a rounded rectangle square to the grip.
 * - The trigger is black, behind the frame (its top goes up into it) and seen through the guard: a curved
 *   blade with a hooked toe.
 * - The magazine's base is black polymer, flush with the grip's back, its front a lip ahead of the front strap
 *   to pull it out by; the frame's bottom is cut away at the front (a diagonal step up from y 1830 to 1750)
 *   so more of the base shows there. The base's bottom is flat at the back and slants up to the front.
 *
 * At 128 px (2.0 mm a pixel, about 22 photo px a pickup pixel): the slide's two planes and its front
 * notches, the port and barrel, the cover plate's seams, the sights, the slide stop, the rail's slots, the
 * grip's stippled panels as shapes, the magazine release and base, the trigger. Too small: the markings,
 * the pins (perhaps one or two dark dots), the pyramids, the serial plate's digits, the texture itself.
 */
import type { Point } from "../lib/geometry";
import { fmt, rounded, smoothCurve } from "../lib/geometry";
import type { GunDrawing } from "../lib/gun";
import {
  BLACK_POLYMER,
  BLUED_STEEL,
  FDE,
  POLISHED_BARREL,
} from "../lib/style";

// ---------------------------------------------------------------------------------------------------------
// The slide

const SLIDE_TOP = 306;
const SLIDE_BOTTOM = 543;
const FRAME_TOP = 550; // the seam between them is the gap from SLIDE_BOTTOM to here
// Its back: a rounded chamfer from the top into the rear face, which leans forward going up
const SLIDE_BACK_TOP = 222; // where the top starts curving down
const SLIDE_BACK_BOTTOM = 149;
const REAR_CHAMFER: Point[] = [
  [167, 400],
  [170, 380],
  [179, 360],
  [192, 340],
  [205, 320],
  [SLIDE_BACK_TOP, SLIDE_TOP],
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

const SLIDE =
  `M${SLIDE_BACK_TOP},${SLIDE_TOP} L${NOSE_TOP},${SLIDE_TOP} ` +
  `${smoothCurve(NOSE_CHAMFER, [1, 0], [-17, 165])} ` +
  `L${SLIDE_FRONT_BOTTOM},${SLIDE_BOTTOM} L${SLIDE_BACK_BOTTOM},${SLIDE_BOTTOM} L${fmt(REAR_CHAMFER[0])} ` +
  `${smoothCurve(REAR_CHAMFER, [18, -143], [1, 0])} Z`;

// The step between the slide's upper slab and its set-in lower plane, ahead of the port: up from the port's
// front bottom corner, then straight to the nose
const STEP_Y = 405;
const STEP: Point[] = [
  [1575, 446],
  [1625, 425],
  [1700, STEP_Y],
];
const LOWER_PLANE =
  `M${fmt(STEP[0])} ${smoothCurve(STEP, [1, -0.5], [1, 0])} L2457,${STEP_Y} ` +
  `L${SLIDE_FRONT_BOTTOM},${SLIDE_BOTTOM} L1575,${SLIDE_BOTTOM} Z`;

// The optic cut, filled by the cover plate, flush with the top
const CUT_BACK = 515;
const CUT_FRONT = 1045;
const CUT_FLOOR = 350;
const COVER = rounded(
  [
    [CUT_BACK, SLIDE_TOP],
    [CUT_FRONT, SLIDE_TOP],
    [CUT_FRONT, CUT_FLOOR],
    [CUT_BACK, CUT_FLOOR],
  ],
  [0, 0, 4, 4],
);

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
  [14, 10, 10, 18],
);
const BARREL_TOP = 368; // above it, the dark inside of the slide
const CHAMBER_FRONT = 1340; // where the bright chamber gives way to the darker barrel

// The sights, black steel: the rear one on the slide behind the cut, its back the windage screw's head
// overhanging the slide; the front one a blade at the nose
const REAR_SIGHT =
  `M232,276 C226,262 225,246 228,232 C232,214 240,202 252,199 L300,203 ` +
  `${smoothCurve(
    [
      [300, 203],
      [380, 230],
      [450, 247],
    ],
    [1, 0.1],
    [1, 0.25],
  )} ` +
  "C462,250 472,262 478,280 L484,300 L488,307 L310,307 L306,284 L232,276 Z";
const FRONT_SIGHT =
  "M2228,307 L2244,256 C2249,232 2256,212 2268,207 C2276,205 2290,207 2300,212 L2355,230 " +
  "C2366,234 2372,246 2372,262 L2372,307 Z";

// ---------------------------------------------------------------------------------------------------------
// The frame: one outline round the upper part, the dust cover and rail, the trigger guard, and the grip,
// with the guard's opening a hole in it

const GRIP_LEAN = -0.235; // x per y down the grip: its front strap, panels and magazine release
void GRIP_LEAN;

// The dust cover's front face, leaning back going down, then the rail set back under it, its lugs between
// slots, and the frame's bottom back to the guard
const DUST_COVER_BOTTOM = 676;
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
const FRAME_FOOT = `L780,1740 L620,1745 L520,1748 C500,1749 488,1752 478,1757 L420,1805 C412,1815 408,1824 400,1830 L140,1830`;
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
// The frame's back, above the beavertail: the ledge where the grip's top meets the upper part, then the
// upper part's back leaning forward going up
const FRAME_BACK = "L131,720 L135,700 L141,690 L139,684 L141,640 L145,600 L151,FRAME_TOP".replace(
  "FRAME_TOP",
  String(FRAME_TOP),
);

const FRAME_OUTLINE =
  `M151,${FRAME_TOP} L2446,${FRAME_TOP} L2430,630 C2425,655 2422,668 2412,676 L${RAIL_FRONT},${DUST_COVER_BOTTOM} ` +
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
const OPENING =
  `M1035,818 L1150,818 L1180,799 L1478,799 C1500,812 1525,832 1545,855 ` +
  `${smoothCurve(OPENING_FRONT, [-0.2, 1], [-1, 0.1])} L1440,1049 ` +
  `${smoothCurve(OPENING_BOTTOM, [-1, 0.114], [0.1, -1])} ` +
  "L986,900 C992,872 996,860 999,850 C1006,834 1018,822 1035,818 Z";

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

// The magazine release, black, proud of the grip in front of the thumb rest, square to the grip
const MAG_RELEASE = rounded(
  [
    [838, 1017],
    [978, 1048],
    [983, 1110],
    [835, 1102],
  ],
  [12, 12, 10, 10],
);

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

// ---------------------------------------------------------------------------------------------------------

const F = FDE;

function drawSide(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2560" height="1967" viewBox="0 0 2560 1967" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  <!-- The blockout (round 1): silhouettes in flat colors, in drawing order -->
  <!-- Black polymer, under the frame's foot -->
  <path id="five-seven-magazine-base" d="${MAG_BASE}" fill="${BLACK_POLYMER.base}"/>
  <!-- Behind the frame, seen through the guard -->
  <path id="five-seven-trigger" d="${TRIGGER}" fill="${BLACK_POLYMER.dark}"/>
  <!-- The seam between slide and frame: the frame's top, in shadow -->
  <rect id="five-seven-seam" x="150" y="${SLIDE_BOTTOM - 4}" width="2296" height="${FRAME_TOP - SLIDE_BOTTOM + 8}" fill="${F.dark}"/>
  <g id="five-seven-frame">
    <path d="${FRAME_OUTLINE} ${OPENING}" fill="${F.base}"/>
  </g>
  <path id="five-seven-magazine-release" d="${MAG_RELEASE}" fill="${BLACK_POLYMER.base}"/>
  <g id="five-seven-slide">
    <path d="${SLIDE}" fill="${F.light}"/>
    <!-- Set in below the step, ahead of the port -->
    <path id="five-seven-lower-plane" d="${LOWER_PLANE}" fill="${F.base}"/>
    <!-- The optic cut's cover plate, flush with the top -->
    <path id="five-seven-cover-plate" d="${COVER}" fill="${F.light}" stroke="${F.dark}" stroke-width="3"/>
    <!-- The ejection port: the dark inside of the slide above the barrel, the bright chamber, the barrel -->
    <path id="five-seven-port" d="${PORT}" fill="${BLUED_STEEL.dark}"/>
    <rect id="five-seven-chamber" x="${PORT_BACK + 4}" y="${BARREL_TOP}" width="${CHAMBER_FRONT - PORT_BACK - 4}" height="${PORT_BOTTOM - BARREL_TOP}" fill="${POLISHED_BARREL.base}"/>
    <rect id="five-seven-barrel" x="${CHAMBER_FRONT}" y="${BARREL_TOP}" width="${PORT_FRONT - CHAMBER_FRONT - 4}" height="${PORT_BOTTOM - BARREL_TOP}" fill="${BLUED_STEEL.base}"/>
    <path id="five-seven-rear-sight" d="${REAR_SIGHT}" fill="${BLUED_STEEL.dark}"/>
    <path id="five-seven-front-sight" d="${FRONT_SIGHT}" fill="${BLUED_STEEL.dark}"/>
  </g>
</svg>`;
}

export const FIVE_SEVEN: GunDrawing = {
  name: "five-seven",
  draft: true,
  photo: {
    file: "five-seven-mk3.webp",
    width: 2560,
    height: 1967,
    about:
      "An FDE Five-seven MK3 from its right side, muzzle to the right, on white, with a red dot sight mounted (draw it without: the optic plate's cover and rear sight, as in the third photo)",
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
        "From the right, front three quarters, without an optic: the cover plate and rear sight, the slide's top, the muzzle (the bore's height in the slide)",
    },
  ],
  // FN Herstal's technical data sheet for the Five-seveN Mk3 MRD: 207.9 mm (8.19") long, a 122 mm (4.81")
  // barrel. In the photo the gun runs from the beavertail's tip (129) to the nose (2463), 2334 px. The
  // origin is halfway along, on the bore: 430, from the barrel's top in the port (368) and the bore's place in
  // the slide's face in the front photo (about halfway down). Checks: the barrel, from the chamber at the
  // port's back (1127) to the nose, is 1336 px, 119 mm (122 with the muzzle's recess); the height over
  // the sights is 149.5 mm against the 142 to 145 retailers give (5.6 to 5.7", FN gives none), and 140 mm
  // without them.
  scale: { origin: [1296, 430], mmPerPixel: 207.9 / 2334 },
  frame: {
    // The rear sight's top, the bottom of the magazine's base, the beavertail's tip, the nose; the square
    // 218 mm, about 5% more than the gun's length, as the M1911's 224 for 216
    top: 197,
    bottom: 1873,
    back: 129,
    front: 2463,
    side: 218,
    pixels: 256,
  },
  comment: `
  <!-- The Five-seven MK3 from its right side, muzzle to the right, in flat dark earth, with the optic cut's
       cover plate on. Millimeters, with the origin on the gun's middle on the bore, as the guns' top views
       in weapons/guns/art/ have it. -->`,
  drawSide,
};
