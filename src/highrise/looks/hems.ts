import type { HemShape } from "../creature-stuff/hemCloth";
import { Drawing } from "./svg";

/** The cloth on a body hanging from round its waist, each drawn as a part of its own */
export const HEM_KINDS = ["skirt", "coat"] as const;
export type HemKind = (typeof HEM_KINDS)[number];

/**
 * Cloth hanging from round the waist, seen from above at rest (the waist's
 * middle at the origin, facing +x), drawn on its own so its hem can swing
 * (`creature-stuff/hemCloth.ts`), in the order it's drawn: over the legs,
 * under the arms
 */
export interface HemDrawing {
  kind: HemKind;
  /** The layer it's shown and hidden with */
  layer: "legs" | "torso";
  drawing: Drawing;
  /** Its waist and hem (mm) */
  shape: HemShape;
}
