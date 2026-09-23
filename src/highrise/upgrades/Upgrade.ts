import type Human from "../human/Human";
import type { GunStats } from "../weapons/guns/GunStats";

export type Rarity = "common" | "uncommon" | "rare";

/** Something the player can pick at the end of a floor. Stays with the human for the rest of the run. */
export interface Upgrade {
  readonly name: string;
  /** One line on the card. For weapon offers, a stat summary. */
  readonly description: string;
  readonly rarity: Rarity;
  /** How many times one human can take it. Unlimited when left out. */
  readonly maxStacks?: number;
  /**
   * Set on weapon offers (`weaponOffers.ts`), which are made up for each offer
   * rather than listed in `UPGRADES`: the gun it gives, shown on the card.
   */
  readonly weapon?: GunStats;
  /** Changes the human, usually their `stats` */
  apply(human: Human): void;
}

/** How likely each rarity is to be offered, relative to each other */
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 6,
  uncommon: 3,
  rare: 1,
};
