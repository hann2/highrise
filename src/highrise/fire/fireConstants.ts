// --- Fire on the floor (see `FireGrid.ts`) ---

/** Meters across a cell of the fire grid */
export const FIRE_CELL_SIZE = 0.5;
/** Seconds a cell burns before it lights its neighbors that have fuel */
export const FIRE_SPREAD_DELAY = 0.12;
/** Cells across a block of the grid that shares one light */
export const FIRE_LIGHT_BLOCK = 6;

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
