import { SCAVENGER_DROP_CHANCE } from "../weapons/guns/ammo";
import { Upgrade } from "./Upgrade";

// Upgrades that change how something works rather than how well

export const Bloodthirsty: Upgrade = {
  name: "Bloodthirsty",
  description: "Melee kills heal 10 health.",
  rarity: "uncommon",
  maxStacks: 1,
  apply: (human) => {
    human.stats.meleeKillHeal += 10;
  },
};

export const SpeedLoader: Upgrade = {
  name: "Speed Loader",
  description: "Reloading an empty gun is instant.",
  rarity: "rare",
  maxStacks: 1,
  apply: (human) => {
    human.stats.instantEmptyReload = true;
  },
};

export const CurbStomp: Upgrade = {
  name: "Curb Stomp",
  description: "Crawlers die in one hit.",
  rarity: "uncommon",
  maxStacks: 1,
  apply: (human) => {
    human.stats.oneHitCrawlers = true;
  },
};

export const SecondWind: Upgrade = {
  name: "Second Wind",
  description: "Heal 25 health at the start of every floor.",
  rarity: "uncommon",
  maxStacks: 1,
  apply: (human) => {
    human.stats.floorHeal += 25;
  },
};

export const Scavenger: Upgrade = {
  name: "Scavenger",
  description: "Kills have a 15% chance to drop a box of ammo.",
  rarity: "uncommon",
  maxStacks: 1,
  apply: (human) => {
    human.stats.killAmmoDropChance += SCAVENGER_DROP_CHANCE;
  },
};
