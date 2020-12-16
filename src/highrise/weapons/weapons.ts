import { GUNS } from "./guns/guns";
import { MELEE_WEAPONS } from "./melee-weapons/meleeWeapons";
import { WeaponStats } from "./WeaponStats";

export const WEAPONS: WeaponStats[] = [...GUNS, ...MELEE_WEAPONS];
