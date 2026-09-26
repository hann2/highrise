import { SCAVENGER_DROP_CHANCE } from "../weapons/guns/ammo";
import { Item } from "./Item";

// Equipment: items that stay with the human for the rest of the run.
// Placeholders ported from the old upgrade pool, to be redesigned once the
// store has been played.

// --- Numbers on `PlayerStats` ---

export const RunningShoes: Item = {
  name: "Running Shoes",
  description: "Move 12% faster.",
  rarity: "common",
  category: "equipment",
  apply: (human) => {
    human.stats.moveSpeed *= 1.12;
  },
};

export const Vitamins: Item = {
  name: "Vitamins",
  description: "+20 max health.",
  rarity: "common",
  category: "equipment",
  apply: (human) => {
    human.stats.maxHp += 20;
    human.hp += 20;
  },
};

export const QuickHands: Item = {
  name: "Quick Hands",
  description: "Reload 30% faster.",
  rarity: "common",
  category: "equipment",
  apply: (human) => {
    human.stats.reloadSpeed *= 1.3;
  },
};

export const SteadyAim: Item = {
  name: "Steady Aim",
  description: "40% less bullet spread.",
  rarity: "common",
  category: "equipment",
  apply: (human) => {
    human.stats.spread *= 0.6;
  },
};

export const Linebacker: Item = {
  name: "Linebacker",
  description: "Pushes shove 40% harder and stun 30% longer.",
  rarity: "common",
  category: "equipment",
  apply: (human) => {
    human.stats.pushKnockback *= 1.4;
    human.stats.pushStun *= 1.3;
  },
};

export const FreshBatteries: Item = {
  name: "Fresh Batteries",
  description: "Your flashlight reaches 35% farther.",
  rarity: "common",
  category: "equipment",
  maxStacks: 2,
  apply: (human) => {
    human.stats.flashlightRange *= 1.35;
  },
};

export const HollowPoints: Item = {
  name: "Hollow Points",
  description: "Deal 20% more damage.",
  rarity: "uncommon",
  category: "equipment",
  apply: (human) => {
    human.stats.damage *= 1.2;
  },
};

export const HairTrigger: Item = {
  name: "Hair Trigger",
  description: "Guns fire 20% faster.",
  rarity: "uncommon",
  category: "equipment",
  apply: (human) => {
    human.stats.fireRate *= 1.2;
  },
};

export const ExtendedMags: Item = {
  name: "Extended Mags",
  description: "Guns hold 50% more rounds.",
  rarity: "uncommon",
  category: "equipment",
  maxStacks: 2,
  apply: (human) => {
    human.stats.magazineSize *= 1.5;
  },
};

export const NightEyes: Item = {
  name: "Night Eyes",
  description: "See 20% farther.",
  rarity: "uncommon",
  category: "equipment",
  maxStacks: 2,
  apply: (human) => {
    human.stats.visionRange *= 1.2;
  },
};

export const GlassCannon: Item = {
  name: "Glass Cannon",
  description: "Deal 50% more damage, but -30 max health.",
  rarity: "rare",
  category: "equipment",
  maxStacks: 1,
  apply: (human) => {
    human.stats.damage *= 1.5;
    human.stats.maxHp -= 30;
    human.hp = Math.min(human.hp, human.maxHp);
  },
};

// --- Rules: how something works rather than how well ---

export const Bloodthirsty: Item = {
  name: "Bloodthirsty",
  description: "Melee kills heal 10 health.",
  rarity: "uncommon",
  category: "equipment",
  maxStacks: 1,
  apply: (human) => {
    human.stats.meleeKillHeal += 10;
  },
};

export const SpeedLoader: Item = {
  name: "Speed Loader",
  description: "Reloading an empty gun is instant.",
  rarity: "rare",
  category: "equipment",
  maxStacks: 1,
  apply: (human) => {
    human.stats.instantEmptyReload = true;
  },
};

export const CurbStomp: Item = {
  name: "Curb Stomp",
  description: "Crawlers die in one hit.",
  rarity: "uncommon",
  category: "equipment",
  maxStacks: 1,
  apply: (human) => {
    human.stats.oneHitCrawlers = true;
  },
};

export const SecondWind: Item = {
  name: "Second Wind",
  description: "Heal 25 health at the start of every floor.",
  rarity: "uncommon",
  category: "equipment",
  maxStacks: 1,
  apply: (human) => {
    human.stats.floorHeal += 25;
    // Items are bought once the floor has started, so this one counts too
    human.heal(25, false);
  },
};

export const Scavenger: Item = {
  name: "Scavenger",
  description: "Kills have a 15% chance to drop a box of ammo.",
  rarity: "uncommon",
  category: "equipment",
  maxStacks: 1,
  apply: (human) => {
    human.stats.killAmmoDropChance += SCAVENGER_DROP_CHANCE;
  },
};

export const IncendiaryRounds: Item = {
  name: "Incendiary Rounds",
  description: "Bullets set enemies on fire.",
  rarity: "rare",
  category: "equipment",
  maxStacks: 1,
  apply: (human) => {
    human.stats.incendiaryRounds = true;
  },
};
