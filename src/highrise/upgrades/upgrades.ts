import { rUniform } from "../../core/util/Random";
import type Human from "../human/Human";
import { markSeen } from "../persistence/SaveData";
import { FlashbangPack, GrenadePack } from "./consumableUpgrades";
import {
  Bloodthirsty,
  CurbStomp,
  Scavenger,
  SecondWind,
  SpeedLoader,
} from "./ruleUpgrades";
import {
  ExtendedMags,
  FreshBatteries,
  GlassCannon,
  HairTrigger,
  HollowPoints,
  Linebacker,
  NightEyes,
  QuickHands,
  RunningShoes,
  SteadyAim,
  Vitamins,
} from "./statUpgrades";
import { RARITY_WEIGHTS, Upgrade } from "./Upgrade";
import { drawWeaponOffer } from "./weaponOffers";

// Every upgrade that can be offered
export const UPGRADES: ReadonlyArray<Upgrade> = [
  RunningShoes,
  Vitamins,
  QuickHands,
  SteadyAim,
  Linebacker,
  FreshBatteries,
  HollowPoints,
  HairTrigger,
  ExtendedMags,
  NightEyes,
  GlassCannon,
  Bloodthirsty,
  SpeedLoader,
  CurbStomp,
  SecondWind,
  Scavenger,
  GrenadePack,
  FlashbangPack,
];

/** How many times `human` has taken `upgrade` */
export function timesTaken(human: Human, upgrade: Upgrade): number {
  return human.upgrades.filter((u) => u === upgrade).length;
}

/** Whether `human` can take `upgrade` (again) */
export function canTake(human: Human, upgrade: Upgrade): boolean {
  return timesTaken(human, upgrade) < (upgrade.maxStacks ?? Infinity);
}

/** What an offer depends on besides the human */
export interface OfferContext {
  /**
   * The best gun tier (index into `GUN_TIERS`) in the coming floor's normal
   * closets (`LevelTemplate.getBestGunTier`). Weapon cards offer that tier or
   * the one above. No weapon cards when left out.
   */
  bestGunTier?: number;
}

/**
 * Picks `count` different upgrades that `human` can take, rarer ones less
 * often. At most one of them is a weapon card, never for a gun `human` holds.
 */
export function drawUpgrades(
  human: Human,
  count: number = 3,
  context: OfferContext = {},
): Upgrade[] {
  const pool = UPGRADES.filter((upgrade) => canTake(human, upgrade));
  if (context.bestGunTier !== undefined) {
    // Only one gun goes in the pool, with its tier's rarity like any other card
    const weaponOffer = drawWeaponOffer(human, context.bestGunTier);
    if (weaponOffer) {
      pool.push(weaponOffer);
    }
  }
  const drawn: Upgrade[] = [];
  while (drawn.length < count && pool.length > 0) {
    const total = pool.reduce((sum, u) => sum + RARITY_WEIGHTS[u.rarity], 0);
    let roll = rUniform(0, total);
    let index = 0;
    while (
      index < pool.length - 1 &&
      roll >= RARITY_WEIGHTS[pool[index].rarity]
    ) {
      roll -= RARITY_WEIGHTS[pool[index].rarity];
      index++;
    }
    drawn.push(...pool.splice(index, 1));
  }
  return drawn;
}

/** Gives `upgrade` to `human` for the rest of the run */
export function takeUpgrade(human: Human, upgrade: Upgrade) {
  upgrade.apply(human);
  human.upgrades.push(upgrade);
  markUpgradeSeen(upgrade);
}

/**
 * Records an offered or taken card for the encyclopedia. A weapon card counts
 * as seeing its gun; it isn't an upgrade the encyclopedia lists.
 */
export function markUpgradeSeen(upgrade: Upgrade) {
  if (upgrade.weapon) {
    markSeen("guns", upgrade.weapon.name);
  } else {
    markSeen("upgrades", upgrade.name);
  }
}
