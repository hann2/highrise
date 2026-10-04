import { BodyLook, Pattern } from "../BodyLook";
import { Color, darken, mix, withAlpha } from "../color";
import { wobble } from "../dimensions";
import { Drawing, ellipsePoints, n, Pt, smoothPath, polygonPath } from "../svg";

/** Shared by the parts that wear clothes: patterns, rips, blood */

/** A pattern over everything inside `clip` (a clip path's id) */
export function drawPattern(
  d: Drawing,
  pattern: Pattern,
  clip: string,
  /** Stripes run along x; turn them by this many degrees */
  angle = 0,
) {
  const color = pattern.color;
  const id = d.def(`pattern-${pattern.kind}-${angle}`, (id) => {
    switch (pattern.kind) {
      case "stripes":
        return (
          `<pattern id="${id}" patternUnits="userSpaceOnUse" width="44" height="44" patternTransform="rotate(${angle})">` +
          `<rect x="0" y="0" width="44" height="15" fill="${color}"/></pattern>`
        );
      case "plaid":
        return (
          `<pattern id="${id}" patternUnits="userSpaceOnUse" width="70" height="70" patternTransform="rotate(${angle})">` +
          `<rect x="0" y="0" width="70" height="22" fill="${withAlpha(color, 0.55)}"/>` +
          `<rect x="0" y="0" width="22" height="70" fill="${withAlpha(color, 0.55)}"/>` +
          `<rect x="0" y="40" width="70" height="5" fill="${withAlpha(darken(color, 0.4), 0.6)}"/>` +
          `<rect x="40" y="0" width="5" height="70" fill="${withAlpha(darken(color, 0.4), 0.6)}"/></pattern>`
        );
      case "dots":
        return (
          `<pattern id="${id}" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(${angle})">` +
          `<circle cx="10" cy="10" r="7" fill="${color}"/><circle cx="30" cy="30" r="7" fill="${color}"/></pattern>`
        );
    }
  });
  d.add(
    `<rect x="${n(d.minX)}" y="${n(d.minY)}" width="${n(d.width)}" height="${n(d.height)}" fill="url(#${id})" clip-path="url(#${clip})"/>`,
  );
}

/** A jagged hole, around `center` */
export function ripPath(center: Pt, size: number, random: () => number): string {
  // A slash: long one way, narrow the other, with frayed edges
  const points: Pt[] = [];
  const count = 10 + Math.floor(random() * 6);
  const turn = random() * Math.PI;
  const long = size * (0.8 + random() * 0.6);
  const wide = size * (0.25 + random() * 0.25);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = 0.55 + random() * 0.5;
    const x = Math.cos(angle) * long * r;
    const y = Math.sin(angle) * wide * r;
    points.push([
      center[0] + x * Math.cos(turn) - y * Math.sin(turn),
      center[1] + x * Math.sin(turn) + y * Math.cos(turn),
    ]);
  }
  return polygonPath(points);
}

/**
 * Rips in the clothes inside `clip`, showing `skin` through them, at
 * places `where` picks
 */
export function drawRips(
  d: Drawing,
  look: BodyLook,
  skin: Color,
  cloth: Color,
  clip: string,
  where: () => Pt,
  random: () => number,
  sizeScale = 1,
) {
  const tears = look.zombie?.tears ?? 0;
  const count = Math.round(tears * 4 * (0.5 + random()));
  if (count === 0) {
    return;
  }
  d.begin(`clip-path="url(#${clip})"`);
  for (let i = 0; i < count; i++) {
    const path = ripPath(where(), (40 + random() * 50) * sizeScale, random);
    d.blob(path, skin, {
      grain: "rot",
      shade: "flat",
      outline: 7,
      outlineColor: darken(cloth, 0.55),
    });
  }
  d.end();
}

/** Splashes and smears of blood inside `clip`, at places `where` picks */
export function drawBlood(
  d: Drawing,
  look: BodyLook,
  clip: string,
  where: () => Pt,
  random: () => number,
  sizeScale = 1,
) {
  const blood = look.zombie?.blood ?? 0;
  const count = Math.round(blood * 6 * (0.5 + random()));
  if (count === 0) {
    return;
  }
  d.begin(`clip-path="url(#${clip})"`);
  for (let i = 0; i < count; i++) {
    const [x, y] = where();
    const size = (14 + random() * 46) * sizeScale;
    const color = mix("#5e0b0b", "#3a1208", random());
    const alpha = 0.55 + random() * 0.35;
    const wave = wobble(random, 3, 2);
    const points = ellipsePoints(
      x,
      y,
      size,
      size * (0.6 + random() * 0.5),
      12,
      (a) => 0.35 * wave(a),
    );
    d.add(`<path d="${smoothPath(points)}" fill="${withAlpha(color, alpha)}"/>`);
    // Spatters round it
    for (let j = 0; j < 3; j++) {
      const angle = random() * Math.PI * 2;
      const r = size * (1.2 + random());
      d.add(
        `<circle cx="${n(x + Math.cos(angle) * r)}" cy="${n(y + Math.sin(angle) * r)}" r="${n(3 + random() * 7)}" fill="${withAlpha(color, alpha)}"/>`,
      );
    }
  }
  d.end();
}

/** Grime over everything inside `clip`, as much as it's rotten */
export function drawGrime(d: Drawing, look: BodyLook, clip: string) {
  const rot = look.zombie?.rot ?? 0;
  if (rot <= 0) {
    return;
  }
  d.add(
    `<rect x="${n(d.minX)}" y="${n(d.minY)}" width="${n(d.width)}" height="${n(d.height)}" fill="${withAlpha("#4a4030", rot * 0.35)}" ` +
      `filter="url(#${d.grainFilter("rot")})" clip-path="url(#${clip})"/>`,
  );
}
