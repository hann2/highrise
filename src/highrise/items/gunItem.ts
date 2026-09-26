import { choose } from "../../core/util/Random";
import { getPartyManager } from "../environment/PartyManager";
import type Human from "../human/Human";
import Gun from "../weapons/guns/Gun";
import { GUN_TIERS, gunTierOf } from "../weapons/guns/gun-stats/gunStats";
import { fireModeName, GunStats } from "../weapons/guns/GunStats";
import type { Item, Rarity } from "./Item";
import { GUN_PRICE_BY_TIER, TRADE_IN } from "./prices";

// Gun items: a store card that hands over a specific gun. They aren't in
// `ITEMS`, because which guns can be dealt depends on the floor; one is made
// up for each shelf (see `dealShelf`).

/** Rarity of a gun card, by the gun's index in `GUN_TIERS` */
const TIER_RARITY: ReadonlyArray<Rarity> = [
  "common",
  "uncommon",
  "uncommon",
  "rare",
];

/** What `gun` costs in the store */
export function gunPrice(gun: GunStats): number {
  const tier = Math.max(0, gunTierOf(gun));
  return GUN_PRICE_BY_TIER[Math.min(tier, GUN_PRICE_BY_TIER.length - 1)];
}

/** What `gun` sells back for when a bought gun replaces it */
export function tradeInValue(gun: GunStats): number {
  return Math.floor(gunPrice(gun) * TRADE_IN);
}

/**
 * A card that gives `gun`, loaded, in its slot. A gun already in that slot is
 * traded in: it's gone, and its trade-in value comes back as quarters. Anything
 * else there (a melee weapon) is dropped.
 */
export function gunItem(gun: GunStats): Item {
  const tier = Math.max(0, gunTierOf(gun));
  return {
    name: gun.name,
    description: gunSummary(gun),
    rarity: TIER_RARITY[Math.min(tier, TIER_RARITY.length - 1)],
    category: "equipment",
    price: gunPrice(gun),
    maxStacks: 1,
    weapon: gun,
    apply: (human) => {
      const weapon = new Gun(gun);
      const slot = human.slotForNewWeapon();
      const replaced = human.getWeaponInSlot(slot);
      if (replaced instanceof Gun) {
        human.removeWeapon(slot);
        getPartyManager(human.game)?.addQuarters(tradeInValue(replaced.stats));
      }
      weapon.ammo = weapon.getCapacity(human);
      // Comes with the usual first-pickup reserve bonus
      human.giveWeapon(weapon);
    },
  };
}

/**
 * Picks a gun for a shelf on a floor whose normal closets have guns up to
 * `bestGunTier`: one from that tier or the one above, never one `human` is
 * already carrying or one in `excluded`. Undefined if there's nothing left to
 * deal.
 */
export function dealGunItem(
  human: Human,
  bestGunTier: number,
  excluded: readonly GunStats[] = [],
): Item | undefined {
  const held = human.guns.map((gun) => gun.stats);
  const candidates = GUN_TIERS.slice(
    Math.max(0, bestGunTier),
    Math.max(0, bestGunTier + 2),
  )
    .flat()
    .filter((gun) => !held.includes(gun) && !excluded.includes(gun));
  return candidates.length > 0 ? gunItem(choose(...candidates)) : undefined;
}

/** One line for a gun card, like "Tier 2 · 30 rounds · semi auto" */
export function gunSummary(gun: GunStats): string {
  const rounds = gun.ammoClass === "shotgun" ? "shells" : "rounds";
  return [
    `Tier ${gunTierOf(gun) + 1}`,
    `${gun.ammoCapacity} ${rounds}`,
    fireModeName(gun).toLowerCase(),
  ].join(" · ");
}
