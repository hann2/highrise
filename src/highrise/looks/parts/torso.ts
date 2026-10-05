import { BodyLook, TopStyle } from "../BodyLook";
import { Color, darken, lighten } from "../color";
import {
  BELLY_DEPTH,
  BUST_DEPTH,
  BodyDimensions,
  lookRandom,
  palette,
  wobble,
} from "../dimensions";
import {
  capsulePath,
  Drawing,
  ellipsePath,
  ellipsePoints,
  n,
  polygonPath,
  Pt,
  smoothPath,
} from "../svg";
import { drawBlood, drawGrime, drawPattern, drawRips } from "./wear";
import { drawPiece, piecePlace } from "../pieces";
import { STYLE } from "../style";

/** Tops that leave the shoulders to what's under them: skin, or the secondary's shirt */
const BANDED: Partial<Record<TopStyle, number>> = {
  tank: 0.5,
  vest: 0.62,
};

/** Tops with a collar that stands up round the back of the neck */
const COLLARED: TopStyle[] = ["shirt", "polo", "jacket", "coat"];

/** What shows on the shoulders: the top, or under it */
function shoulderColor(look: BodyLook, skin: Color): Color {
  switch (look.top.style) {
    case "tank":
      return skin;
    case "vest":
    case "overalls":
      return look.top.secondary;
    default:
      return look.top.color;
  }
}

/**
 * The torso from above, facing +x, round its middle: the chest and back,
 * and a rounded cap at each shoulder where the arm joins, blended together
 * so there's a slight groove between them at the front. Also the part of it
 * that's lit from straight above (`lit`): the ridge of the shoulders, from
 * which the chest falls away in front and the shoulder blades behind.
 */
export function torsoProfile(
  dims: BodyDimensions,
  count = 48,
): { outline: Pt[]; lit: Pt[] } {
  const {
    shoulderHalfWidth: w,
    chestDepth,
    backDepth,
    belly,
    bust,
    hunch,
    squareness,
    armThickness,
  } = dims;
  // The chest is a superellipse a little narrower than the shoulders
  const capRadius = armThickness * 0.62;
  const chestHalf = w - capRadius * 0.8;
  const p = squareness;
  const chest = (y: number, depth: number) => {
    const u = Math.min(1, Math.abs(y) / chestHalf);
    return depth * (1 - u ** p) ** (1 / p);
  };
  // Each shoulder's cap is a circle at the end, as deep as the arm
  const capY = w - capRadius;
  const cap = (y: number, side: 1 | -1) => {
    const dy = Math.abs(y) - capY;
    if (dy <= -capRadius * 3) {
      return -Infinity;
    }
    const along = Math.max(0, capRadius ** 2 - Math.max(0, dy) ** 2);
    return side * Math.sqrt(along);
  };
  // Blends two edges, rounding the corner where they meet
  const smoothMax = (a: number, b: number, k = 30) =>
    a === -Infinity ? b : (a + b + Math.sqrt((a - b) ** 2 + k * k)) / 2;
  // How big the belly is, from 0 to 1: the front rounds out toward a half
  // ellipse as deep as the chest and belly together, so a big belly makes
  // the body rounder, not just deeper or broader
  const round = Math.min(1, (belly / BELLY_DEPTH) * 1.2);

  const front: Pt[] = [];
  const back: Pt[] = [];
  const litFront: Pt[] = [];
  const litBack: Pt[] = [];
  for (let i = 0; i <= count; i++) {
    // Closer together at the ends, where it curves most
    const y = -w * Math.cos((Math.PI * i) / count);
    const across = Math.sqrt(Math.max(0, 1 - (y / w) ** 2));
    let f = smoothMax(cap(y, 1), chest(y, chestDepth));
    let b = -smoothMax(cap(y, 1), chest(y, backDepth));
    f += ((chestDepth + belly) * across - f) * round;
    f += belly * (1 - round) * across;
    f += bust * bustBumps(y, w);
    const backRound = 0.6 * round;
    b += (-(backDepth + 0.35 * belly) * across - b) * backRound;
    b -= 0.35 * belly * across * (1 - backRound);
    const bend = hunch * (y / w) ** 2;
    // At the very ends the front and back meet
    if (i === 0 || i === count) {
      f = b = (f + b) / 2;
    }
    front.push([f + bend, y]);
    back.push([b + bend, y]);
    // The ridge runs a little behind the middle; the lit part is most of
    // the way to each edge, less at the front, which falls away sooner
    const ridge = b + (f - b) * 0.45;
    litFront.push([ridge + (f - ridge) * 0.55 + bend, y]);
    litBack.push([ridge + (b - ridge) * 0.62 + bend, y]);
  }
  return {
    outline: [...front, ...back.slice(1, -1).reverse()],
    lit: [...litFront, ...litBack.slice(1, -1).reverse()],
  };
}

/**
 * Light from above over the whole torso, patterns and all: in cel, the
 * chest and shoulder blades in shadow beyond the lit ridge of the shoulders
 */
function drawTorsoShading(d: Drawing, shape: string, lit: Pt[]) {
  if (STYLE.shading === "cel") {
    // Everything outside the lit part, by the even-odd rule
    d.add(
      `<path d="${shape} ${smoothPath(lit)}" fill="#000" fill-opacity="${STYLE.shadow}" fill-rule="evenodd"/>`,
    );
  } else if (STYLE.shading !== "flat") {
    d.add(`<path d="${shape}" fill="url(#${d.shadeGradient("dome")})"/>`);
  }
}

/** The outline of the torso from above, facing +x, round its middle */
export function torsoOutline(dims: BodyDimensions): Pt[] {
  return torsoProfile(dims).outline;
}

/** Where the middle of each side of the bust is, and its half-width, as fractions of the shoulders' half-width */
const BUST_SIDE = 0.33;
const BUST_SPREAD = 0.27;

/** How far out the bust is (0 to 1 of its depth) at `y` across the chest: two round mounds */
function bustBumps(y: number, w: number): number {
  const mound = (side: number) => {
    const u = (y - side * BUST_SIDE * w) / (BUST_SPREAD * w);
    return Math.abs(u) < 1 ? (1 - u * u) ** 0.65 : 0;
  };
  return Math.max(mound(-1), mound(1));
}

/** Shading that rounds out the bust: a shadow down its outer side, a highlight on top */
function drawBustShading(
  d: Drawing,
  dims: BodyDimensions,
  color: Color,
  clip: string,
) {
  const w = dims.shoulderHalfWidth;
  const depth = dims.bust;
  d.begin(`clip-path="url(#${clip})"`);
  for (const side of [-1, 1]) {
    const cy = side * BUST_SIDE * w;
    const r = BUST_SPREAD * w;
    const front = dims.chestDepth + depth;
    // Underneath and to the outside, where it meets the ribs
    d.line(
      `M${n(dims.chestDepth * 0.35)} ${n(cy + side * r * 0.95)}Q${n(front * 0.92)} ${n(cy + side * r * 1.05)} ${n(front * 0.98)} ${n(cy + side * r * 0.2)}`,
      darken(color, 0.35),
      10,
      `opacity="${n(0.25 + 0.35 * (depth / BUST_DEPTH))}"`,
    );
    d.add(
      `<ellipse cx="${n(front - depth * 0.55 - 10)}" cy="${n(cy - side * r * 0.1)}" rx="${n(depth * 0.45 + 12)}" ry="${n(r * 0.42)}" fill="${lighten(color, 0.25)}" opacity="${n(0.12 + 0.12 * (depth / BUST_DEPTH))}"/>`,
    );
  }
  // Between them
  d.line(
    `M${n(dims.chestDepth * 0.6)} 0L${n(dims.chestDepth + depth * 0.5)} 0`,
    darken(color, 0.4),
    7,
    `opacity="0.45"`,
  );
  d.end();
}

/**
 * The torso from above, facing +x, its middle at the origin. The head
 * covers the middle of it, so what shows is the shoulders, the back of the
 * collar, and the front if there's a belly.
 */
export function drawTorso(
  look: BodyLook,
  dims: BodyDimensions,
  prefix: string,
): Drawing {
  const colors = palette(look);
  const random = lookRandom(look, 2);
  const top = look.top;
  const w = dims.shoulderHalfWidth;
  const { outline, lit } = torsoProfile(dims);
  const shape = smoothPath(outline);
  const d = new Drawing(prefix, 0, 0, 0, 0);
  d.includePoints(outline);
  const torso = d.clipPath("torso", shape);

  // Behind: a hood, a sack
  if (look.extras.some((e) => e.kind === "sack")) {
    drawSack(
      d,
      look.extras.find((e) => e.kind === "sack")!.color,
      dims,
      random,
    );
  }

  // What's under the top, then the top
  const band = BANDED[top.style];
  d.blob(shape, band ? shoulderColor(look, colors.skin) : top.color, {
    shade: "flat",
  });
  let garment = torso;
  if (band || top.style === "overalls") {
    const half = band ? w * band : w * 0.36;
    const front = top.style === "overalls" ? 40 : -999;
    garment = d.clipPath(
      "garment",
      polygonPath([
        [-999, -half],
        [999, -half],
        [999, half],
        [-999, half],
      ]),
    );
    d.begin(`clip-path="url(#${torso})"`);
    if (top.style === "overalls") {
      // Straps over the shoulders and a bib in front
      for (const side of [-1, 1]) {
        d.blob(capsulePath(-400, 400, side * half * 0.95, 52), top.color, {
          shade: "tube",
        });
      }
      d.blob(
        polygonPath([
          [front, -half],
          [400, -half],
          [400, half],
          [front, half],
        ]),
        top.color,
        {},
      );
      for (const side of [-1, 1]) {
        d.add(
          `<circle cx="${n(front + 22)}" cy="${n(side * half * 0.95)}" r="11" fill="#c9b47a" stroke="#6b5a2a" stroke-width="4"/>`,
        );
      }
    } else {
      d.blob(
        polygonPath([
          [-999, -half],
          [999, -half],
          [999, half],
          [-999, half],
        ]),
        top.color,
        { clip: torso },
      );
      if (top.style === "vest") {
        // Reflective stripes
        for (const side of [-1, 1]) {
          d.add(
            `<rect x="-400" y="${n(side * half * 0.62 - 14)}" width="800" height="28" fill="${lighten(top.color, 0.65)}" opacity="0.85"/>`,
          );
        }
      }
    }
    d.end();
  }
  if (top.pattern) {
    const patterned =
      band || top.style === "overalls"
        ? garment
        : d.clipPath("patterned", shape);
    d.begin(`clip-path="url(#${torso})"`);
    drawPattern(d, top.pattern, patterned);
    d.end();
  }
  // Shading again over the pattern and bands
  drawTorsoShading(d, shape, lit);
  if (dims.bust > 0) {
    drawBustShading(d, dims, top.color, torso);
  }

  // Details
  const sleeveSeams = top.style !== "tank" && look.sleeves.length > 0.05;
  if (sleeveSeams) {
    for (const side of [-1, 1]) {
      const y = side * (w - dims.armThickness * 0.9);
      d.line(
        `M${n(-dims.backDepth * 0.75)} ${n(y + side * 8)}Q0 ${n(y - side * 10)} ${n(dims.chestDepth * 0.75)} ${n(y + side * 8)}`,
        darken(shoulderColor(look, colors.skin), 0.35),
        6,
        `opacity="0.7"`,
      );
    }
  }
  const neck = dims.headRy * 1.06;
  if (top.style === "polo") {
    // The placket down the front, with its buttons
    d.line(
      `M${n(neck * 0.8)} 0L${n(dims.chestDepth + dims.bust + 20)} 0`,
      darken(top.color, 0.3),
      6,
      `opacity="0.7"`,
    );
    for (const x of [neck * 0.95, neck * 1.12]) {
      d.add(
        `<circle cx="${n(x)}" cy="0" r="7" fill="${lighten(top.color, 0.5)}" stroke="${darken(top.color, 0.4)}" stroke-width="3"/>`,
      );
    }
  }
  if (COLLARED.includes(top.style) && !top.popped) {
    // The collar standing up round the back of the neck
    const collar = top.style === "coat" ? top.secondary : top.color;
    d.line(
      `M${n(neck * 0.35)} ${n(-neck * 0.98)}A${n(neck)} ${n(neck)} 0 0 0 ${n(neck * 0.35)} ${n(neck * 0.98)}`,
      darken(collar, 0.45),
      34,
    );
    d.line(
      `M${n(neck * 0.35)} ${n(-neck * 0.98)}A${n(neck)} ${n(neck)} 0 0 0 ${n(neck * 0.35)} ${n(neck * 0.98)}`,
      lighten(collar, 0.06),
      22,
    );
  }
  if (top.style === "jacket" || top.style === "coat") {
    const inner = top.style === "jacket" ? top.secondary : top.secondary;
    const v = d.clipPath(
      "v",
      polygonPath([
        [30, 0],
        [600, -380],
        [600, 380],
      ]),
    );
    if (top.style === "jacket") {
      d.begin(`clip-path="url(#${torso})"`);
      d.blob(
        polygonPath([
          [30, 0],
          [600, -380],
          [600, 380],
        ]),
        inner,
        { clip: v },
      );
      d.end();
      // Lapels
      for (const side of [-1, 1]) {
        d.line(
          `M${n(40)} ${n(side * 8)}L${n(300)} ${n(side * 180)}`,
          darken(top.color, 0.4),
          10,
        );
        d.line(
          `M${n(110)} ${n(side * 120)}L${n(150)} ${n(side * 62)}`,
          darken(top.color, 0.3),
          7,
        );
      }
    } else {
      // A coat's trim down the front
      d.begin(`clip-path="url(#${torso})"`);
      d.blob(capsulePath(0, 600, 0, 46), inner, { outline: 5 });
      d.end();
    }
  }
  if (top.style === "shirt") {
    const pocketY = -w * 0.62;
    d.blob(
      polygonPath([
        [25, pocketY - 45],
        [dims.chestDepth * 0.85, pocketY - 45],
        [dims.chestDepth * 0.85, pocketY + 45],
        [25, pocketY + 45],
      ]),
      top.color,
      { shade: "flat", outline: 6, clip: torso },
    );
    for (const side of [-1, 1]) {
      d.blob(
        polygonPath([
          [neck * 0.55, side * neck * 0.82],
          [neck * 1.05, side * neck * 0.62],
          [neck * 0.8, side * neck * 1.02],
        ]),
        lighten(top.color, 0.08),
        { shade: "flat", outline: 6 },
      );
    }
  }
  if (top.style === "sweater" || top.style === "tshirt") {
    d.add(
      `<path d="${ellipsePath(0, 0, neck * 0.98, neck * 0.98)}" fill="none" stroke="${darken(top.color, 0.25)}" stroke-width="16" opacity="0.8"/>`,
    );
  }

  // Wear and tear
  const onShoulders = (): Pt => {
    const side = random() < 0.5 ? -1 : 1;
    return [
      (random() - 0.5) * (dims.chestDepth + dims.backDepth) * 0.9,
      side * w * (0.45 + random() * 0.45),
    ];
  };
  drawRips(d, look, colors.skin, top.color, garment, onShoulders, random);
  drawBlood(d, look, torso, onShoulders, random);
  drawGrime(d, look, torso);

  // Things worn over the top
  for (const extra of look.extras) {
    drawExtra(d, extra.kind, extra.color, dims, torso, random);
  }

  d.outline(shape, band ? shoulderColor(look, colors.skin) : top.color);
  // Over the outline: a popped collar stands round the neck, and the hood
  // lies on the back and shoulders
  if (COLLARED.includes(top.style) && top.popped) {
    drawPoppedCollar(
      d,
      top.style === "coat" ? top.secondary : top.color,
      dims.headRy * 1.06,
    );
  }
  if (top.style === "hoodie") {
    // The hood bunched up behind the neck, and its strings in front
    const hood = ellipsePoints(
      -neck * 0.95,
      0,
      95,
      neck * 1.05,
      24,
      (a) => 0.05 * Math.sin(a * 5),
    );
    d.blob(smoothPath(hood), darken(top.color, 0.05), {});
    d.blob(
      ellipsePath(-neck * 0.75, 0, 40, neck * 0.7),
      darken(top.color, 0.4),
      {
        shade: "flat",
        outline: 0,
      },
    );
    for (const side of [-1, 1]) {
      d.line(
        `M${n(neck * 0.8)} ${n(side * 30)}L${n(dims.chestDepth + 30)} ${n(side * 38)}`,
        lighten(top.color, 0.5),
        7,
      );
    }
  }
  for (const piece of look.pieces ?? []) {
    if (piecePlace(piece.name) === "torso") {
      drawPiece(d, piece.name, piece.color, piece.secondary);
    }
  }
  return d;
}

/**
 * A collar turned up: a band standing round the neck from behind, wider
 * than the head, its points flaring out at the front
 */
function drawPoppedCollar(d: Drawing, color: Color, neck: number) {
  const start = (50 * Math.PI) / 180;
  const steps = 20;
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = start + ((Math.PI * 2 - 2 * start) * i) / steps;
    // Taller toward the front, where the points are
    const front = Math.max(0, Math.cos(a));
    const r = neck * (1.38 + 0.22 * front);
    outer.push([Math.cos(a) * r, Math.sin(a) * r]);
    inner.push([Math.cos(a) * neck * 0.94, Math.sin(a) * neck * 0.94]);
  }
  const tip = (side: number): Pt => [
    Math.cos(start - 0.18) * neck * 1.62,
    side * Math.sin(start - 0.18) * neck * 1.62,
  ];
  // Out from one point, round the back to the other, and in along the neck
  const shape = smoothPath(
    [tip(1), ...outer, tip(-1), ...inner.slice().reverse()],
    true,
    0.5,
  );
  d.include(-neck * 1.65, -neck * 1.65, neck * 1.65, neck * 1.65);
  d.blob(shape, lighten(color, 0.04), { shade: "flat" });
  // The inside of the band, in shadow, and where it folds
  d.line(
    smoothPath(inner, false, 0.6),
    darken(color, 0.35),
    16,
    `opacity="0.6"`,
  );
  const fold = outer.map(([x, y]): Pt => [x * 0.82, y * 0.82]);
  d.line(smoothPath(fold, false, 0.6), darken(color, 0.25), 6, `opacity="0.6"`);
}

function drawSack(
  d: Drawing,
  color: Color,
  dims: BodyDimensions,
  random: () => number,
) {
  const cx = -dims.backDepth - 95;
  const cy = -dims.shoulderHalfWidth * 0.5;
  const wave = wobble(random, 4, 3);
  const points = ellipsePoints(cx, cy, 175, 165, 24, (a) => 0.07 * wave(a));
  d.includePoints(points);
  d.blob(smoothPath(points), color, {});
  // Folds gathered up toward the neck of it
  for (let i = 0; i < 5; i++) {
    const angle = Math.PI * (0.9 + i * 0.12);
    d.line(
      `M${n(cx + 40)} ${n(cy + 20)}Q${n(cx + Math.cos(angle) * 60)} ${n(cy + Math.sin(angle) * 40)} ${n(cx + Math.cos(angle) * 150)} ${n(cy + Math.sin(angle) * 140)}`,
      darken(color, 0.3),
      7,
      `opacity="0.5"`,
    );
  }
  d.line(
    `M${n(cx + 60)} ${n(cy + 60)}L${n(cx + 140)} ${n(cy + 120)}`,
    darken(color, 0.5),
    18,
  );
}

function drawExtra(
  d: Drawing,
  kind: BodyLook["extras"][number]["kind"],
  color: Color,
  dims: BodyDimensions,
  torso: string,
  random: () => number,
) {
  const w = dims.shoulderHalfWidth;
  const neck = dims.headRy * 1.06;
  switch (kind) {
    case "backpack": {
      const x0 = -dims.backDepth - 85;
      d.include(x0, -w * 0.55, 0, w * 0.55);
      for (const side of [-1, 1]) {
        d.blob(
          capsulePath(
            -dims.backDepth * 0.6,
            dims.chestDepth * 0.9,
            side * w * 0.45,
            40,
          ),
          darken(color, 0.2),
          { shade: "tube", clip: torso },
        );
      }
      const pack = `M${n(x0 + 40)} ${n(-w * 0.52)}L${n(-dims.backDepth + 55)} ${n(-w * 0.55)}Q${n(-dims.backDepth + 75)} 0 ${n(-dims.backDepth + 55)} ${n(w * 0.55)}L${n(x0 + 40)} ${n(w * 0.52)}Q${n(x0 - 10)} 0 ${n(x0 + 40)} ${n(-w * 0.52)}Z`;
      d.blob(pack, color, {});
      d.blob(capsulePath(x0 + 8, x0 + 80, 0, w * 0.6), darken(color, 0.1), {
        outline: 6,
      });
      d.line(
        `M${n(x0 + 25)} ${n(-w * 0.42)}Q${n(x0 + 5)} 0 ${n(x0 + 25)} ${n(w * 0.42)}`,
        "#d8d0b8",
        5,
      );
      return;
    }
    case "satchel": {
      d.begin(`clip-path="url(#${torso})"`);
      d.add(
        `<path d="M${n(dims.chestDepth * 1.2)} ${n(-w * 0.75)}L${n(-dims.backDepth * 1.2)} ${n(w * 0.75)}" stroke="${darken(color, 0.45)}" stroke-width="46"/>` +
          `<path d="M${n(dims.chestDepth * 1.2)} ${n(-w * 0.75)}L${n(-dims.backDepth * 1.2)} ${n(w * 0.75)}" stroke="${color}" stroke-width="34"/>`,
      );
      d.end();
      return;
    }
    case "scarf": {
      const ring = ellipsePath(0, 0, neck * 1.08, neck * 1.08);
      d.add(
        `<path d="${ring}" fill="none" stroke="${darken(color, 0.45)}" stroke-width="66"/>` +
          `<path d="${ring}" fill="none" stroke="${color}" stroke-width="54"/>`,
      );
      const tail = [
        [neck * 0.6, w * 0.25],
        [neck * 1.3, w * 0.4],
        [neck * 1.55, w * 0.32],
        [neck * 1.0, w * 0.18],
      ] as Pt[];
      d.includePoints(tail);
      d.blob(smoothPath(tail), color, {});
      return;
    }
    case "tie": {
      d.blob(
        polygonPath([
          [neck * 0.7, -16],
          [dims.chestDepth + dims.belly + 25, -24],
          [dims.chestDepth + dims.belly + 45, 0],
          [dims.chestDepth + dims.belly + 25, 24],
          [neck * 0.7, 16],
        ]),
        color,
        { outline: 6 },
      );
      return;
    }
    case "lanyard": {
      d.line(
        `M${n(neck * 0.2)} ${n(-neck * 1.0)}Q${n(neck * 1.1)} ${n(-neck * 0.4)} ${n(neck * 1.2)} 0Q${n(neck * 1.1)} ${n(neck * 0.4)} ${n(neck * 0.2)} ${n(neck * 1.0)}`,
        color,
        12,
      );
      d.blob(
        polygonPath([
          [neck * 1.12, -34],
          [neck * 1.12 + 50, -34],
          [neck * 1.12 + 50, 34],
          [neck * 1.12, 34],
        ]),
        "#f2f2ee",
        { shade: "flat", outline: 5, outlineColor: "#777" },
      );
      d.include(neck * 1.12, -34, neck * 1.12 + 50, 34);
      return;
    }
    case "sack":
      // Drawn first, behind
      return;
  }
}

/**
 * The torso lying face down, from above: the shoulders at the origin and
 * toward +x, the waist toward -x, torn off and bloody (the legs, when there
 * are any, are drawn over that end). For crawlers, corpses and gibs.
 */
export function drawLyingTorso(
  look: BodyLook,
  dims: BodyDimensions,
  prefix: string,
): Drawing {
  const colors = palette(look);
  const random = lookRandom(look, 3);
  const top = look.top;
  const w = dims.shoulderHalfWidth;
  const length = 400 + dims.belly * 0.4;
  const front = 70 + dims.backDepth * 0.25;
  const waist = w * (0.74 + Math.max(0, look.build.belly) * 0.18);
  const jag = wobble(random, 6, 5);
  // Down the left side, ragged across the waist, back up the right
  const points: Pt[] = [
    [front, 0],
    [front * 0.75, -w * 0.62],
    [front * 0.2, -w * 0.97],
    [-front * 0.4, -w],
    [-length * 0.45, -w * 0.9],
    [-length * 0.85, -waist],
  ];
  const tornSteps = 12;
  for (let i = 0; i <= tornSteps; i++) {
    const y = -waist + (2 * waist * i) / tornSteps;
    points.push([-length - 18 - (i % 2) * 30 + jag(i) * 14, y]);
  }
  points.push(
    [-length * 0.85, waist],
    [-length * 0.45, w * 0.9],
    [-front * 0.4, w],
    [front * 0.2, w * 0.97],
    [front * 0.75, w * 0.62],
  );
  const shape = smoothPath(points, true, 0.75);
  const d = new Drawing(prefix, 0, 0, 0, 0);
  d.includePoints(points);
  const torso = d.clipPath("torso", shape);

  // The raw end
  d.blob(capsulePath(-length - 70, -length + 70, 0, waist * 1.9), "#5a0d0d", {
    shade: "flat",
    outline: 0,
    clip: torso,
  });

  const band = BANDED[top.style];
  const base = band ? shoulderColor(look, colors.skin) : top.color;
  d.blob(shape, base, {});
  let garment = torso;
  if (band || top.style === "overalls") {
    const half = band ? w * band : w * 0.36;
    garment = d.clipPath(
      "garment",
      polygonPath([
        [-999, -half],
        [999, -half],
        [999, half],
        [-999, half],
      ]),
    );
    d.begin(`clip-path="url(#${torso})"`);
    if (top.style === "overalls") {
      // The straps cross on the back
      for (const side of [-1, 1]) {
        d.add(
          `<path d="M${n(front)} ${n(side * half)}L${n(-length * 0.7)} ${n(-side * half * 0.4)}" stroke="${darken(top.color, 0.45)}" stroke-width="62"/>` +
            `<path d="M${n(front)} ${n(side * half)}L${n(-length * 0.7)} ${n(-side * half * 0.4)}" stroke="${top.color}" stroke-width="50"/>`,
        );
      }
      d.blob(
        capsulePath(-length - 80, -length * 0.62, 0, waist * 1.9),
        top.color,
        {},
      );
    } else {
      d.blob(
        polygonPath([
          [-999, -half],
          [999, -half],
          [999, half],
          [-999, half],
        ]),
        top.color,
        {},
      );
    }
    d.end();
  }
  if (top.pattern) {
    d.begin(`clip-path="url(#${torso})"`);
    drawPattern(d, top.pattern, garment);
    d.end();
  }
  d.add(`<path d="${shape}" fill="url(#${d.shadeGradient("dome")})"/>`);
  // The seam down the back, and the collar at the neck
  d.line(
    `M${n(front * 0.6)} 0L${n(-length * 0.8)} 0`,
    darken(base, 0.3),
    6,
    `opacity="0.5"`,
  );
  if (top.style === "hoodie") {
    d.blob(
      smoothPath(
        ellipsePoints(
          front * 0.1,
          0,
          85,
          w * 0.45,
          20,
          (a) => 0.05 * Math.sin(a * 5),
        ),
      ),
      darken(top.color, 0.05),
      {},
    );
  } else if (COLLARED.includes(top.style)) {
    d.blob(
      capsulePath(front * 0.1, front * 0.55, 0, w * 0.75),
      lighten(top.color, 0.05),
      {
        outline: 6,
      },
    );
  }

  const onBack = (): Pt => [
    -random() * length * 0.9 + front * 0.5,
    (random() - 0.5) * w * 1.7,
  ];
  drawRips(d, look, colors.skin, top.color, garment, onBack, random);
  drawBlood(d, look, torso, onBack, random);
  // Always bloody where it tore
  d.begin(`clip-path="url(#${torso})"`);
  for (let i = 0; i < 5; i++) {
    const y = (random() - 0.5) * waist * 1.8;
    d.add(
      `<ellipse cx="${n(-length + 30 + random() * 50)}" cy="${n(y)}" rx="${n(40 + random() * 40)}" ry="${n(25 + random() * 25)}" fill="#6a0e0e" opacity="0.75"/>`,
    );
  }
  d.end();
  drawGrime(d, look, torso);
  // The spine sticking out
  d.blob(capsulePath(-length - 70, -length + 10, 0, 34), "#e9e2cf", {
    shade: "tube",
    outline: 6,
    outlineColor: "#8a7f68",
  });
  for (let i = 0; i < 3; i++) {
    d.line(
      `M${n(-length - 55 + i * 22)} -17L${n(-length - 55 + i * 22)} 17`,
      "#a59a80",
      5,
    );
  }
  d.include(-length - 75, -20, 0, 20);

  for (const extra of look.extras) {
    if (extra.kind === "backpack") {
      d.blob(
        capsulePath(-length * 0.75, -front * 0.2, 0, w * 1.05),
        extra.color,
        {},
      );
      d.line(
        `M${n(-length * 0.65)} ${n(-w * 0.35)}L${n(-length * 0.65)} ${n(w * 0.35)}`,
        "#d8d0b8",
        5,
      );
    }
  }

  d.outline(shape, base);
  return d;
}
