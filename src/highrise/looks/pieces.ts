import { Color } from "./color";
import { Drawing, n } from "./svg";

/**
 * Hand-drawn pieces: SVG files a look can wear on its head (hats, headphones,
 * masks) or torso (badges, armor, wings), in `pieces/head/` and
 * `pieces/torso/`. See `pieces/README.md` for how to draw one.
 */

export const PIECE_PLACES = ["head", "torso"] as const;
export type PiecePlace = (typeof PIECE_PLACES)[number];

/** Colors in a piece that are swapped for the look's */
const COLOR_KEYS: [RegExp, "color" | "secondary"][] = [
  [/#ff00ff\b|#f0f\b|rgb\(\s*255\s*,\s*0\s*,\s*255\s*\)/gi, "color"],
  [/#00ffff\b|#0ff\b|rgb\(\s*0\s*,\s*255\s*,\s*255\s*\)/gi, "secondary"],
];

interface Piece {
  place: PiecePlace;
  /** What's inside the file's `<svg>` */
  content: string;
  /** Its viewBox, in mm, with the part's origin in the middle */
  box: [number, number, number, number];
}

const PIECES = new Map<string, Piece>();

/** Adds a piece from its SVG file's text (`name` is the file name without `.svg`) */
export function registerPiece(name: string, place: PiecePlace, svg: string) {
  const root = svg.match(/<svg\b[^>]*>/i)?.[0];
  if (!root) {
    throw new Error(`Piece ${name} isn't an SVG`);
  }
  const attr = (key: string) =>
    root.match(new RegExp(`\\b${key}="([^"]*)"`, "i"))?.[1];
  const viewBox = attr("viewBox")
    ?.split(/[\s,]+/)
    .map(Number);
  const box = (
    viewBox && viewBox.length === 4
      ? viewBox
      : [
          0,
          0,
          parseFloat(attr("width") ?? "0"),
          parseFloat(attr("height") ?? "0"),
        ]
  ) as [number, number, number, number];
  const content = svg
    .slice(svg.indexOf(root) + root.length, svg.lastIndexOf("</svg>"))
    // A guide layer (a head or torso to draw round) isn't part of it
    .replace(/<g\b[^>]*\bid="guide"[^>]*>[\s\S]*?<\/g>/i, "");
  PIECES.set(name, { place, content, box });
}

export function pieceNames(place?: PiecePlace): string[] {
  return [...PIECES.entries()]
    .filter(([, piece]) => !place || piece.place === place)
    .map(([name]) => name)
    .sort();
}

export function piecePlace(name: string): PiecePlace | undefined {
  return PIECES.get(name)?.place;
}

/**
 * Draws a piece into `d`, its middle on the part's origin, recolored, with
 * its ids made its own
 */
export function drawPiece(
  d: Drawing,
  name: string,
  color: Color,
  secondary: Color | undefined,
) {
  const piece = PIECES.get(name);
  if (!piece) {
    return;
  }
  const [x, y, w, h] = piece.box;
  const prefix = d.id(`piece-${name}`);
  let content = piece.content
    .replace(/\bid="([^"]+)"/g, `id="${prefix}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${prefix}-$1"`);
  for (const [key, which] of COLOR_KEYS) {
    content = content.replace(
      key,
      which === "color" ? color : (secondary ?? color),
    );
  }
  d.include(-w / 2, -h / 2, w / 2, h / 2);
  d.add(
    `<svg x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" viewBox="${x} ${y} ${w} ${h}" overflow="visible">${content}</svg>`,
  );
}
