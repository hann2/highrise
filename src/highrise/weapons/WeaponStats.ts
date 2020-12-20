import { GunStats } from "./guns/GunStats";
import { MeleeWeaponStats } from "./melee/MeleeWeaponStats";

// For extending
export interface BaseWeaponStats {
  // A friend
  readonly name: string;
  // Physical size of the weapon
  readonly size: [number, number];

  readonly textures: {
    readonly pickup: string;
  };

  readonly sounds: {};
}

// For actually using
export type WeaponStats = MeleeWeaponStats | GunStats;
