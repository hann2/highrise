import type { Rarity } from "./Item";

// Every price in the store, in quarters. First guesses; tune in playtest.

/** What an item costs when it doesn't say */
export const PRICE_BY_RARITY: Record<Rarity, number> = {
  common: 8,
  uncommon: 14,
  rare: 22,
};

/** What a gun costs, by its index in `GUN_TIERS` */
export const GUN_PRICE_BY_TIER: ReadonlyArray<number> = [0, 20, 30, 40];

/** What a gun sells back for when a new one replaces it: this much of its tier price, rounded down */
export const TRADE_IN = 0.5;

/** The consumable on the shelf: how many come in one purchase, and for how much */
export const CONSUMABLE_COUNT = 2;
export const CONSUMABLE_PRICE = 6;

/**
 * Items for gun families the human doesn't hold are dealt this much as often
 * as the rest, and guns of families they do hold too: stores lean toward the
 * guns you have for attachments, and toward the ones you don't for guns
 */
export const OTHER_FAMILY_WEIGHT = 0.25;

/** What `item` costs */
export function itemPrice(item: { price?: number; rarity: Rarity }): number {
  return item.price ?? PRICE_BY_RARITY[item.rarity];
}
