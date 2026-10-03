import { DEFAULT_GAIT, GaitStyle } from "../../core/animation/Gait";

/** What a body's legs look like: the leg and shoe images are tinted these (CSS colors, `#rrggbb`) */
export interface LegColors {
  pants: string;
  shoes: string;
}

/** A body's legs: how they look and how they walk */
export interface LegStyle {
  colors: LegColors;
  gait: GaitStyle;
}

// A human's legs, in meters (`BodySprite`, and the character editor's
// preview); other bodies' are in proportion to their size
/** From the middle of the body to each hip */
export const HIP_WIDTH = 0.1;
export const LEG_THICKNESS = 0.16;
export const FOOT_LENGTH = 0.26;
export const FOOT_WIDTH = 0.12;
/** How far in front of the ankle the middle of the foot is */
export const FOOT_FORWARD = 0.05;

/** Plain trousers and shoes, for a character whose data doesn't say */
export const DEFAULT_LEG_COLORS: LegColors = {
  pants: "#3e4552",
  shoes: "#262626",
};

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
