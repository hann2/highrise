import type { ConsumableStats } from "../weapons/consumables/ConsumableStats";
import type { Item } from "./Item";
import { CONSUMABLE_COUNT, CONSUMABLE_PRICE } from "./prices";

/**
 * A store card that gives `count` of a throwable, up to what can be carried.
 * Only one type is carried at a time, so a different type is swapped out
 * (dropped at your feet), the same as picking one up.
 */
export function consumableItem(
  stats: ConsumableStats,
  count: number = CONSUMABLE_COUNT,
): Item {
  return {
    name: count > 1 ? `${stats.name} ×${count}` : stats.name,
    description: stats.description,
    rarity: "common",
    category: "equipment",
    price: CONSUMABLE_PRICE,
    consumable: stats,
    apply: (human) => {
      human.giveConsumable(stats, count);
    },
  };
}
