import type Entity from "../../core/entity/Entity";
import type Game from "../../core/Game";
import type LevelController from "../controllers/LevelController";

// The shape of a run: 15 floors in three acts of 5, each ending in a boss
// level (a tier 1 boss, a tier 2 boss and the final one). Everything that
// depends on how far into the run a floor is reads it from here. First
// guesses; tune in playtest.

/** Floors in a run, not counting the lobby */
export const FLOORS = 15;
export const ACT_LENGTH = 5;
export const ACT_COUNT = 3;
/** The top of the building, and the final boss */
export const FINAL_FLOOR = FLOORS;

/**
 * Which pool of boss levels a boss floor draws from (see
 * `boss-levels/bossLevels.ts`)
 */
export type BossTier = 1 | 2 | "final";

/**
 * The boss floors, and the pool each draws its boss level from. Nothing on a
 * boss level scales with the act: a boss level is the same fight wherever
 * it's dealt.
 */
export const BOSS_FLOORS: Readonly<Record<number, BossTier>> = {
  5: 1,
  10: 2,
  [FINAL_FLOOR]: "final",
};

/** Floors with a bigger store, right after each boss but the last */
export const BIG_STORE_FLOORS: readonly number[] = [6, 11];

/** Which act (1 to 3) a floor is in */
export function actOf(floor: number): number {
  return Math.min(ACT_COUNT, Math.max(1, Math.ceil(floor / ACT_LENGTH)));
}

/**
 * The gun tier (index into `GUN_TIERS`) each act's stores deal from, along
 * with the tier above it. Index = act − 1.
 */
export const GUN_TIER_FOR_ACT: readonly number[] = [0, 1, 2];

/**
 * How much tougher and harder-hitting enemies are in each act. Index = act −
 * 1. Not on boss levels (see `scalesWithAct`).
 */
export const ENEMY_HP_SCALE: readonly number[] = [1, 1.2, 1.5];
export const ENEMY_DAMAGE_SCALE: readonly number[] = [1, 1.15, 1.4];

/** Enemies on a floor: `ENEMY_BASE + ENEMY_PER_FLOOR × floor`, capped by room */
export const ENEMY_BASE = 24;
export const ENEMY_PER_FLOOR = 4;

/**
 * Something outside a run that says which act it is (the arena scene), found
 * by the tag "act_override"
 */
export interface ActOverride extends Entity {
  act: number;
}

/**
 * Which act of the run the current floor is in; 1 outside a run (the lobby),
 * unless an `ActOverride` says otherwise
 */
export function getCurrentAct(game: Game): number {
  const override = game.entities.getTagged("act_override")[0] as
    ActOverride | undefined;
  if (override) {
    return override.act;
  }
  const levelController = game.entities.getTagged("level_controller")[0] as
    LevelController | undefined;
  return levelController?.floor?.act ?? 1;
}

/**
 * Whether enemies made now get the act's toughness: everywhere but a boss
 * level, which is the same fight on whichever floor it's dealt
 */
export function scalesWithAct(game: Game): boolean {
  const levelController = game.entities.getTagged("level_controller")[0] as
    | LevelController
    | undefined;
  return !levelController?.floor?.boss;
}
