import type { Item } from "./Item";
import NightVisionLight from "./NightVisionLight";

// Items only bosses drop: rare, no downsides, never on a shelf, so a boss is
// always good news. (Akimbo joins them with the second wave of items.)

export const NightVision: Item = {
  name: "Night Vision",
  description: "See 20% further, and a little in the dark around you.",
  rarity: "rare",
  category: "boss",
  maxStacks: 1,
  apply: (human) => {
    human.stats.visionRange *= 1.2;
    human.addChild(new NightVisionLight(human));
  },
};

export const HeavyWallet: Item = {
  name: "Heavy Wallet",
  description: "Enemies drop twice the quarters.",
  rarity: "rare",
  category: "boss",
  maxStacks: 1,
  apply: (human) => {
    human.stats.quarterMultiplier *= 2;
  },
};

export const SecondHeart: Item = {
  name: "Second Heart",
  description: "Once, dying leaves you on 50 health instead.",
  rarity: "rare",
  category: "boss",
  maxStacks: 1,
  apply: (human) => {
    human.stats.extraLives += 1;
  },
};

export const AdrenalGland: Item = {
  name: "Adrenal Gland",
  description: "A stim's rush for 6 seconds at the start of every floor.",
  rarity: "rare",
  category: "boss",
  maxStacks: 1,
  apply: (human) => {
    human.stats.floorStimSeconds += 6;
  },
};

export const BOSS_ITEMS: ReadonlyArray<Item> = [
  NightVision,
  HeavyWallet,
  SecondHeart,
  AdrenalGland,
];
