import Gun from "./guns/Gun";
import { GUNS } from "./guns/gun-stats/gunStats";
import { MELEE_WEAPONS } from "./melee/melee-weapons/meleeWeapons";
import MeleeWeapon from "./melee/MeleeWeapon";
import { WeaponStats } from "./WeaponStats";

export const WEAPONS: WeaponStats[] = [...GUNS, ...MELEE_WEAPONS];

export type Weapon = Gun | MeleeWeapon;
