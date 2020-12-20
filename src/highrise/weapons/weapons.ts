import { GUNS } from "./guns/gun-stats/gunStats";
import { MELEE_WEAPONS } from "./melee/melee-weapons/meleeWeapons";
import { WeaponStats } from "./WeaponStats";

export const WEAPONS: WeaponStats[] = [...GUNS, ...MELEE_WEAPONS];
