import Gun from "./guns/Gun";
import { GUNS } from "./guns/gun-stats/gunStats";
import { MELEE_WEAPONS } from "./melee/melee-weapons/meleeWeapons";
import MeleeWeapon from "./melee/MeleeWeapon";
import { WeaponStats } from "./WeaponStats";

export const WEAPONS: WeaponStats[] = [...GUNS, ...MELEE_WEAPONS];

export type Weapon = Gun | MeleeWeapon;

/**
 * Humans carry two weapons: a primary (rifles and shotguns, limited ammo) and
 * a secondary (pistols and melee weapons, unlimited).
 */
export type WeaponSlot = "primary" | "secondary";

/** Which slot a weapon goes in */
export function slotFor(weapon: Weapon): WeaponSlot {
  return weapon instanceof Gun && weapon.stats.ammoClass !== "pistol"
    ? "primary"
    : "secondary";
}

export function otherSlot(slot: WeaponSlot): WeaponSlot {
  return slot === "primary" ? "secondary" : "primary";
}
