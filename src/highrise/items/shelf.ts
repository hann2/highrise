import { choose, rUniform } from "../../core/util/Random";
import type Human from "../human/Human";
import type { GunStats } from "../weapons/guns/GunStats";
import { CONSUMABLES } from "../weapons/consumables/consumable-stats/consumableStats";
import { consumableItem } from "./consumableItem";
import { dealGunItem } from "./gunItem";
import { RARITY_WEIGHTS, type Item } from "./Item";
import { canTake, ITEMS } from "./items";

/** How many item slots a store has, above the gun and the consumable */
export const SHELF_SLOTS = 4;
/** ...and a big store (on the floor after a landmark) */
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
 * often; a gun (`bestGunTier` or the one above, never one they hold or one in
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
  const slots: (Item | null)[] = [];
  while (slots.length < slotCount) {
    slots.push(pool.length > 0 ? takeWeighted(pool) : null);
  }
  const gun = dealGunItem(human, bestGunTier, excludedGuns) ?? null;
  const consumable = consumableItem(choose(...CONSUMABLES));
  return { slots, gun, consumable };
}

/** Removes and returns one item from `pool`, weighted by rarity */
function takeWeighted(pool: Item[]): Item {
  const total = pool.reduce(
    (sum, item) => sum + RARITY_WEIGHTS[item.rarity],
    0,
  );
  let roll = rUniform(0, total);
  let index = 0;
  while (
    index < pool.length - 1 &&
    roll >= RARITY_WEIGHTS[pool[index].rarity]
  ) {
    roll -= RARITY_WEIGHTS[pool[index].rarity];
    index++;
  }
  return pool.splice(index, 1)[0];
}
