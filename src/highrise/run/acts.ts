import type Game from "../../core/Game";
import type LevelController from "../controllers/LevelController";

// The shape of a run: 15 floors in acts of 4, with a landmark floor (a boss,
// or a siege once that exists) at the end of each of the first three acts,
// and the last act running up to the finale on 15. Everything that depends on
// how far into the run a floor is reads it from here. First guesses; tune in
// playtest.

/** Floors in a run, not counting the lobby */
export const FLOORS = 15;
export const ACT_LENGTH = 4;
/** The top of the building. Floors 4, 8 and 12 are landmarks (see `RunPlan`), and so is this one. */
export const FINAL_FLOOR = FLOORS;
/** Floors with a bigger store, right after each landmark */
export const BIG_STORE_FLOORS: readonly number[] = [5, 9, 13];

/** Which act (1 to 4) a floor is in. Floors 13 to 15 are all act 4. */
export function actOf(floor: number): number {
  return Math.min(4, Math.max(1, Math.ceil(floor / ACT_LENGTH)));
}

/**
 * The gun tier (index into `GUN_TIERS`) each act's stores deal from, along
 * with the tier above it. Index = act − 1.
 */
export const GUN_TIER_FOR_ACT: readonly number[] = [0, 1, 2, 3];

/** How much tougher and harder-hitting enemies are in each act. Index = act − 1. */
export const ENEMY_HP_SCALE: readonly number[] = [1, 1.15, 1.3, 1.5];
export const ENEMY_DAMAGE_SCALE: readonly number[] = [1, 1.1, 1.25, 1.4];

/** Enemies on a floor: `ENEMY_BASE + ENEMY_PER_FLOOR × floor`, capped by room */
export const ENEMY_BASE = 24;
export const ENEMY_PER_FLOOR = 4;

/** Which act of the run the current floor is in; 1 outside a run (the lobby) */
export function getCurrentAct(game: Game): number {
  const levelController = game.entities.getTagged("level_controller")[0] as
    LevelController | undefined;
  return levelController?.floor?.act ?? 1;
}
