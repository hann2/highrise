import {
  Loadout,
  LOADOUT_PARAMS,
  loadoutQueryParts,
  otherQueryParts,
  parseLoadout,
} from "../../arena/loadout";
import { BOSS_FLOORS, BossTier } from "../../run/acts";
import { BossLevelClass } from "../BossLevel";
import { BOSS_LEVELS, tiersOf } from "../bossLevels";

/** Everything about a boss test. It all goes in the URL (see `bossTestConfigToQuery`). */
export interface BossTestConfig extends Loadout {
  level: BossLevelClass;
  /**
   * Which boss floor of the run it's played as: its store and the directory.
   * The fight's the same on any (nothing on a boss level scales with the act).
   */
  floor: number;
  /** Quarters to start with, for the arrival room's store */
  quarters: number;
  /** The player can't die */
  god: boolean;
  /** Reserve ammo, throwables and usable charges never run out (magazines still need reloading) */
  infiniteAmmo: boolean;
  /** The bosses stand still and don't attack */
  frozen: boolean;
}

/** The boss floors, lowest first */
export const BOSS_FLOOR_NUMBERS: readonly number[] = Object.keys(BOSS_FLOORS)
  .map(Number)
  .sort((a, b) => a - b);

/** The first boss floor whose pool has `level` in it */
export function floorFor(level: BossLevelClass): number {
  const tiers = tiersOf(level);
  return (
    BOSS_FLOOR_NUMBERS.find((floor) => tiers.includes(BOSS_FLOORS[floor])) ??
    BOSS_FLOOR_NUMBERS[0]
  );
}

export function tierOf(floor: number): BossTier {
  return BOSS_FLOORS[floor];
}

/**
 * Reads the setup from the URL. Anything not given (or not recognized) gets
 * a default: the first boss level, played on the first boss floor that deals
 * it.
 *
 * `?scene=boss&boss=necromancer&floor=10&quarters=40&god&infammo&frozen`,
 * plus a loadout as in the arena (`char=`, `weapons=`, `items=`,
 * `throwable=`, `usable=`)
 */
export function parseBossTestConfig(params: URLSearchParams): BossTestConfig {
  const level =
    BOSS_LEVELS.find((l) => l.id === params.get("boss")) ?? BOSS_LEVELS[0];
  const floorParam = parseInt(params.get("floor") ?? "", 10);
  const floor = BOSS_FLOOR_NUMBERS.includes(floorParam)
    ? floorParam
    : floorFor(level);
  const quarters = parseInt(params.get("quarters") ?? "0", 10);
  return {
    ...parseLoadout(params),
    level,
    floor,
    quarters: isNaN(quarters) ? 0 : Math.max(quarters, 0),
    god: params.has("god"),
    infiniteAmmo: params.has("infammo"),
    frozen: params.has("frozen"),
  };
}

/** The query string for a setup, starting with `?scene=boss` (see `parseBossTestConfig`) */
export function bossTestConfigToQuery(config: BossTestConfig): string {
  const parts = [
    "scene=boss",
    `boss=${config.level.id}`,
    `floor=${config.floor}`,
  ];
  parts.push(...loadoutQueryParts(config));
  if (config.quarters > 0) {
    parts.push(`quarters=${config.quarters}`);
  }
  const flags: [boolean, string][] = [
    [config.god, "god"],
    [config.infiniteAmmo, "infammo"],
    [config.frozen, "frozen"],
  ];
  for (const [on, flag] of flags) {
    if (on) {
      parts.push(flag);
    }
  }
  // Keep anything that isn't the scene's, like ?seed
  parts.push(
    ...otherQueryParts([
      "scene",
      "boss",
      "floor",
      "quarters",
      ...LOADOUT_PARAMS,
      ...flags.map(([, flag]) => flag),
    ]),
  );
  return "?" + parts.join("&");
}
