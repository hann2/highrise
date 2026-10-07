import { BodyLook, stripeCount } from "../BodyLook";
import { Color, darken, lighten } from "../color";
import { BodyDimensions, lookRandom, palette } from "../dimensions";
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
import { drawBlood, drawPattern, drawRips } from "./wear";

/** The sleeves' color: the top's own, or the shirt under a top without sleeves */
export function sleeveColor(look: BodyLook): Color {
  if (look.sleeves.color) {
    return look.sleeves.color;
  }
  switch (look.top.style) {
    case "tank":
      return look.skin;
    case "vest":
    case "overalls":
      return look.top.secondary;
    default:
      return look.top.color;
  }
}

/** Room round an arm's drawing */
const ARM_PAD = 7;

/**
 * Where along an arm's drawing the shoulder, elbow and hand are (mm), and
 * the wrist, where the arm ends: far enough inside the hand that the arm
 * never shows past it, even stretched to reach
 */
function armJoints(dims: BodyDimensions) {
  const shoulder = ARM_PAD + dims.armThickness / 2;
  const elbow = shoulder + dims.upperArm;
  const hand = elbow + dims.forearm;
  return { shoulder, elbow, hand, wrist: hand - dims.handSize * 0.32 };
}

/**
 * How wide an arm is along its length, as a fraction of its thickness, at
 * fractions of the way from shoulder to elbow (`upper`) and elbow to hand
 * (`fore`): fullest at the shoulder, wider than the arm is thick so it flows
 * out of the torso, tapering to the elbow, swelling again
 * just below it where the forearm's muscles are, and tapering to the wrist.
 */
export const ARM_WIDTHS: { upper?: number; fore?: number; width: number }[] = [
  { upper: 0, width: 1.4 },
  { upper: 0.4, width: 1 },
  { upper: 1, width: 0.7 },
  { fore: 0.2, width: 0.78 },
  { fore: 0.8, width: 0.56 },
  { fore: 1, width: 0.55 },
];

/** Where along a whole arm's drawing (`drawArm`) the middle of the hand goes (mm) */
export function armHandPosition(dims: BodyDimensions): number {
  return armJoints(dims).hand;
}

/** As far out from its middle as an arm (or its sleeve) ever gets (mm) */
function widestHalf(dims: BodyDimensions): number {
  const widest = Math.max(...ARM_WIDTHS.map(({ width }) => width));
  return (widest / 2 + 0.12) * dims.armThickness;
}

/** The arm's half-width at `x` along its drawing (mm) */
function armHalfWidth(dims: BodyDimensions, x: number): number {
  const joints = armJoints(dims);
  const at = ARM_WIDTHS.map(({ upper, fore, width }): [number, number] => [
    upper !== undefined
      ? joints.shoulder + upper * dims.upperArm
      : joints.elbow + fore! * dims.forearm,
    width,
  ]);
  const t = dims.armThickness / 2;
  if (x <= at[0][0]) {
    return at[0][1] * t;
  }
  for (let i = 1; i < at.length; i++) {
    const [x1, w1] = at[i];
    if (x <= x1) {
      const [x0, w0] = at[i - 1];
      const f = (x - x0) / (x1 - x0);
      // Eased, so the widths change smoothly through each point
      const eased = f * f * (3 - 2 * f);
      return (w0 + (w1 - w0) * eased) * t;
    }
  }
  return at[at.length - 1][1] * t;
}

/**
 * The outline of an arm from `x0` to `x1` along it, `widen(x, half)` times
 * as wide, rounded at both ends: the arm itself, or a sleeve. `endDepth` is
 * how far the round end at `x1` comes out, as a fraction of a half circle
 */
function armShape(
  dims: BodyDimensions,
  x0: number,
  x1: number,
  widen: (x: number, half: number) => number = (_, half) => half,
  steps = 24,
  endDepth = 1,
): Pt[] {
  const half = (x: number) => widen(x, armHalfWidth(dims, x));
  const top: Pt[] = [];
  const bottom: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    top.push([x, -half(x)]);
    bottom.push([x, half(x)]);
  }
  // A round end at each: half circles of the width there
  const cap = (x: number, side: 1 | -1, depth = 1): Pt[] => {
    const r = half(x);
    return [0.25, 0.5, 0.75].map((f): Pt => {
      const a = Math.PI * f;
      return [x + side * Math.sin(a) * r * depth, side * -Math.cos(a) * r];
    });
  };
  return [...top, ...cap(x1, 1, endDepth), ...bottom.reverse(), ...cap(x0, -1)];
}

/**
 * How far a sleeve's end comes out past where it ends, as a fraction of a
 * half circle: a hem round an arm, seen from above, is nearly straight across
 */
const HEM_DEPTH = 0.3;

/**
 * A band round the arm from `x0` to `x1`, `widen`ed, with a hem's end at
 * `x1` and straight across at `x0`: a cuff
 */
function bandShape(
  dims: BodyDimensions,
  x0: number,
  x1: number,
  widen: (x: number, half: number) => number,
): string {
  // Without the round end at x0
  return smoothPath(
    armShape(dims, x0, x1, widen, 6, HEM_DEPTH).slice(0, -3),
    true,
    0.5,
  );
}

/**
 * How wide a sleeve is at `x` for an arm `half` wide there: as wide as the
 * arm at the shoulder, so it's the shoulder's own edge, getting looser and
 * less tapered down the arm
 */
function sleeveWidener(dims: BodyDimensions) {
  const { shoulder } = armJoints(dims);
  return (x: number, half: number) => {
    const f = Math.min(1, Math.max(0, (x - shoulder) / (dims.upperArm * 0.4)));
    const loose = f * f * (3 - 2 * f);
    return half * (1 - 0.08 * loose) + dims.armThickness * 0.12 * loose;
  };
}

/**
 * A whole arm from above, straight, from the shoulder end at x = 0 to the
 * hand end, shaped as an arm is (`ARM_WIDTHS`). Sleeved as far as it is.
 * Corpses and severed arms use it stretched; standing, bodies use it cut in
 * two (`drawArmSegment`), without the sleeve, which goes over the two
 * halves bent as one (`drawSleeve`).
 */
export function drawArm(
  look: BodyLook,
  dims: BodyDimensions,
  side: -1 | 1,
  prefix: string,
  /** Without its sleeve, which standing bodies draw on their own (`drawSleeve`) */
  skinOnly = false,
): Drawing {
  const colors = palette(look);
  const random = lookRandom(look, side === -1 ? 4 : 5);
  const t = dims.armThickness;
  const joints = armJoints(dims);
  const length = joints.hand + t / 2 + ARM_PAD;
  const m = widestHalf(dims) + ARM_PAD;
  const d = new Drawing(prefix, 0, -m, length, m);
  // The round end at the shoulder, as wide as the arm is there
  d.include(joints.shoulder - m, -m, length, m);
  const arm = smoothPath(
    armShape(dims, joints.shoulder, joints.wrist),
    true,
    0.5,
  );
  const rot = look.zombie?.rot ?? 0;
  d.blob(arm, colors.skin, {
    shade: "tube",
    grain: rot > 0 ? "rot" : undefined,
  });

  if (hasSleeve(look) && !skinOnly) {
    paintSleeve(d, look, dims, side, random);
  }
  const armClip = d.clipPath("arm", arm);
  drawBlood(
    d,
    look,
    armClip,
    () => [random() * length, (random() - 0.5) * t],
    random,
    0.5,
  );
  return d;
}

/** Whether `look` has sleeves at all */
export function hasSleeve(look: BodyLook): boolean {
  return look.sleeves.length > 0.02;
}

/** Where along an arm's drawing (`drawArm`) its sleeve ends (mm) */
function sleeveEnd(look: BodyLook, dims: BodyDimensions): number {
  const joints = armJoints(dims);
  return (
    joints.shoulder +
    (joints.wrist - joints.shoulder) * Math.min(1, look.sleeves.length)
  );
}

/**
 * A sleeve, onto `d` in an arm's drawing's coordinates (`drawArm`): its
 * color and pattern, a track suit's stripes, cuffs and rips. Gives its
 * shape's clip path.
 */
function paintSleeve(
  d: Drawing,
  look: BodyLook,
  dims: BodyDimensions,
  side: -1 | 1,
  random: () => number,
): string {
  const colors = palette(look);
  const t = dims.armThickness;
  const joints = armJoints(dims);
  const sleeve = look.sleeves.length;
  const color = sleeveColor(look);
  // Sleeves end along the arm, from the shoulder to the wrist
  const end = sleeveEnd(look, dims);
  const ragged = (look.zombie?.tears ?? 0) > 0.3;
  // Loose: wider than the arm, and less tapered
  const widen = sleeveWidener(dims);
  const outline = armShape(
    dims,
    joints.shoulder,
    end,
    widen,
    16,
    ragged ? 1 : HEM_DEPTH,
  );
  if (ragged) {
    // Torn at the end: a zigzag across instead of the round end
    const half = widen(end, armHalfWidth(dims, end));
    const top = outline.slice(0, 17);
    const bottom = outline.slice(20, 37);
    const rag: Pt[] = [];
    for (let i = 1; i < 6; i++) {
      rag.push([
        end + (i % 2 ? 1 : -1) * (6 + random() * 18),
        -half + (2 * half * i) / 6,
      ]);
    }
    outline.splice(
      0,
      outline.length,
      ...top,
      ...rag,
      ...bottom,
      ...outline.slice(37),
    );
  }
  const shape = smoothPath(outline, true, 0.5);
  const clip = d.clipPath("sleeve", shape);
  d.blob(shape, color, { shade: "tube" });
  if (
    look.top.pattern &&
    look.top.style !== "vest" &&
    look.top.style !== "overalls"
  ) {
    drawPattern(d, look.top.pattern, clip);
    d.add(`<path d="${shape}" fill="url(#${d.shadeGradient("tube")})"/>`);
  }
  if (look.top.style === "tracksuit") {
    // Stripes down the outside of the sleeve, narrowing with it, and
    // elastic cuffs
    d.begin(`clip-path="url(#${clip})"`);
    const half = (x: number) => widen(x, armHalfWidth(dims, x));
    const count = stripeCount(look.top);
    for (let i = 0; i < count; i++) {
      // Across the sleeve, as fractions of its half-width, side by side
      const middle = 0.3 + (i - (count - 1) / 2) * 0.26;
      const edges = [middle - 0.08, middle + 0.08];
      const steps = 12;
      const points: Pt[] = [];
      for (const [i, edge] of edges.entries()) {
        for (let j = 0; j <= steps; j++) {
          const x = i === 0 ? (end * j) / steps : end - (end * j) / steps;
          points.push([x, side * edge * half(x)]);
        }
      }
      d.add(`<path d="${polygonPath(points)}" fill="${look.top.secondary}"/>`);
    }
    d.end();
    if (!look.sleeves.cuff && sleeve > 0.9) {
      d.blob(bandShape(dims, end - 30, end, widen), darken(color, 0.15), {
        shade: "tube",
        outline: 0,
        clip,
      });
    }
  }
  if (look.sleeves.cuff) {
    // A little bigger than the sleeve, so it shows round it
    d.blob(
      bandShape(dims, end - 34, end + 2, (x, half) => widen(x, half) + 3),
      look.sleeves.cuff,
      { shade: "tube", outline: 6 },
    );
  }
  drawRips(
    d,
    look,
    colors.skin,
    color,
    clip,
    () => [
      joints.shoulder + random() * (end - joints.shoulder),
      (random() - 0.5) * t * 0.6,
    ],
    random,
    0.5,
  );
  return clip;
}

/**
 * A sleeve on its own, straight, its origin where the shoulder joint is and
 * running along +x as the arm does: standing, it's bent at the elbow over
 * the arm (`sleeveStrip`). Empty without sleeves.
 */
export function drawSleeve(
  look: BodyLook,
  dims: BodyDimensions,
  side: -1 | 1,
  prefix: string,
): Drawing {
  const joints = armJoints(dims);
  const m = widestHalf(dims) + ARM_PAD;
  if (!hasSleeve(look)) {
    return new Drawing(prefix, -1, -1, 1, 1);
  }
  const end = sleeveEnd(look, dims);
  // Room for its round shoulder end, and a torn end's points
  const d = new Drawing(prefix, 0, 0, 0, 0);
  // No shadow round it: bent, the edge of its picture fans out round the
  // outside of the elbow, and a shadow there would streak
  d.castsShadow = false;
  d.include(-m, -m, end - joints.shoulder + m, m);
  // Drawn as on the arm, moved so the shoulder joint's at the origin
  d.begin(`transform="translate(${n(-joints.shoulder)} 0)"`);
  const random = lookRandom(look, side === -1 ? 6 : 7);
  const clip = paintSleeve(d, look, dims, side, random);
  // Blood on the sleeve as well as on the arm under it
  drawBlood(
    d,
    look,
    clip,
    () => [
      joints.shoulder + random() * (end - joints.shoulder),
      (random() - 0.5) * dims.armThickness,
    ],
    random,
    0.5,
  );
  d.end();
  return d;
}

/**
 * A hand from above, fingers toward +x, its middle at the origin; the thumb
 * is on the inside, toward the body's middle
 */
export function drawHand(
  look: BodyLook,
  dims: BodyDimensions,
  side: -1 | 1,
  prefix: string,
): Drawing {
  const colors = palette(look);
  const h = dims.handSize;
  const rot = look.zombie?.rot ?? 0;
  const color = look.gloves ?? colors.skin;
  const grain = !look.gloves && rot > 0 ? "rot" : undefined;
  const d = new Drawing(prefix, -h * 0.55, -h * 0.55, h * 0.55, h * 0.55);
  const inside = -side;
  if (rot > 0 && !look.gloves) {
    // Clawing fingers
    d.include(-h * 0.55, -h * 0.55, h * 0.85, h * 0.55);
    for (let i = 0; i < 4; i++) {
      const y = (i - 1.5) * h * 0.17;
      const reach = h * (0.7 - Math.abs(i - 1.5) * 0.07);
      d.line(
        `M0 ${n(y)}L${n(reach)} ${n(y * 1.25)}`,
        darken(color, 0.5),
        h * 0.17,
      );
      d.line(`M0 ${n(y)}L${n(reach)} ${n(y * 1.25)}`, color, h * 0.11);
      d.add(
        `<circle cx="${n(reach + 3)}" cy="${n(y * 1.25)}" r="${n(h * 0.04)}" fill="#3b3524"/>`,
      );
    }
    d.blob(
      ellipsePath(h * 0.08, inside * h * 0.34, h * 0.18, h * 0.12),
      color,
      { grain, outline: 6 },
    );
    d.blob(ellipsePath(-h * 0.04, 0, h * 0.4, h * 0.37), color, { grain });
  } else {
    // A loose fist: the thumb along the inside, under the fingers, and
    // creases between the fingers at the front
    d.blob(ellipsePath(h * 0.12, inside * h * 0.3, h * 0.22, h * 0.12), color, {
      outline: 6,
      shade: "tube",
    });
    const fist = smoothPath(
      ellipsePoints(0, 0, h * 0.42, h * 0.36, 32, (a) =>
        // Squarer at the front, where the knuckles are
        Math.cos(a) > 0 ? 0.08 * Math.cos(a) ** 2 * Math.sin(a) ** 2 * 4 : 0,
      ),
    );
    d.blob(fist, color);
    for (let i = -1; i <= 1; i++) {
      const y = i * h * 0.15;
      d.line(
        `M${n(h * 0.28)} ${n(y)}L${n(h * 0.42)} ${n(y)}`,
        darken(color, 0.4),
        4,
        `opacity="0.7"`,
      );
    }
  }
  return d;
}

/** A rectangle's path */
function box(x0: number, y0: number, x1: number, y1: number): string {
  return polygonPath([
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ]);
}

/**
 * The upper arm (shoulder to elbow) or the forearm (elbow to the middle of
 * the hand), cut from the whole arm, with a round end at the elbow as wide
 * as the arm is there, so a bent arm's halves overlap smoothly. Its origin
 * is where it starts (the shoulder, or the elbow) and it runs along +x.
 */
export function drawArmSegment(
  look: BodyLook,
  dims: BodyDimensions,
  side: -1 | 1,
  segment: "upper" | "fore",
  prefix: string,
): Drawing {
  const t = dims.armThickness;
  const joints = armJoints(dims);
  const [start, end] =
    segment === "upper"
      ? [joints.shoulder, joints.elbow]
      : [joints.elbow, joints.hand];
  // Bare: the sleeve goes over both halves, bent as one (`drawSleeve`)
  const whole = drawArm(look, dims, side, `${prefix}-arm`, true);
  const length = end - start;
  const d = new Drawing(prefix, -t / 2, -t / 2, length + t / 2, t / 2);
  const m = widestHalf(dims) + ARM_PAD;
  d.include(-m, -m, length + m, m);
  // The halves of an arm don't shadow each other, so the elbow doesn't stand out
  d.castsShadow = false;
  // The arm's own shape between the joints, rounded at each
  const outline = armShape(dims, start, end);
  const clip = d.clipPath(
    "segment",
    smoothPath(
      outline.map(([x, y]): Pt => [x - start, y]),
      true,
      0.5,
    ),
  );
  // The whole arm once, used twice
  const arm = d.def("arm", (id) => `<g id="${id}">${whole.content(false)}</g>`);
  const use = `<use href="#${arm}"/>`;
  // Its own side of the elbow, and a little over, so there's no seam
  const elbow = joints.elbow;
  const far = (length + m) * 2;
  const own = d.clipPath(
    "own",
    segment === "upper"
      ? box(elbow - far, -far, elbow + 0.5, far)
      : box(elbow - 0.5, -far, elbow + far, far),
  );
  // The round end at the elbow is the arm just this side of it, stretched
  // across: the upper arm's own clothes going on, not the forearm's, and the
  // other way round, so a sleeve's end or a stripe never shows past the elbow
  // at the other half's angle
  const slice = 2;
  const stretch = (m * 1.5) / slice;
  const sliced = d.clipPath(
    "slice",
    segment === "upper"
      ? box(elbow - slice, -far, elbow, far)
      : box(elbow, -far, elbow + slice, far),
  );
  d.begin(`clip-path="url(#${clip})"`);
  d.begin(`transform="translate(${n(-start)} 0)"`);
  d.add(
    `<g transform="translate(${n(elbow)} 0) scale(${-stretch} 1) translate(${n(-elbow)} 0)"><g clip-path="url(#${sliced})">${use}</g></g>`,
  );
  d.add(`<g clip-path="url(#${own})">${use}</g>`);
  d.end();
  d.end();
  return d;
}
