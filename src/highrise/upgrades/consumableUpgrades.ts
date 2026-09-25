import { Flashbang } from "../weapons/consumables/consumable-stats/Flashbang";
import { FragGrenade } from "../weapons/consumables/consumable-stats/FragGrenade";
import { Molotov } from "../weapons/consumables/consumable-stats/Molotov";
import { Upgrade } from "./Upgrade";

// Upgrades that hand out consumables. Only one type is carried at a time, so
// taking one of these swaps out a different type (dropped at your feet).

export const GrenadePack: Upgrade = {
  name: "Grenade Pack",
  description: "Two frag grenades.",
  rarity: "uncommon",
  apply: (human) => {
    human.giveConsumable(FragGrenade, 2);
  },
};

export const FlashbangPack: Upgrade = {
  name: "Flashbangs",
  description: "Two flashbangs that stun everything that sees them.",
  rarity: "uncommon",
  apply: (human) => {
    human.giveConsumable(Flashbang, 2);
  },
};

export const MolotovPack: Upgrade = {
  name: "Molotovs",
  description: "Two molotovs that set the floor on fire where they land.",
  rarity: "uncommon",
  apply: (human) => {
    human.giveConsumable(Molotov, 2);
  },
};
