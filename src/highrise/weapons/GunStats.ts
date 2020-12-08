import dryFire1 from "../../../resources/audio/guns/misc/dry-fire-1.mp3";
import pistolCock1 from "../../../resources/audio/guns/pistol/pistol-cock-1.mp3";
import pistol2Shot1 from "../../../resources/audio/guns/pistol/pistol2-shot-1.mp3";
import ar15Reload1 from "../../../resources/audio/guns/rifle/ar-15-reload-1.flac";
import shotgunPump1 from "../../../resources/audio/guns/shotgun/shotgun-pump-1.mp3";
import pistolCasing from "../../../resources/images/shell-casings/pistol-casing.png";
import ar15 from "../../../resources/images/weapons/ar-15.png";
import pistol from "../../../resources/images/weapons/pistol.png";
import { SoundName } from "../../core/resources/sounds";
import { degToRad } from "../../core/util/MathUtil";
import { BaseWeaponStats } from "./WeaponStats";

// Stats that make a gun unique

export interface GunStats extends BaseWeaponStats {
  // Maximum rounds per second
  fireRate: number;
  // meters/second of bullet when fired
  muzzleVelocity: number;
  // base damage the bullet does
  bulletDamage: number;
  // Distance from the shooter that the bullet is created
  muzzleLength: number;
  // Full Auto, Semi Auto, Pump, Burst ...
  fireMode: FireMode;
  // Maximum number of rounds in the gun
  ammoCapacity: number;
  // Whether you load rounds one-at-a-time or all-at-once
  reloadingStyle: ReloadingStyle;
  // Seconds to complete a reload. For INDIVIDUAL, this is seconds per round loaded
  reloadTime: number;

  // The number of bullets per round fired
  bulletsPerShot: number;
  // The maximum spread of bullets fired
  bulletSpread: number;

  // Sounds that play for various things
  sounds: {
    shoot: SoundName[];
    empty: SoundName[];
    pickup: SoundName[];
    reload: SoundName[];
    reloadInsert?: SoundName[];
    reloadFinish?: SoundName[];
    pump?: SoundName[];
  };

  textures: {
    // Texture to use when the item's on the ground
    pickup: string;
    // Texture while in person's hands
    holding: string;
    // Texture of the ejected shell casing
    shellCasing: string;
  };
}

export enum FireMode {
  // One bullet per trigger pull
  SEMI_AUTO,
  // Constant bullets as long as trigger is down
  FULL_AUTO,
  // 3 bullets per trigger pull
  BURST, // TODO: Implement burst fire
  // Pumps after every shot
  PUMP,
}

export enum ReloadingStyle {
  // One reload action brings the gun back to full ammo
  MAGAZINE,
  // Rounds are loaded one-at-a-time
  INDIVIDUAL,
}

export const defaultGunStats: GunStats = {
  name: "Gun",
  fireRate: 1.0,
  muzzleLength: 0.2,
  muzzleVelocity: 80,
  bulletDamage: 40,
  fireMode: FireMode.SEMI_AUTO,
  ammoCapacity: 10,
  reloadTime: 1,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  bulletsPerShot: 1,
  bulletSpread: degToRad(0.5),

  size: [1, 1],
  textures: { pickup: ar15, holding: pistol, shellCasing: pistolCasing },

  sounds: {
    shoot: [pistol2Shot1],
    empty: [dryFire1],
    pickup: [pistolCock1],
    reload: [ar15Reload1],
    reloadInsert: [],
    reloadFinish: [],
    pump: [shotgunPump1],
  },
};
