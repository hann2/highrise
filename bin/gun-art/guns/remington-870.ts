/**
 * The Remington 870 Marine Magnum from its right side: electroless nickel receiver, barrel and magazine tube, a
 * black synthetic stock and ribbed pump, an 18" barrel, the magazine tube's extension and its barrel clamp near
 * the muzzle. Drawn in the pixels of its photo (738 by 222) by named numbers, following the gun-art skill
 * (.claude/skills/gun-art/SKILL.md), with guns/m1911.ts as the worked example. A draft until it goes into the game.
 *
 * Every color is an option (`Remington870Options`), so a skin later (the blued and wood Express, the black
 * tactical one, in the other photos) is a set of them; the stock and the pump are drawn by their own functions
 * (`stock`, `pump`) from their own shapes, so another stock or pump can replace them without touching the rest.
 *
 * ## Dimensions (the scale)
 *
 * - Overall 38.5" (978 mm) with the 18" barrel and its 14" length of pull: Remington's catalog figures for the
 *   Marine Magnum (retailers list the barrel as 18" or 18.5"; Remington's newer listings say 18.5", a 6+1
 *   magazine, 14" length of pull, 7.5 lb). The photo is 677 px long (the recoil pad's back at x 28 to the muzzle
 *   at x 705), so 978 / 677 = 1.4445 mm a pixel. That's the scale.
 * - Checks, all in the photo at that scale: the length of pull (the trigger's face, x 274, to the middle of the
 *   recoil pad's back, x 30) is 244 px = 352 mm = 13.9" (14"); from the receiver's front (x 393.5) to the muzzle
 *   is 311 px = 450 mm = 17.7", and the barrel's shank goes about an inch into the receiver to the breech, so the
 *   barrel is about 18.7", between the two published lengths; the receiver is 137 px = 198 mm = 7.8" long
 *   (the 870's is about 7.9"); the barrel is 14.3 px across at its middle = 20.7 mm (12 gauge, about 0.81"), the
 *   magazine tube 16.2 px = 23.4 mm (the 870's is 7/8" = 22.2 mm: the photo's soft edges, kept).
 * - The bore's axis is y 64 (the barrel is y 56.2 to 71.3 at the receiver, 57 to 70.8 at the muzzle); the origin
 *   is the middle of the gun's length on it, x 366.5.
 *
 * ## Construction
 *
 * Parts, back to front in drawing order, and how they sit:
 *
 * - MAGAZINE TUBE, under the barrel, from inside the receiver to its cap just behind the muzzle: a cylinder
 *   (y 76.6 to 92.8). The factory extension screws on where the magazine cap was (its COUPLING, a short, fatter
 *   collar, x 588 to 601, tapering into the tube at its front), and runs on to its own rounded cap at x 704.3.
 * - Between the barrel and the tube, behind the pump: the far action bar in shadow (a dark band, not a hole: the
 *   photo is dark there), and the near ACTION BAR, a flat nickel strip (y 74.2 to 80.4) lying across the tube's
 *   upper side, from the receiver into the pump, which it's riveted to.
 * - BARREL, out of the receiver's front: a cylinder tapering very slightly to the muzzle, its crown rounded, a
 *   bead front sight on a small base at its end. Its LUG (the ring round the magazine tube, brazed under the
 *   barrel) is just in front of the pump (x 581 to 588); the extension's coupling holds it on.
 * - In front of the lug, the barrel and tube are apart: the gap between them (y 71 to 76.6) is see-through all
 *   the way to the muzzle, but for the BARREL CLAMP (x 651 to 668), which goes round both and fills the gap
 *   between them, a screw through its middle; its back face shows as a dark band where it's not on the barrel or
 *   the tube. A sling swivel stud hangs under it, with its cross hole through it (a hole).
 * - PUMP (forend), black synthetic, over the tube and the action bars: a smooth band along its top, then ribs
 *   (grooves round it) down its side to its bottom; its back's lower edge reaches back a little further (a lip).
 *   It slides back to pump (later, as a moving part).
 * - STOCK, black synthetic, butted against the receiver's back: the comb's top straight from the recoil pad to
 *   the comb's nose, down into the wrist and up along the grip's top into the receiver; the toe straight from the
 *   pad to the grip; the pistol grip's back curving down into its cap, its front curving up into the trigger
 *   plate. On it: the RECOIL PAD (black rubber, a seam across), the comb's top rolling over (a dark band along
 *   it, deepest at its back as a flute), the grip's molded panel (an edge curving down from the comb's nose), a
 *   swivel stud under the toe.
 * - TRIGGER (nickel), behind the trigger plate, showing through the guard's opening: a crescent blade.
 * - TRIGGER PLATE, black, under the receiver and up into it: the guard round its opening (a hole), the plate's
 *   front sloping up to the receiver's bottom at x 331; the crossbolt SAFETY through it at the guard's top back
 *   (a round button, seen end on); a small tab ahead of the guard's front slope (as photographed).
 * - RECEIVER (nickel): one flat side face, its top rounding over (a band along the top, following its curve down
 *   to the back), the back edge straight against the stock, the front square. The EJECTION PORT, a true pill
 *   (round ends, straight top and bottom), with the bolt in it (bright, shadowed under the port's top edge, the
 *   extractor's end at its front). Two trigger plate pins through the side.
 *
 * ## Deliberate simplifications
 *
 * - No lettering or roll marks. The pump's ribs are a regular grid of grooves, its bottom edge straight (the
 *   photo's scallops between the ribs are under a pixel at 128 px).
 * - The magazine tube's seam where the extension starts is hidden in the coupling, as photographed.
 */
import type { Point } from "../lib/geometry";
import { arc, fixed, fmt, on, rounded, smoothCurve } from "../lib/geometry";
import type { GunDrawing } from "../lib/gun";
import type { Material, Stops } from "../lib/style";
import { linear } from "../lib/style";

// ---------------------------------------------------------------------------------------------------------
// Materials (each an option, so a skin is a set of them)

/** Electroless nickel: a warm satin silver, not mirror chrome. A first guess, to pick on the options sheet. */
export const SATIN_NICKEL: Material = {
  base: "#b5b0a8",
  dark: "#6f6b65",
  light: "#d4d0c9",
  highlight: "#efece6",
};

/** Black synthetic (the stock and the pump): flat, a touch cool, never pure black */
export const BLACK_SYNTHETIC: Material = {
  base: "#34353a",
  dark: "#18191c",
  light: "#4a4b52",
  highlight: "#686a72",
};

/** The recoil pad's black rubber: a little warmer and darker than the stock */
export const BLACK_RUBBER: Material = {
  base: "#2b2728",
  dark: "#141213",
  light: "#3b3536",
  highlight: "#564c4d",
};

export interface Remington870Options {
  /** The receiver, barrel, magazine tube, action bar, clamp and trigger */
  nickel?: Partial<Material>;
  /** The bolt, through the ejection port: the nickel's, brighter, unless given */
  bolt?: Partial<Material>;
  stock?: Partial<Material>;
  pump?: Partial<Material>;
  /** The trigger plate (the guard) and the safety: the stock's, unless given */
  triggerPlate?: Partial<Material>;
  recoilPad?: Partial<Material>;
  /**
   * How shiny the nickel is: 0 is matte, 1 the default satin, more is brighter, with harder bands (a polished
   * nickel)
   */
  sheen?: number;
  /** A thin outline round the silhouette, in each part's own dark (the set's rule; default true) */
  outline?: boolean;
  /** How wide the rim light along the black parts' top edges is, in millimeters (default RIM_LIGHT_MM) */
  rimLight?: number;
}

// ---------------------------------------------------------------------------------------------------------
// The scale: 978 mm (38.5") over the 677 px from the recoil pad's back to the muzzle

const BUTT_BACK = 28;
const MUZZLE = 704.8;
const MM_PER_PX = 978 / (MUZZLE + 0.2 - BUTT_BACK);
const BORE_Y = 64;

/** The outline's width (the set's rule), and the rim light's, in the photo's pixels */
const OUTLINE = 0.4 / MM_PER_PX;
const RIM_LIGHT_MM = 0.8;

const f1 = (v: number) => fixed(v, 1);

function mix(a: string, b: string, t: number): string {
  const ca = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const cb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return (
    "#" +
    ca
      .map((v, i) => Math.round(v + (cb[i] - v) * t))
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

// ---------------------------------------------------------------------------------------------------------
// The barrel and the magazine tube

const RECEIVER_FRONT = 393.5;
const BARREL_TOP_BACK = 56.2;
const BARREL_TOP_FRONT = 57.0;
const BARREL_BOTTOM_BACK = 71.3;
const BARREL_BOTTOM_FRONT = 70.8;
const CROWN_R = 1.4;
const BARREL =
  `M${RECEIVER_FRONT - 4},${BARREL_TOP_BACK} L${MUZZLE - CROWN_R},${BARREL_TOP_FRONT} ` +
  `C${MUZZLE - 0.5},${BARREL_TOP_FRONT} ${MUZZLE},${BARREL_TOP_FRONT + 0.6} ${MUZZLE},${BARREL_TOP_FRONT + CROWN_R} ` +
  `L${MUZZLE},${BARREL_BOTTOM_FRONT - CROWN_R} ` +
  `C${MUZZLE},${BARREL_BOTTOM_FRONT - 0.6} ${MUZZLE - 0.5},${BARREL_BOTTOM_FRONT} ${MUZZLE - CROWN_R},${BARREL_BOTTOM_FRONT} ` +
  `L${RECEIVER_FRONT - 4},${BARREL_BOTTOM_BACK} Z`;
/** The bead on a little base, at the muzzle */
const BEAD_X = 693.8;
const BEAD: Point = [BEAD_X, 53.7];
const BEAD_R = 1.6;
const BEAD_BASE =
  `M${BEAD_X - 5},${BARREL_TOP_FRONT + 0.3} C${BEAD_X - 3},${BARREL_TOP_FRONT - 0.3} ${BEAD_X - 1.6},${BARREL_TOP_FRONT - 1.2} ` +
  `${BEAD_X - 0.9},${BEAD[1] + 0.8} L${BEAD_X + 0.9},${BEAD[1] + 0.8} C${BEAD_X + 1.6},${BARREL_TOP_FRONT - 1.2} ` +
  `${BEAD_X + 3},${BARREL_TOP_FRONT - 0.3} ${BEAD_X + 5},${BARREL_TOP_FRONT + 0.3} Z`;

const TUBE_TOP = 76.6;
const TUBE_BOTTOM = 92.8;
const TUBE_MID = (TUBE_TOP + TUBE_BOTTOM) / 2;
const TUBE_END = 704.3;
const CAP_START = 695; // where the extension's cap starts to round off
const TUBE =
  `M${RECEIVER_FRONT - 4},${TUBE_TOP} L${CAP_START},${TUBE_TOP} ` +
  `C${CAP_START + 4},${TUBE_TOP} ${TUBE_END - 1.5},${TUBE_TOP + 0.6} ${TUBE_END - 0.6},${TUBE_TOP + 1.6} ` +
  `C${TUBE_END},${TUBE_TOP + 2.3} ${TUBE_END},${TUBE_TOP + 3} ${TUBE_END},${TUBE_TOP + 3.6} ` +
  `L${TUBE_END},${TUBE_BOTTOM - 3.6} C${TUBE_END},${TUBE_BOTTOM - 3} ${TUBE_END},${TUBE_BOTTOM - 2.3} ${TUBE_END - 0.6},${TUBE_BOTTOM - 1.6} ` +
  `C${TUBE_END - 1.5},${TUBE_BOTTOM - 0.6} ${CAP_START + 4},${TUBE_BOTTOM} ${CAP_START},${TUBE_BOTTOM} ` +
  `L${RECEIVER_FRONT - 4},${TUBE_BOTTOM} Z`;
/** Where the cap's rounding starts: a fine line round the tube */
const CAP_LINE = `M${CAP_START},${TUBE_TOP + 0.4} L${CAP_START},${TUBE_BOTTOM - 0.4}`;

// The barrel's lug round the tube, just in front of the pump, and the extension's coupling holding it on
const PUMP_FRONT = 581.2;
const LUG_FRONT = 588;
const LUG_BOTTOM = 96.3;
const LUG = rounded(
  [
    [PUMP_FRONT - 2, BARREL_BOTTOM_FRONT - 1],
    [LUG_FRONT, BARREL_BOTTOM_FRONT - 1],
    [LUG_FRONT, LUG_BOTTOM],
    [PUMP_FRONT - 2, LUG_BOTTOM],
  ],
  [0, 0, 1.2, 0],
);
const COUPLING_FRONT = 600.5;
const COUPLING_R = 10.1;
const COUPLING = rounded(
  [
    [LUG_FRONT - 0.5, TUBE_MID - COUPLING_R],
    [COUPLING_FRONT, TUBE_MID - COUPLING_R],
    [COUPLING_FRONT + 2.6, TUBE_TOP + 0.2],
    [COUPLING_FRONT + 2.6, TUBE_BOTTOM - 0.2],
    [COUPLING_FRONT, TUBE_MID + COUPLING_R],
    [LUG_FRONT - 0.5, TUBE_MID + COUPLING_R],
  ],
  [0, 1, 0.5, 0.5, 1, 0],
);

// The barrel clamp round both, its back face dark where it shows (between them and under the tube), and the
// sling swivel stud under it, with its cross hole
const CLAMP_BACK = 651;
const CLAMP_FACE = 655; // where its back face ends and its side starts
const CLAMP_FRONT = 668;
const CLAMP_BOTTOM = 96.6;
// Its back face: a dark band from the barrel's underside to its bottom, drawn under the barrel and the tube so
// it only shows between them and under the tube
const CLAMP_BACK_FACE = rounded(
  [
    [CLAMP_BACK, BARREL_BOTTOM_FRONT - 1],
    [CLAMP_FRONT - 1, BARREL_BOTTOM_FRONT - 1],
    [CLAMP_FRONT - 1, CLAMP_BOTTOM - 0.4],
    [CLAMP_BACK, CLAMP_BOTTOM - 0.4],
  ],
  [0, 0, 1, 1],
);
// Its side in three parts: a ring round the barrel, a web filling the gap, and a ring round the tube with a
// boss under it for the stud
const CLAMP_RING_PROUD = 0.3;
const CLAMP_BARREL_RING = rounded(
  [
    [CLAMP_FACE, BARREL_TOP_FRONT - CLAMP_RING_PROUD],
    [CLAMP_FRONT, BARREL_TOP_FRONT - CLAMP_RING_PROUD],
    [CLAMP_FRONT, BARREL_BOTTOM_FRONT + CLAMP_RING_PROUD],
    [CLAMP_FACE, BARREL_BOTTOM_FRONT + CLAMP_RING_PROUD],
  ],
  [0.5, 0.5, 0, 0],
);
const CLAMP_WEB = `M${CLAMP_FACE},${BARREL_BOTTOM_FRONT} L${CLAMP_FRONT},${BARREL_BOTTOM_FRONT} L${CLAMP_FRONT},${TUBE_TOP} L${CLAMP_FACE},${TUBE_TOP} Z`;
const CLAMP_TUBE_RING = rounded(
  [
    [CLAMP_FACE, TUBE_TOP - CLAMP_RING_PROUD],
    [CLAMP_FRONT, TUBE_TOP - CLAMP_RING_PROUD],
    [CLAMP_FRONT, CLAMP_BOTTOM],
    [CLAMP_FACE, CLAMP_BOTTOM],
  ],
  [0, 0, 1.2, 0.6],
);
/** The whole clamp's silhouette, for the outline */
const CLAMP = rounded(
  [
    [CLAMP_FACE, BARREL_TOP_FRONT - CLAMP_RING_PROUD],
    [CLAMP_FRONT, BARREL_TOP_FRONT - CLAMP_RING_PROUD],
    [CLAMP_FRONT, CLAMP_BOTTOM],
    [CLAMP_BACK, CLAMP_BOTTOM - 0.4],
    [CLAMP_BACK, TUBE_BOTTOM],
    [CLAMP_FACE, TUBE_BOTTOM],
  ],
  [0.5, 0.5, 1.2, 1, 0, 0],
);
const CLAMP_SCREW: Point = [661.5, 73.8];
const STUD_X = 659.8;
const STUD = rounded(
  [
    [STUD_X - 1.6, CLAMP_BOTTOM - 0.5],
    [STUD_X + 1.6, CLAMP_BOTTOM - 0.5],
    [STUD_X + 1.6, 98.6],
    [STUD_X + 3, 99.4],
    [STUD_X + 3, 104.3],
    [STUD_X - 3, 104.3],
    [STUD_X - 3, 99.4],
    [STUD_X - 1.6, 98.6],
  ],
  [0, 0, 0.4, 0.6, 2.2, 2.2, 0.6, 0.4],
);
const STUD_HOLE: Point = [STUD_X, 101.8];
const STUD_HOLE_R = 1;
/** The stud with its cross hole cut through it (a hole) */
const STUD_WITH_HOLE = `${STUD} M${fmt(on(STUD_HOLE, STUD_HOLE_R, 0))} ${arc(STUD_HOLE, STUD_HOLE_R, 0, 360)} Z`;

// The action bars, between the barrel and the tube from the receiver into the pump
const PUMP_BACK = 464.5;
const ACTION_BAR_TOP = 74.2;
const ACTION_BAR_BOTTOM = 80.4;
const FAR_BAR = `M${RECEIVER_FRONT - 2},${BARREL_BOTTOM_BACK - 1} L${PUMP_BACK + 2},${BARREL_BOTTOM_BACK - 1} L${PUMP_BACK + 2},${TUBE_TOP + 2} L${RECEIVER_FRONT - 2},${TUBE_TOP + 2} Z`;
const ACTION_BAR = `M${RECEIVER_FRONT - 2},${ACTION_BAR_TOP} L${PUMP_BACK + 2},${ACTION_BAR_TOP} L${PUMP_BACK + 2},${ACTION_BAR_BOTTOM} L${RECEIVER_FRONT - 2},${ACTION_BAR_BOTTOM} Z`;

// ---------------------------------------------------------------------------------------------------------
// The pump: a smooth band along its top, ribs down its side

const PUMP_TOP = 68.3;
const PUMP_BOTTOM = 100.1;
const PUMP_LIP_BACK = 462; // its back's lower edge reaches back this far
const PUMP_LIP_TOP = 93;
const RIBS_TOP = 79.3; // where the ribs start under the smooth band
const RIB_COUNT = 23;
const PUMP_SHAPE = rounded(
  [
    [PUMP_BACK, PUMP_TOP],
    [PUMP_FRONT, PUMP_TOP],
    [PUMP_FRONT, PUMP_BOTTOM],
    [PUMP_LIP_BACK, PUMP_BOTTOM],
    [PUMP_LIP_BACK, PUMP_LIP_TOP],
    [PUMP_BACK, PUMP_LIP_TOP],
  ],
  [1, 2.6, 2.4, 1.6, 0.8, 0],
);

function pump(P: Material, rim: number): string {
  const first = PUMP_BACK + 3.2;
  const last = PUMP_FRONT - 3.2;
  const pitch = (last - first) / (RIB_COUNT - 1);
  const grooves: string[] = [];
  for (let i = 0; i < RIB_COUNT; i++) {
    const x = first + i * pitch;
    // A groove: its shadowed back wall, and its lit front lip
    grooves.push(
      `<path d="M${f1(x - 0.8)},${RIBS_TOP + 1.5} L${f1(x + 0.8)},${RIBS_TOP + 1.5} L${f1(x + 0.8)},${PUMP_BOTTOM + 1} L${f1(x - 0.8)},${PUMP_BOTTOM + 1} Z" fill="${P.dark}"/>`,
      `<path d="M${f1(x + 1.1)},${RIBS_TOP + 2.2} L${f1(x + 1.1)},${PUMP_BOTTOM - 0.8}" stroke="${P.light}" stroke-width="0.6" opacity="0.7" fill="none"/>`,
    );
  }
  return `<g id="remington-870-pump">
    <path d="${PUMP_SHAPE}" fill="url(#remington-870-pump-shading)"/>
    <g clip-path="url(#remington-870-pump-clip)">
      <!-- The ribs' grooves, round its side below the smooth band -->
      ${grooves.join("\n      ")}
      <!-- The smooth band's lower edge, where the ribs start -->
      <path d="M${PUMP_LIP_BACK},${RIBS_TOP + 0.6} L${PUMP_FRONT},${RIBS_TOP + 0.6}" stroke="${P.dark}" stroke-width="1" fill="none"/>
      <path d="M${PUMP_LIP_BACK},${RIBS_TOP - 0.3} L${PUMP_FRONT},${RIBS_TOP - 0.3}" stroke="${P.light}" stroke-width="0.6" fill="none"/>
      <!-- Its back's edge, and the step down to the lip -->
      <path d="M${PUMP_BACK + 0.4},${PUMP_TOP + 1} L${PUMP_BACK + 0.4},${PUMP_LIP_TOP}" stroke="${P.light}" stroke-width="0.7" fill="none"/>
      <!-- The rim light along its top -->
      <path d="M${PUMP_BACK},${PUMP_TOP} L${PUMP_FRONT},${PUMP_TOP}" stroke="${P.highlight}" stroke-width="${f1(rim * 2)}" fill="none"/>
    </g>
  </g>`;
}

// ---------------------------------------------------------------------------------------------------------
// The receiver

const RECEIVER_TOP = 54.6;
const RECEIVER_BOTTOM = 94.6;
const RECEIVER_BACK_TOP: Point = [256.2, 64.3]; // its back edge, against the stock, from the top...
const RECEIVER_BACK_BOTTOM: Point = [263.2, RECEIVER_BOTTOM]; // ...to the bottom
// Its top, rounding down to the back: a smooth curve from the back's top to where it's flat
const RECEIVER_TOP_CURVE: Point[] = [
  RECEIVER_BACK_TOP,
  [266, 59.6],
  [279, 56.1],
  [296, RECEIVER_TOP],
];
const TOP_BAND = 3.8; // how far down the side the top's rounding goes
const RECEIVER =
  `M${fmt(RECEIVER_BACK_BOTTOM)} L${fmt(RECEIVER_BACK_TOP)} ` +
  smoothCurve(RECEIVER_TOP_CURVE, [0.86, -0.5], [1, 0]) +
  ` L${RECEIVER_FRONT - 1},${RECEIVER_TOP} C${RECEIVER_FRONT - 0.4},${RECEIVER_TOP} ${RECEIVER_FRONT},${RECEIVER_TOP + 0.4} ${RECEIVER_FRONT},${RECEIVER_TOP + 1} ` +
  `L${RECEIVER_FRONT},${RECEIVER_BOTTOM - 2} C${RECEIVER_FRONT},${RECEIVER_BOTTOM - 1} ${RECEIVER_FRONT - 0.6},${RECEIVER_BOTTOM - 0.8} ${RECEIVER_FRONT - 1.4},${RECEIVER_BOTTOM - 0.7} ` +
  `L${fmt(RECEIVER_BACK_BOTTOM)} Z`;
// The edge where the top's rounding meets the flat side: the top's curve, TOP_BAND lower
const TOP_EDGE_POINTS: Point[] = RECEIVER_TOP_CURVE.map(([x, y], i) =>
  i === 0 ? [x + 0.9, y + TOP_BAND] : [x, y + TOP_BAND],
);
const TOP_EDGE =
  `M${fmt(TOP_EDGE_POINTS[0])} ` +
  smoothCurve(TOP_EDGE_POINTS, [0.86, -0.5], [1, 0]) +
  ` L${RECEIVER_FRONT},${RECEIVER_TOP + TOP_BAND}`;
const TOP_BAND_SHAPE =
  `M${fmt(RECEIVER_BACK_TOP)} ` +
  smoothCurve(RECEIVER_TOP_CURVE, [0.86, -0.5], [1, 0]) +
  ` L${RECEIVER_FRONT},${RECEIVER_TOP} L${RECEIVER_FRONT},${RECEIVER_TOP + TOP_BAND} L${fmt(TOP_EDGE_POINTS[3])} ` +
  smoothCurve([...TOP_EDGE_POINTS].reverse(), [-1, 0], [-0.86, 0.5]) +
  " Z";

// The ejection port: a true pill, and the bolt in it
const PORT_BACK = 332;
const PORT_FRONT = 383.5;
const PORT_TOP = 59.5;
const PORT_BOTTOM = 74.5;
const PORT_R = (PORT_BOTTOM - PORT_TOP) / 2;
const PORT = rounded(
  [
    [PORT_BACK, PORT_TOP],
    [PORT_FRONT, PORT_TOP],
    [PORT_FRONT, PORT_BOTTOM],
    [PORT_BACK, PORT_BOTTOM],
  ],
  [PORT_R, PORT_R, PORT_R, PORT_R],
);
const EXTRACTOR: Point = [379.4, 65.6];

// The trigger plate's pins through the side
const PINS: Point[] = [
  [272.5, 86],
  [307.5, 86],
];
const PIN_R = 1.8;

// ---------------------------------------------------------------------------------------------------------
// The trigger plate, the trigger and the safety

const PLATE_TOP = RECEIVER_BOTTOM - 2; // up inside the receiver
const PLATE_FRONT: Point = [331, RECEIVER_BOTTOM - 0.2];
// Round the back of the guard, along its bottom and up its front slope to the receiver
const PLATE_EDGE: Point[] = [
  [260.6, 96.2],
  [262.2, 102.5],
  [264.4, 110.4],
  [268.6, 113.2],
  [280, 113.8],
  [292, 112.7],
  [299, 111],
  [304.6, 107.4],
  [311, 103.3],
  [317.2, 100.1],
  [323.5, 98.2],
  PLATE_FRONT,
];
// The guard's opening (a hole): round at the back and the front, flat along its top under the receiver
const OPENING: Point[] = [
  [279, 96.3],
  [292, 96.6],
  [298.4, 99.6],
  [299.7, 104.2],
  [297.8, 109.6],
  [290.5, 112.2],
  [279.5, 112.3],
  [272.4, 110],
  [270.3, 105],
  [272.6, 99.8],
  [279, 96.3],
];
const OPENING_PATH =
  `M${fmt(OPENING[0])} ` + smoothCurve(OPENING, [1, 0.02], [1, 0.02]) + " Z";
const PLATE =
  `M${PLATE_EDGE[0][0] + 0.4},${PLATE_TOP} L${fmt(PLATE_EDGE[0])} ` +
  smoothCurve(PLATE_EDGE, [0.25, 1], [0.95, -0.3]) +
  ` L${PLATE_FRONT[0] + 1},${PLATE_TOP} Z ${OPENING_PATH}`;
// A lit line round the bottom of the opening (its lower edge, rounded, faces up into the light)
const OPENING_LIT =
  `M${fmt(OPENING[3])} ` +
  smoothCurve(OPENING.slice(3, 9), [-0.3, 1], [-0.4, -1]);
// The trigger: a crescent blade hanging from inside the plate, its tip curling back
const TRIGGER_BACK: Point[] = [
  [277.6, 95],
  [276.6, 98.5],
  [274.2, 102],
  [273.2, 106],
  [273.9, 109.6],
  [275.9, 112.5],
];
const TRIGGER_FRONT: Point[] = [
  [276.9, 112.1],
  [275.2, 109.4],
  [274.7, 106],
  [275.7, 102.4],
  [278.1, 99],
  [279.2, 95],
];
const TRIGGER =
  `M${fmt(TRIGGER_BACK[0])} ` +
  smoothCurve(TRIGGER_BACK, [-0.3, 1], [0.6, 0.8]) +
  ` C${f1(276.4)},${f1(112.9)} ${f1(277)},${f1(112.6)} ${fmt(TRIGGER_FRONT[0])} ` +
  smoothCurve(TRIGGER_FRONT, [-0.4, -1], [0.3, -1]) +
  " Z";
const SAFETY: Point = [267.6, 99.4];
const SAFETY_R = 2.3;
// A small tab ahead of the guard's front slope, as photographed
const TAB = rounded(
  [
    [313.6, 100.6],
    [318.8, 100.2],
    [318.4, 102.6],
    [314.6, 102.9],
  ],
  [0.4, 0.6, 0.8, 0.8],
);
// And one under the receiver's front, as photographed
const FRONT_TAB = rounded(
  [
    [370.5, RECEIVER_BOTTOM - 1],
    [377.5, RECEIVER_BOTTOM - 1],
    [379.2, RECEIVER_BOTTOM + 1.6],
    [372, RECEIVER_BOTTOM + 0.9],
  ],
  [0, 0.6, 0.6, 0.6],
);

// ---------------------------------------------------------------------------------------------------------
// The stock

// The comb's top: straight from the pad's top corner to the comb's nose, which rounds over and down into the
// wrist; then the grip's top rises into the receiver's back
const COMB_BACK: Point = [31.2, 95.8];
const COMB_NOSE: Point = [186.5, 79.6];
const WRIST_TOP: Point[] = [
  COMB_NOSE,
  [192.5, 80.4],
  [199, 83.6],
  [206, 85.8],
  [214, 84.4],
  [226, 78.9],
  [241, 71.9],
  [RECEIVER_BACK_TOP[0] + 1, RECEIVER_BACK_TOP[1] - 0.6],
];
// The recoil pad's back, leaning back toward the toe
const BUTT_EDGE: Point[] = [
  [28.4, 99.8],
  [28.1, 108],
  [29.4, 125],
  [32.3, 146],
  [35.2, 166],
  [37.3, 181.8],
];
const BUTT_TOE: Point = [39.2, 184];
// The toe: from the pad's bottom, straight (y = 178 - 0.435 (x - 60)) to the grip
const TOE_SLOPE = -0.435;
const toeY = (x: number) => 178 + TOE_SLOPE * (x - 60);
const TOE: Point[] = [BUTT_TOE, [50, 182], [60, toeY(60)], [176, toeY(176)]];
// The pistol grip: its back curving down into the cap, its bottom, and its front curving up into the trigger
// plate (points from the photo's runs)
const GRIP: Point[] = [
  [176, toeY(176)],
  [180.4, 129.4],
  [184, 133.4],
  [191, 136.8],
  [201, 138.9],
  [210.5, 139.8],
  [214.2, 138.4],
  [215.6, 134],
  [217, 129.6],
  [218.4, 125.8],
  [220.2, 122],
  [222.3, 118],
  [225.2, 114],
  [228.4, 110],
  [233, 106],
  [240, 102],
  [251, 98.2],
  [RECEIVER_BACK_BOTTOM[0] - 1, RECEIVER_BACK_BOTTOM[1] + 0.6],
];
const STOCK =
  `M${fmt(RECEIVER_BACK_BOTTOM)} L${fmt([RECEIVER_BACK_BOTTOM[0] + 1.5, RECEIVER_BACK_BOTTOM[1] - 2])} ` +
  `L${fmt([RECEIVER_BACK_TOP[0] + 2.4, RECEIVER_BACK_TOP[1] + 1])} L${fmt(WRIST_TOP[7])} ` +
  smoothCurve([...WRIST_TOP].reverse(), [-0.9, 0.42], [-1, -0.04]) +
  ` L${fmt([COMB_BACK[0] + 2.6, COMB_BACK[1] - 0.3])} C${f1(COMB_BACK[0] + 0.6)},${f1(COMB_BACK[1])} ${f1(BUTT_EDGE[0][0])},${f1(BUTT_EDGE[0][1] - 2.2)} ${fmt(BUTT_EDGE[0])} ` +
  smoothCurve(BUTT_EDGE, [-0.05, 1], [0.12, 1]) +
  ` C${f1(37.5)},${f1(183.2)} ${f1(38.2)},${f1(184.1)} ${fmt(BUTT_TOE)} ` +
  smoothCurve(TOE, [1, -0.1], [1, TOE_SLOPE]) +
  " " +
  smoothCurve(GRIP, [1, TOE_SLOPE], [1, -0.32]) +
  " Z";
// The recoil pad: between the butt's edge and its seam
const PAD_SEAM: [Point, Point] = [
  [45.8, 94.4],
  [55.6, toeY(55.6) + 0.6],
];
const PAD = `M${fmt(PAD_SEAM[0])} L${fmt(PAD_SEAM[1])} L${fmt([30, 190])} L${fmt([20, 190])} L${fmt([20, 90])} Z`;
// The comb's top rolling over: a dark band along it, and the flute at its back
const COMB_ROLL =
  `M${fmt(COMB_BACK)} L${fmt(COMB_NOSE)} L${fmt([COMB_NOSE[0] - 6, COMB_NOSE[1] + 4.4])} ` +
  `L${fmt([100, 96.6])} L${fmt([46, 102])} L${fmt([30, 103.6])} Z`;
const FLUTE: Point[] = [
  [67.5, 96.6],
  [86, 95.4],
  [112, 94.6],
  [92, 100.6],
  [77, 104],
  [69.4, 102.2],
  [67.5, 96.6],
];
const FLUTE_PATH =
  `M${fmt(FLUTE[0])} ` + smoothCurve(FLUTE, [1, -0.05], [-0.2, -1]) + " Z";
// The grip's molded panel: its edge curving down from under the comb's nose to the grip's back, and its lower
// edge across to the grip's front
const PANEL_EDGE: Point[] = [
  [183, 81.6],
  [175.6, 88],
  [172, 97],
  [172.4, 108],
  [176.6, 119],
  [180.6, 126.4],
];
const PANEL_LOWER: [Point, Point] = [
  [180.4, 120.6],
  [201, 102.8],
];
const PANEL =
  `M${fmt(PANEL_EDGE[0])} ` +
  smoothCurve(PANEL_EDGE, [-0.75, 0.66], [0.45, 0.9]) +
  ` L${fmt(PANEL_LOWER[0])} L${fmt(PANEL_LOWER[1])} L${fmt([214, 85])} L${fmt([195, 82])} Z`;
// The swivel stud under the toe
const BUTT_STUD_X = 87.6;
const BUTT_STUD: Point = [BUTT_STUD_X, toeY(BUTT_STUD_X) + 1.4];

function stock(S: Material, pad: Material, rim: number): string {
  const wristRim =
    `M${fmt(COMB_BACK)} L${fmt(COMB_NOSE)} ` +
    smoothCurve(WRIST_TOP, [1, 0.04], [0.9, -0.42]);
  return `<g id="remington-870-stock">
    <path d="${STOCK}" fill="url(#remington-870-stock-shading)"/>
    <g clip-path="url(#remington-870-stock-clip)">
      <!-- The pistol grip's panel, a step up on its side, lit along its edge -->
      <path d="${PANEL}" fill="${S.light}" opacity="0.35"/>
      <path d="M${fmt(PANEL_EDGE[0])} ${smoothCurve(PANEL_EDGE, [-0.75, 0.66], [0.45, 0.9])}" stroke="${S.highlight}" stroke-width="0.9" opacity="0.6" fill="none"/>
      <path d="M${fmt(PANEL_LOWER[0])} L${fmt(PANEL_LOWER[1])}" stroke="${S.highlight}" stroke-width="0.7" opacity="0.4" fill="none"/>
      <!-- The grip cap, a little apart from the grip -->
      <path d="M${f1(179.6)},${f1(128.4)} C${f1(186)},${f1(131.2)} ${f1(200)},${f1(134.4)} ${f1(215.8)},${f1(133.6)}" stroke="${S.dark}" stroke-width="0.8" fill="none"/>
      <!-- The comb's top rolling over, and the flute along it -->
      <path d="${COMB_ROLL}" fill="${S.dark}" opacity="0.75"/>
      <path d="${FLUTE_PATH}" fill="${mix(S.dark, "#000000", 0.4)}"/>
      <path d="M${fmt(FLUTE[3])} ${smoothCurve(FLUTE.slice(3), [-1, 0.3], [-0.2, -1])}" stroke="${S.light}" stroke-width="0.6" fill="none"/>
      <!-- The recoil pad, and its seam -->
      <path d="${PAD}" fill="url(#remington-870-pad-shading)"/>
      <path d="M${fmt(PAD_SEAM[0])} L${fmt(PAD_SEAM[1])}" stroke="${pad.dark}" stroke-width="1" fill="none"/>
      <path d="M${fmt([PAD_SEAM[0][0] + 1, PAD_SEAM[0][1]])} L${fmt([PAD_SEAM[1][0] + 1, PAD_SEAM[1][1]])}" stroke="${S.light}" stroke-width="0.5" opacity="0.6" fill="none"/>
      <!-- The rim light along its top edges -->
      <path d="${wristRim}" stroke="${S.highlight}" stroke-width="${f1(rim * 2)}" fill="none"/>
    </g>
    <!-- The swivel stud under the toe -->
    <circle cx="${f1(BUTT_STUD[0])}" cy="${f1(BUTT_STUD[1])}" r="2" fill="${S.base}"/>
    <circle cx="${f1(BUTT_STUD[0])}" cy="${f1(BUTT_STUD[1])}" r="0.8" fill="${S.highlight}"/>
  </g>`;
}

// ---------------------------------------------------------------------------------------------------------
// Shading

/** A cylinder along the gun (the barrel, the tube), top to bottom: satin, its bands soft, harder with sheen */
function cylinderStops(N: Material, sheen: number): Stops {
  const s = Math.min(sheen, 1);
  const hard = Math.max(0, sheen - 1);
  return [
    [0, mix(N.base, N.dark, 0.55)],
    [0.14, N.base],
    [0.36 - 0.06 * hard, mix(N.base, N.light, s)],
    [0.46, mix(N.base, N.highlight, s)],
    [0.56 + 0.04 * hard, mix(N.base, N.light, s * 0.8)],
    [0.62 + 0.02 * hard, mix(N.base, N.dark, 0.15 + 0.35 * hard)],
    [0.86, mix(N.base, N.dark, 0.35 + 0.3 * hard)],
    [1, N.dark],
  ];
}

/** The receiver's flat side, top to bottom: lit, darkening toward its bottom */
function faceStops(N: Material, sheen: number): Stops {
  const s = Math.min(sheen, 1);
  const hard = Math.max(0, sheen - 1);
  return [
    [0, mix(N.base, N.light, s)],
    [0.45, mix(N.base, N.light, s * (0.7 + 0.3 * hard))],
    [0.55 + 0.1 * hard, mix(N.base, N.light, 0.3 * s)],
    [0.95, mix(N.base, N.dark, 0.2 + 0.3 * hard)],
    [1, mix(N.base, N.dark, 0.5)],
  ];
}

// ---------------------------------------------------------------------------------------------------------
// The outline round the silhouette: each part's shape stroked twice OUTLINE wide under everything, so the parts
// cover the inner half and only the outer half shows, round the gun and in its holes

function outlines(
  N: Material,
  S: Material,
  P: Material,
  T: Material,
  pad: Material,
): string {
  const parts: [string, string][] = [
    [STOCK, S.dark],
    [PLATE, T.dark],
    [TRIGGER, N.dark],
    [RECEIVER, N.dark],
    [BARREL, N.dark],
    [BEAD_BASE, N.dark],
    [TUBE, N.dark],
    [LUG, N.dark],
    [COUPLING, N.dark],
    [CLAMP, N.dark],
    [STUD_WITH_HOLE, N.dark],
    [PUMP_SHAPE, P.dark],
    [TAB, T.dark],
    [FRONT_TAB, T.dark],
  ];
  return `<!-- The outline: each part's shape stroked under everything, so only its outer half shows -->
  <g id="remington-870-outline" fill="none" stroke-width="${fixed(OUTLINE * 2, 2)}">
    ${parts.map(([d, color]) => `<path d="${d}" stroke="${color}"/>`).join("\n    ")}
    <circle cx="${f1(BEAD[0])}" cy="${f1(BEAD[1])}" r="${BEAD_R}" stroke="${N.dark}"/>
    <circle cx="${f1(BUTT_STUD[0])}" cy="${f1(BUTT_STUD[1])}" r="2" stroke="${S.dark}"/>
  </g>`;
}

// ---------------------------------------------------------------------------------------------------------

function drawSide(options: Remington870Options = {}): string {
  const N: Material = { ...SATIN_NICKEL, ...options.nickel };
  const S: Material = { ...BLACK_SYNTHETIC, ...options.stock };
  const P: Material = { ...BLACK_SYNTHETIC, ...options.pump };
  const T: Material = { ...S, ...options.triggerPlate };
  const pad: Material = { ...BLACK_RUBBER, ...options.recoilPad };
  const B: Material = {
    base: mix(N.base, N.light, 0.4),
    dark: N.dark,
    light: mix(N.light, N.highlight, 0.5),
    highlight: "#ffffff",
    ...options.bolt,
  };
  const sheen = options.sheen ?? 1;
  const rim = (options.rimLight ?? RIM_LIGHT_MM) / MM_PER_PX;
  // The stock's shading runs square to the toe, from the comb down to it
  const stockFrom: Point = [100, 88];
  const stockTo: Point = [128, 151.5];
  const tubeX = 500;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="738" height="222" viewBox="0 0 738 222" fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">
  <defs>
    ${linear("remington-870-barrel-shading", [tubeX, BARREL_TOP_FRONT], [tubeX, BARREL_BOTTOM_FRONT], cylinderStops(N, sheen))}
    ${linear("remington-870-tube-shading", [tubeX, TUBE_TOP], [tubeX, TUBE_BOTTOM], cylinderStops(N, sheen))}
    ${linear("remington-870-coupling-shading", [tubeX, TUBE_MID - COUPLING_R], [tubeX, TUBE_MID + COUPLING_R], cylinderStops(N, sheen))}
    ${linear(
      "remington-870-clamp-shading",
      [tubeX, BARREL_TOP_FRONT],
      [tubeX, CLAMP_BOTTOM],
      [
        [0, mix(N.base, N.dark, 0.3)],
        [0.1, mix(N.base, N.light, 0.6)],
        [0.5, N.base],
        [1, mix(N.base, N.dark, 0.5)],
      ],
    )}
    ${linear("remington-870-clamp-tube-shading", [tubeX, TUBE_TOP], [tubeX, CLAMP_BOTTOM], cylinderStops(N, sheen))}
    ${linear(
      "remington-870-bar-shading",
      [tubeX, ACTION_BAR_TOP],
      [tubeX, ACTION_BAR_BOTTOM],
      [
        [0, N.light],
        [0.6, N.base],
        [1, mix(N.base, N.dark, 0.5)],
      ],
    )}
    ${linear("remington-870-receiver-shading", [320, RECEIVER_TOP], [320, RECEIVER_BOTTOM], faceStops(N, sheen))}
    ${linear(
      "remington-870-top-shading",
      [320, RECEIVER_TOP],
      [320, RECEIVER_TOP + TOP_BAND],
      [
        [0, mix(N.base, N.dark, 0.35)],
        [0.6, N.base],
        [1, mix(N.base, N.light, 0.4)],
      ],
    )}
    ${linear(
      "remington-870-bolt-shading",
      [350, PORT_TOP],
      [350, PORT_BOTTOM],
      [
        [0, B.dark],
        [0.22, mix(B.dark, B.base, 0.5)],
        [0.42, B.light],
        [0.55, B.highlight],
        [0.7, B.base],
        [1, mix(B.base, B.dark, 0.6)],
      ],
    )}
    ${linear(
      "remington-870-pump-shading",
      [500, PUMP_TOP],
      [500, PUMP_BOTTOM],
      [
        [0, P.light],
        [0.08, P.base],
        [0.34, mix(P.base, P.dark, 0.3)],
        [0.36, P.base],
        [0.55, mix(P.base, P.light, 0.5)],
        [0.85, P.base],
        [1, P.dark],
      ],
    )}
    ${linear("remington-870-stock-shading", stockFrom, stockTo, [
      [0, S.dark],
      [0.12, S.base],
      [0.5, mix(S.base, S.light, 0.8)],
      [0.85, S.base],
      [1, S.dark],
    ])}
    ${linear(
      "remington-870-pad-shading",
      [28, 140],
      [56, 140],
      [
        [0, pad.dark],
        [0.3, pad.light],
        [0.75, pad.base],
        [1, pad.dark],
      ],
    )}
    ${linear(
      "remington-870-plate-shading",
      [290, 94],
      [290, 114],
      [
        [0, T.dark],
        [0.3, T.base],
        [0.8, mix(T.base, T.light, 0.6)],
        [1, T.base],
      ],
    )}
    <clipPath id="remington-870-stock-clip">
      <path d="${STOCK}"/>
    </clipPath>
    <clipPath id="remington-870-pump-clip">
      <path d="${PUMP_SHAPE}"/>
    </clipPath>
    <clipPath id="remington-870-port-clip">
      <path d="${PORT}"/>
    </clipPath>
    <clipPath id="remington-870-receiver-clip">
      <path d="${RECEIVER}"/>
    </clipPath>
  </defs>
  ${options.outline === false ? "" : outlines(N, S, P, T, pad)}
  <!-- The magazine tube under the barrel, from inside the receiver to the extension's cap behind the muzzle -->
  <!-- The barrel clamp's back face, under the barrel and the tube: it shows between them and under the tube -->
  <path id="remington-870-clamp-back" d="${CLAMP_BACK_FACE}" fill="${mix(N.dark, "#000000", 0.35)}"/>
  <g id="remington-870-magazine-tube">
    <path d="${TUBE}" fill="url(#remington-870-tube-shading)"/>
    <path d="${CAP_LINE}" stroke="${N.dark}" stroke-width="0.5" opacity="0.6" fill="none"/>
  </g>
  <!-- Between the barrel and the tube behind the pump: the far action bar in shadow, and the near one, flat
       nickel lying across the tube's upper side -->
  <g id="remington-870-action-bars">
    <path d="${FAR_BAR}" fill="${mix(N.dark, "#000000", 0.45)}"/>
    <path d="${ACTION_BAR}" fill="url(#remington-870-bar-shading)"/>
    <path d="M${RECEIVER_FRONT},${ACTION_BAR_BOTTOM + 0.4} L${PUMP_BACK},${ACTION_BAR_BOTTOM + 0.4}" stroke="${mix(N.dark, "#000000", 0.3)}" stroke-width="0.9" opacity="0.8" fill="none"/>
  </g>
  <!-- The barrel, out of the receiver's front, the bead at its muzzle -->
  <g id="remington-870-barrel">
    <path d="${BARREL}" fill="url(#remington-870-barrel-shading)"/>
    <path d="M${MUZZLE - 0.7},${BARREL_TOP_FRONT + 1.4} L${MUZZLE - 0.7},${BARREL_BOTTOM_FRONT - 1.4}" stroke="${N.light}" stroke-width="0.6" opacity="0.7" fill="none"/>
    <path d="${BEAD_BASE}" fill="${N.base}"/>
    <circle cx="${f1(BEAD[0])}" cy="${f1(BEAD[1])}" r="${BEAD_R}" fill="${N.light}"/>
    <circle cx="${f1(BEAD[0] - 0.5)}" cy="${f1(BEAD[1] - 0.5)}" r="0.6" fill="${N.highlight}"/>
  </g>
  <!-- The barrel's lug round the tube, and the extension's coupling holding it on -->
  <g id="remington-870-lug">
    <path d="${LUG}" fill="url(#remington-870-clamp-shading)"/>
    <path d="M${LUG_FRONT - 1.5},${BARREL_BOTTOM_FRONT} L${LUG_FRONT - 1.5},${LUG_BOTTOM - 0.6}" stroke="${N.dark}" stroke-width="0.5" opacity="0.6" fill="none"/>
    <path d="${COUPLING}" fill="url(#remington-870-coupling-shading)"/>
  </g>
  <!-- The barrel clamp round both, its back face dark between them and under the tube; the sling swivel stud
       under it, with its cross hole -->
  <g id="remington-870-clamp">
    <path d="${STUD_WITH_HOLE}" fill="url(#remington-870-clamp-shading)"/>
    <path d="${CLAMP_BARREL_RING}" fill="url(#remington-870-barrel-shading)"/>
    <path d="${CLAMP_WEB}" fill="${N.base}"/>
    <path d="${CLAMP_TUBE_RING}" fill="url(#remington-870-clamp-tube-shading)"/>
    <path d="M${CLAMP_FRONT - 0.4},${BARREL_TOP_FRONT + 0.3} L${CLAMP_FRONT - 0.4},${CLAMP_BOTTOM - 0.6}" stroke="${N.dark}" stroke-width="0.5" opacity="0.6" fill="none"/>
    <path d="M${CLAMP_FACE + 0.4},${BARREL_TOP_FRONT + 0.3} L${CLAMP_FACE + 0.4},${CLAMP_BOTTOM - 0.6}" stroke="${N.highlight}" stroke-width="0.5" opacity="0.7" fill="none"/>
    <circle cx="${f1(CLAMP_SCREW[0])}" cy="${f1(CLAMP_SCREW[1])}" r="1.5" fill="${N.dark}"/>
    <circle cx="${f1(CLAMP_SCREW[0])}" cy="${f1(CLAMP_SCREW[1])}" r="0.9" fill="${N.base}"/>
  </g>
  ${pump(P, rim)}
  ${stock(S, pad, rim)}
  <!-- The trigger, behind the plate, showing through the guard -->
  <g id="remington-870-trigger">
    <path d="${TRIGGER}" fill="${mix(N.base, N.dark, 0.35)}"/>
    <path d="M${fmt(TRIGGER_BACK[1])} ${smoothCurve(TRIGGER_BACK.slice(1), [-0.6, 0.8], [0.6, 0.8])}" stroke="${N.highlight}" stroke-width="0.6" fill="none"/>
  </g>
  <!-- The trigger plate: the guard round its opening (a hole), up into the receiver; the crossbolt safety through
       it, and a tab ahead of the guard -->
  <g id="remington-870-trigger-plate">
    <path d="${TAB}" fill="${T.light}"/>
    <path d="${PLATE}" fill="url(#remington-870-plate-shading)"/>
    <path d="${OPENING_LIT}" stroke="${T.highlight}" stroke-width="0.7" opacity="0.6" fill="none"/>
    <circle cx="${f1(SAFETY[0])}" cy="${f1(SAFETY[1])}" r="${SAFETY_R}" fill="${T.dark}"/>
    <circle cx="${f1(SAFETY[0] - 0.3)}" cy="${f1(SAFETY[1] - 0.3)}" r="${SAFETY_R - 0.6}" fill="${T.light}"/>
  </g>
  <path id="remington-870-front-tab" d="${FRONT_TAB}" fill="${T.base}"/>
  <!-- The receiver: its flat side, the top rounding over, the ejection port with the bolt in it, the trigger
       plate's pins -->
  <g id="remington-870-receiver">
    <path d="${RECEIVER}" fill="url(#remington-870-receiver-shading)"/>
    <g clip-path="url(#remington-870-receiver-clip)">
      <path d="${TOP_BAND_SHAPE}" fill="url(#remington-870-top-shading)"/>
      <path d="${TOP_EDGE}" stroke="${N.highlight}" stroke-width="0.7" fill="none"/>
      <!-- Its back edge against the stock, and its bottom edge, in shadow -->
      <path d="M${fmt(RECEIVER_BACK_TOP)} L${fmt(RECEIVER_BACK_BOTTOM)}" stroke="${N.dark}" stroke-width="1" opacity="0.6" fill="none"/>
      <path d="M${RECEIVER_BACK_BOTTOM[0]},${RECEIVER_BOTTOM - 0.4} L${RECEIVER_FRONT},${RECEIVER_BOTTOM - 0.4}" stroke="${N.dark}" stroke-width="1" opacity="0.5" fill="none"/>
      <!-- Its front edge, lit -->
      <path d="M${RECEIVER_FRONT - 0.5},${RECEIVER_TOP + 1} L${RECEIVER_FRONT - 0.5},${RECEIVER_BOTTOM - 1.5}" stroke="${N.light}" stroke-width="0.7" fill="none"/>
    </g>
    <path id="remington-870-port" d="${PORT}" fill="url(#remington-870-bolt-shading)"/>
    <!-- The port's top edge casting its shadow in, and its bottom edge lit -->
    <path d="M${PORT_BACK},${PORT_TOP + 0.8} L${PORT_FRONT},${PORT_TOP + 0.8}" stroke="${mix(N.dark, "#000000", 0.4)}" stroke-width="2" opacity="0.75" fill="none" clip-path="url(#remington-870-port-clip)"/>
    <path d="${PORT}" stroke="${N.dark}" stroke-width="0.8" fill="none"/>
    <path d="M${PORT_BACK + PORT_R},${PORT_BOTTOM + 0.6} L${PORT_FRONT - PORT_R},${PORT_BOTTOM + 0.6}" stroke="${N.highlight}" stroke-width="0.6" opacity="0.8" fill="none"/>
    <circle cx="${f1(EXTRACTOR[0])}" cy="${f1(EXTRACTOR[1])}" r="1.3" fill="${mix(N.dark, "#000000", 0.4)}"/>
    <circle cx="${f1(EXTRACTOR[0] - 0.3)}" cy="${f1(EXTRACTOR[1] - 0.3)}" r="0.5" fill="${N.highlight}"/>
    <g id="remington-870-pins">
      ${PINS.map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${PIN_R}" fill="${mix(N.base, N.dark, 0.45)}"/>\n      <circle cx="${f1(x - 0.3)}" cy="${f1(y - 0.3)}" r="${PIN_R - 0.7}" fill="${N.base}"/>`).join("\n      ")}
    </g>
  </g>
</svg>`;
}

export const REMINGTON_870: GunDrawing<Remington870Options> = {
  name: "remington-870",
  photo: {
    file: "remington-870-marine.jpeg",
    width: 738,
    height: 222,
    about:
      "The 870 Marine Magnum from its right side, muzzle to the right, on white: small (about 1.44 mm a pixel)",
  },
  otherPhotos: [
    {
      file: "remington-870-black-and-wood.jpg",
      width: 1200,
      height: 312,
      about:
        "An 870 Express with a blued receiver and wooden stock and pump, a long barrel with a vent rib: the receiver, trigger group and stock's shapes at a better size (and a finish for a skin later)",
    },
    {
      file: "remington-870-tactical.jpg",
      width: 1000,
      height: 244,
      about:
        "A tactical 870 with a Magpul stock and pump: same receiver (and a finish for a skin later)",
    },
  ],
  // The origin on the middle of the gun's length on the bore, and 978 mm (38.5") over the 677 px from the
  // recoil pad's back to the muzzle
  scale: {
    origin: [(BUTT_BACK + MUZZLE + 0.2) / 2, BORE_Y],
    mmPerPixel: MM_PER_PX,
  },
  // The bead's top, the butt's toe, the recoil pad's back, the muzzle; a meter square
  frame: {
    top: 52,
    bottom: 184.5,
    back: BUTT_BACK,
    front: MUZZLE + 0.2,
    side: 1000,
    pixels: 512,
  },
  comment: `
  <!-- The Remington 870 Marine Magnum from its right side, muzzle to the right: electroless nickel receiver,
       barrel and magazine tube with its extension and barrel clamp, black synthetic stock and ribbed pump, an
       18" barrel. Millimeters, with the origin on the gun's middle on the bore, as the guns' top views in
       weapons/guns/art/ have it; drawn over a photo, then simplified. -->`,
  drawSide,
};
