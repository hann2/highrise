import {
  FOOT_FORWARD,
  FOOT_LENGTH,
  FOOT_WIDTH,
  HIP_WIDTH,
  LEG_THICKNESS,
} from "../creature-stuff/Legs";
import { BodyLook, PartialLook } from "./BodyLook";
import { darken } from "./color";
import { BodyDrawing, drawBody } from "./drawBody";
import { capsulePath, Drawing, ellipsePath, n } from "./svg";

export interface ComposeOptions {
  /** Standing mid-stride, or lying face down like a corpse */
  pose?: "standing" | "lying";
  /** Where the hands are, from the middle, in mm (standing) */
  hands?: [[number, number], [number, number]];
  /** How far each foot is from under its hip, mid-stride (mm) */
  stride?: number;
  /** Pixels per meter */
  scale?: number;
  /** Facing up the page, as players think of it, instead of along +x */
  faceUp?: boolean;
  /** Lying down without its legs, like a crawler */
  legless?: boolean;
}

function place(part: Drawing, transform: string): string {
  return `<g transform="${transform}">${part.content()}</g>`;
}

/**
 * A whole body as one SVG, put together the way `BodySprite` does in the
 * game (standing) or a `Corpse` (lying): for the character editor, the
 * encyclopedia, and contact sheets.
 */
export function composeBodySvg(
  look: PartialLook | BodyDrawing,
  options: ComposeOptions = {},
  prefix = "c",
): string {
  const body = "parts" in look ? look : drawBody(look, prefix);
  const { parts, dims } = body;
  const {
    pose = "standing",
    stride = 150,
    scale = 200,
    faceUp = true,
  } = options;
  const items: string[] = [];
  let box: [number, number, number, number];

  if (pose === "standing") {
    const hip = HIP_WIDTH * 1000;
    const legThickness = LEG_THICKNESS * 1000;
    // The left foot forward, the right back, like the editor always showed
    for (const side of [-1, 1]) {
      const along = -side * stride;
      const x0 = Math.min(0, along) - legThickness / 2;
      const x1 = Math.max(0, along) + legThickness / 2;
      items.push(
        `<path d="${capsulePath(x0, x1, side * hip, legThickness)}" fill="${body.look.pants}" stroke="${darken(body.look.pants, 0.5)}" stroke-width="9"/>`,
      );
    }
    for (const side of [-1, 1]) {
      const along = -side * stride;
      items.push(
        `<path d="${ellipsePath(along + FOOT_FORWARD * 1000, side * hip, (FOOT_LENGTH * 1000) / 2, (FOOT_WIDTH * 1000) / 2)}" fill="${body.look.shoes}" stroke="${darken(body.look.shoes, 0.5)}" stroke-width="9"/>`,
      );
    }
    const shoulder = dims.shoulderHalfWidth - dims.armThickness / 2;
    const hands = options.hands ?? [
      [300, -200],
      [300, 200],
    ];
    const arms = [
      [parts.leftArm, parts.leftHand, -1, hands[0]],
      [parts.rightArm, parts.rightHand, 1, hands[1]],
    ] as const;
    for (const [arm, , side, [hx, hy]] of arms) {
      const sy = side * shoulder;
      const span = Math.hypot(hx, hy - sy);
      const angle = (Math.atan2(hy - sy, hx) * 180) / Math.PI;
      items.push(
        place(
          arm,
          `translate(0 ${n(sy)}) rotate(${n(angle)}) scale(${(span / arm.width).toFixed(3)} 1)`,
        ),
      );
    }
    for (const [, hand, , [hx, hy]] of arms) {
      items.push(place(hand, `translate(${n(hx)} ${n(hy)})`));
    }
    items.push(place(parts.torso, ""));
    items.push(place(parts.head, ""));
    const reach = Math.max(
      dims.shoulderHalfWidth + 40,
      -parts.torso.minY,
      parts.torso.maxY,
      -parts.head.minY,
      parts.head.maxY,
    );
    box = [
      Math.min(-stride - 200, parts.torso.minX, parts.head.minX),
      -reach,
      Math.max(420, parts.torso.maxX, parts.head.maxX),
      reach,
    ];
  } else {
    // Face down: the legs, the top half, arms by its sides and the head
    const shoulder = dims.shoulderHalfWidth - dims.armThickness / 2;
    const torsoLength = -parts.lyingTorso.minX;
    const waist = -torsoLength * 0.4;
    // The legs over the torn end, as a corpse has them
    items.push(place(parts.lyingTorso, ""));
    if (!options.legless) {
      items.push(place(parts.lyingLegs, `translate(${n(waist)} 0)`));
    }
    for (const [arm, hand, side] of [
      [parts.leftArm, parts.leftHand, -1],
      [parts.rightArm, parts.rightHand, 1],
    ] as const) {
      const angle = side * 150;
      items.push(
        place(
          arm,
          `translate(0 ${n(side * shoulder)}) rotate(${angle}) scale(0.75 1)`,
        ),
      );
      const rad = (angle * Math.PI) / 180;
      items.push(
        place(
          hand,
          `translate(${n(Math.cos(rad) * arm.width * 0.75)} ${n(side * shoulder + Math.sin(rad) * arm.width * 0.75)})`,
        ),
      );
    }
    items.push(place(parts.head, `translate(${n(dims.headRx * 0.55)} 0)`));
    const reach = dims.shoulderHalfWidth + 120;
    box = [
      options.legless ? parts.lyingTorso.minX : waist + parts.lyingLegs.minX,
      -reach,
      dims.headRx * 0.55 + parts.head.maxX,
      reach,
    ];
  }

  let [x0, y0, x1, y1] = box;
  let content = items.join("");
  if (faceUp) {
    content = `<g transform="rotate(-90)">${content}</g>`;
    [x0, y0, x1, y1] = [y0, -x1, y1, -x0];
  }
  const w = x1 - x0;
  const h = y1 - y0;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${n((w * scale) / 1000)}" height="${n((h * scale) / 1000)}" viewBox="${n(x0)} ${n(y0)} ${n(w)} ${n(h)}">` +
    content +
    `</svg>`
  );
}

/** One part on its own, as an SVG document */
export function partSvg(part: Drawing, scale = 200): string {
  return part.toSvg(scale);
}

/** An SVG as a URL an `<img>` can show */
export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const portraits = new Map<string, string>();

/** A whole body as an image URL, made once per look and options */
export function portraitUrl(
  look: BodyLook,
  options: ComposeOptions = {},
): string {
  const key = JSON.stringify([look, options]);
  let url = portraits.get(key);
  if (!url) {
    url = svgDataUrl(
      composeBodySvg(look, options, `portrait${portraits.size}`),
    );
    portraits.set(key, url);
  }
  return url;
}
