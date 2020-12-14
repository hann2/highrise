import snd_casingDropBoard1 from "../../../resources/audio/guns/casing-drops/casing-drop-board-1.flac";
import snd_casingDropBoard2 from "../../../resources/audio/guns/casing-drops/casing-drop-board-2.flac";
import snd_casingDropBoard3 from "../../../resources/audio/guns/casing-drops/casing-drop-board-3.flac";
import snd_casingDropBoard4 from "../../../resources/audio/guns/casing-drops/casing-drop-board-4.flac";
import snd_dryFire1 from "../../../resources/audio/guns/misc/dry-fire-1.mp3";
import snd_pistolCock1 from "../../../resources/audio/guns/pistol/pistol-cock-1.mp3";
import snd_pistol2Shot1 from "../../../resources/audio/guns/pistol/pistol2-shot-1.mp3";
import snd_ar15Reload1 from "../../../resources/audio/guns/rifle/ar-15-reload-1.flac";
import snd_shotgunPump1 from "../../../resources/audio/guns/shotgun/shotgun-pump-1.mp3";
import img_pistolCasing from "../../../resources/images/shell-casings/pistol-casing.png";
import img_ar15 from "../../../resources/images/weapons/ar-15.png";
import img_pistol from "../../../resources/images/weapons/pistol.png";
import { SoundName } from "../../core/resources/sounds";
import { degToRad } from "../../core/util/MathUtil";
import { BaseWeaponStats } from "./WeaponStats";

// Stats that make a gun unique

export interface GunStats extends BaseWeaponStats {
  // Maximum rounds per second
  readonly fireRate: number;
  // meters/second of bullet when fired
  readonly muzzleVelocity: number;
  // base damage the bullet does
  readonly bulletDamage: number;
  // Distance from the shooter that the bullet is created
  readonly muzzleLength: number;
  // Full Auto, Semi Auto, Pump, Burst ...
  readonly fireMode: FireMode;
  // Maximum number of rounds in the gun
  readonly ammoCapacity: number;
  // Whether you load rounds one-at-a-time or all-at-once
  readonly reloadingStyle: ReloadingStyle;
  // Seconds to complete a reload. For INDIVIDUAL, this is seconds per round loaded
  readonly reloadTime: number;

  // The number of bullets per round fired
  readonly bulletsPerShot: number;
  // The maximum spread of bullets fired
  readonly bulletSpread: number;

  // Sounds that play for various things
  readonly sounds: {
    readonly shoot: SoundName[];
    readonly empty: SoundName[];
    readonly pickup: SoundName[];
    readonly reload: SoundName[];
    readonly reloadInsert: SoundName[];
    readonly reloadFinish: SoundName[];
    readonly pump: SoundName[];
    readonly shellDrop: SoundName[];
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
}

export type GunSounds = GunStats["sounds"];
export type GunSoundName = keyof GunSounds;

export enum FireMode {
  // One bullet per trigger pull
  SEMI_AUTO,
  // Constant bullets as long as trigger is down
  FULL_AUTO,
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
  muzzleLength: 0.5,
  muzzleVelocity: 80,
  bulletDamage: 40,
  fireMode: FireMode.SEMI_AUTO,
  ammoCapacity: 10,
  reloadTime: 1,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  bulletsPerShot: 1,
  bulletSpread: degToRad(0.5),

  size: [1, 1],
  leftHandPosition: [0.3, 0],
  rightHandPosition: [0.3, 0],
  holdPosition: [0.3, 0],

  textures: {
    pickup: img_ar15,
    holding: img_pistol,
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
    shellDrop: [
      snd_casingDropBoard1,
      snd_casingDropBoard2,
      snd_casingDropBoard3,
      snd_casingDropBoard4,
    ],
  },
};
