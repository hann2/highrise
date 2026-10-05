import type { HatStyle } from "./BodyLook";
import { Color, parseSvgColor, retint } from "./color";
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

/** A file's root `<svg>`, viewBox and contents */
function parseSvg(name: string, svg: string) {
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
  return { root, attr, content, box };
}

/** Adds a piece from its SVG file's text (`name` is the file name without `.svg`) */
export function registerPiece(name: string, place: PiecePlace, svg: string) {
  const { content, box } = parseSvg(name, svg);
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

/** Puts SVG content into `d`, its middle on the part's origin, with its ids made its own */
function embed(
  d: Drawing,
  name: string,
  content: string,
  [x, y, w, h]: [number, number, number, number],
  scale = 1,
) {
  const prefix = d.id(name);
  content = content
    // Plain href: the documents parts go into don't declare xlink
    .replace(/\bxlink:href=/g, "href=")
    .replace(/\bid="([^"]+)"/g, `id="${prefix}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${prefix}-$1"`);
  const sw = w * scale;
  const sh = h * scale;
  d.include(-sw / 2, -sh / 2, sw / 2, sh / 2);
  d.add(
    `<svg x="${n(-sw / 2)}" y="${n(-sh / 2)}" width="${n(sw)}" height="${n(sh)}" viewBox="${x} ${y} ${w} ${h}" overflow="visible">${content}</svg>`,
  );
}

/**
 * Hand-drawn hats (`hats/<style>.svg`), drawn for those hat styles instead
 * of by code. The root `<svg>` says which color the drawing is in
 * (`data-color`), and which of its colors are the secondary's
 * (`data-secondary`, space-separated); every other color is a shade of the
 * main one. Drawn in a hat's colors, each is moved the way the drawing's
 * own color would have to move to be the hat's.
 */
interface HatDrawing {
  content: string;
  box: [number, number, number, number];
  color: Color;
  secondary: Color[];
}

const HAT_DRAWINGS = new Map<HatStyle, HatDrawing>();

export function registerHatDrawing(style: HatStyle, svg: string) {
  const { attr, content, box } = parseSvg(style, svg);
  const color = parseSvgColor(attr("data-color") ?? "");
  if (!color) {
    throw new Error(`Hat ${style} has no data-color`);
  }
  const secondary = (attr("data-secondary") ?? "")
    .split(/\s+(?![^(]*\))/)
    .map((c) => parseSvgColor(c))
    .filter((c): c is Color => !!c);
  HAT_DRAWINGS.set(style, { content, box, color, secondary });
}

export function hasHatDrawing(style: HatStyle): boolean {
  return HAT_DRAWINGS.has(style);
}

/** Draws a hat's drawing into `d`, `scale` times its own size, in its colors */
export function drawHatDrawing(
  d: Drawing,
  style: HatStyle,
  color: Color,
  secondary: Color | undefined,
  scale: number,
) {
  const hat = HAT_DRAWINGS.get(style);
  if (!hat) {
    return;
  }
  const content = hat.content.replace(
    /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g,
    (text) => {
      const original = parseSvgColor(text)!;
      return hat.secondary.includes(original)
        ? retint(original, hat.secondary[0], secondary ?? hat.secondary[0])
        : retint(original, hat.color, color);
    },
  );
  embed(d, `hat-${style}`, content, hat.box, scale);
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
  let content = piece.content;
  for (const [key, which] of COLOR_KEYS) {
    content = content.replace(
      key,
      which === "color" ? color : (secondary ?? color),
    );
  }
  embed(d, `piece-${name}`, content, piece.box);
}
