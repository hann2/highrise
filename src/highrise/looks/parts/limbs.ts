import { BodyLook } from "../BodyLook";
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

/** Where along an arm's drawing the shoulder, elbow and hand are (mm) */
function armJoints(dims: BodyDimensions) {
  const shoulder = ARM_PAD + dims.armThickness / 2;
  const elbow = shoulder + dims.upperArm;
  return { shoulder, elbow, hand: elbow + dims.forearm };
}

/**
 * A whole arm from above, straight, from the shoulder end at x = 0 to the
 * hand end. Sleeved as far as it is. Corpses and severed arms use it
 * stretched; standing, bodies use it cut in two (`drawArmSegment`).
 */
export function drawArm(
  look: BodyLook,
  dims: BodyDimensions,
  side: -1 | 1,
  prefix: string,
): Drawing {
  const colors = palette(look);
  const random = lookRandom(look, side === -1 ? 4 : 5);
  const t = dims.armThickness;
  const pad = ARM_PAD;
  const length = armJoints(dims).hand + t / 2 + pad;
  const d = new Drawing(prefix, 0, -t / 2 - pad, length, t / 2 + pad);
  const arm = capsulePath(pad, length - pad, 0, t);
  const rot = look.zombie?.rot ?? 0;
  d.blob(arm, colors.skin, {
    shade: "tube",
    grain: rot > 0 ? "rot" : undefined,
  });

  const sleeve = look.sleeves.length;
  if (sleeve > 0.02) {
    const color = sleeveColor(look);
    const end = pad + (length - pad * 2) * sleeve;
    const half = (t / 2) * 1.1;
    const ragged = (look.zombie?.tears ?? 0) > 0.3;
    const points: Pt[] = [
      [pad + half, -half],
      [end, -half],
    ];
    if (ragged) {
      for (let i = 1; i < 6; i++) {
        points.push([
          end + (i % 2 ? 1 : -1) * (6 + random() * 18),
          -half + (2 * half * i) / 6,
        ]);
      }
    }
    points.push([end, half], [pad + half, half]);
    // Round over the shoulder end
    const shape =
      polygonPath(points).slice(0, -1) +
      `A${n(half)} ${n(half)} 0 0 1 ${n(pad + half)} ${n(-half)}Z`;
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
    if (look.sleeves.cuff) {
      d.blob(
        polygonPath([
          [end - 34, -half - 3],
          [end, -half - 3],
          [end, half + 3],
          [end - 34, half + 3],
        ]),
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
      () => [pad + random() * (end - pad), (random() - 0.5) * t * 0.6],
      random,
      0.5,
    );
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

/**
 * The upper arm (shoulder to elbow) or the forearm (elbow to the middle of
 * the hand), cut from the whole arm with a rounded end at the elbow, so a
 * bent arm's two halves overlap there. Its origin is where it starts (the
 * shoulder, or the elbow) and it runs along +x.
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
  const whole = drawArm(look, dims, side, `${prefix}-arm`);
  const length = end - start;
  const d = new Drawing(prefix, -t / 2, -t / 2, length + t / 2, t / 2);
  // The halves of an arm don't shadow each other, so the elbow doesn't stand out
  d.castsShadow = false;
  d.include(-t / 2, -t / 2, length + t / 2, t / 2);
  const shape = capsulePath(-t / 2, length + t / 2, 0, t);
  const clip = d.clipPath("segment", shape);
  d.begin(`clip-path="url(#${clip})"`);
  d.add(`<g transform="translate(${n(-start)} 0)">${whole.content(false)}</g>`);
  d.end();
  // The rounded end at the elbow, in whatever covers the arm there
  const sleeveEnd = ARM_PAD + (whole.width - ARM_PAD * 2) * look.sleeves.length;
  const covered = look.sleeves.length > 0.02 && sleeveEnd > joints.elbow;
  d.outline(shape, covered ? sleeveColor(look) : palette(look).skin);
  return d;
}
