import { BodyLook } from "../BodyLook";
import { Color, darken, lighten } from "../color";
import { BodyDimensions, lookRandom, palette } from "../dimensions";
import {
  capsulePath,
  Drawing,
  ellipsePath,
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

/**
 * An arm from above, shoulder at x = 0 and wrist at `armLength`, which the
 * game stretches from the shoulder to the hand. Sleeved as far as it is.
 */
export function drawArm(
  look: BodyLook,
  dims: BodyDimensions,
  side: -1 | 1,
  prefix: string,
): Drawing {
  const colors = palette(look);
  const random = lookRandom(look, side === -1 ? 4 : 5);
  const length = dims.armLength;
  const t = dims.armThickness;
  const pad = 7;
  const d = new Drawing(prefix, 0, -t / 2 - pad, length, t / 2 + pad);
  const arm = capsulePath(pad, length - pad, 0, t);
  const rot = look.zombie?.rot ?? 0;
  d.blob(arm, colors.skin, { shade: "tube", grain: rot > 0 ? "rot" : "skin" });

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
    d.blob(shape, color, { shade: "tube", grain: "cloth" });
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
        { shade: "tube", grain: "knit", outline: 6 },
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
  const grain = look.gloves ? "cloth" : rot > 0 ? "rot" : "skin";
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
  } else {
    for (let i = 0; i < 4; i++) {
      const y = (i - 1.5) * h * 0.17;
      d.blob(ellipsePath(h * 0.3, y, h * 0.17, h * 0.1), color, {
        grain,
        outline: 6,
      });
    }
  }
  // The thumb
  d.blob(ellipsePath(h * 0.08, inside * h * 0.34, h * 0.18, h * 0.12), color, {
    grain,
    outline: 6,
  });
  d.blob(ellipsePath(-h * 0.04, 0, h * 0.4, h * 0.37), color, { grain });
  return d;
}

/**
 * Both legs lying face down, from above: the waist at the origin, the feet
 * toward -x, soles up. For corpses, and legs left behind.
 */
export function drawLyingLegs(
  look: BodyLook,
  dims: BodyDimensions,
  prefix: string,
): Drawing {
  const random = lookRandom(look, 6);
  const w = dims.shoulderHalfWidth;
  const length = 640;
  const d = new Drawing(prefix, -length - 80, -w * 0.9, 0, w * 0.9);
  const hip = w * (0.38 + Math.max(0, look.build.belly) * 0.1);
  const thigh = 150 + Math.max(0, look.build.belly) * 30;
  const pants = look.pants;
  for (const side of [-1, 1]) {
    const spread = side * (w * 0.5 + random() * w * 0.2);
    const ankle: Pt = [-length + 20, spread];
    const leg: Pt[] = [
      [0, side * hip - thigh / 2],
      [-length * 0.5, (side * hip + spread) / 2 - thigh * 0.42],
      [ankle[0], ankle[1] - thigh * 0.36],
      [ankle[0] - 20, ankle[1]],
      [ankle[0], ankle[1] + thigh * 0.36],
      [-length * 0.5, (side * hip + spread) / 2 + thigh * 0.42],
      [0, side * hip + thigh / 2],
    ];
    d.includePoints(leg);
    d.blob(smoothPath(leg, true, 0.8), pants, { grain: "cloth" });
    d.line(
      `M${n(-length * 0.15)} ${n(side * hip * 0.9)}Q${n(-length * 0.5)} ${n((side * hip + spread) / 2)} ${n(-length * 0.85)} ${n(spread)}`,
      darken(pants, 0.35),
      6,
      `opacity="0.6"`,
    );
    // A shoe, sole up
    const shoe = ellipsePath(ankle[0] - 55, ankle[1], 85, 52);
    d.include(ankle[0] - 145, ankle[1] - 56, ankle[0], ankle[1] + 56);
    d.blob(shoe, look.shoes);
    d.blob(
      ellipsePath(ankle[0] - 62, ankle[1], 66, 36),
      darken(look.shoes, 0.35),
      {
        shade: "flat",
        outline: 0,
      },
    );
    d.blob(
      ellipsePath(ankle[0] - 22, ankle[1], 20, 30),
      lighten(look.shoes, 0.1),
      {
        shade: "flat",
        outline: 0,
      },
    );
  }
  // The waistband
  const half = hip + thigh / 2;
  d.blob(
    polygonPath([
      [-44, -half],
      [-4, -half],
      [-4, half],
      [-44, half],
    ]),
    darken(pants, 0.25),
    { grain: "cloth", outline: 6 },
  );
  return d;
}
