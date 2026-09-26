import { choose, rBool, rUniform } from "../../core/util/Random";
import type Human from "../human/Human";
import { CONSUMABLES } from "../weapons/consumables/consumable-stats/consumableStats";
import { consumableItem } from "./consumableItem";
import { dealGunItem } from "./gunItem";
import { RARITY_WEIGHTS, type Item } from "./Item";
import { canTake, ITEMS } from "./items";
import { GUN_ON_SHELF_CHANCE } from "./prices";

/** How many item slots a store has, above the gun and the consumable */
export const SHELF_SLOTS = 4;

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
 * often; sometimes a gun (`bestGunTier` or the one above, never one they hold);
 * always one consumable. Uses the shared random stream, so call it during level
 * generation to keep seeded runs reproducible.
 */
export function dealShelf(human: Human, bestGunTier: number): Shelf {
  const pool = ITEMS.filter((item) => canTake(human, item));
  const slots: (Item | null)[] = [];
  while (slots.length < SHELF_SLOTS) {
    slots.push(pool.length > 0 ? takeWeighted(pool) : null);
  }
  const gun = rBool(GUN_ON_SHELF_CHANCE)
    ? (dealGunItem(human, bestGunTier) ?? null)
    : null;
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
