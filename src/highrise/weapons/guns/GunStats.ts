// Stats that make a gun unique

import snd_dryFire1 from "../../../../resources/audio/guns/misc/dry-fire-1.mp3";
import snd_pistolCock1 from "../../../../resources/audio/guns/pistol/pistol-cock-1.mp3";
import snd_pistol2Shot1 from "../../../../resources/audio/guns/pistol/pistol2-shot-1.mp3";
import snd_ar15Reload1 from "../../../../resources/audio/guns/rifle/ar-15-reload-1.flac";
import snd_shotgunPump1 from "../../../../resources/audio/guns/shotgun/shotgun-pump-1.mp3";
import img_pistolCasing from "../../../../resources/images/shell-casings/pistol-casing.png";
import img_glockHold from "../../../../resources/images/weapons/glock-hold.png";
import img_glockPickup from "../../../../resources/images/weapons/glock-pickup.png";
import { SoundName } from "../../../core/resources/sounds";
import { degToRad } from "../../../core/util/MathUtil";
import { BaseWeaponStats } from "../WeaponStats";
import { BulletStats, defaultBulletStats } from "./BulletStats";

export interface GunStats extends BaseWeaponStats {
  // Maximum rounds per second
  readonly fireRate: number;
  // Distance from the shooter that the bullet is created
  readonly muzzleLength: number;
  // Full Auto, Semi Auto, Pump, Burst ...
  readonly fireMode: FireMode;
  // Maximum number of rounds in the gun
  readonly ammoCapacity: number;
  // Whether you load rounds one-at-a-time or all-at-once
  readonly reloadingStyle: ReloadingStyle;
  // Seconds to start a reload.
  readonly reloadStartTime: number;
  // Seconds to do the insert part of a reload. For INDIVIDUAL, this is seconds per round loaded
  readonly reloadInsertTime: number;
  // Seconds to finish a reload.
  readonly reloadEndTime: number;

  // The type of bullet this uses
  readonly bulletStats: BulletStats;
  // The maximum spread of bullets fired
  readonly bulletSpread: number;

  // Whether the shells eject after each shot or on reload
  readonly ejectionType: EjectionType;

  // Color of the laser sight, or none if this doesn't have one
  readonly laserSightColor?: number;

  // Angle delta on each shot
  readonly recoilAmount: number;
  // Percent of aim recovered per second I think
  readonly recoilRecovery: number;

  // Sounds that play for various things
  readonly sounds: {
    readonly shoot: SoundName[];
    readonly empty: SoundName[];
    readonly pickup: SoundName[];
    readonly reload: SoundName[];
    readonly reloadInsert: SoundName[];
    readonly reloadFinish: SoundName[];
    readonly pump: SoundName[];
  };

  readonly textures: {
    // Texture to use when the item's on the ground
    readonly pickup: string;
    // Texture while in person's hands
    readonly holding: string;
    // Texture of the ejected shell casing
    readonly shellCasing: string;
  };

  // Position of the left hand
  leftHandPosition: [number, number];
  // Position of the right hand
  rightHandPosition: [number, number];
  // Position of the sprite
  holdPosition: [number, number];
  // Angle that the shooter stands at while holding the gun
  stanceAngle: number;
  // Position offset that the shooter stands at while holding the gun
  stanceOffset: [number, number];
}

export type GunSounds = GunStats["sounds"];
export type GunSoundName = keyof GunSounds;

export enum FireMode {
  // One bullet per trigger pull
  SEMI_AUTO,
  // Constant bullets as long as trigger is down
  FULL_AUTO,
}

export enum EjectionType {
  // Shells eject on each shot
  AUTOMATIC,
  // Shells eject when pumped
  PUMP,
  // Shells eject at start of reload
  RELOAD,
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
  fireMode: FireMode.SEMI_AUTO,
  ammoCapacity: 10,
  reloadStartTime: 0.1,
  reloadInsertTime: 1,
  reloadEndTime: 0.1,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  ejectionType: EjectionType.AUTOMATIC,
  bulletSpread: degToRad(0.5),

  bulletStats: defaultBulletStats,

  recoilAmount: degToRad(2),
  recoilRecovery: 5,

  size: [1, 1],
  muzzleLength: 0.5,
  leftHandPosition: [0.3, 0],
  rightHandPosition: [0.3, 0],
  holdPosition: [0.3, 0],
  stanceAngle: 0,
  stanceOffset: [0, 0],

  textures: {
    pickup: img_glockPickup,
    holding: img_glockHold,
    shellCasing: img_pistolCasing,
  },

  sounds: {
    shoot: [snd_pistol2Shot1],
    empty: [snd_dryFire1],
    pickup: [snd_pistolCock1],
    reload: [snd_ar15Reload1],
    reloadInsert: [],
    reloadFinish: [],
    pump: [snd_shotgunPump1],
  },
};
