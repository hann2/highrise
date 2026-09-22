/**
 * The layers that entities tick in, in the order they are processed. An entity
 * picks its layer with `tickLayer = "camera"`; entities that don't specify one
 * tick on the default layer.
 */
export const TICK_LAYERS = [
  "input", // player input, so that everything else sees this tick's intent
  "main", // most things
  "camera", // follows positions after everything else has moved
] as const;

export type TickLayerName = (typeof TICK_LAYERS)[number];

export const DEFAULT_TICK_LAYER: TickLayerName = "main";
