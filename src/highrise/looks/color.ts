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
