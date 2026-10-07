import { BodyLook, PartialLook, resolveLook } from "./BodyLook";
import { bodyDimensions, BodyDimensions } from "./dimensions";
import { drawHead } from "./parts/head";
import { drawArm, drawArmSegment, drawHand, drawSleeve } from "./parts/limbs";
import { drawFoot, drawLeg, drawLyingLegs } from "./parts/legs";
import { drawLyingTorso, drawTorso } from "./parts/torso";
import { Drawing } from "./svg";
import { DangleDrawing } from "./dangles";
import { HemDrawing } from "./hems";
import { drawHems } from "./parts/hems";

/** Every image a body is drawn with */
export const BODY_PARTS = [
  "head",
  "torso",
  /** Whole arms, straight: for corpses and severed arms */
  "leftArm",
  "rightArm",
  /** Arms in two, bent at the elbow, standing */
  "leftUpperArm",
  "leftForearm",
  "rightUpperArm",
  "rightForearm",
  /** Sleeves on their own, straight, bent over the arms standing */
  "leftSleeve",
  "rightSleeve",
  "leftHand",
  "rightHand",
  /** Stretched from the hip to the ankle, the same for both */
  "leg",
  "leftFoot",
  "rightFoot",
  /** Face down from the waist up: crawlers, corpses */
  "lyingTorso",
  /** The back of the head, face down */
  "lyingHead",
  /** Face down from the waist down */
  "lyingLegs",
] as const;
export type BodyPart = (typeof BODY_PARTS)[number];

/** The parts in groups that can be shown or hidden together, to look at what's under them */
export const BODY_LAYERS = [
  "head",
  "torso",
  "arms",
  "hands",
  "legs",
  "feet",
] as const;
export type BodyLayer = (typeof BODY_LAYERS)[number];

export const LAYER_PARTS: Record<BodyLayer, BodyPart[]> = {
  head: ["head", "lyingHead"],
  torso: ["torso", "lyingTorso"],
  arms: [
    "leftArm",
    "rightArm",
    "leftUpperArm",
    "leftForearm",
    "rightUpperArm",
    "rightForearm",
    "leftSleeve",
    "rightSleeve",
  ],
  hands: ["leftHand", "rightHand"],
  legs: ["leg", "lyingLegs"],
  feet: ["leftFoot", "rightFoot"],
};

export interface BodyDrawing {
  look: BodyLook;
  dims: BodyDimensions;
  parts: Record<BodyPart, Drawing>;
  /**
   * What swings as it moves, standing (lying, it's drawn on the parts),
   * in the order it's drawn: over the torso, and under the head
   */
  dangles: DangleDrawing[];
  /**
   * The cloth hanging from round the waist, standing (a skirt, a coat's
   * tails; lying, it's drawn on the parts), in the order it's drawn: over
   * the legs, under the arms
   */
  hems: HemDrawing[];
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
  const dangles: DangleDrawing[] = [];
  const torso = drawTorso(resolved, dims, p("t"), dangles);
  const head = drawHead(resolved, dims, p("h"), false, dangles);
  return {
    look: resolved,
    dims,
    dangles,
    hems: drawHems(resolved, dims, p("hm")),
    parts: {
      head,
      torso,
      leftArm: drawArm(resolved, dims, -1, p("la")),
      rightArm: drawArm(resolved, dims, 1, p("ra")),
      leftUpperArm: drawArmSegment(resolved, dims, -1, "upper", p("lua")),
      leftForearm: drawArmSegment(resolved, dims, -1, "fore", p("lfa")),
      rightUpperArm: drawArmSegment(resolved, dims, 1, "upper", p("rua")),
      rightForearm: drawArmSegment(resolved, dims, 1, "fore", p("rfa")),
      leftSleeve: drawSleeve(resolved, dims, -1, p("ls")),
      rightSleeve: drawSleeve(resolved, dims, 1, p("rs")),
      leftHand: drawHand(resolved, dims, -1, p("lh")),
      rightHand: drawHand(resolved, dims, 1, p("rh")),
      leg: drawLeg(resolved, dims, p("lg")),
      leftFoot: drawFoot(resolved, dims, 1, p("lf")),
      rightFoot: drawFoot(resolved, dims, -1, p("rf")),
      lyingTorso: drawLyingTorso(resolved, dims, p("lt")),
      lyingHead: drawHead(resolved, dims, p("lhd"), true),
      lyingLegs: drawLyingLegs(resolved, dims, p("ll")),
    },
  };
}
