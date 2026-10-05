import { BodyLook } from "../../highrise/looks/BodyLook";
import { composeBodySvg, svgDataUrl } from "../../highrise/looks/composeBody";
import { bodyDimensions } from "../../highrise/looks/dimensions";
import { drawHead } from "../../highrise/looks/parts/head";
import { drawFoot, drawLyingLegs } from "../../highrise/looks/parts/legs";
import { drawTorso } from "../../highrise/looks/parts/torso";
import { Drawing, n } from "../../highrise/looks/svg";

/**
 * What a thumbnail shows: the head, the front of the head close up (the face
 * and the hairline), the torso, the whole body standing, the legs (lying face
 * down, where they show best from above), or the feet
 */
export type ThumbnailKind =
  "head" | "face" | "torso" | "body" | "legs" | "feet";

/**
 * Drawings turned to face up the page (each moved across by its offset),
 * framed with `margin` (mm) round the first, or round `frame` (`[back, front,
 * side]` in the drawing's mm) if given
 */
function faceUp(
  parts: [Drawing, number][],
  margin: number,
  frame?: [number, number, number],
  aspect = 1,
): string {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  const groups = parts.map(([part, offset], i) => {
    // Turned a quarter, x (forward) is up the page and y across it
    if (i === 0 || !frame) {
      x0 = Math.min(x0, part.minY + offset);
      x1 = Math.max(x1, part.maxY + offset);
      y0 = Math.min(y0, -part.maxX);
      y1 = Math.max(y1, -part.minX);
    }
    return `<g transform="translate(${n(offset)} 0) rotate(-90)">${part.content()}</g>`;
  });
  if (frame) {
    [x0, x1, y0, y1] = [-frame[2], frame[2], -frame[1], -frame[0]];
  }
  // `aspect` wide, so every thumbnail's at the same scale for its kind
  const height = Math.max((x1 - x0) / aspect, y1 - y0) + margin * 2;
  const width = height * aspect;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${n(96 * aspect)}" height="96" viewBox="${n(cx - width / 2)} ${n(cy - height / 2)} ${n(width)} ${n(height)}">` +
    groups.join("") +
    `</svg>`
  );
}

function thumbnailSvg(look: BodyLook, kind: ThumbnailKind): string {
  const dims = bodyDimensions(look);
  switch (kind) {
    case "head":
      return faceUp([[drawHead(look, dims, "th"), 0]], 12);
    case "face":
      // Out to the nose and the glasses
      return faceUp([[drawHead(look, dims, "th"), 0]], 6, [
        dims.headRx * 0.1,
        dims.headRx * 1.32,
        dims.headRy * 1.05,
      ]);
    case "torso":
      return faceUp([[drawTorso(look, dims, "tt"), 0]], 16, undefined, 1.6);
    case "legs":
      return faceUp([[drawLyingLegs(look, dims, "tl"), 0]], 30);
    case "feet": {
      const left = drawFoot(look, dims, 1, "tfl");
      const right = drawFoot(look, dims, -1, "tfr");
      const apart = Math.max(left.height, right.height) * 0.62;
      return faceUp(
        [
          [left, -apart],
          [right, apart],
        ],
        14,
      );
    }
    case "body":
      return composeBodySvg(look, { scale: 100 }, "tb");
  }
}

const cache = new Map<string, string>();

/** A thumbnail of `look` as an image URL, made once per look and kind */
export function thumbnailUrl(look: BodyLook, kind: ThumbnailKind): string {
  const key = kind + JSON.stringify(look);
  let url = cache.get(key);
  if (!url) {
    if (cache.size > 400) {
      cache.clear();
    }
    url = svgDataUrl(thumbnailSvg(look, kind));
    cache.set(key, url);
  }
  return url;
}
