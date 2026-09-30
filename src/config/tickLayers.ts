/**
 * The layers that entities tick and render in, in the order they are
 * processed. An entity picks its layer with `tickLayer = "camera"`; one that
 * doesn't tick in its parent's layer, or the default one. Each layer is timed
 * as a whole by the profiler, so they also sort the frame's time into
 * categories without timing every entity.
 */
export const TICK_LAYERS = [
  "input", // player input, so that everything else sees this tick's intent
  "main", // most things: humans, the level, the world
  "enemies", // enemies and everything that comes with them
  "effects", // projectiles, particles, casings, gibs
  "fire", // fire and smoke
  "camera", // follows positions after everything else has moved
] as const;

export type TickLayerName = (typeof TICK_LAYERS)[number];

export const DEFAULT_TICK_LAYER: TickLayerName = "main";
