import { choose } from "../../core/util/Random";
import type Human from "../human/Human";
import Gun from "../weapons/guns/Gun";
import { GUN_TIERS, gunTierOf } from "../weapons/guns/gun-stats/gunStats";
import { fireModeName, GunStats } from "../weapons/guns/GunStats";
import { Rarity } from "./Upgrade";
import type { Upgrade } from "./Upgrade";

// Weapon offers: an upgrade card that hands over a specific gun. They aren't
// in `UPGRADES`, because which guns can be offered depends on the floor; one
// is made up for each offer (see `drawUpgrades`).

/** Rarity of a weapon card, by the gun's index in `GUN_TIERS` */
const TIER_RARITY: ReadonlyArray<Rarity> = [
  "common",
  "uncommon",
  "uncommon",
  "rare",
];

/** A card that gives `gun`, loaded, in its slot (dropping what was there) */
export function makeWeaponOffer(gun: GunStats): Upgrade {
  const tier = Math.max(0, gunTierOf(gun));
  return {
    name: gun.name,
    description: gunSummary(gun),
    rarity: TIER_RARITY[Math.min(tier, TIER_RARITY.length - 1)],
    maxStacks: 1,
    weapon: gun,
    apply: (human) => {
      const weapon = new Gun(gun);
      weapon.ammo = weapon.getCapacity(human);
      // Comes with the usual first-pickup reserve bonus
      human.giveWeapon(weapon);
    },
  };
}

/**
 * Picks a gun to offer on a floor whose normal closets have guns up to
 * `bestGunTier`: one from that tier or the one above, and never one `human`
 * is already carrying. Undefined if there's nothing left to offer.
 */
export function drawWeaponOffer(
  human: Human,
  bestGunTier: number,
): Upgrade | undefined {
  const held = [human.primary, human.secondary]
    .filter((weapon) => weapon instanceof Gun)
    .map((gun) => gun.stats);
  const candidates = GUN_TIERS.slice(
    Math.max(0, bestGunTier),
    Math.max(0, bestGunTier + 2),
  )
    .flat()
    .filter((gun) => !held.includes(gun));
  return candidates.length > 0
    ? makeWeaponOffer(choose(...candidates))
    : undefined;
}

/** One line for a weapon card, like "Tier 2 · 30 rounds · semi auto" */
export function gunSummary(gun: GunStats): string {
  const rounds = gun.ammoClass === "shotgun" ? "shells" : "rounds";
  return [
    `Tier ${gunTierOf(gun) + 1}`,
    `${gun.ammoCapacity} ${rounds}`,
    fireModeName(gun).toLowerCase(),
  ].join(" · ");
}
