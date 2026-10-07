/**
 * Turning a drawing made in a reference photo's pixels into the game's: millimeters about the gun's middle on
 * the bore (as the top views in src/highrise/weapons/guns/art/ are), framed as a pickup.
 */
import { fixed } from "./geometry";

export interface PhotoScale {
  /** The gun's middle on the bore, in the photo's pixels */
  readonly origin: readonly [number, number];
  /** Millimeters a pixel: the real gun's length over its length in the photo */
  readonly mmPerPixel: number;
}

/** A number to two decimals at most, without trailing zeros, and never "-0" */
function short(value: number): string {
  const s = fixed(value, 2).replace(/0+$/, "").replace(/\.$/, "");
  return s === "-0" ? "0" : s;
}

const X_ATTRIBUTES = ["x", "cx", "x1", "x2"];
const Y_ATTRIBUTES = ["y", "cy", "y1", "y2"];
const LENGTH_ATTRIBUTES = ["width", "height", "r", "stroke-width"];

/**
 * Every coordinate and length in a drawing's body (everything after its <svg> tag), from the photo's pixels to
 * millimeters. Paths must use absolute M/L/C/Z only, so every number pair in them is a point.
 */
export function toMillimeters(svg: string, scale: PhotoScale): string {
  const [ox, oy] = scale.origin;
  const x = (v: string) => short((parseFloat(v) - ox) * scale.mmPerPixel);
  const y = (v: string) => short((parseFloat(v) - oy) * scale.mmPerPixel);
  const length = (v: string) => short(parseFloat(v) * scale.mmPerPixel);
  let body = svg.slice(svg.indexOf(">") + 1);
  body = body.replace(/ d="([^"]*)"/g, (_, d: string) => {
    const converted = d.replace(
      /(-?[\d.]+),(-?[\d.]+)/g,
      (_m, a: string, b: string) => `${x(a)},${y(b)}`,
    );
    return ` d="${converted}"`;
  });
  const convert = (names: string[], f: (v: string) => string) => {
    for (const name of names) {
      body = body.replace(
        new RegExp(` ${name}="(-?[\\d.]+)"`, "g"),
        (_, v: string) => ` ${name}="${f(v)}"`,
      );
    }
  };
  convert(X_ATTRIBUTES, x);
  convert(Y_ATTRIBUTES, y);
  convert(LENGTH_ATTRIBUTES, length);
  return body;
}

export interface PickupFrame {
  /** The gun's extent in the photo's pixels: its top, bottom, back and front */
  readonly top: number;
  readonly bottom: number;
  readonly back: number;
  readonly front: number;
  /** The square's side in millimeters: a little more than the gun's length, so it fills the width */
  readonly side: number;
  /** Pixels the pickup image is, square */
  readonly pixels: number;
}

/** The <svg> tag of a pickup: a square in millimeters round the gun, which fills its width, in the middle of its height */
export function pickupTag(frame: PickupFrame, scale: PhotoScale): string {
  const [ox, oy] = scale.origin;
  const midX = ((frame.back + frame.front) / 2 - ox) * scale.mmPerPixel;
  const midY = ((frame.top + frame.bottom) / 2 - oy) * scale.mmPerPixel;
  const box = `${fixed(midX - frame.side / 2, 2)} ${fixed(midY - frame.side / 2, 2)} ${frame.side} ${frame.side}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${frame.pixels}" height="${frame.pixels}" viewBox="${box}" ` +
    'fill-rule="evenodd" stroke-linejoin="round" clip-rule="evenodd">'
  );
}
