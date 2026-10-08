import { CHARACTERS } from "../../highrise/characters/Character";
import { GUN_PRICE_BY_TIER } from "../../highrise/items/prices";
import { GUN_TIER_FOR_ACT } from "../../highrise/run/acts";
import {
  AMMO_BOX,
  AMMO_PRICE,
  ammoClassName,
  MAX_RESERVE,
  NEW_GUN_RESERVE_BONUS,
} from "../../highrise/weapons/guns/ammo";
import { gunTierOf } from "../../highrise/weapons/guns/gun-stats/gunStats";
import {
  DEFAULT_BULLET_SLOWDOWN,
  EjectionType,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../../highrise/weapons/guns/GunStats";

/*
 * A gun's stats as the gun browser lays them out: grouped, labelled, worked
 * out where the raw numbers don't say it plainly (damage per second, a full
 * reload), and which way is better, for comparing two.
 */

export interface Fact {
  label: string;
  /** What it means, for the tooltip */
  about?: string;
  /** The number, for comparing (none for words) */
  value?: (gun: GunStats) => number;
  /** How it reads */
  text: (gun: GunStats) => string;
  /** Which way is better, for comparing: more or less */
  better?: "more" | "less";
}

export interface FactGroup {
  title: string;
  facts: Fact[];
}

const RAD_TO_DEG = 180 / Math.PI;

function round(n: number, places = 2): string {
  return String(Number(n.toFixed(places)));
}

/** A number with its unit */
function numeric(
  label: string,
  value: (gun: GunStats) => number,
  unit: string,
  better?: "more" | "less",
  about?: string,
  places = 2,
): Fact {
  return {
    label,
    about,
    value,
    better,
    text: (gun) => `${round(value(gun), places)}${unit}`,
  };
}

export function damagePerShot(gun: GunStats): number {
  return gun.bulletStats.damage * gun.bulletStats.bulletsPerShot;
}

/** Seconds a reload takes from empty: the whole magazine, or every round one at a time */
export function fullReloadTime(gun: GunStats): number {
  const { reloadStartTime, reloadInsertTime, reloadEndTime } = gun;
  return gun.reloadingStyle === ReloadingStyle.INDIVIDUAL
    ? reloadStartTime + gun.ammoCapacity * reloadInsertTime + reloadEndTime
    : reloadStartTime + reloadInsertTime + reloadEndTime;
}

/** Damage per second firing as fast as it goes, reloads and all */
export function sustainedDps(gun: GunStats): number {
  const firing = gun.ammoCapacity / gun.fireRate;
  return (
    (damagePerShot(gun) * gun.ammoCapacity) / (firing + fullReloadTime(gun))
  );
}

/** The acts whose stores deal it (each deals its tier and the one above) */
function actsSelling(gun: GunStats): number[] {
  const tier = gunTierOf(gun);
  return GUN_TIER_FOR_ACT.flatMap((dealt, i) =>
    tier === dealt || tier === dealt + 1 ? [i + 1] : [],
  );
}

const FIRE_MODES: Record<FireMode, string> = {
  [FireMode.SEMI_AUTO]: "Semi-automatic",
  [FireMode.FULL_AUTO]: "Full auto",
};
const RELOADING: Record<ReloadingStyle, string> = {
  [ReloadingStyle.MAGAZINE]: "Magazine",
  [ReloadingStyle.INDIVIDUAL]: "A round at a time",
};
const EJECTION: Record<EjectionType, string> = {
  [EjectionType.AUTOMATIC]: "Each shot",
  [EjectionType.PUMP]: "Pumped",
  [EjectionType.RELOAD]: "On reload",
};

export const FACT_GROUPS: FactGroup[] = [
  {
    title: "Damage",
    facts: [
      numeric("Per bullet", (g) => g.bulletStats.damage, "", "more"),
      numeric(
        "Bullets per shot",
        (g) => g.bulletStats.bulletsPerShot,
        "",
        "more",
      ),
      numeric("Per shot", damagePerShot, "", "more"),
      numeric(
        "Per second",
        (g) => damagePerShot(g) * g.fireRate,
        "",
        "more",
        "Firing as fast as it goes, without reloading",
        0,
      ),
      numeric(
        "Sustained",
        sustainedDps,
        "/s",
        "more",
        "Damage per second emptying it and reloading from empty, over and over",
        0,
      ),
      numeric(
        "Per magazine",
        (g) => damagePerShot(g) * g.ammoCapacity,
        "",
        "more",
      ),
      numeric(
        "Bullet mass",
        (g) => g.bulletStats.mass * 1000,
        " g",
        "more",
        "How hard it knocks enemies back",
      ),
    ],
  },
  {
    title: "Firing",
    facts: [
      { label: "Mode", text: (g) => FIRE_MODES[g.fireMode] },
      numeric(
        "Fire rate",
        (g) => g.fireRate,
        "/s",
        "more",
        "Most rounds a second",
      ),
      numeric(
        "Spread",
        (g) => g.bulletSpread * RAD_TO_DEG,
        "°",
        "less",
        "The widest bullets go off where it's aimed",
        1,
      ),
      numeric(
        "Recoil",
        (g) => g.recoilAmount * RAD_TO_DEG,
        "°",
        "less",
        "How far each shot kicks the aim",
        1,
      ),
      numeric(
        "Recoil recovery",
        (g) => g.recoilRecovery,
        "/s",
        "more",
        "How fast the aim comes back",
      ),
      numeric(
        "Muzzle velocity",
        (g) => g.muzzleVelocity,
        " m/s",
        "more",
        `The real gun's. Bullets in the game go ${DEFAULT_BULLET_SLOWDOWN} times slower`,
        0,
      ),
      { label: "Shells eject", text: (g) => EJECTION[g.ejectionType] },
      {
        label: "Laser sight",
        text: (g) =>
          g.laserSightColor === undefined
            ? "None"
            : `#${g.laserSightColor.toString(16).padStart(6, "0")}`,
      },
    ],
  },
  {
    title: "Ammo",
    facts: [
      { label: "Class", text: (g) => ammoClassName(g.ammoClass) },
      numeric("Capacity", (g) => g.ammoCapacity, "", "more"),
      { label: "Reloading", text: (g) => RELOADING[g.reloadingStyle] },
      numeric(
        "Reload",
        fullReloadTime,
        " s",
        "less",
        "From empty: start, insert (each round, loaded one at a time) and finish",
      ),
      {
        label: "Reload parts",
        about:
          "Seconds to start, to insert (per round, if loaded one at a time) and to finish",
        text: (g) =>
          `${round(g.reloadStartTime)} + ${round(g.reloadInsertTime)}${
            g.reloadingStyle === ReloadingStyle.INDIVIDUAL ? " each" : ""
          } + ${round(g.reloadEndTime)} s`,
      },
      numeric(
        "Box",
        (g) => AMMO_BOX[g.ammoClass],
        " rounds",
        "more",
        "What an ammo box holds",
        0,
      ),
      numeric(
        "Box price",
        (g) => AMMO_PRICE[g.ammoClass],
        " quarters",
        "less",
        "Quarters for a box at an ammo machine",
        0,
      ),
      numeric(
        "Most carried",
        (g) => MAX_RESERVE[g.ammoClass],
        "",
        "more",
        "Most reserve rounds of its class one human can carry",
        0,
      ),
      numeric(
        "Comes with",
        (g) => NEW_GUN_RESERVE_BONUS[g.ammoClass],
        "",
        "more",
        "Reserve rounds it brings the first time it's picked up",
        0,
      ),
    ],
  },
  {
    title: "In a run",
    facts: [
      {
        label: "Tier",
        text: (g) => {
          const tier = gunTierOf(g);
          return tier < 0 ? "None" : String(tier + 1);
        },
      },
      {
        label: "Price",
        about: "Quarters at a store",
        value: (g) => GUN_PRICE_BY_TIER[gunTierOf(g)] ?? 0,
        better: "less",
        text: (g) => {
          const price = GUN_PRICE_BY_TIER[gunTierOf(g)];
          return price === undefined ? "Not sold" : `${price} quarters`;
        },
      },
      {
        label: "Sold in",
        about: "The acts whose stores deal it",
        text: (g) => {
          const acts = actsSelling(g);
          return acts.length ? `Act ${acts.join(", ")}` : "None";
        },
      },
      {
        label: "Starts with it",
        text: (g) =>
          CHARACTERS.filter((c) => c.startingWeapons.includes(g))
            .map((c) => c.name)
            .join(", ") || "Nobody",
      },
    ],
  },
];
