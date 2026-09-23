import { Upgrade } from "./Upgrade";

// Upgrades that make a number on `PlayerStats` better

export const RunningShoes: Upgrade = {
  name: "Running Shoes",
  description: "Move 12% faster.",
  rarity: "common",
  apply: (human) => {
    human.stats.moveSpeed *= 1.12;
  },
};

export const Vitamins: Upgrade = {
  name: "Vitamins",
  description: "+20 max health.",
  rarity: "common",
  apply: (human) => {
    human.stats.maxHp += 20;
    human.hp += 20;
  },
};

export const QuickHands: Upgrade = {
  name: "Quick Hands",
  description: "Reload 30% faster.",
  rarity: "common",
  apply: (human) => {
    human.stats.reloadSpeed *= 1.3;
  },
};

export const SteadyAim: Upgrade = {
  name: "Steady Aim",
  description: "40% less bullet spread.",
  rarity: "common",
  apply: (human) => {
    human.stats.spread *= 0.6;
  },
};

export const Linebacker: Upgrade = {
  name: "Linebacker",
  description: "Pushes shove 40% harder and stun 30% longer.",
  rarity: "common",
  apply: (human) => {
    human.stats.pushKnockback *= 1.4;
    human.stats.pushStun *= 1.3;
  },
};

export const FreshBatteries: Upgrade = {
  name: "Fresh Batteries",
  description: "Your flashlight reaches 35% farther.",
  rarity: "common",
  maxStacks: 2,
  apply: (human) => {
    human.stats.flashlightRange *= 1.35;
  },
};

export const HollowPoints: Upgrade = {
  name: "Hollow Points",
  description: "Deal 20% more damage.",
  rarity: "uncommon",
  apply: (human) => {
    human.stats.damage *= 1.2;
  },
};

export const HairTrigger: Upgrade = {
  name: "Hair Trigger",
  description: "Guns fire 20% faster.",
  rarity: "uncommon",
  apply: (human) => {
    human.stats.fireRate *= 1.2;
  },
};

export const ExtendedMags: Upgrade = {
  name: "Extended Mags",
  description: "Guns hold 50% more rounds.",
  rarity: "uncommon",
  maxStacks: 2,
  apply: (human) => {
    human.stats.magazineSize *= 1.5;
  },
};

export const NightEyes: Upgrade = {
  name: "Night Eyes",
  description: "See 20% farther.",
  rarity: "uncommon",
  maxStacks: 2,
  apply: (human) => {
    human.stats.visionRange *= 1.2;
  },
};

export const GlassCannon: Upgrade = {
  name: "Glass Cannon",
  description: "Deal 50% more damage, but -30 max health.",
  rarity: "rare",
  maxStacks: 1,
  apply: (human) => {
    human.stats.damage *= 1.5;
    human.stats.maxHp -= 30;
    human.hp = Math.min(human.hp, human.maxHp);
  },
};
