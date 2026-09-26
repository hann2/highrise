import { colorLerp } from "../../core/util/ColorUtils";

// --- Fire on the floor (see `FireGrid.ts`) ---

/** Meters across a cell of the fire grid */
export const FIRE_CELL_SIZE = 0.5;
/** Seconds a cell burns before it lights its neighbors that have fuel */
export const FIRE_SPREAD_DELAY = 0.12;

// --- How fire looks (see `FireRenderer.ts` and `flames.frag`) ---

/** Pixels per meter of the heat buffer */
export const HEAT_RESOLUTION = 16;
/** Meters the heat buffer reaches past each edge of the screen */
export const HEAT_MARGIN = 1.5;
/** Meters across the blob of heat of one burning cell (half of it) */
export const HEAT_BLOB_RADIUS = 0.6;
/** Meters a cell's blob of heat sits off the cell's middle, at most */
export const HEAT_BLOB_JITTER = 0.15;
/** Seconds a cell's fire takes to grow to full size after it catches */
export const HEAT_GROW_TIME = 0.3;
/** Seconds of fuel left when a cell's fire starts dying down */
export const HEAT_DIE_DOWN_FUEL = 1.5;
/** Meters across the blob of heat of a burning enemy or human (half of it) */
export const BURNING_HEAT_RADIUS = 0.45;
/** Seconds of movement the heat of a moving burning thing trails behind it */
export const BURNING_TAIL = 0.12;
/** Seconds the fire of something that died burning takes to die down */
export const DEAD_BURNING_FADE_TIME = 0.7;
/** Meters the flame shader pushes heat around by */
export const FLAME_WARP = 0.25;

// --- Marks on the floor (see `FloorMarks.ts`) ---

/** Pixels per meter of the fuel stains and scorch marks */
export const FLOOR_MARK_RESOLUTION = 12;
/** Meters across a blob of stain or scorch (half of it) */
export const MARK_BLOB_RADIUS = 0.5;
/** Seconds a cell burns before it's as scorched as it gets */
export const SCORCH_TIME = 4;
export const SCORCH_COLOR = 0x0c0906;
/** How dark the worst scorch is */
export const SCORCH_ALPHA = 0.8;
export const FUEL_STAIN_COLOR = 0x221c0c;
/** How dark the fuel stains are at most */
export const FUEL_STAIN_ALPHA = 0.9;
/** Seconds of fuel in a cell for its stain to be as dark as it gets */
export const FUEL_STAIN_FULL = 5;

// --- Burning (see `Burning.ts`) ---

/** Seconds an enemy keeps burning after it was last lit */
export const ENEMY_BURN_TIME = 4;
/** Damage per second to a burning enemy */
export const ENEMY_BURN_DPS = 12;
/** Seconds between chunks of burn damage to an enemy */
export const ENEMY_BURN_INTERVAL = 0.25;

/** Seconds a human keeps burning after they were last lit */
export const HUMAN_BURN_TIME = 1.5;
/** Damage per second to a burning human */
export const HUMAN_BURN_DPS = 8;
/** Seconds between chunks of burn damage to a human. Each one flashes the screen red. */
export const HUMAN_BURN_INTERVAL = 0.5;

// --- Light from fire ---

/** The two colors a fire's light wavers between */
export const FIRE_LIGHT_COLORS = [0xff6420, 0xff9440] as const;
/** Meters from the first cell of a patch of fire that share its light */
export const FIRE_LIGHT_PATCH_RADIUS = 2.5;
/** Burning cells in a patch whose light reaches the furthest */
export const FIRE_LIGHT_FULL_PATCH = 60;
/** Meters a fire's light reaches: this much for a little fire... */
export const FIRE_LIGHT_MIN_RADIUS = 6;
/** ...plus up to this much for a big one */
export const FIRE_LIGHT_EXTRA_RADIUS = 6;
/** Meters the light of one burning cell reaches, in the "cells" light mode */
export const CELL_LIGHT_RADIUS = 5;
/** How bright the light of one burning cell is, in the "cells" light mode */
export const CELL_LIGHT_INTENSITY = 0.1;
/** Meters the light of one burning cell wanders from its middle, in the "cells" light mode */
export const CELL_LIGHT_WANDER = 0.25;
/** Meters the light of a burning enemy reaches */
export const BURNING_LIGHT_RADIUS = 4;
/** How bright the light of a burning enemy is, next to a fire on the floor */
export const BURNING_LIGHT_INTENSITY = 0.7;
/** Meters a fire's light wanders from where it should be, as it flickers */
export const FIRE_LIGHT_WANDER = 0.12;

/**
 * Where a fire's light is at time `t`: how bright (0 to 1), which color, and
 * how far it's moved from the fire, for fires with different `phase`s to
 * flicker differently.
 */
export function fireLightFlicker(
  t: number,
  phase: number,
): { intensity: number; color: number; offset: [number, number] } {
  const f = flicker(t * 0.8, phase);
  return {
    intensity: 0.88 + 0.12 * f,
    color: colorLerp(FIRE_LIGHT_COLORS[0], FIRE_LIGHT_COLORS[1], 0.5 + 0.5 * f),
    offset: [
      FIRE_LIGHT_WANDER * flicker(t * 0.6, phase + 5.1),
      FIRE_LIGHT_WANDER * flicker(t * 0.6, phase + 9.7),
    ],
  };
}

/** Seconds over which a fire going out shrinks away */
export const BURN_FADE_TIME = 0.5;

/**
 * A wobble between about -1 and 1 at time `t`, the same every time for the
 * same `t` and `phase`. For flickering things in `onRender`, which mustn't use
 * the seeded random numbers (that would make runs depend on the frame rate).
 */
export function flicker(t: number, phase: number): number {
  return (
    0.5 * Math.sin(t * 11.3 + phase) +
    0.3 * Math.sin(t * 17.9 + phase * 2.3) +
    0.2 * Math.sin(t * 29.7 + phase * 3.7)
  );
}
