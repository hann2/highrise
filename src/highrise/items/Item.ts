import type Human from "../human/Human";
import type { ConsumableStats } from "../weapons/consumables/ConsumableStats";
import type { AmmoClass } from "../weapons/guns/ammo";
import type { GunStats } from "../weapons/guns/GunStats";

export type Rarity = "common" | "uncommon" | "rare";

/**
 * What kind of item it is: equipment (stays with the human), an attachment
 * (goes on the guns it fits, `attachments.ts`), or a boss item (only bosses
 * drop them, `bossItems.ts`)
 */
export type ItemCategory = "equipment" | "attachment" | "boss";

/** Something bought from a store. Stays with the human for the rest of the run. */
export interface Item {
  readonly name: string;
  /** One line on the card. For guns, a stat summary. */
  readonly description: string;
  readonly rarity: Rarity;
  readonly category: ItemCategory;
  /** In quarters. `PRICE_BY_RARITY` when left out. */
  readonly price?: number;
  /** How many times one human can take it. Unlimited when left out. */
  readonly maxStacks?: number;
  /**
   * The gun families (classes of ammo) it's for, if it only does anything
   * with some guns: every attachment, and items like Buckshot Bounce. Cards
   * say "Fits: shotguns", and stores deal these more when you hold one.
   */
  readonly fits?: readonly AmmoClass[];
  /**
   * Set on gun items (`gunItem.ts`), which are made up per shelf rather than
   * listed in `ITEMS`: the gun it gives, shown on the card.
   */
  readonly weapon?: GunStats;
  /** Set on consumable items (`consumableItem.ts`): what it gives. */
  readonly consumable?: ConsumableStats;
  /** Changes the human, usually their `stats` */
  apply(human: Human): void;
}

/** How likely each rarity is to be dealt, relative to each other */
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 6,
  uncommon: 3,
  rare: 1,
};
