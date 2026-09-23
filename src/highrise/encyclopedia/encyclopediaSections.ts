import { RESOURCES } from "../../../resources/resources";
import { CHARACTERS } from "../characters/Character";
import { isCharacterUnlocked, SaveData } from "../persistence/SaveData";
import { UPGRADES } from "../upgrades/upgrades";
import { GUN_TIERS, GUNS } from "../weapons/guns/gun-stats/gunStats";
import {
  EjectionType,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../weapons/guns/GunStats";
import { MELEE_WEAPONS } from "../weapons/melee/melee-weapons/meleeWeapons";
import { SwingDescriptor } from "../weapons/melee/SwingDescriptor";
import { ENEMY_INFO } from "./enemyInfo";

/** One thing in the encyclopedia. Unfound entries are shown as "???". */
export interface EncyclopediaEntry {
  name: string;
  found: boolean;
  /** URL of a picture */
  image?: string;
  /** Turns the image to face up, for things drawn facing right like heads */
  rotateImage?: boolean;
  /** A short line under the name, like a rarity */
  tag?: string;
  description?: string;
  stats: [label: string, value: string][];
}

export interface EncyclopediaSection {
  title: string;
  /** Builds the entries, in display order, from what the save says was found */
  getEntries(save: SaveData): EncyclopediaEntry[];
}

const characters: EncyclopediaSection = {
  title: "Characters",
  getEntries: () =>
    CHARACTERS.map((character) => ({
      name: character.name,
      found: isCharacterUnlocked(character.name),
      image: RESOURCES.images[character.textures.head],
      rotateImage: true,
      stats: [],
    })),
};

const guns: EncyclopediaSection = {
  title: "Guns",
  getEntries: (save) =>
    GUNS.map((gun) => ({
      name: gun.name,
      found: save.seen.guns.includes(gun.name),
      image: RESOURCES.images[gun.textures.pickup],
      tag: `Tier ${GUN_TIERS.findIndex((tier) => tier.includes(gun)) + 1}`,
      stats: [
        ["Damage", gunDamage(gun)],
        ["Magazine", String(gun.ammoCapacity)],
        ["Fire rate", `${gun.fireRate} / s`],
        ["Reload", gunReload(gun)],
        ["Mode", gunMode(gun)],
      ],
    })),
};

const melee: EncyclopediaSection = {
  title: "Melee",
  getEntries: (save) =>
    MELEE_WEAPONS.map((weapon) => ({
      name: weapon.name,
      found: save.seen.melee.includes(weapon.name),
      image: RESOURCES.images[weapon.textures.pickup],
      stats: [
        ["Damage", String(weapon.damage)],
        ["Knockback", String(weapon.knockbackAmount)],
        [
          "Swing",
          `${seconds(new SwingDescriptor(weapon.swing.durations).duration)}`,
        ],
      ],
    })),
};

const upgrades: EncyclopediaSection = {
  title: "Upgrades",
  getEntries: (save) =>
    UPGRADES.map((upgrade) => ({
      name: upgrade.name,
      found: save.seen.upgrades.includes(upgrade.name),
      tag: upgrade.rarity,
      description: upgrade.description,
      stats:
        upgrade.maxStacks === undefined
          ? []
          : [["Max stacks", String(upgrade.maxStacks)]],
    })),
};

const enemies: EncyclopediaSection = {
  title: "Enemies",
  getEntries: (save) =>
    ENEMY_INFO.map((enemy) => ({
      name: enemy.name,
      found: save.seen.enemies.includes(enemy.name),
      image: RESOURCES.images[enemy.image],
      rotateImage: enemy.image.includes("Head"),
      description: enemy.description,
      stats: [
        ["Health", enemy.health],
        ["Damage", enemy.damage],
        ["Speed", enemy.speed],
      ],
    })),
};

/** Every section, in tab order */
export const ENCYCLOPEDIA_SECTIONS: ReadonlyArray<EncyclopediaSection> = [
  characters,
  guns,
  melee,
  // Consumables (weapons/consumables/) go here once they exist, as a section with `seen.consumables`
  upgrades,
  enemies,
];

function gunDamage(gun: GunStats): string {
  const { damage, bulletsPerShot } = gun.bulletStats;
  return bulletsPerShot > 1 ? `${damage} × ${bulletsPerShot}` : String(damage);
}

function gunReload(gun: GunStats): string {
  if (gun.reloadingStyle === ReloadingStyle.INDIVIDUAL) {
    return `${seconds(gun.reloadInsertTime)} per round`;
  }
  return seconds(
    gun.reloadStartTime + gun.reloadInsertTime + gun.reloadEndTime,
  );
}

function gunMode(gun: GunStats): string {
  if (gun.ejectionType === EjectionType.PUMP) {
    return "Pump action";
  }
  return gun.fireMode === FireMode.FULL_AUTO ? "Full auto" : "Semi auto";
}

function seconds(time: number): string {
  return `${Number(time.toFixed(2))} s`;
}
