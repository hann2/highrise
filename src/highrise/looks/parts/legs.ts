import { BodyLook, ShoeStyle } from "../BodyLook";
import { Color, darken, lighten, mix } from "../color";
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
import { drawBlood, drawRips } from "./wear";
import { lyingWaistHalf } from "./torso";

/** How much of a leg shorts cover, and a skirt, from the hip, unless the look says */
const SHORTS = 0.46;
const SKIRT = 0.42;

/** How far down the leg shorts or a skirt come (0 to 1), or 1 for anything else */
export function pantsCoverage(look: BodyLook): number {
  const style = look.pantsStyle;
  if (style !== "shorts" && style !== "skirt") {
    return 1;
  }
  return look.pantsLength ?? (style === "shorts" ? SHORTS : SKIRT);
}

/** How much wider than the leg the bottom of shorts or a skirt is */
function pantsFlare(look: BodyLook): number {
  switch (look.pantsStyle) {
    case "skirt":
      // A long skirt flares out more by the time it gets down there
      return 1.35 + pantsCoverage(look) * 0.45;
    case "shorts":
      return 1.12;
    default:
      return 1;
  }
}

/** The stripes down track pants: two along each edge of the leg */
function drawTrackStripes(
  d: Drawing,
  from: number,
  to: number,
  edge: number,
  color: Color,
  sides: number[],
) {
  for (const side of sides) {
    for (const inset of [0.16, 0.36]) {
      d.line(
        `M${n(from)} ${n(side * edge * (1 - inset))}L${n(to)} ${n(side * edge * (1 - inset))}`,
        color,
        edge * 0.13,
      );
    }
  }
}

/**
 * A leg from above, hip at x = 0 and ankle at `legLength`, which the game
 * stretches from the hip to where the foot is. Under the body, so mostly
 * seen mid-stride.
 */
export function drawLeg(
  look: BodyLook,
  dims: BodyDimensions,
  prefix: string,
): Drawing {
  const colors = palette(look);
  const random = lookRandom(look, 7);
  const length = dims.legLength;
  const t = dims.legThickness;
  const pad = 7;
  const style = look.pantsStyle;
  const flare = pantsFlare(look);
  const d = new Drawing(
    prefix,
    0,
    (-t / 2) * flare - pad,
    length,
    (t / 2) * flare + pad,
  );
  const rot = look.zombie?.rot ?? 0;
  const leg = capsulePath(pad, length - pad, 0, t);
  const pants = look.pants;

  let cloth: string;
  if (style === "shorts" || style === "skirt") {
    d.blob(leg, colors.skin, {
      shade: "tube",
      grain: rot > 0 ? "rot" : undefined,
    });
    const half0 = (t / 2) * (style === "skirt" ? 1.05 : 1.1);
    // At least past the round top
    const end = Math.max(
      pad + half0 + 30,
      Math.min(length - pad, length * pantsCoverage(look)),
    );
    const half1 = (t / 2) * flare;
    cloth =
      `M${n(pad + half0)} ${n(-half0)}L${n(end)} ${n(-half1)}L${n(end)} ${n(half1)}L${n(pad + half0)} ${n(half0)}` +
      `A${n(half0)} ${n(half0)} 0 0 1 ${n(pad + half0)} ${n(-half0)}Z`;
    d.blob(cloth, pants, { shade: "tube" });
    if (style === "skirt") {
      for (const y of [-0.5, 0, 0.5]) {
        d.line(
          `M${n(pad + half0)} ${n(y * half0)}L${n(end - 4)} ${n(y * half1)}`,
          darken(pants, 0.3),
          5,
          `opacity="0.5"`,
        );
      }
    }
    d.line(
      `M${n(end - 10)} ${n(-half1 + 4)}L${n(end - 10)} ${n(half1 - 4)}`,
      darken(pants, 0.35),
      6,
    );
  } else {
    cloth = leg;
    d.blob(leg, pants, { shade: "tube" });
    if (style === "jeans") {
      // Stitched seams down the sides, and worn at the knee
      for (const y of [-t * 0.34, t * 0.34]) {
        d.line(
          `M${n(pad + t * 0.4)} ${n(y)}L${n(length - pad - t * 0.4)} ${n(y)}`,
          "#d2a85a",
          3,
          `stroke-dasharray="9 6" opacity="0.7"`,
        );
      }
      d.add(
        `<ellipse cx="${n(length * 0.52)}" cy="0" rx="${n(t * 0.55)}" ry="${n(t * 0.3)}" fill="${lighten(pants, 0.25)}" opacity="0.35"/>`,
      );
    } else if (style === "trackpants") {
      // Stripes down the sides, and elastic gathered at the ankle
      const clip = d.clipPath("leg", leg);
      d.begin(`clip-path="url(#${clip})"`);
      drawTrackStripes(
        d,
        pad,
        length - pad,
        t / 2,
        look.pantsTrim ?? "#f2f2ee",
        [-1, 1],
      );
      d.end();
      for (let i = 0; i < 4; i++) {
        const x = length - pad - 30 + i * 7;
        d.line(
          `M${n(x)} ${n(-t * 0.42)}L${n(x)} ${n(t * 0.42)}`,
          darken(pants, 0.3),
          3,
          `opacity="0.6"`,
        );
      }
    } else {
      d.line(
        `M${n(length * 0.1)} 0L${n(length * 0.9)} 0`,
        darken(pants, 0.3),
        5,
        `opacity="0.55"`,
      );
    }
    // The hem at the ankle
    if (style !== "trackpants")
      d.blob(
        polygonPath([
          [length - pad - 34, -t / 2],
          [length - pad - 22, -t / 2],
          [length - pad - 22, t / 2],
          [length - pad - 34, t / 2],
        ]),
        darken(pants, 0.25),
        { shade: "flat", outline: 0, clip: d.clipPath("leg", leg) },
      );
  }

  const clip = d.clipPath("cloth", cloth);
  drawRips(
    d,
    look,
    colors.skin,
    pants,
    clip,
    () => [pad + random() * (length - pad * 2), (random() - 0.5) * t * 0.6],
    random,
    0.55,
  );
  drawBlood(
    d,
    look,
    d.clipPath("all", leg),
    () => [random() * length, (random() - 0.5) * t],
    random,
    0.5,
  );
  return d;
}

/** A shoe's size, by its style (mm), for average feet: length, width, and how pointed the toe is */
const SHOE_SIZES: Record<ShoeStyle, [number, number, number]> = {
  sneakers: [262, 118, 0],
  hightops: [264, 116, 0],
  runners: [272, 122, 0],
  boots: [285, 136, 0],
  dress: [272, 108, 0.45],
  heels: [240, 94, 0.75],
  sandals: [258, 112, 0],
  bare: [246, 106, 0],
};

/** A shoe's outline, heel at -x, toe at +x */
function shoeOutline(length: number, width: number, point: number): Pt[] {
  const l = length / 2;
  const w = width / 2;
  const side = (s: number): Pt[] => [
    [-l * 0.86, s * w * 0.62],
    [-l * 0.45, s * w * 0.86],
    [l * 0.15, s * w * 0.98],
    [l * 0.62, s * w * (0.9 - point * 0.35)],
  ];
  return [
    [-l, 0],
    ...side(1),
    [l * (0.92 - point * 0.05), w * (0.45 - point * 0.35)],
    [l, 0],
    [l * (0.92 - point * 0.05), -w * (0.45 - point * 0.35)],
    ...side(-1).reverse(),
  ];
}

/**
 * A bare foot from above, toe toward +x: narrow at the heel, widest across the
 * ball, and five toes in an arc from the big one on the inside, each with a
 * nail. `inner` is the side toward the body's middle.
 */
function drawBareFoot(
  d: Drawing,
  length: number,
  width: number,
  skin: Color,
  rot: number,
  inner: number,
) {
  const l = length / 2;
  const w = width / 2;
  const grain = rot > 0 ? "rot" : undefined;
  const nail = mix(lighten(skin, 0.3), "#f0c8c0", 0.35);
  // Toes, from the big one: where each one's tip is, and how big it is
  const toes: { x: number; y: number; r: number }[] = [
    { x: 0.9, y: 0.48, r: 0.3 },
    { x: 0.88, y: 0.05, r: 0.2 },
    { x: 0.8, y: -0.3, r: 0.18 },
    { x: 0.7, y: -0.58, r: 0.16 },
    { x: 0.57, y: -0.8, r: 0.14 },
  ];
  for (const toe of toes) {
    const r = toe.r * w;
    const cx = toe.x * l - r;
    const cy = inner * toe.y * w;
    // Each toe runs back into the foot
    d.blob(capsulePath(cx - l * 0.3, cx + r, cy, r * 2), skin, {
      grain,
      shade: "tube",
    });
  }
  // The foot, up to where the toes begin
  d.blob(
    smoothPath([
      [-l, 0],
      [-l * 0.86, inner * w * 0.5],
      [-l * 0.25, inner * w * 0.62],
      [l * 0.38, inner * w * 0.9],
      [l * 0.56, inner * w * 0.62],
      [l * 0.6, 0],
      [l * 0.44, -inner * w * 0.6],
      [l * 0.22, -inner * w * 0.92],
      [-l * 0.3, -inner * w * 0.74],
      [-l * 0.86, -inner * w * 0.52],
    ]),
    skin,
    { grain, shade: "tube" },
  );
  for (const toe of toes) {
    const r = toe.r * w;
    d.add(
      `<ellipse cx="${n(toe.x * l - r * 0.75)}" cy="${n(inner * toe.y * w)}" rx="${n(r * 0.5)}" ry="${n(r * 0.55)}" fill="${nail}" opacity="0.7"/>`,
    );
  }
}

/**
 * A shoe (or a bare foot) from above, toe toward +x, its middle at the
 * origin; `inner` is the side toward the body's middle (+1 for the left foot)
 */
export function drawFoot(
  look: BodyLook,
  dims: BodyDimensions,
  inner: 1 | -1,
  prefix: string,
): Drawing {
  const colors = palette(look);
  const style = look.shoeStyle;
  const [baseLength, baseWidth, point] = SHOE_SIZES[style];
  const length = baseLength * dims.footScale;
  const width = baseWidth * dims.footScale;
  const trim = look.shoeTrim ?? "#ecebe6";
  const rot = look.zombie?.rot ?? 0;
  const d = new Drawing(prefix, -length / 2, -width / 2, length / 2, width / 2);
  d.include(-length / 2 - 8, -width / 2 - 8, length / 2 + 8, width / 2 + 8);
  const color = look.shoes;
  const outline = shoeOutline(length, width, point);
  const shape = smoothPath(outline);

  switch (style) {
    case "bare":
      drawBareFoot(d, length, width, colors.skin, rot, inner);
      if (rot > 0) {
        // Dirty from walking around without shoes
        d.add(
          `<path d="${shape}" fill="${mix("#3a2e20", colors.skin, 0.4)}" opacity="${n(0.25 + rot * 0.2)}"/>`,
        );
      }
      return d;
    case "sandals": {
      d.blob(smoothPath(shoeOutline(length * 1.04, width * 1.12, 0)), color, {
        shade: "flat",
      });
      drawBareFoot(d, length * 0.94, width * 0.92, colors.skin, rot, inner);
      for (const x of [-0.22, 0.25]) {
        d.blob(
          polygonPath([
            [length * x - 14, -width * 0.48],
            [length * x + 14, -width * 0.48],
            [length * x + 14, width * 0.48],
            [length * x - 14, width * 0.48],
          ]),
          color,
          { shade: "tube", outline: 5 },
        );
      }
      return d;
    }
    case "sneakers": {
      // A white sole round a colored upper, laces and a toe cap
      d.blob(smoothPath(shoeOutline(length * 1.04, width * 1.1, 0)), trim, {
        shade: "flat",
      });
      d.blob(smoothPath(shoeOutline(length * 0.93, width * 0.9, 0)), color, {});
      d.blob(
        ellipsePath(length * 0.33, 0, length * 0.13, width * 0.3),
        lighten(color, 0.12),
        {
          shade: "flat",
          outline: 4,
        },
      );
      for (let i = 0; i < 3; i++) {
        const x = -length * 0.08 + i * length * 0.09;
        d.line(
          `M${n(x)} ${n(-width * 0.2)}L${n(x)} ${n(width * 0.2)}`,
          "#f4f4f0",
          7,
        );
      }
      return d;
    }
    case "hightops": {
      // Canvas on a thin rubber sole: a rubber toe cap, laces, and the
      // high collar round the ankle with its round patch on the inside
      d.blob(smoothPath(shoeOutline(length * 1.03, width * 1.06, 0)), trim, {
        shade: "flat",
      });
      d.blob(
        smoothPath(shoeOutline(length * 0.95, width * 0.94, 0)),
        color,
        {},
      );
      d.blob(ellipsePath(length * 0.36, 0, length * 0.13, width * 0.4), trim, {
        shade: "flat",
        outline: 0,
      });
      d.line(
        `M${n(length * 0.25)} ${n(-width * 0.38)}Q${n(length * 0.21)} 0 ${n(length * 0.25)} ${n(width * 0.38)}`,
        darken(trim, 0.3),
        5,
      );
      d.blob(
        ellipsePath(-length * 0.2, 0, length * 0.22, width * 0.43),
        darken(color, 0.12),
        { shade: "flat", outline: 5 },
      );
      d.blob(
        ellipsePath(-length * 0.21, 0, length * 0.14, width * 0.28),
        darken(color, 0.45),
        { shade: "flat", outline: 0 },
      );
      d.add(
        `<circle cx="${n(-length * 0.2)}" cy="${n(inner * width * 0.36)}" r="${n(width * 0.09)}" fill="${trim}" stroke="${darken(color, 0.3)}" stroke-width="3"/>`,
      );
      for (let i = 0; i < 4; i++) {
        const x = length * 0.02 + i * length * 0.055;
        d.line(
          `M${n(x)} ${n(-width * 0.18)}L${n(x)} ${n(width * 0.18)}`,
          "#f4f4f0",
          6,
        );
      }
      return d;
    }
    case "runners": {
      // A thick sole showing all round, a mesh toe, and a swoosh of stripe
      // along the outside
      d.blob(smoothPath(shoeOutline(length * 1.05, width * 1.12, 0)), trim, {
        shade: "flat",
      });
      d.blob(smoothPath(shoeOutline(length * 0.9, width * 0.88, 0)), color, {});
      d.blob(
        ellipsePath(length * 0.3, 0, length * 0.15, width * 0.33),
        lighten(color, 0.22),
        { shade: "flat", outline: 0 },
      );
      d.line(
        `M${n(-length * 0.34)} ${n(-inner * width * 0.16)}Q${n(-length * 0.02)} ${n(-inner * width * 0.5)} ${n(length * 0.2)} ${n(-inner * width * 0.26)}`,
        trim,
        width * 0.09,
      );
      d.blob(
        ellipsePath(-length * 0.3, 0, length * 0.12, width * 0.28),
        darken(color, 0.4),
        { shade: "flat", outline: 0 },
      );
      for (let i = 0; i < 3; i++) {
        const x = -length * 0.1 + i * length * 0.08;
        d.line(
          `M${n(x)} ${n(-width * 0.16)}L${n(x)} ${n(width * 0.16)}`,
          lighten(color, 0.55),
          6,
        );
      }
      return d;
    }
    case "boots": {
      d.blob(
        smoothPath(shoeOutline(length * 1.05, width * 1.08, 0)),
        darken(color, 0.55),
        {
          shade: "flat",
        },
      );
      d.blob(
        smoothPath(shoeOutline(length * 0.95, width * 0.94, 0)),
        color,
        {},
      );
      // Where the leg goes in, and the laces up the front
      d.blob(
        ellipsePath(-length * 0.22, 0, length * 0.2, width * 0.36),
        darken(color, 0.35),
        {
          shade: "flat",
          outline: 5,
        },
      );
      for (let i = 0; i < 3; i++) {
        const x = length * 0.02 + i * length * 0.08;
        d.line(
          `M${n(x)} ${n(-width * 0.2)}L${n(x + 6)} ${n(width * 0.2)}`,
          darken(color, 0.5),
          5,
        );
      }
      d.add(
        `<ellipse cx="${n(length * 0.34)}" cy="${n(-width * 0.12)}" rx="${n(length * 0.08)}" ry="${n(width * 0.12)}" fill="#fff" opacity="0.18"/>`,
      );
      return d;
    }
    case "dress":
    case "heels": {
      d.blob(shape, color);
      if (style === "heels") {
        // The top of the foot shows
        d.blob(
          ellipsePath(-length * 0.08, 0, length * 0.22, width * 0.3),
          colors.skin,
          {
            outline: 5,
            outlineColor: darken(color, 0.4),
          },
        );
      } else {
        d.line(
          `M${n(-length * 0.05)} ${n(-width * 0.2)}Q${n(length * 0.05)} 0 ${n(-length * 0.05)} ${n(width * 0.2)}`,
          darken(color, 0.4),
          5,
        );
      }
      // Polished
      d.add(
        `<ellipse cx="${n(length * 0.28)}" cy="${n(-width * 0.14)}" rx="${n(length * 0.12)}" ry="${n(width * 0.1)}" fill="#fff" opacity="0.4"/>`,
      );
      return d;
    }
  }
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
  const colors = palette(look);
  const random = lookRandom(look, 6);
  const w = dims.shoulderHalfWidth;
  const length = 640;
  const d = new Drawing(prefix, -length - 80, -w * 0.9, 0, w * 0.9);
  const hip = w * (0.38 + Math.max(0, look.build.belly) * 0.1);
  const thigh =
    dims.legThickness * (0.94 + Math.max(0, look.build.belly) * 0.2);
  const pants = look.pants;
  const style = look.pantsStyle;
  const rot = look.zombie?.rot ?? 0;
  const skinGrain = rot > 0 ? "rot" : undefined;
  const bare = style === "shorts" || style === "skirt";
  const coverage = pantsCoverage(look);
  const covered = d.clipPath(
    "covered",
    polygonPath([
      [10, -999],
      [style === "shorts" ? -length * coverage : bare ? 0 : -9999, -999],
      [style === "shorts" ? -length * coverage : bare ? 0 : -9999, 999],
      [10, 999],
    ]),
  );

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
    const path = smoothPath(leg, true, 0.8);
    if (bare) {
      d.blob(path, colors.skin, { grain: skinGrain });
    }
    d.blob(path, pants, { clip: covered });
    if (style === "trackpants") {
      // Stripes down the outside of the leg
      for (const inset of [0.12, 0.3]) {
        d.line(
          `M${n(-10)} ${n(side * (hip + thigh * (0.5 - inset)))}Q${n(-length * 0.5)} ${n((side * hip + spread) / 2 + side * thigh * (0.42 - inset))} ${n(ankle[0] + 10)} ${n(ankle[1] + side * thigh * (0.36 - inset))}`,
          look.pantsTrim ?? "#f2f2ee",
          thigh * 0.07,
        );
      }
    } else if (!bare) {
      d.line(
        `M${n(-length * 0.15)} ${n(side * hip * 0.9)}Q${n(-length * 0.5)} ${n((side * hip + spread) / 2)} ${n(-length * 0.85)} ${n(spread)}`,
        darken(pants, 0.35),
        6,
        `opacity="0.6"`,
      );
    }
    drawSole(d, look, colors.skin, ankle, dims.footScale);
  }

  // The seat: the hips and bottom, as wide as the waist above, closing the
  // gap between the tops of the legs
  const waistHalf = Math.max(hip + thigh / 2, lyingWaistHalf(look, dims));
  const seat: Pt[] = [
    [14, -waistHalf * 0.98],
    [-90, -waistHalf * 1.02],
    [-170, -waistHalf * 0.85],
    [-215, -hip * 0.6],
    [-200, 0],
    [-215, hip * 0.6],
    [-170, waistHalf * 0.85],
    [-90, waistHalf * 1.02],
    [14, waistHalf * 0.98],
  ];
  d.includePoints(seat);
  d.blob(smoothPath(seat, true, 0.8), pants, {});
  d.line(`M${n(-50)} 0L${n(-195)} 0`, darken(pants, 0.35), 6, `opacity="0.6"`);
  const half = waistHalf;
  if (style === "skirt") {
    const hem = half * (1.15 + coverage * 0.7);
    d.blob(
      polygonPath([
        [0, -half * 1.05],
        [-length * coverage, -hem],
        [-length * coverage, hem],
        [0, half * 1.05],
      ]),
      pants,
      { shade: "tube" },
    );
    // Folds from the waist to the hem
    for (const f of [-0.6, -0.2, 0.2, 0.6]) {
      d.line(
        `M${n(-30)} ${n(f * half)}L${n(-length * coverage + 10)} ${n(f * hem)}`,
        darken(pants, 0.3),
        5,
        `opacity="0.5"`,
      );
    }
  }
  drawBlood(
    d,
    look,
    d.clipPath(
      "all",
      polygonPath([
        [0, -half],
        [-length, -w],
        [-length, w],
        [0, half],
      ]),
    ),
    () => [-random() * length * 0.9, (random() - 0.5) * half * 1.6],
    random,
  );
  // The waistband
  d.blob(
    polygonPath([
      [-44, -half],
      [-4, -half],
      [-4, half],
      [-44, half],
    ]),
    darken(pants, 0.25),
    { outline: 6 },
  );
  return d;
}

/** The sole of a shoe (or a foot) at `ankle`, face down, toe pointing down into the floor */
function drawSole(
  d: Drawing,
  look: BodyLook,
  skin: Color,
  ankle: Pt,
  footScale: number,
) {
  const style = look.shoeStyle;
  const [baseLength, baseWidth] = SHOE_SIZES[style];
  const length = baseLength * footScale;
  const width = baseWidth * footScale;
  const cx = ankle[0] - length * 0.32;
  const rx = length * 0.33;
  const ry = width * 0.45;
  d.include(cx - rx, ankle[1] - ry, ankle[0], ankle[1] + ry);
  const sole = ellipsePath(cx, ankle[1], rx, ry);
  switch (style) {
    case "bare":
      d.blob(sole, mix(skin, "#4a3a28", 0.25), {});
      return;
    case "sandals":
      d.blob(sole, look.shoes, { shade: "flat" });
      d.blob(ellipsePath(cx + rx * 0.4, ankle[1], rx * 0.45, ry * 0.7), skin, {
        outline: 4,
      });
      return;
    case "sneakers":
    case "hightops":
    case "runners":
      d.blob(sole, darken(look.shoeTrim ?? "#ecebe6", 0.07), { shade: "flat" });
      for (let i = -2; i <= 2; i++) {
        d.line(
          `M${n(cx + i * rx * 0.3)} ${n(ankle[1] - ry * 0.6)}L${n(cx + i * rx * 0.3)} ${n(ankle[1] + ry * 0.6)}`,
          "#a8a7a0",
          5,
        );
      }
      return;
    case "boots":
      d.blob(ellipsePath(cx, ankle[1], rx * 1.06, ry * 1.08), "#2a2420", {
        shade: "flat",
      });
      for (let i = -2; i <= 2; i++) {
        d.line(
          `M${n(cx + i * rx * 0.3 - 8)} ${n(ankle[1] - ry * 0.7)}L${n(cx + i * rx * 0.3 + 8)} ${n(ankle[1] + ry * 0.7)}`,
          "#4a4038",
          9,
        );
      }
      return;
    case "dress":
    case "heels":
      d.blob(sole, darken(look.shoes, 0.35), { shade: "flat" });
      if (style === "heels") {
        // The heel, sticking up at the ankle
        d.blob(
          ellipsePath(ankle[0] - 18, ankle[1], 16, 14),
          darken(look.shoes, 0.55),
          {
            outline: 4,
          },
        );
      }
      return;
  }
}
