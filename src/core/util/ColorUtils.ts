import { clamp } from "./MathUtil";

// Converts int values 0-255 to single hex value
export function rgbToHex(red: number, green: number, blue: number): number {
  return (
    clamp(blue, 0, 255) +
    (clamp(green, 0, 255) << 8) +
    (clamp(red, 0, 255) << 16)
  );
}

type RGB = { r: number; g: number; b: number };

export function rgbObjToHex({ r, g, b }: RGB): number {
  return rgbToHex(r, g, b);
}

export function hexToRGB(hex: number): RGB {
  return {
    r: hex >> 16,
    g: (hex >> 8) & 0x0000ff,
    b: hex & 0x0000ff,
  };
}

export function hexToVec3(hex: number): [number, number, number] {
  const r = hex >> 16;
  const g = (hex >> 8) & 0x0000ff;
  const b = hex & 0x0000ff;
  return [r / 255.0, g / 255.0, b / 255.0];
}

// given colors "from" and "to", return a hex array [from, x, y, z, to]
// where there are exactly (steps + 1) elements in the array
// and each element is a color that fades between the two endpoint colors
export function colorRange(from: number, to: number, steps: number): number[] {
  const perStepFade = 1.0 / steps;
  const out = [];
  for (let i = 0; i < steps; i++) {
    out.push(colorLerp(from, to, perStepFade * i));
  }
  return out;
}

export function colorLerp(from: number, to: number, percentTo: number): number {
  const rgbFrom = hexToRGB(from);
  const rgbTo = hexToRGB(to);

  rgbFrom.r = Math.floor(rgbFrom.r * (1.0 - percentTo));
  rgbFrom.g = Math.floor(rgbFrom.g * (1.0 - percentTo));
  rgbFrom.b = Math.floor(rgbFrom.b * (1.0 - percentTo));

  rgbTo.r = Math.floor(rgbTo.r * percentTo);
  rgbTo.g = Math.floor(rgbTo.g * percentTo);
  rgbTo.b = Math.floor(rgbTo.b * percentTo);

  return rgbObjToHex(rgbFrom) + rgbObjToHex(rgbTo);
}

export function lighten(from: number, percent: number = 0.1): number {
  return colorLerp(from, 0xffffff, percent);
}

export function darken(from: number, percent: number = 0.1): number {
  return colorLerp(from, 0x000000, percent);
}

export function colorDistance(c1: number, c2: number): number {
  const rgb1 = hexToRGB(c1);
  const rgb2 = hexToRGB(c2);

  return Math.max(
    Math.abs(rgb1.r - rgb2.r) / 255,
    Math.abs(rgb1.g - rgb2.g) / 255,
    Math.abs(rgb1.b - rgb2.b) / 255
  );
}
