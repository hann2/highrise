import { choose, takeWeighted } from "../../core/util/Random";
import type Human from "../human/Human";
import type { GunStats } from "../weapons/guns/GunStats";
import { CONSUMABLES } from "../weapons/consumables/consumable-stats/consumableStats";
import { consumableItem } from "./consumableItem";
import { dealGunItem } from "./gunItem";
import { RARITY_WEIGHTS, type Item } from "./Item";
import { canTake, ITEMS } from "./items";
import { OTHER_FAMILY_WEIGHT } from "./prices";

/** How many item slots a store has, above the gun and the consumable */
export const SHELF_SLOTS = 4;
/** ...and a big store (on the floor after a boss) */
export const BIG_SHELF_SLOTS = 8;

/**
 * What a store has for sale on one floor. A slot is null once it's been
 * bought (or if there was nothing left to deal).
 */
export interface Shelf {
  slots: (Item | null)[];
  gun: Item | null;
  consumable: Item | null;
}

/**
 * Deals a shelf for `human`: different items they can take, rarer ones less
 * often and ones for guns they don't hold less often; a gun (`bestGunTier` or the one above, never one they hold or one in
 * `excludedGuns`, so only missing if that rules out every candidate);
 * always one consumable. Uses the shared random stream, so call it during level
 * generation to keep seeded runs reproducible.
 */
export function dealShelf(
  human: Human,
  bestGunTier: number,
  /** Guns that can't be dealt (ones earlier stores had) */
  excludedGuns: readonly GunStats[] = [],
  slotCount: number = SHELF_SLOTS,
): Shelf {
  const pool = ITEMS.filter((item) => canTake(human, item));
  const held = new Set(human.guns.map((gun) => gun.stats.ammoClass));
  const weight = (item: Item) =>
    RARITY_WEIGHTS[item.rarity] *
    (!item.fits || item.fits.some((family) => held.has(family))
      ? 1
      : OTHER_FAMILY_WEIGHT);
  const slots: (Item | null)[] = [];
  while (slots.length < slotCount) {
    slots.push(pool.length > 0 ? takeWeighted(pool, weight) : null);
  }
  const gun = dealGunItem(human, bestGunTier, excludedGuns) ?? null;
  const consumable = consumableItem(choose(...CONSUMABLES));
  return { slots, gun, consumable };
}
