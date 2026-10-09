import { rUniform } from "../../core/util/Random";
import type { BossTier } from "../run/acts";
import { BossLevelClass } from "./BossLevel";
import BehemothLevel from "./behemoth/BehemothLevel";
import HordeLevel from "./horde/HordeLevel";
import NecromancerLevel from "./necromancer/NecromancerLevel";

/** A boss level in a pool, and how likely it is to be dealt next to the others */
interface PoolEntry {
  level: BossLevelClass;
  weight: number;
}

/**
 * The boss levels each boss floor draws from (`acts.ts` says which floors and
 * tiers). A pool can lean one way, toward boss fights or toward hordes, by
 * its weights. One each for now: a horde to hold out against, the
 * Necromancer, and the Behemoth.
 */
export const BOSS_POOLS: Readonly<Record<BossTier, readonly PoolEntry[]>> = {
  1: [{ level: HordeLevel, weight: 1 }],
  2: [{ level: NecromancerLevel, weight: 1 }],
  final: [{ level: BehemothLevel, weight: 1 }],
};

/** Every boss level there is, once each */
export const BOSS_LEVELS: readonly BossLevelClass[] = [
  ...new Set(
    Object.values(BOSS_POOLS).flatMap((pool) =>
      pool.map((entry) => entry.level),
    ),
  ),
];

/** A boss level from `tier`'s pool, by weight */
export function dealBossLevel(tier: BossTier): BossLevelClass {
  const pool = BOSS_POOLS[tier];
  const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let pick = rUniform(0, total);
  for (const entry of pool) {
    pick -= entry.weight;
    if (pick < 0) {
      return entry.level;
    }
  }
  return pool[pool.length - 1].level;
}

/** Which pools a boss level is in */
export function tiersOf(level: BossLevelClass): BossTier[] {
  return (Object.keys(BOSS_POOLS) as (keyof typeof BOSS_POOLS)[])
    .map((key) => (key === "final" ? "final" : (Number(key) as 1 | 2)))
    .filter((tier) => BOSS_POOLS[tier].some((entry) => entry.level === level));
}
