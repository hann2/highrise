/**
 * The M1911 from its right side, drawn in the pixels of a photo of an early one (2000 by 1278). Shapes are
 * worked out from named numbers, so changing one moves everything that depends on it.
 */
import type { Point } from "../lib/geometry";
import {
  arc,
  degrees,
  fixed,
  fmt,
  on,
  rounded,
  SlantedAxis,
  smoothCurve,
} from "../lib/geometry";
import type { GunDrawing } from "../lib/gun";

// Blued steel
const STEEL = "#4a4d54";
const STEEL_DARK = "#26282d";
const STEEL_LIGHT = "#6a6e76";
const STEEL_EDGE = "#787d87";
const WORN = "#8d9199"; // the grip safety, bright steel
// Cocoa-brown wood: WOOD at the panel's edges, WOOD_LIGHT down its middle, WOOD_DARK for its checkering and edge
const WOOD = "#6a3a24";
const WOOD_DARK = "#3e2013";
const WOOD_LIGHT = "#a3633f";

/** How the wood panel looks: its colors and shading, and how its edges and diamonds are drawn */
export interface WoodStyle {
  /** Gradient stops, as [offset, color] */
  stops: [number, string][];
  /**
   * Which way the gradient runs: across the grip, square to its lean, from the panel's back edge to its front
   * ("grip"); straight back to front ("across"); "down" the grip; from its top front corner to its bottom back
   * one ("diagonal"); or not at all ("flat", the first stop's color)
   */
  direction: "grip" | "across" | "down" | "diagonal" | "flat";
  /** The checkering's color and opacity */
  check: string;
  checkOpacity: number;
  /** An outline round the panel and its notches, or null */
  outline: string | null;
  outlineWidth: number;
  /** A lit band just inside the edge, or null */
  bevel: string | null;
  bevelWidth: number;
  /** The diamonds' own color; null is the panel's shading */
  diamond: string | null;
  /** [color, opacity] over the diamonds, or null */
  diamondTint: [string, number] | null;
  diamondOutline: string | null;
  diamondOutlineWidth: number;
}

export const DEFAULT_WOOD: WoodStyle = {
  stops: [
    [0, WOOD],
    [0.5, WOOD_LIGHT],
    [1, WOOD],
  ],
  direction: "grip",
  check: WOOD_DARK,
  checkOpacity: 0.6,
  outline: WOOD_DARK,
  outlineWidth: 4,
  bevel: null,
  bevelWidth: 8,
  diamond: null,
  diamondTint: ["#ffffff", 0.1],
  diamondOutline: null,
  diamondOutlineWidth: 4,
};

export interface M1911Options {
  wood?: Partial<WoodStyle>;
}

// The grip, in three layers along one axis: the frame, the wood panel on it, and the grip safety, the one part
// that stands proud of the frame's back, under the frame's edge (the flat mainspring housing below it is flush
// with the frame, so it's drawn as the frame). Lines down the grip lean back by the front strap's lean; lines
// across it (the panel's top and bottom, the grip's base) fall a little to the front.
const GRIP = new SlantedAxis(200, 760, -0.345, 0.15);
const K = GRIP.lean;
const ACROSS = GRIP.fall;
const down = (offset: number, y: number) => GRIP.at(offset, y);
const cross = (offset: number, point: Point) => GRIP.cross(offset, point);

// Distances forward of the back of the grip, along a row
const BACK_PIECES = 44; // how far the grip safety reaches under the frame
const FRAME_BACK = 32; // the frame's edge over the grip safety
const SAFETY_PROUD = 14; // how far the grip safety stands behind the frame's back
const PANEL_BACK = 54;
const PANEL_FRONT = 365;
const FRONT_STRAP = 476;
const SEAM = 750; // where the grip safety ends and the housing starts
const BASE: Point = [80, 1172]; // a point on the grip's base
const PANEL_TOP: Point = [450, 317]; // a point on the panel's top edge
const PANEL_INSET = 16; // how far above the base the panel's bottom is

const PANEL_BASE: Point = [BASE[0], BASE[1] - PANEL_INSET];
const PANEL = rounded(
  [
    cross(PANEL_BACK, PANEL_TOP),
    cross(PANEL_FRONT, PANEL_TOP),
    cross(PANEL_FRONT, PANEL_BASE),
    cross(PANEL_BACK, PANEL_BASE),
  ],
  [22, 22, 22, 22],
);

// The smooth diamonds round the screws, long down the grip ("double diamond" grips)
const UNIT = GRIP.down;
const NORMAL = GRIP.forward;
const MIDDLE = (PANEL_BACK + PANEL_FRONT) / 2;
const TOP_SCREW = down(MIDDLE, 432);
const BOTTOM_SCREW = down(MIDDLE, 1086);

// The checkering: two sets of lines SPREAD either side of the grip's axis, crossing in diamonds. Lines of both
// sets cross at each screw: the grid starts at the top one, spaced so that the bottom one is on a crossing too.
const SPREAD = 0.42;
const between = Math.hypot(
  BOTTOM_SCREW[0] - TOP_SCREW[0],
  BOTTOM_SCREW[1] - TOP_SCREW[1],
);
const SPACING =
  (between * Math.sin(SPREAD)) / Math.round((between * Math.sin(SPREAD)) / 13);
const DIAMOND_LINES = 5; // how many lines of checkering out from its screw a diamond's edges are

/** The smooth diamond round a screw, its edges on lines of the checkering */
function diamond(screw: Point): string {
  const h = DIAMOND_LINES * SPACING;
  const length = h / Math.sin(SPREAD);
  const width = h / Math.cos(SPREAD);
  const [sx, sy] = screw;
  const pts: Point[] = [
    [sx - UNIT[0] * length, sy - UNIT[1] * length],
    [sx + NORMAL[0] * width, sy + NORMAL[1] * width],
    [sx + UNIT[0] * length, sy + UNIT[1] * length],
    [sx - NORMAL[0] * width, sy - NORMAL[1] * width],
  ];
  return "M" + pts.map(fmt).join(" L") + " Z";
}

const TOP_DIAMOND = diamond(TOP_SCREW);
const BOTTOM_DIAMOND = diamond(BOTTOM_SCREW);

function screw(at: Point, r = 28): string {
  const [sx, sy] = at;
  return (
    `<circle cx="${fixed(sx, 1)}" cy="${fixed(sy, 1)}" r="${r}" fill="${STEEL}"/>\n` +
    `    <path d="M${fixed(sx - 26, 1)},${fixed(sy + 9, 1)} L${fixed(sx + 26, 1)},${fixed(sy - 9, 1)}" stroke="${STEEL_DARK}" stroke-width="7"/>`
  );
}

// The frame round the grip: down the front strap, along the base, up its back edge over the back pieces, and
// round under the tang
const STRAP_FOOT = cross(FRONT_STRAP, BASE);
const FRAME_FOOT = cross(0, BASE);
const FRAME_GRIP =
  `L${fmt(FRAME_FOOT)} L${fmt(down(0, SEAM))} L${fmt(down(FRAME_BACK, SEAM))} L${fmt(down(FRAME_BACK, 560))} ` +
  "C300,520 285,488 256,460 C215,422 160,397 118,384 L110,376";

// Round the trigger the frame is on two planes. Its flat face ends at one edge, the RIM: under the dust cover,
// round behind the trigger, and down the grip STRAP_ROUND short of its front, the front strap rounding away from
// it. Below that is one lower surface: the trigger guard (a ring with a pill-shaped OPENING), the pocket behind
// the trigger, and the rounded front strap.
const STRAP_ROUND = 79; // the face ends just ahead of the wood panel
// Where the guard's front leaves the dust cover's underside (the first half of that curve)
const GUARD_TOP: Point = [1163.6, 409.75];
const FILLET_START = "L1205,403 C1188.5,403 1174.75,405.25 1163.6,409.75";
const RIM_TOP = 392; // the rim's top
const RIM_BACK = 745; // how far back it goes behind the trigger
const RIM_JOIN = 730; // where it meets the front strap's line
const rimJoin = down(FRONT_STRAP - STRAP_ROUND, RIM_JOIN);

// Along the top of the pocket, then one smooth curve: round the pocket's back, bulging forward a little below
// it, back just above the guard's bottom, and down into the front strap along its line (points from Simon's
// trace of the photo)
const RIM_POCKET = `C1145,398 1110,${RIM_TOP} 1060,${RIM_TOP} L900,${RIM_TOP}`;
const RIM_POINTS: Point[] = [
  [900, RIM_TOP],
  [800, 410],
  [758, 460],
  [RIM_BACK, 530],
  [756, 590],
  [738, 632],
  [690, 656],
  [645, 678],
  rimJoin,
];
const RIM_SWEEP = smoothCurve(RIM_POINTS, [-1, 0], [K, 1]);
const RIM = `${RIM_POCKET} ${RIM_SWEEP} L${fmt(cross(FRONT_STRAP - STRAP_ROUND, BASE))}`;
const RIM_STEP = `${RIM_POCKET} ${RIM_SWEEP}`;
// The guard's outline, from the dust cover down its front, along its bottom, and down the front strap
const GUARD_OUTLINE =
  "C1152.5,414.25 1144,421 1138,430 C1118,460 1110,495 1107,530 L1104,585 C1100,628 1060,656 1012,656 " +
  `L820,656 C762,656 718,668 697,700 L${fmt(STRAP_FOOT)}`;

const OPENING_LEFT = 800;
const OPENING_RIGHT = 1080;
const OPENING_TOP = 428;
const OPENING_BOTTOM = 632;
// A pill: half circles at the back and the front, as round as it's tall, joined by straight top and bottom edges
const OPENING_R = (OPENING_BOTTOM - OPENING_TOP) / 2;
const MID = (OPENING_TOP + OPENING_BOTTOM) / 2;
const BACK_CENTER: Point = [OPENING_LEFT + OPENING_R, MID];
const FRONT_CENTER: Point = [OPENING_RIGHT - OPENING_R, MID];
const FRONT_CURVE = `L${fmt(on(FRONT_CENTER, OPENING_R, -90))} ${arc(FRONT_CENTER, OPENING_R, -90, 90)}`;
const OPENING =
  `M${fmt(on(BACK_CENTER, OPENING_R, -90))} ${FRONT_CURVE} L${fmt(on(BACK_CENTER, OPENING_R, 90))} ` +
  `${arc(BACK_CENTER, OPENING_R, 90, 270)} Z`;
// The lower surface: its outline, then back under the face
const LOWER =
  `M1205,403 C1188.5,403 1174.75,405.25 1163.6,409.75 ${GUARD_OUTLINE} ` +
  `L${fmt(cross(300, BASE))} L${fmt(down(300, 700))} L720,430 L760,385 L1205,385 Z ${OPENING}`;
// Lit: the opening's bevel at its front and bottom
const OPENING_BEVEL = `M${FRONT_CENTER[0] - 30},${OPENING_TOP} ${FRONT_CURVE} L${BACK_CENTER[0] + 10},${OPENING_BOTTOM}`;
// Lit down the middle of the rounded front strap, and round under the guard
const STRAP_LIGHT_AT = FRONT_STRAP - 42;
const strapLight = down(STRAP_LIGHT_AT, 780);
const STRAP_LIGHT =
  `M990,643 L822,643 C760,643 704,656 676,688 C660,708 ${fixed(strapLight[0] - K * 40, 1)},${strapLight[1] - 40} ${fmt(strapLight)} ` +
  `L${fmt(cross(STRAP_LIGHT_AT, [BASE[0], BASE[1] - 8]))}`;

// The trigger is a crescent: its back the opening's back half circle, its front the inside of a bigger, flatter
// circle (TRIGGER_FACE_R), whose deepest point is TRIGGER_DEPTH forward of the back
const TRIGGER_DEPTH = 68;
const TRIGGER_FACE_R = OPENING_R * 1.6;
const FACE_CENTER: Point = [OPENING_LEFT + TRIGGER_DEPTH + TRIGGER_FACE_R, MID];
// Where the two circles cross: `along` forward of the back circle's center, `h` above and below it
const d = FACE_CENTER[0] - BACK_CENTER[0];
const along =
  (d * d + OPENING_R * OPENING_R - TRIGGER_FACE_R * TRIGGER_FACE_R) / (2 * d);
const crossingH = Math.sqrt(OPENING_R * OPENING_R - along * along);
const backAngle = degrees(Math.atan2(crossingH, along)); // the crossings' angles from the back circle's center
const faceAngle = degrees(Math.atan2(crossingH, d - along)); // and from the face's
const TRIGGER =
  `M${fmt(on(BACK_CENTER, OPENING_R, -backAngle))} ${arc(BACK_CENTER, OPENING_R, -backAngle, -360 + backAngle)} ` +
  `${arc(FACE_CENTER, TRIGGER_FACE_R, 180 - faceAngle, 180 + faceAngle)} Z`;
const TRIGGER_FACE =
  `M${fmt(on(FACE_CENTER, TRIGGER_FACE_R, 180 - faceAngle + 5))} ` +
  `${arc(FACE_CENTER, TRIGGER_FACE_R, 180 - faceAngle + 5, 180 + faceAngle - 5)}`;

// The grip safety: from its tang, round under the frame's, then straight down the back to where it ends
const SAFETY =
  "M96,380 C89,385 89,397 98,402 C140,418 200,446 236,480 " +
  `C252,495 ${fmt(down(-SAFETY_PROUD, 530))} ${fmt(down(-SAFETY_PROUD, 560))} L${fmt(down(-SAFETY_PROUD, SEAM - 16))} ` +
  `C${fmt(down(-SAFETY_PROUD, SEAM - 4))} ${fmt(down(-8, SEAM + 1))} ${fmt(down(4, SEAM + 1))} L${fmt(down(BACK_PIECES, SEAM + 1))} ` +
  `L${fmt(down(BACK_PIECES, 560))} C305,505 275,462 232,432 C192,402 152,386 120,377 C110,375 101,376 96,380 Z`;
const SAFETY_LIGHT =
  `M108,392 C148,408 204,436 242,472 C256,486 ${fmt(down(8 - SAFETY_PROUD, 530))} ${fmt(down(8 - SAFETY_PROUD, 560))} ` +
  `L${fmt(down(8 - SAFETY_PROUD, SEAM - 14))}`;
// The frame's back below it, lit along its rounded edge
const BACK_LIGHT =
  `M${fmt(down(3, SEAM + 6))} L${fmt(cross(3, [BASE[0], BASE[1] - 8]))} ` +
  `L${fmt(cross(15, [BASE[0], BASE[1] - 8]))} L${fmt(down(15, SEAM + 6))} Z`;
const HOUSING_FOOT = FRAME_FOOT;
const lx = HOUSING_FOOT[0] + 26;
const ly = HOUSING_FOOT[1] - 4;
const f1 = (v: number) => fixed(v, 1);
const LOOP =
  `M${f1(lx - 12)},${f1(ly - 6)} C${f1(lx - 22)},${f1(ly + 12)} ${f1(lx - 16)},${f1(ly + 38)} ${f1(lx + 2)},${f1(ly + 40)} ` +
  `C${f1(lx + 20)},${f1(ly + 42)} ${f1(lx + 26)},${f1(ly + 16)} ${f1(lx + 14)},${f1(ly - 6)}`;
// The magazine's base, flush with the grip's base, its lip ahead of the front strap
const mx0 = STRAP_FOOT[0] - 130;
const MAG_BASE = rounded(
  [
    [mx0, BASE[1] + ACROSS * (mx0 - BASE[0]) - 11],
    [STRAP_FOOT[0] + 16, STRAP_FOOT[1] - 11 + ACROSS * 16],
    [STRAP_FOOT[0] + 16, STRAP_FOOT[1] + ACROSS * 16],
    [mx0, BASE[1] + ACROSS * (mx0 - BASE[0])],
  ],
  [0, 4, 4, 0],
);
// The magazine catch's lock plate in front of the panel, its tail into it; and the pin in the frame at the
// panel's foot. The panel is notched round both.
const PLATE_SCREW: Point = [695, 585];
const PLATE =
  "M624,567 C645,563 672,561 694,561 C708,561 719,572 719,585 C719,598 708,609 694,609 " +
  "C672,609 645,603 624,598 C614,596 608,590 608,582 C608,574 614,568 624,567 Z";
const FOOT_PIN = down(50, 1146);
const GRIP_BOTTOM = Math.max(STRAP_FOOT[1] + ACROSS * 16, ly + 42);

/** Two sets of lines either side of the panel's axis, crossing in diamonds */
function checkering(): string {
  const axis = Math.atan2(1, K); // down the grip, leaning back
  const lines: string[] = [];
  for (const spread of [-SPREAD, SPREAD]) {
    const a = axis + spread;
    const dir: Point = [Math.cos(a), Math.sin(a)];
    const n: Point = [-dir[1], dir[0]];
    const [cx, cy] = TOP_SCREW;
    for (let k = -70; k <= 70; k++) {
      const off = k * SPACING;
      const px = cx + n[0] * off;
      const py = cy + n[1] * off;
      lines.push(
        `M${fixed(px - dir[0] * 1100, 0)},${fixed(py - dir[1] * 1100, 0)} ` +
          `L${fixed(px + dir[0] * 1100, 0)},${fixed(py + dir[1] * 1100, 0)}`,
      );
    }
  }
  return lines.join(" ");
}

function woodGradient(st: WoodStyle): string {
  const back = down(PANEL_BACK, 760);
  const width = (PANEL_FRONT - PANEL_BACK) * UNIT[1]; // the panel's width, square to the grip
  const ends: Record<string, [Point, Point]> = {
    grip: [back, [back[0] + NORMAL[0] * width, back[1] + NORMAL[1] * width]],
    across: [
      [120, 760],
      [690, 760],
    ],
    down: [
      [560, 320],
      [290, 1200],
    ],
    diagonal: [
      [700, 360],
      [130, 1190],
    ],
  };
  const stops: [number, string][] =
    st.direction !== "flat" ? st.stops : [st.stops[0], [1, st.stops[0][1]]];
  const [[x1, y1], [x2, y2]] = ends[st.direction] ?? ends.across;
  const out = [
    `<linearGradient id="m1911-wood-shading" gradientUnits="userSpaceOnUse" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}">`,
    ...stops.map(([o, c]) => `      <stop offset="${o}" stop-color="${c}"/>`),
    "    </linearGradient>",
  ];
  return out.join("\n");
}

function panelDrawing(st: WoodStyle): string {
  const out = [`<path d="${PANEL}" fill="url(#m1911-wood-shading)"/>`];
  out.push(
    `<g clip-path="url(#m1911-panel-clip)">\n` +
      `      <path d="${checkering()}" stroke="${st.check}" stroke-width="3.5" opacity="${st.checkOpacity}" fill="none"/>\n` +
      "    </g>",
  );
  const fill = st.diamond ?? "url(#m1911-wood-shading)";
  for (const dPath of [TOP_DIAMOND, BOTTOM_DIAMOND]) {
    out.push(
      `<path d="${dPath}" fill="${fill}" clip-path="url(#m1911-panel-clip)"/>`,
    );
    if (st.diamondTint) {
      const [color, opacity] = st.diamondTint;
      out.push(
        `<path d="${dPath}" fill="${color}" opacity="${opacity}" clip-path="url(#m1911-panel-clip)"/>`,
      );
    }
    if (st.diamondOutline) {
      out.push(
        `<path d="${dPath}" stroke="${st.diamondOutline}" stroke-width="${st.diamondOutlineWidth}" ` +
          'fill="none" clip-path="url(#m1911-panel-clip)"/>',
      );
    }
  }
  // The notches cut a plate's outline 7 out and a circle of 22 round the pin; a stroke this much wider leaves
  // `width` of it on the wood
  const roundNotches = (color: string, width: number) =>
    `<g clip-path="url(#m1911-panel-clip)" stroke="${color}" fill="none">\n` +
    `      <path d="${PLATE}" stroke-width="${14 + 2 * width}"/>\n` +
    `      <circle cx="${f1(FOOT_PIN[0])}" cy="${f1(FOOT_PIN[1])}" r="22" stroke-width="${2 * width}"/>\n` +
    "    </g>";
  if (st.bevel) {
    out.push(
      `<path d="${PANEL}" stroke="${st.bevel}" stroke-width="${st.bevelWidth * 2}" fill="none" ` +
        'clip-path="url(#m1911-panel-clip)"/>',
    );
    out.push(roundNotches(st.bevel, st.bevelWidth));
  }
  if (st.outline) {
    out.push(
      `<path d="${PANEL}" stroke="${st.outline}" stroke-width="${st.outlineWidth}" fill="none"/>`,
    );
    out.push(roundNotches(st.outline, st.outlineWidth));
  }
  return out.join("\n    ");
}

function serrations(): string {
  const out: string[] = [];
  for (let i = 0; i < 19; i++) {
    const x = 396 + i * 15.4;
    out.push(
      `<rect x="${f1(x)}" y="122" width="5.5" height="162" fill="${STEEL_DARK}"/>`,
    );
    out.push(
      `<rect x="${f1(x + 5.5)}" y="122" width="3" height="162" fill="${STEEL_EDGE}" opacity="0.5"/>`,
    );
  }
  return out.join("\n      ");
}

function drawSide(options: M1911Options = {}): string {
  const st: WoodStyle = { ...DEFAULT_WOOD, ...options.wood };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1278" viewBox="0 0 2000 1278" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  <defs>
    <linearGradient id="m1911-slide-shading" gradientUnits="userSpaceOnUse" x1="1021" y1="74" x2="1021" y2="388">
      <stop offset="0" stop-color="#303237"/>
      <stop offset="0.17" stop-color="#3a3c42"/>
      <stop offset="0.19" stop-color="#62656d"/>
      <stop offset="0.66" stop-color="#52555c"/>
      <stop offset="0.67" stop-color="#36383d"/>
      <stop offset="1" stop-color="#36383d"/>
    </linearGradient>
    <linearGradient id="m1911-nose-shading" gradientUnits="userSpaceOnUse" x1="1021" y1="234" x2="1021" y2="388">
      <stop offset="0" stop-color="#1f2125"/>
      <stop offset="0.05" stop-color="#6a6e77"/>
      <stop offset="0.5" stop-color="#4c5058"/>
      <stop offset="1" stop-color="#2a2c31"/>
    </linearGradient>
    <linearGradient id="m1911-frame-shading" gradientUnits="userSpaceOnUse" x1="1021" y1="284" x2="1021" y2="403">
      <stop offset="0" stop-color="#2e3035"/>
      <stop offset="0.06" stop-color="#585b62"/>
      <stop offset="0.5" stop-color="#4f5259"/>
      <stop offset="0.52" stop-color="#43464c"/>
      <stop offset="1" stop-color="#3b3d43"/>
    </linearGradient>
    <linearGradient id="m1911-barrel-shading" gradientUnits="userSpaceOnUse" x1="1021" y1="92" x2="1021" y2="148">
      <stop offset="0" stop-color="#7e828a"/>
      <stop offset="0.06" stop-color="#eef0f3"/>
      <stop offset="0.35" stop-color="#cdd1d6"/>
      <stop offset="0.55" stop-color="#8e929a"/>
      <stop offset="1" stop-color="#3c3f45"/>
    </linearGradient>
    ${woodGradient(st)}
    <mask id="m1911-panel-notches" maskUnits="userSpaceOnUse" x="0" y="0" width="2000" height="1278">
      <rect x="0" y="0" width="2000" height="1278" fill="white"/>
      <path d="${PLATE}" fill="black" stroke="black" stroke-width="14"/>
      <circle cx="${f1(FOOT_PIN[0])}" cy="${f1(FOOT_PIN[1])}" r="22" fill="black"/>
    </mask>
    <linearGradient id="m1911-rim-shadow" gradientUnits="userSpaceOnUse" x1="1021" y1="540" x2="1021" y2="720">
      <stop offset="0" stop-color="#1b1c20" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#1b1c20" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="m1911-panel-clip">
      <path d="${PANEL}"/>
    </clipPath>
  </defs>
  <!-- Behind the slide, pivoting in the frame; cocked, as it's carried -->
  <g id="hammer">
    <path d="M128,124 C132,114 150,108 172,108 C195,108 210,121 228,129 L300,132 L300,242 L261,242 C258,214 244,190 222,173 C210,165 200,160 190,155 C172,147 150,143 136,137 C129,134 126,129 128,124 Z" fill="${STEEL}"/>
    <path d="M205,131 L219,133 L221,168 L207,162 Z" fill="${STEEL_DARK}"/>
    <path d="M140,116 L148,124 M150,111 L158,121 M161,109 L168,120 M172,108 L178,120 M183,109 L188,121 M194,112 L197,124" stroke="${STEEL_DARK}" stroke-width="3" fill="none"/>
  </g>
  <!-- Seen through the ejection port, and its bushing out of the front of the slide -->
  <g id="barrel">
    <rect x="845" y="92" width="290" height="63" fill="url(#m1911-barrel-shading)"/>
    <path d="M1928,116 L1950,116 C1955,116 1958,120 1958,126 L1958,342 C1958,348 1955,352 1950,352 L1928,352 Z" fill="${STEEL_DARK}"/>
  </g>
  <!-- The frame's lower plane, under its face: the trigger guard, the pocket behind the trigger and the rounded
       front strap, in the shadow of the face's edge, lit along the strap and round the opening -->
  <g id="trigger-guard">
    <path d="${LOWER}" fill="#323439"/>
    <path d="M${GUARD_TOP[0]},${GUARD_TOP[1]} ${RIM_STEP}" stroke="url(#m1911-rim-shadow)" stroke-width="18" fill="none"/>
    <path d="${STRAP_LIGHT}" stroke="${STEEL_LIGHT}" stroke-width="16" opacity="0.55" fill="none"/>
    <path d="${OPENING_BEVEL}" stroke="#80848c" stroke-width="5" fill="none"/>
  </g>
  <!-- A long, plain trigger, filling the back of the guard's opening, curved at the front -->
  <g id="trigger">
    <path d="${TRIGGER}" fill="#7b7f87"/>
    <path d="${TRIGGER_FACE}" stroke="#9fa3aa" stroke-width="5" fill="none"/>
  </g>
  <!-- Bright steel down the back of the grip: from its tang under the hammer, under the frame's edge, standing
       proud of the frame's back down to where it ends on the flat mainspring housing -->
  <g id="grip-safety">
    <path d="${SAFETY}" fill="${WORN}"/>
    <path d="${SAFETY_LIGHT}" stroke="#c4c7cc" stroke-width="7" fill="none"/>
  </g>
  <!-- Through the foot of the grip -->
  <g id="lanyard-loop">
    <path d="${LOOP}" stroke="${STEEL_DARK}" stroke-width="7" fill="none"/>
  </g>
  <!-- The frame's face: the dust cover under the slide's front, round the trigger's pocket, the grip, and the tang over the grip safety -->
  <g id="frame">
    <path d="M262,284 L1552,284 L1552,397 C1552,401 1549,403 1545,403 ${FILLET_START} ${RIM} ${FRAME_GRIP} C150,360 200,345 238,324 C252,315 260,300 262,284 Z" fill="url(#m1911-frame-shading)"/>
    <!-- The face's edge, catching the light where it steps down to the guard and the strap -->
    <path d="M${GUARD_TOP[0]},${GUARD_TOP[1]} ${RIM}" stroke="#5f636b" stroke-width="3" fill="none"/>
    <!-- The back of the grip below the grip safety (the flat mainspring housing, flush with the frame), lit along its edge -->
    <path d="${BACK_LIGHT}" fill="${STEEL_LIGHT}" opacity="0.7"/>
    <!-- The chamfer along the dust cover -->
    <path d="M1150,345 L1552,345 L1552,350 L1150,350 Z" fill="${STEEL_DARK}" opacity="0.5"/>
  </g>
  <!-- The magazine's base, flush with the bottom of the grip -->
  <g id="magazine">
    <path d="${MAG_BASE}" fill="${STEEL}"/>
  </g>
  <!-- Walnut, checkered but for the diamonds round the screws -->
  <g id="grip-panel" mask="url(#m1911-panel-notches)">
    ${panelDrawing(st)}
    ${screw(TOP_SCREW)}
    ${screw(BOTTOM_SCREW)}
  </g>
  <g id="slide">
    <path d="M330,74 L844,74 C852,75 857,82 858,92 L859,110 C860,132 876,146 904,146 L1078,146 C1104,146 1120,132 1122,112 L1123,94 C1124,84 1126,77 1134,74 L1905,74 C1918,74 1930,85 1932,100 L1934,350 C1934,372 1920,388 1898,388 L1552,388 L1552,284 L262,284 L262,200 C262,140 290,90 330,74 Z" fill="url(#m1911-slide-shading)"/>
    <!-- Its nose, under the dust cover's front: rounded below the step -->
    <path d="M1552,284 L1582,284 C1622,262 1662,238 1722,234 L1933,232 L1934,350 C1934,372 1920,388 1898,388 L1552,388 Z" fill="url(#m1911-nose-shading)"/>
    <!-- The ejection port's cut edge, catching the light -->
    <path d="M858,92 L859,110 C860,132 876,146 904,146 L1078,146 C1104,146 1120,132 1122,112 L1123,94" stroke="#8a8e96" stroke-width="2.5" fill="none"/>
    <!-- Grooves to grip it by -->
    <g id="serrations">
      ${serrations()}
    </g>
    <!-- Small, as on the first 1911s -->
    <path id="rear-sight" d="M386,76 L392,60 L405,47 L416,36 L427,33 L437,40 L449,53 L453,63 L460,76 Z" fill="${STEEL}"/>
    <path id="front-sight" d="M1806,76 C1825,62 1840,55 1858,54 C1875,54 1890,60 1900,76 Z" fill="${STEEL}"/>
  </g>
  <!-- Pins through the frame, and the end of the slide stop's -->
  <g id="pins" fill="${STEEL_LIGHT}">
    <circle cx="298" cy="335" r="16"/>
    <circle cx="206" cy="386" r="15"/>
    <circle cx="352" cy="396" r="10"/>
    <circle cx="965" cy="340" r="19"/>
    <circle cx="960" cy="334" r="7" fill="${STEEL_EDGE}"/>
    <!-- The magazine catch's lock, on this side -->
    <path d="${PLATE}" fill="${STEEL}"/>
    <!-- The mainspring housing's pin, at the panel's foot -->
    <circle cx="${f1(FOOT_PIN[0])}" cy="${f1(FOOT_PIN[1])}" r="13"/>
    <circle cx="${PLATE_SCREW[0]}" cy="${PLATE_SCREW[1]}" r="13" fill="${STEEL_LIGHT}"/>
    <path d="M${PLATE_SCREW[0] - 7},${PLATE_SCREW[1] + 12} L${PLATE_SCREW[0] + 7},${PLATE_SCREW[1] - 12}" stroke="${STEEL_DARK}" stroke-width="4"/>
  </g>
</svg>
`;
}

export const M1911: GunDrawing<M1911Options> = {
  name: "m1911",
  photo: {
    file: "early-1911-right.png",
    width: 2000,
    height: 1278,
    about:
      "An early M1911 from its right side, on a pale blue backdrop (Simon's pick; source unknown)",
  },
  otherPhotos: [
    {
      file: "rock-island-1911a1-right.png",
      width: 1600,
      height: 1041,
      about:
        "A Rock Island M1911 A1 from its right side, evenly lit: shows how the grip and trigger area are built",
    },
    {
      file: "rock-island-1911a1-left.png",
      width: 1600,
      height: 1055,
      about:
        "The same from its left side: the back of the grip, under the grip safety",
    },
  ],
  // The origin on the gun's middle (between the grip safety's tang and the muzzle) on the bore, and 216 mm (the
  // 1911's length) over the 1867 px they're apart
  scale: { origin: [1021, 232], mmPerPixel: 216 / 1867 },
  frame: {
    // The rear sight's top, the bottom of the grip, the grip's foot, the barrel bushing
    top: 30,
    bottom: GRIP_BOTTOM,
    back: HOUSING_FOOT[0] - 2,
    front: 1958,
    side: 224,
    pixels: 256,
  },
  comment: `
  <!-- The M1911 from its right side, muzzle to the right: an early one, with a short grip safety, a flat
       mainspring housing, a long trigger, small sights and walnut "double diamond" grips. Millimeters,
       with the origin on the gun's middle on the bore, as the guns' top views in weapons/guns/art/ have it;
       drawn over a photo, then simplified. The square is the pickup's, as the other pickups'. -->`,
  drawSide,
};
