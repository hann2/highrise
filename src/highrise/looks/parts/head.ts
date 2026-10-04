import { BodyLook, Hat } from "../BodyLook";
import { Color, darken, lighten, mix } from "../color";
import { BodyDimensions, lookRandom, palette, wobble } from "../dimensions";
import {
  Drawing,
  ellipsePath,
  ellipsePoints,
  n,
  polygonPath,
  Pt,
  smoothPath,
} from "../svg";
import { STYLE } from "../style";

/**
 * The head from above, facing +x, the skull's middle at the origin: hair,
 * ears, nose, brows, a beard, glasses and a hat.
 */
export function drawHead(
  look: BodyLook,
  dims: BodyDimensions,
  prefix: string,
): Drawing {
  const { headRx: rx, headRy: ry } = dims;
  const colors = palette(look);
  const rot = look.zombie?.rot ?? 0;
  const skinGrain = rot > 0 ? "rot" : "skin";
  const hair = look.hair;
  const random = lookRandom(look, 1);
  const d = new Drawing(prefix, -rx, -ry, rx, ry);
  d.include(-rx * 1.1, -ry * 1.15, rx * 1.1, ry * 1.15);

  // Hair down the back, under everything
  if (hair.length > 0.02 && hair.coverage > 0) {
    drawLongHair(d, look, rx, ry, colors.hair, random);
  }
  if (hair.ponytail > 0.02 && hair.coverage > 0) {
    drawPonytail(d, hair.ponytail, rx, ry, colors.hair, random);
  }

  // Ears, a nose, a beard: whatever sticks out from under the skull
  for (const side of [-1, 1]) {
    d.blob(ellipsePath(-rx * 0.06, side * ry * 0.97, 24, 31), colors.skin, {
      grain: skinGrain,
    });
  }
  if (look.beard && look.beard.length > 0) {
    drawBeard(d, look, rx, ry, random);
  }
  d.blob(ellipsePath(rx * 0.95, 0, 27, 20), colors.skin, { grain: skinGrain });
  d.include(rx * 0.95 + 27, -20, rx * 0.95 + 27, 20);

  const skull = ellipsePath(0, 0, rx, ry);
  d.blob(skull, colors.skin, { grain: skinGrain });

  // Eyes and brows at the front edge, unless the hair hides them
  for (const side of [-1, 1]) {
    const x = rx * 0.9;
    const y = side * ry * 0.3;
    d.add(
      `<ellipse cx="${n(x)}" cy="${n(y)}" rx="9" ry="14" fill="${rot > 0.5 ? "#c9c7a0" : "#2a2420"}" transform="rotate(${side * 12} ${n(x)} ${n(y)})"/>`,
    );
  }
  const browColor = darken(colors.hair, 0.15);
  for (const side of [-1, 1]) {
    const x = rx * 0.74;
    const y = side * ry * 0.33;
    d.line(
      `M${n(x - 6)} ${n(y - side * 26)}Q${n(x + 7)} ${n(y)} ${n(x - 4)} ${n(y + side * 24)}`,
      browColor,
      10,
    );
  }

  if (hair.coverage > 0) {
    drawHair(d, look, rx, ry, colors.hair, colors.skin, random);
  }
  if (look.glasses) {
    drawGlasses(d, look.glasses.shape, look.glasses.color, rx, ry);
  }
  if (look.hat) {
    drawHat(d, look.hat, rx, ry, 1 + hair.volume * 0.12 * hair.coverage);
  }
  return d;
}

/** The edge of the hair, all round, as a factor of the skull's radii */
function hairEdge(look: BodyLook, random: () => number) {
  const { volume, messiness, curls } = look.hair;
  const wave = wobble(random, 5, 3);
  const curlCount = 14 + Math.floor(random() * 6);
  const curlPhase = random() * Math.PI;
  return (angle: number) =>
    0.035 +
    volume * 0.2 +
    curls * 0.12 +
    messiness * 0.07 * wave(angle) +
    curls * 0.07 * Math.abs(Math.sin(angle * curlCount + curlPhase));
}

function drawHair(
  d: Drawing,
  look: BodyLook,
  rx: number,
  ry: number,
  color: Color,
  skin: Color,
  random: () => number,
) {
  const hair = look.hair;
  const edge = hairEdge(look, random);
  const count = hair.curls > 0.05 ? 160 : 72;
  const points = ellipsePoints(0, 0, rx, ry, count, edge);
  d.includePoints(points);
  const shape = smoothPath(points);

  // Clipped to behind the hairline, and to a strip for a mohawk
  const base = rx * (-1.2 + 2.1 * hair.coverage);
  const hairline: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const y = -ry * 1.6 + (ry * 3.2 * i) / 24;
    const t = Math.min(1, (y / ry) ** 2);
    hairline.push([base + hair.fringe * rx * 0.42 * (t - 0.35), y]);
  }
  hairline.push([-rx * 3, ry * 1.6], [-rx * 3, -ry * 1.6]);
  const clips = [d.clipPath("hairline", smoothPath(hairline, true, 0.6))];
  if (hair.mohawk > 0) {
    const half = ry * (0.12 + hair.mohawk * 0.35);
    clips.push(
      d.clipPath(
        "mohawk",
        polygonPath([
          [-rx * 3, -half],
          [rx * 3, -half],
          [rx * 3, half],
          [-rx * 3, half],
        ]),
      ),
    );
    // Stubble where it's shaved
    d.begin(`clip-path="url(#${clips[0]})"`);
    d.add(
      `<path d="${ellipsePath(0, 0, rx - 4, ry - 4)}" fill="${mix(skin, color, 0.35)}" opacity="0.6"/>`,
    );
    d.end();
  }
  for (const clip of clips) {
    d.begin(`clip-path="url(#${clip})"`);
  }
  d.blob(shape, color, { grain: "cloth", outline: STYLE.outline * 0.9 });

  const crown: Pt = [-rx * 0.28, (hair.part ?? 0) * ry * 0.45];
  const strandColor = darken(color, 0.3);
  if (hair.curls > 0.3) {
    // Little curls all over
    const curls = Math.round(30 + hair.curls * 30);
    for (let i = 0; i < curls; i++) {
      const angle = random() * Math.PI * 2;
      const r = Math.sqrt(random()) * 1.05;
      const x = Math.cos(angle) * rx * r;
      const y = Math.sin(angle) * ry * r;
      const size = 9 + random() * 9;
      d.add(
        `<path d="M${n(x - size)} ${n(y)}a${n(size)} ${n(size)} 0 1 1 ${n(size)} ${n(size)}" fill="none" stroke="${strandColor}" stroke-width="4" opacity="0.5"/>`,
      );
    }
  } else {
    // Combed back from the hairline, away from the parting
    const part = (hair.part ?? 0) * ry * 0.45;
    const strands = 22;
    for (let i = 0; i < strands; i++) {
      const across = -1 + (2 * (i + 0.5)) / strands;
      const y0 = across * ry * 0.9 + (random() - 0.5) * 12;
      const away = y0 < part ? -1 : 1;
      const spread = Math.min(1, Math.abs(y0 - part) / ry + 0.15);
      const angle = Math.PI - away * spread * 1.25;
      const reach = (1 + edge(angle)) * 0.98;
      const end: Pt = [
        Math.cos(angle) * rx * reach,
        Math.sin(angle) * ry * reach,
      ];
      const jitter = hair.messiness * 30 * (random() - 0.5);
      d.line(
        `M${n(rx * 1.1)} ${n(y0)}Q${n(-rx * 0.15 + jitter)} ${n(y0 * 1.1 + away * 25 + jitter)} ${n(end[0])} ${n(end[1])}`,
        strandColor,
        4.5,
        `opacity="0.35"`,
      );
    }
  }
  // A shine across the top
  d.line(
    `M${n(-rx * 0.45)} ${n(-ry * 0.42)}Q${n(-rx * 0.05)} ${n(-ry * 0.62)} ${n(rx * 0.3)} ${n(-ry * 0.38)}`,
    lighten(color, 0.4),
    14,
    `opacity="0.3"`,
  );
  if (hair.part !== undefined) {
    const y = hair.part * ry * 0.45;
    d.line(
      `M${n(crown[0])} ${n(y)}L${n(rx * 0.9)} ${n(y * 0.9)}`,
      darken(color, 0.45),
      6,
    );
  }
  // Patches where it's falling out
  const rot = look.zombie?.rot ?? 0;
  for (let i = 0; i < Math.round(rot * 4 * random()); i++) {
    const angle = random() * Math.PI * 2;
    const r = random() * 0.6;
    const cx = Math.cos(angle) * rx * r;
    const cy = Math.sin(angle) * ry * r;
    const size = 22 + random() * 30;
    const wave = wobble(random, 3, 2);
    d.blob(
      smoothPath(
        ellipsePoints(cx, cy, size, size * 0.8, 9, (a) => 0.3 * wave(a)),
      ),
      skin,
      { grain: "rot", outline: 0 },
    );
  }
  for (const _ of clips) {
    d.end();
  }

  if (hair.bun > 0.02) {
    const r = 34 + hair.bun * 42;
    const cx = -rx * 0.6 - hair.bun * 20;
    d.include(cx - r, -r, cx + r, r);
    d.blob(ellipsePath(cx, 0, r, r * 0.95), color, { grain: "cloth" });
    d.line(
      `M${n(cx + r * 0.6)} ${n(0)}A${n(r * 0.6)} ${n(r * 0.55)} 0 1 1 ${n(cx)} ${n(-r * 0.55)}A${n(r * 0.3)} ${n(r * 0.3)} 0 1 1 ${n(cx + r * 0.1)} ${n(r * 0.2)}`,
      strandColor,
      5,
      `opacity="0.6"`,
    );
  }
}

function drawLongHair(
  d: Drawing,
  look: BodyLook,
  rx: number,
  ry: number,
  color: Color,
  random: () => number,
) {
  const { length, volume, messiness } = look.hair;
  const wave = wobble(random, 4, 3);
  const width = ry * (1.02 + volume * 0.25);
  const back = rx + length * 230;
  const points: Pt[] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Down one side, round the bottom, up the other
    const along = Math.sin(t * Math.PI);
    const x = rx * 0.1 - (rx * 0.1 + back) * Math.pow(along, 0.6);
    const y = -width * Math.cos(t * Math.PI) * (1 - 0.15 * along);
    const jag = 1 + messiness * 0.08 * wave(t * 7);
    points.push([x * jag, y * jag]);
  }
  d.includePoints(points);
  d.blob(smoothPath(points), color, { grain: "cloth" });
  const strands = darken(color, 0.3);
  for (let i = 1; i < 8; i++) {
    const y = -width * 0.85 + (width * 1.7 * i) / 8;
    d.line(
      `M${n(-rx * 0.4)} ${n(y * 0.8)}Q${n(-back * 0.7)} ${n(y * 1.05)} ${n(-back * 0.92)} ${n(y * 0.75)}`,
      strands,
      5,
      `opacity="0.4"`,
    );
  }
}

function drawPonytail(
  d: Drawing,
  amount: number,
  rx: number,
  ry: number,
  color: Color,
  random: () => number,
) {
  const length = 70 + amount * 250;
  const sway = (random() - 0.5) * 60;
  const start: Pt = [-rx * 0.75, 0];
  const end: Pt = [-rx - length, sway];
  const width = 34 + amount * 18;
  const points: Pt[] = [
    [start[0], -width],
    [(start[0] + end[0]) / 2, sway * 0.4 - width * 1.15],
    [end[0], end[1] - width * 0.35],
    [end[0] - 18, end[1]],
    [end[0], end[1] + width * 0.35],
    [(start[0] + end[0]) / 2, sway * 0.4 + width * 1.15],
    [start[0], width],
  ];
  d.includePoints(points);
  d.blob(smoothPath(points), color, { grain: "cloth" });
  d.line(
    `M${n(start[0] - 10)} ${n(0)}Q${n((start[0] + end[0]) / 2)} ${n(sway * 0.5)} ${n(end[0])} ${n(end[1])}`,
    darken(color, 0.3),
    5,
    `opacity="0.45"`,
  );
  // The band round it
  d.blob(ellipsePath(-rx * 0.98, 0, 14, width * 0.8), darken(color, 0.55), {
    shade: "flat",
    outline: 0,
  });
}

function drawBeard(
  d: Drawing,
  look: BodyLook,
  rx: number,
  ry: number,
  random: () => number,
) {
  const beard = look.beard!;
  const color = beard.color ?? palette(look).hair;
  const reach = rx * 0.95 + beard.length * 110;
  const wave = wobble(random, 4, 4);
  const points: Pt[] = [];
  for (let i = 0; i <= 20; i++) {
    const angle = -Math.PI * 0.62 + (Math.PI * 1.24 * i) / 20;
    const jag = 1 + look.hair.messiness * 0.06 * wave(angle);
    points.push([
      rx * 0.1 + Math.cos(angle) * (reach - rx * 0.1) * jag,
      Math.sin(angle) * ry * (0.92 + beard.length * 0.12) * jag,
    ]);
  }
  points.push([-rx * 0.1, ry * 0.7], [-rx * 0.1, -ry * 0.7]);
  d.includePoints(points);
  d.blob(smoothPath(points, true, 0.8), color, { grain: "cloth" });
  for (let i = 0; i < 9; i++) {
    const angle = -0.9 + (1.8 * i) / 8;
    d.line(
      `M${n(rx * 0.6 * Math.cos(angle))} ${n(ry * 0.7 * Math.sin(angle))}L${n(reach * 0.95 * Math.cos(angle))} ${n(ry * 0.9 * Math.sin(angle))}`,
      darken(color, 0.25),
      5,
      `opacity="0.4"`,
    );
  }
}

function drawGlasses(
  d: Drawing,
  shape: "round" | "square" | "shades",
  color: Color,
  rx: number,
  ry: number,
) {
  const front = (y: number) => rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2));
  const half = ry * 0.62;
  // The arms along each side to the ears
  for (const side of [-1, 1]) {
    const y = side * half;
    d.line(
      `M${n(front(y) - 4)} ${n(y)}Q${n(rx * 0.3)} ${n(side * ry * 0.98)} ${n(-rx * 0.05)} ${n(side * ry * 1.0)}`,
      color,
      8,
    );
  }
  const thickness = shape === "shades" ? 26 : 14;
  const lens = shape === "shades" ? darken(color, 0.4) : color;
  for (const side of [-1, 1]) {
    const y0 = side * half;
    const y1 = side * 16;
    const x0 = front(y0) + 2;
    const x1 = front(y1) + 6;
    const path =
      shape === "round"
        ? `M${n(x0)} ${n(y0)}Q${n(x1 + 14)} ${n((y0 + y1) / 2)} ${n(x1)} ${n(y1)}`
        : `M${n(x0)} ${n(y0)}L${n(x1 + 6)} ${n((y0 + y1) / 2)}L${n(x1)} ${n(y1)}`;
    d.line(path, lens, thickness);
  }
  d.line(
    `M${n(front(16) + 6)} ${n(-16)}Q${n(rx + 4)} 0 ${n(front(16) + 6)} ${n(16)}`,
    color,
    8,
  );
  d.include(rx, -half, rx + 20, half);
}

function drawHat(d: Drawing, hat: Hat, rx: number, ry: number, size: number) {
  const hx = rx * size;
  const hy = ry * size;
  const color = hat.color;
  switch (hat.style) {
    case "cap": {
      const brim = ellipsePath(hx * 0.62, 0, hx * 0.66, hy * 0.78);
      d.include(-hx, -hy, hx * 1.28, hy);
      d.blob(brim, darken(hat.secondary ?? color, 0.05), { shade: "flat" });
      d.blob(ellipsePath(-6, 0, hx * 1.02, hy * 1.03), color, {
        grain: "cloth",
      });
      const seam = darken(color, 0.3);
      for (const angle of [Math.PI / 3, (Math.PI * 2) / 3, Math.PI]) {
        for (const side of [-1, 1]) {
          d.line(
            `M${n(-hx * 0.15)} 0L${n(-6 + Math.cos(angle) * hx * 0.98)} ${n(side * Math.sin(angle) * hy * 0.98)}`,
            seam,
            5,
            `opacity="0.6"`,
          );
        }
      }
      d.blob(ellipsePath(-hx * 0.15, 0, 16, 16), color, { outline: 5 });
      return;
    }
    case "beanie": {
      d.include(-hx * 1.1, -hy * 1.1, hx * 1.1, hy * 1.1);
      d.blob(ellipsePath(-4, 0, hx * 1.06, hy * 1.07), color, {
        grain: "knit",
      });
      d.add(
        `<path d="${ellipsePath(-4, 0, hx * 0.95, hy * 0.95)}" fill="none" stroke="${darken(color, 0.25)}" stroke-width="20" opacity="0.5"/>`,
      );
      if (hat.secondary) {
        d.blob(
          smoothPath(
            ellipsePoints(
              -hx * 0.2,
              0,
              44,
              44,
              18,
              (a) => 0.08 * Math.sin(a * 9),
            ),
          ),
          hat.secondary,
          { grain: "knit" },
        );
      }
      return;
    }
    case "hardhat": {
      d.include(-hx * 1.3, -hy * 1.2, hx * 1.35, hy * 1.2);
      d.blob(ellipsePath(10, 0, hx * 1.28, hy * 1.17), darken(color, 0.08));
      d.blob(ellipsePath(-4, 0, hx * 1.0, hy * 0.98), color);
      d.blob(
        `M${n(-hx * 0.95)} -18L${n(hx * 0.95)} -18L${n(hx * 0.95)} 18L${n(-hx * 0.95)} 18Z`,
        lighten(color, 0.12),
        {
          shade: "tube",
          clip: d.clipPath("hardhat", ellipsePath(-4, 0, hx * 1.0, hy * 0.98)),
        },
      );
      return;
    }
    case "santa": {
      const red = color;
      const fur = hat.secondary ?? "#f4f1ea";
      const tip: Pt = [-hx * 1.35, hy * 0.75];
      d.include(tip[0] - 50, -hy * 1.15, hx * 1.15, tip[1] + 50);
      d.blob(ellipsePath(-6, 0, hx * 1.02, hy * 1.02), red, { grain: "cloth" });
      d.blob(
        smoothPath([
          [-hx * 0.1, -hy * 0.6],
          [-hx * 0.7, hy * 0.1],
          tip,
          [-hx * 0.75, hy * 0.75],
          [hx * 0.05, hy * 0.55],
        ]),
        darken(red, 0.06),
        { grain: "cloth" },
      );
      d.add(
        `<path d="${ellipsePath(-6, 0, hx * 0.98, hy * 0.98)}" fill="none" stroke="${darken(fur, 0.35)}" stroke-width="34"/>` +
          `<path d="${ellipsePath(-6, 0, hx * 0.98, hy * 0.98)}" fill="none" stroke="${fur}" stroke-width="26" filter="url(#${d.grainFilter("knit")})"/>`,
      );
      d.blob(
        smoothPath(
          ellipsePoints(
            tip[0],
            tip[1],
            42,
            42,
            16,
            (a) => 0.1 * Math.sin(a * 7),
          ),
        ),
        fur,
        { grain: "knit" },
      );
      return;
    }
    case "cowboy": {
      d.include(-hx * 1.8, -hy * 1.75, hx * 1.8, hy * 1.75);
      d.blob(ellipsePath(0, 0, hx * 1.75, hy * 1.68), color, {
        grain: "cloth",
        outline: STYLE.outline * 1.4,
      });
      d.blob(ellipsePath(-8, 0, hx * 0.95, hy * 0.82), darken(color, 0.05), {
        grain: "cloth",
      });
      d.add(
        `<path d="${ellipsePath(-8, 0, hx * 0.92, hy * 0.79)}" fill="none" stroke="${hat.secondary ?? darken(color, 0.5)}" stroke-width="16"/>`,
      );
      d.line(`M${n(-hx * 0.6)} 0L${n(hx * 0.55)} 0`, darken(color, 0.3), 10);
      return;
    }
    case "tricorn": {
      const corners: Pt[] = [
        [hx * 1.4, 0],
        [-hx * 1.05, -hy * 1.45],
        [-hx * 1.05, hy * 1.45],
      ];
      d.includePoints(corners);
      const brim: Pt[] = [];
      for (let i = 0; i < 3; i++) {
        const a = corners[i];
        const b = corners[(i + 1) % 3];
        brim.push(a);
        // Each side curls in toward the middle
        brim.push([(a[0] + b[0]) * 0.42, (a[1] + b[1]) * 0.42]);
      }
      const trim = hat.secondary ?? "#c9a640";
      d.blob(smoothPath(brim, true, 0.7), color, {
        grain: "cloth",
        outlineColor: trim,
        outline: STYLE.outline * 1.4,
      });
      d.blob(ellipsePath(-14, 0, hx * 0.62, hy * 0.66), darken(color, 0.1), {
        grain: "cloth",
      });
      // A skull and crossbones on the front
      const sx = hx * 0.82;
      d.include(sx - 30, -30, sx + 30, 30);
      d.line(
        `M${n(sx - 22)} -24L${n(sx + 26)} 24M${n(sx - 22)} 24L${n(sx + 26)} -24`,
        "#ece6d6",
        9,
      );
      d.blob(ellipsePath(sx, 0, 20, 23), "#ece6d6", { outline: 4 });
      return;
    }
    case "bandana": {
      const cloth = color;
      d.include(-hx * 1.6, -hy * 1.05, hx * 1.05, hy * 1.05);
      // The knot's tails at the back
      for (const side of [-1, 1]) {
        d.blob(
          smoothPath([
            [-hx * 0.9, side * 12],
            [-hx * 1.35, side * 40],
            [-hx * 1.55, side * 70],
            [-hx * 1.25, side * 30],
          ]),
          cloth,
          { grain: "cloth" },
        );
      }
      d.blob(ellipsePath(-14, 0, hx * 0.98, hy * 1.02), cloth, {
        grain: "cloth",
      });
      if (hat.secondary) {
        d.begin(
          `clip-path="url(#${d.clipPath("bandana", ellipsePath(-14, 0, hx * 0.98, hy * 1.02))})"`,
        );
        for (let x = -hx; x < hx; x += 46) {
          for (let y = -hy; y < hy; y += 46) {
            d.add(
              `<circle cx="${n(x + ((y / 46) % 2) * 23)}" cy="${n(y)}" r="9" fill="${hat.secondary}" opacity="0.85"/>`,
            );
          }
        }
        d.end();
      }
      return;
    }
    case "beret": {
      d.include(-hx * 1.2, -hy * 1.2, hx * 1.2, hy * 1.3);
      d.blob(ellipsePath(-14, 18, hx * 1.12, hy * 1.12), color, {
        grain: "knit",
      });
      d.blob(ellipsePath(-14, 18, 12, 12), darken(color, 0.15), { outline: 4 });
      return;
    }
  }
}
