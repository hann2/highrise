import { GunStats } from "./GunStats";
import { MeleeWeaponStats } from "./MeleeWeaponStats";

// For extending
export interface BaseWeaponStats {
  // A friend
  name: string;
  // Physical size of the weapon
  size: [number, number];

  textures: {
    pickup: string;
  };

  sounds: {};
}

// For actually using
export type WeaponStats = MeleeWeaponStats | GunStats;
