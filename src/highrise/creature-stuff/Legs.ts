import type { Texture } from "pixi.js";
import { DEFAULT_GAIT, GaitStyle } from "../../core/animation/Gait";

/**
 * What a body's legs are drawn with (baked from its look, `looks/`): a leg
 * stretched from hip to ankle, and each foot, at `BODY_PIXELS_PER_METER`
 */
export interface LegTextures {
  leg: Texture;
  leftFoot: Texture;
  rightFoot: Texture;
  /** A leg's thickness, in meters, for a human-sized body */
  thickness: number;
}

/** A body's legs: how they look and how they walk */
export interface LegStyle {
  textures: LegTextures;
  gait: GaitStyle;
}

// A human's legs, in meters (`BodySprite`, and the character editor's
// preview); other bodies' are in proportion to their size
/** From the middle of the body to each hip */
export const HIP_WIDTH = 0.1;
/** A foot's size, for footprints (shoes are drawn their own size) */
export const FOOT_LENGTH = 0.26;
export const FOOT_WIDTH = 0.12;
/** How far in front of the ankle the middle of the foot is */
export const FOOT_FORWARD = 0.05;
/**
 * How far a leg goes past the ankle, over the shoe, as a fraction of its
 * thickness (it goes half its thickness past the hip). Legs are drawn over
 * the feet, so this is how much of the shoe the hem covers.
 */
export const HEM_OVERLAP = 0.15;

export const HUMAN_GAIT: GaitStyle = DEFAULT_GAIT;

/** Shorter steps that hardly leave the floor, about four a second at full speed */
export const ZOMBIE_GAIT: GaitStyle = {
  ...DEFAULT_GAIT,
  minReach: 0.18,
  reachPerSpeed: 0.04,
  maxReach: 0.36,
  walkDuty: 0.7,
  runDuty: 0.35,
  runSpeed: 5,
  lift: 0.35,
};

/** Long running strides, five a second at full speed */
export const SPRINTER_GAIT: GaitStyle = {
  ...DEFAULT_GAIT,
  reachPerSpeed: 0.03,
  maxReach: 0.45,
  runDuty: 0.28,
  runSpeed: 7,
};

/** Big heavy plodding steps */
export const HEAVY_GAIT: GaitStyle = {
  ...DEFAULT_GAIT,
  minReach: 0.28,
  reachPerSpeed: 0.05,
  maxReach: 0.5,
  walkDuty: 0.68,
  runDuty: 0.35,
  runSpeed: 6,
  lift: 0.6,
};
