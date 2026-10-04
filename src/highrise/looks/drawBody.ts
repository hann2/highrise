import { BodyLook, PartialLook, resolveLook } from "./BodyLook";
import { bodyDimensions, BodyDimensions } from "./dimensions";
import { drawHead } from "./parts/head";
import { drawArm, drawHand, drawLyingLegs } from "./parts/limbs";
import { drawLyingTorso, drawTorso } from "./parts/torso";
import { Drawing } from "./svg";

/** Every image a body is drawn with */
export const BODY_PARTS = [
  "head",
  "torso",
  "leftArm",
  "rightArm",
  "leftHand",
  "rightHand",
  /** Face down from the waist up: crawlers, corpses */
  "lyingTorso",
  /** Face down from the waist down */
  "lyingLegs",
] as const;
export type BodyPart = (typeof BODY_PARTS)[number];

export interface BodyDrawing {
  look: BodyLook;
  dims: BodyDimensions;
  parts: Record<BodyPart, Drawing>;
}

/**
 * Draws every part of a body with `look`, each as its own SVG drawing in
 * millimeters round its own origin (where it's attached). `prefix` keeps
 * their ids apart from other bodies' in a shared document.
 */
export function drawBody(look: PartialLook, prefix = "b"): BodyDrawing {
  const resolved = resolveLook(look);
  const dims = bodyDimensions(resolved);
  const p = (part: string) => `${prefix}-${part}`;
  return {
    look: resolved,
    dims,
    parts: {
      head: drawHead(resolved, dims, p("h")),
      torso: drawTorso(resolved, dims, p("t")),
      leftArm: drawArm(resolved, dims, -1, p("la")),
      rightArm: drawArm(resolved, dims, 1, p("ra")),
      leftHand: drawHand(resolved, dims, -1, p("lh")),
      rightHand: drawHand(resolved, dims, 1, p("rh")),
      lyingTorso: drawLyingTorso(resolved, dims, p("lt")),
      lyingLegs: drawLyingLegs(resolved, dims, p("ll")),
    },
  };
}
