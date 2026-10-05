/** Colors as `#rrggbb` strings, the way looks store them and SVG wants them */

export type Color = string;

export function isColor(value: unknown): value is Color {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function channels(color: Color): [number, number, number] {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function fromChannels([r, g, b]: number[]): Color {
  const hex = (c: number) =>
    Math.round(Math.max(0, Math.min(255, c)))
      .toString(16)
      .padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** `a` with `t` of the way to `b` */
export function mix(a: Color, b: Color, t: number): Color {
  const ca = channels(a);
  const cb = channels(b);
  return fromChannels(ca.map((c, i) => c + (cb[i] - c) * t));
}

export function darken(color: Color, amount: number): Color {
  return mix(color, "#000000", amount);
}

export function lighten(color: Color, amount: number): Color {
  return mix(color, "#ffffff", amount);
}

/** 0 for black to 1 for white, by how bright it looks */
export function luminance(color: Color): number {
  const [r, g, b] = channels(color);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** `color` with its saturation scaled by `factor` (0 is grey) */
export function saturate(color: Color, factor: number): Color {
  const c = channels(color);
  const grey = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  return fromChannels(c.map((v) => grey + (v - grey) * factor));
}

/** As an `rgba()` with `alpha`, for see-through fills */
export function withAlpha(color: Color, alpha: number): string {
  const [r, g, b] = channels(color);
  return `rgba(${r},${g},${b},${alpha})`;
}

function toHsl(color: Color): [number, number, number] {
  const [r, g, b] = channels(color).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) {
    return [0, 0, l];
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r
      ? (g - b) / d + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  return [h / 6, s, l];
}

function fromHsl([h, s, l]: [number, number, number]): Color {
  const hue = (p: number, q: number, t: number) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) {
    return fromChannels([l, l, l].map((c) => c * 255));
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return fromChannels(
    [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)].map(
      (c) => c * 255,
    ),
  );
}

/**
 * `color` moved the way `from` would have to move to be `to`: the same hue
 * turn, saturation and lightness change. For recoloring a drawing made in
 * shades of `from` into shades of `to`.
 */
export function retint(color: Color, from: Color, to: Color): Color {
  const [h, s, l] = toHsl(color);
  const [fh, fs, fl] = toHsl(from);
  const [th, ts, tl] = toHsl(to);
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  return fromHsl([
    (h + th - fh + 1) % 1,
    clamp(fs > 0.01 ? s * (ts / fs) : ts),
    clamp(l + tl - fl),
  ]);
}

/** `#rrggbb` from an SVG color written `#rrggbb`, `#rgb` or `rgb(r,g,b)` */
export function parseSvgColor(text: string): Color | undefined {
  const rgb = text.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgb) {
    return fromChannels(rgb.slice(1, 4).map(Number));
  }
  if (/^#[0-9a-f]{6}$/i.test(text)) {
    return text.toLowerCase();
  }
  if (/^#[0-9a-f]{3}$/i.test(text)) {
    return `#${[...text.slice(1)].map((c) => c + c).join("")}`.toLowerCase();
  }
  return undefined;
}
