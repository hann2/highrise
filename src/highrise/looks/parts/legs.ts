import { BodyLook, ShoeStyle } from "../BodyLook";
import { Color, darken, lighten, luminance, mix } from "../color";
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
import { LYING_LEGS, lyingHipsHalf, lyingWaistHalf } from "./torso";
import { STYLE } from "../style";

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

/** How much wider than the leg the bottom of shorts is */
function pantsFlare(look: BodyLook): number {
  switch (look.pantsStyle) {
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
  if (style === "skirt") {
    // Bare: the skirt's drawn on its own, over the legs (`parts/hems.ts`)
    d.blob(leg, colors.skin, {
      shade: "tube",
      grain: rot > 0 ? "rot" : undefined,
    });
    // Nothing for rips to tear
    cloth = "M0 0Z";
  } else if (style === "shorts") {
    d.blob(leg, colors.skin, {
      shade: "tube",
      grain: rot > 0 ? "rot" : undefined,
    });
    const half0 = (t / 2) * 1.1;
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
  const length = LYING_LEGS;
  const hipsHalf = lyingHipsHalf(look, dims);
  const waistHalf = lyingWaistHalf(look, dims);
  const d = new Drawing(prefix, -length - 80, -hipsHalf, 0, hipsHalf);
  const thigh =
    dims.legThickness * (0.94 + Math.max(0, look.build.belly) * 0.2);
  // Each leg's middle at the hip, so its outside is the outside of the hips
  const hip = Math.max(thigh * 0.5, hipsHalf - thigh * 0.5);
  const pants = look.pants;
  const style = look.pantsStyle;
  const rot = look.zombie?.rot ?? 0;
  const skinGrain = rot > 0 ? "rot" : undefined;
  const bare = style === "shorts" || style === "skirt";
  const coverage = pantsCoverage(look);

  // Sometimes a knee's drawn up and out to the side
  const bent = random() < 0.4 ? (random() < 0.5 ? -1 : 1) : 0;
  const legs: LyingLeg[] = [];
  for (const side of [-1, 1]) {
    const knee = bent === side;
    // Down the middle of the leg, from the hip to the ankle, and how wide it
    // is at each (as a share of the thigh)
    const out =
      side * (knee ? thigh * (0.75 + random() * 0.35) : random() * w * 0.15);
    const ankleY = side * hip * 0.9 + out * (knee ? 0.4 : 1);
    const ankleX = knee ? -length * 0.86 : -length + 20;
    const kneeY = (side * hip + ankleY) / 2 + (knee ? out : out * 0.1);
    const leg = lyingLeg(
      side,
      [
        // From the hip joint, under the seat, not the waist
        [-70, side * hip],
        [-length * 0.27, (side * hip * 3 + kneeY) / 4],
        [-length * 0.5, kneeY],
        [(-length * 0.5 + ankleX) / 2 - 20, (kneeY + ankleY) / 2],
        [ankleX, ankleY],
      ],
      (bare ? [0.5, 0.45, 0.33, 0.37, 0.25] : [0.5, 0.45, 0.4, 0.4, 0.36]).map(
        (share) => share * thigh,
      ),
    );
    legs.push(leg);
    // The foot fallen onto its side, so its side's up, bent at the ankle
    // with its toe out to the side and its sole down toward the feet; the
    // trouser leg over the top of the shoe, bare legs under it
    const splay = -side * (0.9 + random() * 0.5);
    const shoe = () =>
      drawShoeSide(
        d,
        look,
        colors.skin,
        [ankleX, ankleY],
        dims.footScale,
        leg.end + splay,
        side,
      );
    if (!bare) {
      shoe();
    }
    const path = leg.outline(1, true);
    d.includePoints(leg.points(1, true));
    // Lying flat, shaded along its sides
    d.blob(path, bare ? colors.skin : pants, {
      grain: bare ? skinGrain : undefined,
      shade: "tube",
    });
    if (style === "shorts") {
      // Square across the leg where they end, a little wider than it
      d.blob(leg.outline(coverage, false, pantsFlare(look)), pants, {
        shade: "tube",
      });
    }
    if (style === "trackpants") {
      // Stripes down the outside of the leg
      for (const inset of [0.12, 0.3]) {
        d.line(
          leg.along(1 - inset * 2, 0, 1),
          look.pantsTrim ?? "#f2f2ee",
          thigh * 0.07,
        );
      }
    } else if (!bare) {
      // The crease down the back of the leg
      d.line(leg.along(0, 0.2, 0.85), darken(pants, 0.35), 6, `opacity="0.6"`);
    }
    if (bare) {
      shoe();
    }
  }

  // The seat: from the waist out over the hips, and rounding off over the
  // top of each leg, as wide as them
  const seat: Pt[] = [
    [14, -waistHalf],
    [-70, -hipsHalf * 0.99],
    [-140, -hipsHalf],
    [-195, -(hip + thigh * 0.3)],
    [-222, -hip * 0.45],
    [-210, 0],
    [-222, hip * 0.45],
    [-195, hip + thigh * 0.3],
    [-140, hipsHalf],
    [-70, hipsHalf * 0.99],
    [14, waistHalf],
  ];
  d.includePoints(seat);
  if (style !== "skirt") {
    d.blob(smoothPath(seat, true, 0.8), pants, { shade: "side" });
    if (style !== "trackpants") {
      drawBackPockets(d, look, hip);
    }
    d.line(
      `M${n(-50)} 0L${n(-205)} 0`,
      darken(pants, 0.35),
      6,
      `opacity="0.6"`,
    );
  }
  if (style === "skirt") {
    drawLyingSkirt(d, look, legs, waistHalf, hipsHalf, length * coverage);
  }
  drawBlood(
    d,
    look,
    d.clipPath(
      "all",
      polygonPath([
        [0, -waistHalf],
        [-length, -w],
        [-length, w],
        [0, waistHalf],
      ]),
    ),
    () => [-random() * length * 0.9, (random() - 0.5) * waistHalf * 1.6],
    random,
  );
  if (style !== "skirt") {
    // The waistband, which a top that hangs out covers
    d.blob(
      polygonPath([
        [-44, -waistHalf * 1.01],
        [-4, -waistHalf],
        [-4, waistHalf],
        [-44, waistHalf * 1.01],
      ]),
      darken(pants, 0.25),
      { outline: 6, shade: "flat" },
    );
  }
  return d;
}

/**
 * The back pockets on the seat, lying face down, so it reads as the back:
 * stitched patches on jeans, slits on trousers and shorts
 */
function drawBackPockets(d: Drawing, look: BodyLook, hip: number) {
  const pants = look.pants;
  for (const side of [-1, 1]) {
    const inner = side * hip * 0.3;
    const outer = side * hip * 1.05;
    if (look.pantsStyle === "jeans") {
      const pocket: Pt[] = [
        [-72, inner],
        [-72, outer],
        [-160, outer - side * 8],
        [-182, (inner + outer) / 2],
        [-160, inner + side * 8],
      ];
      d.blob(polygonPath(pocket), darken(pants, 0.06), {
        shade: "flat",
        outline: 5,
      });
      // Its stitching, in jeans' yellow thread
      d.add(
        `<path d="${polygonPath(pocket.map(([x, y]): Pt => [x * 0.94 - 4, (inner + outer) / 2 + (y - (inner + outer) / 2) * 0.86]))}" fill="none" stroke="#d6a54e" stroke-width="3" stroke-dasharray="8 6" opacity="0.8"/>`,
      );
    } else {
      // A slit, buttoned
      d.line(
        `M${n(-88)} ${n(side * hip * 0.4)}L${n(-92)} ${n(side * hip * 1.0)}`,
        darken(pants, 0.45),
        7,
      );
      d.blob(ellipsePath(-104, side * hip * 0.7, 7, 7), darken(pants, 0.3), {
        shade: "flat",
        outline: 3,
      });
    }
  }
}

/**
 * A skirt lying over the legs, face down: out from the waist over the hips
 * and on down, as wide as the legs under it where it ends, its hem curving
 * round and scalloped where it folds
 */
function drawLyingSkirt(
  d: Drawing,
  look: BodyLook,
  legs: LyingLeg[],
  waistHalf: number,
  hipsHalf: number,
  depth: number,
) {
  const color = look.pants;
  // Out past each leg where it ends, a bent one too
  const at = depth / LYING_LEGS;
  const [left, right] = legs.map((leg) => {
    const [x, y, half] = leg.sample(at);
    return { x, y: y + leg.side * (half + 30) };
  });
  const hem: Pt[] = [];
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = left.y + (right.y - left.y) * t;
    const x =
      left.x +
      (right.x - left.x) * t -
      22 * Math.sin(Math.PI * t) -
      8 * Math.abs(Math.sin(Math.PI * t * 5));
    hem.push([x, y]);
  }
  const shape: Pt[] = [
    [10, -waistHalf * 1.04],
    [-depth * 0.35, -Math.max(hipsHalf * 1.06, -left.y * 0.9)],
    ...hem,
    [-depth * 0.35, Math.max(hipsHalf * 1.06, right.y * 0.9)],
    [10, waistHalf * 1.04],
  ];
  d.includePoints(shape);
  const path = smoothPath(shape, true, 0.5);
  d.blob(path, color, { shade: "side" });
  const clip = d.clipPath("skirt", path);
  d.begin(`clip-path="url(#${clip})"`);
  // Folds fanning out from the waist to the hem
  for (const f of [0.15, 0.32, 0.5, 0.68, 0.85]) {
    const [hx, hy] = hem[Math.round(f * steps)];
    d.line(
      `M${n(-30)} ${n((f * 2 - 1) * waistHalf * 0.9)}L${n(hx + 6)} ${n(hy)}`,
      darken(color, 0.3),
      6,
      `opacity="0.45"`,
    );
  }
  d.end();
  // The waistband
  d.blob(
    polygonPath([
      [-36, -waistHalf * 1.04],
      [-4, -waistHalf * 1.04],
      [-4, waistHalf * 1.04],
      [-36, waistHalf * 1.04],
    ]),
    darken(color, 0.2),
    { outline: 6, shade: "flat" },
  );
}

/** A leg lying down, laid along a line through points from the hip to the ankle */
interface LyingLeg {
  side: number;
  /** Which way it goes at the ankle (radians) */
  end: number;
  /** Where along it (0 at the hip, 1 at the ankle) its middle is, and its half-width there */
  sample(at: number): [number, number, number];
  /** Its outline from the hip to `upTo` of the way down, rounded at the end or square across */
  points(upTo: number, rounded: boolean, wider?: number): Pt[];
  outline(upTo: number, rounded: boolean, wider?: number): string;
  /** A line along it from `from` to `to` of the way down, `across` of the way out to its outside */
  along(across: number, from: number, to: number): string;
}

function lyingLeg(side: number, middle: Pt[], widths: number[]): LyingLeg {
  // How far along each point is, as a share of the whole
  const lengths = [0];
  for (let i = 1; i < middle.length; i++) {
    const [ax, ay] = middle[i - 1];
    const [bx, by] = middle[i];
    lengths.push(lengths[i - 1] + Math.hypot(bx - ax, by - ay));
  }
  const total = lengths[lengths.length - 1];
  const shares = lengths.map((l) => l / total);
  // Square to the leg at each point, toward its outside
  const normals: Pt[] = middle.map(([x, y], i) => {
    const [ax, ay] = middle[Math.max(0, i - 1)];
    const [bx, by] = middle[Math.min(middle.length - 1, i + 1)];
    const span = Math.hypot(bx - ax, by - ay);
    let nx = -(by - ay) / span;
    let ny = (bx - ax) / span;
    if (ny * side < 0) {
      nx = -nx;
      ny = -ny;
    }
    return [nx, ny];
  });
  const sample = (at: number): [number, number, number, number, number] => {
    let i = 0;
    while (i < shares.length - 2 && shares[i + 1] < at) {
      i++;
    }
    const t = Math.max(
      0,
      Math.min(1, (at - shares[i]) / (shares[i + 1] - shares[i])),
    );
    const lerp = (a: number, b: number) => a + (b - a) * t;
    const nx = lerp(normals[i][0], normals[i + 1][0]);
    const ny = lerp(normals[i][1], normals[i + 1][1]);
    const length = Math.hypot(nx, ny);
    return [
      lerp(middle[i][0], middle[i + 1][0]),
      lerp(middle[i][1], middle[i + 1][1]),
      lerp(widths[i], widths[i + 1]),
      nx / length,
      ny / length,
    ];
  };
  const [ex, ey] = middle[middle.length - 1];
  const [px, py] = middle[middle.length - 2];
  const end = Math.atan2(ey - py, ex - px);
  const points = (upTo: number, rounded: boolean, wider = 1): Pt[] => {
    const steps = Math.max(2, Math.round(upTo * 16));
    const inner: Pt[] = [];
    const outer: Pt[] = [];
    for (let i = 0; i <= steps; i++) {
      const [x, y, half, nx, ny] = sample((upTo * i) / steps);
      const h = half * (i === 0 ? 1 : wider);
      inner.push([x - nx * h, y - ny * h]);
      outer.push([x + nx * h, y + ny * h]);
    }
    const [x, y] = sample(upTo);
    return [
      ...inner,
      ...(rounded
        ? [[x + Math.cos(end) * 20, y + Math.sin(end) * 20] as Pt]
        : []),
      ...outer.reverse(),
    ];
  };
  return {
    side,
    end,
    sample: (at) => {
      const [x, y, half] = sample(at);
      return [x, y, half];
    },
    points,
    outline: (upTo, rounded, wider) =>
      rounded
        ? smoothPath(points(upTo, rounded, wider), true, 0.8)
        : polygonPath(points(upTo, rounded, wider)),
    along: (across, from, to) => {
      const line: Pt[] = [];
      for (let i = 0; i <= 10; i++) {
        const [x, y, half, nx, ny] = sample(from + ((to - from) * i) / 10);
        line.push([x + nx * half * across, y + ny * half * across]);
      }
      return smoothPath(line, false);
    },
  };
}

/**
 * A shoe (or a bare foot) at `ankle`, lying face down with the foot fallen
 * onto its side, from the side: the toe pointing `angle`, the leg coming
 * into it over the heel, and the sole and heel on the `soleSide` (-1 or 1)
 */
function drawShoeSide(
  d: Drawing,
  look: BodyLook,
  skin: Color,
  ankle: Pt,
  footScale: number,
  angle: number,
  soleSide: number,
) {
  const style = look.shoeStyle;
  const [baseLength] = SHOE_SIZES[style];
  const L = baseLength * footScale;
  // How tall it is from the sole to the top of the instep
  const H =
    (style === "dress" || style === "heels"
      ? 80
      : style === "boots"
        ? 105
        : 95) * footScale;
  d.include(ankle[0] - L, ankle[1] - L, ankle[0] + L, ankle[1] + L);
  d.begin(
    `transform="translate(${n(ankle[0])} ${n(ankle[1])}) rotate(${n((angle * 180) / Math.PI)}) scale(1 ${soleSide})"`,
  );
  const pointy = style === "heels" || style === "dress" ? 0.12 : 0;
  // Round from the back of the heel, along the sole to the toe and back
  // over the instep to the ankle
  const sole: Pt[] = [
    [-0.16 * L, 0.3 * H],
    [-0.06 * L, 0.55 * H],
    [0.4 * L, 0.52 * H],
    [0.8 * L, 0.42 * H],
    [(0.98 + pointy) * L, 0.18 * H],
  ];
  const upper: Pt[] = [
    [(1 + pointy) * L, -0.02 * H],
    [0.88 * L, -0.22 * H],
    [0.5 * L, -0.42 * H],
    [0.15 * L, -0.5 * H],
    [-0.08 * L, -0.45 * H],
    [-0.2 * L, -0.05 * H],
  ];
  const outline = smoothPath([...sole, ...upper], true, 0.6);
  // The sole, `thick` in from its edge
  const soleStrip = (thick: number) =>
    smoothPath(
      [...sole, ...[...sole].reverse().map(([x, y]): Pt => [x, y - thick])],
      true,
      0.5,
    );
  const trim = look.shoeTrim ?? "#ecebe6";
  switch (style) {
    case "bare":
    case "sandals": {
      // The foot, toes along its end
      d.blob(outline, skin, { shade: "flat" });
      for (const t of [0.15, 0.32]) {
        d.line(
          `M${n(L * 0.92)} ${n((0.3 - t) * H)}l${n(L * 0.06)} ${n(0)}`,
          darken(skin, 0.3),
          4,
        );
      }
      if (style === "sandals") {
        d.blob(soleStrip(H * 0.16), look.shoes, { shade: "flat", outline: 4 });
        for (const x of [0.35, 0.7]) {
          d.line(
            `M${n(x * L)} ${n(0.5 * H)}L${n(x * L - 10)} ${n(-0.42 * H)}`,
            look.shoes,
            14,
          );
        }
      } else {
        d.blob(soleStrip(H * 0.12), mix(skin, "#4a3a28", 0.2), {
          shade: "flat",
          outline: 0,
        });
      }
      break;
    }
    case "sneakers":
    case "hightops":
    case "runners": {
      if (style === "hightops") {
        // Up round the ankle, the way the leg comes in
        d.blob(
          polygonPath([
            [-0.18 * L, -0.3 * H],
            [0.16 * L, -0.4 * H],
            [0.14 * L, -1.0 * H],
            [-0.16 * L, -1.0 * H],
          ]),
          look.shoes,
          { shade: "flat" },
        );
      }
      d.blob(outline, look.shoes, { shade: "flat" });
      // A sole as pale as the shoe is shaded, so they don't run together
      const soleColor =
        Math.abs(luminance(trim) - luminance(look.shoes)) < 0.15
          ? darken(trim, 0.22)
          : trim;
      d.blob(soleStrip(H * (style === "runners" ? 0.26 : 0.2)), soleColor, {
        shade: "flat",
        outline: 4,
      });
      // The toe cap and the laces
      d.line(
        `M${n(0.72 * L)} ${n(0.38 * H)}Q${n(0.7 * L)} ${n(-0.1 * H)} ${n(0.86 * L)} ${n(-0.22 * H)}`,
        darken(look.shoes, 0.3),
        4,
        `opacity="0.6"`,
      );
      for (const x of [0.12, 0.24, 0.36, 0.48]) {
        d.line(
          `M${n(x * L)} ${n(-0.4 * H)}l${n(10)} ${n(0.14 * H)}`,
          darken(look.shoes, 0.35),
          5,
        );
      }
      break;
    }
    case "boots":
      // Up the leg, the way it comes in
      d.blob(
        polygonPath([
          [-0.2 * L, -0.3 * H],
          [0.18 * L, -0.4 * H],
          [0.16 * L, -1.5 * H],
          [-0.18 * L, -1.5 * H],
        ]),
        look.shoes,
        { shade: "flat" },
      );
      d.blob(outline, look.shoes, { shade: "flat" });
      d.blob(soleStrip(H * 0.22), "#2a2420", { shade: "flat", outline: 4 });
      for (const x of [0.1, 0.3, 0.5, 0.7]) {
        d.line(`M${n(x * L)} ${n(0.52 * H)}l0 ${n(-0.1 * H)}`, "#4a4038", 6);
      }
      break;
    case "dress":
    case "heels": {
      // Leather soles, lighter than a dark shoe, so it reads as one
      const leather =
        luminance(look.shoes) < 0.25
          ? mix(look.shoes, "#8a6e52", 0.6)
          : darken(look.shoes, 0.35);
      if (style === "heels") {
        // The heel, standing out from under the back of it
        d.blob(
          polygonPath([
            [-0.1 * L, 0.45 * H],
            [0.02 * L, 0.48 * H],
            [-0.02 * L, 1.25 * H],
            [-0.07 * L, 1.25 * H],
          ]),
          darken(look.shoes, 0.25),
          { shade: "flat", outline: 4 },
        );
      } else {
        d.blob(
          polygonPath([
            [-0.14 * L, 0.4 * H],
            [0.1 * L, 0.5 * H],
            [0.1 * L, 0.72 * H],
            [-0.12 * L, 0.68 * H],
          ]),
          darken(leather, 0.3),
          { shade: "flat", outline: 4 },
        );
      }
      d.blob(outline, look.shoes, { shade: "flat" });
      d.blob(soleStrip(H * 0.1), leather, { shade: "flat", outline: 3 });
      // A shine along the toe
      d.line(
        `M${n(0.55 * L)} ${n(-0.25 * H)}Q${n(0.8 * L)} ${n(-0.2 * H)} ${n(0.9 * L)} ${n(-0.05 * H)}`,
        lighten(look.shoes, 0.4),
        6,
        `opacity="0.5"`,
      );
      break;
    }
  }
  d.end();
}
