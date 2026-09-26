import Gun from "./guns/Gun";
import { GUNS } from "./guns/gun-stats/gunStats";
import { MELEE_WEAPONS } from "./melee/melee-weapons/meleeWeapons";
import MeleeWeapon from "./melee/MeleeWeapon";
import { WeaponStats } from "./WeaponStats";

export const WEAPONS: WeaponStats[] = [...GUNS, ...MELEE_WEAPONS];

export type Weapon = Gun | MeleeWeapon;

/** Humans carry two weapons of any kind, in slots 0 and 1 */
export type WeaponSlot = 0 | 1;

export const WEAPON_SLOTS: ReadonlyArray<WeaponSlot> = [0, 1];

export function otherSlot(slot: WeaponSlot): WeaponSlot {
  return slot === 0 ? 1 : 0;
}
