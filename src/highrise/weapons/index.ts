import { GUNS } from "./guns";
import { MELEE_WEAPONS } from "./melee-weapons";
import { WeaponStats } from "./WeaponStats";

export const WEAPONS: WeaponStats[] = [...GUNS, ...MELEE_WEAPONS];
