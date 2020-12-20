import snd_casingDropBoard1 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-1.flac";
import snd_casingDropBoard2 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-2.flac";
import snd_casingDropBoard3 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-3.flac";
import snd_casingDropBoard4 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-4.flac";
import snd_shotgunCasingDrop1 from "../../../../resources/audio/guns/casing-drops/shotgun-casing-drop-1.mp3";
import img_pistolCasing from "../../../../resources/images/shell-casings/pistol-casing.png";
import img_rifleCasing from "../../../../resources/images/shell-casings/rifle-casing.png";
import img_shotgunCasing from "../../../../resources/images/shell-casings/shotgun-casing.png";
import { SoundName } from "../../../core/resources/sounds";

export interface BulletStats {
  // Amount of damage done to enemies
  damage: number;
  // Affects the amount of knockback done to enemies
  mass: number;
  // Speed in meters/sec this exits the gun
  muzzleVelocity: number;
  // Color of the line
  color: number;
  // Sound the casing makes when it hits the ground
  dropSounds: SoundName[];
  // Texture of the casing as it's flying and hitting the ground
  dropTexture: string;
  // Bullets per shot
  bulletsPerShot: number;
}

export const defaultBulletStats: BulletStats = {
  damage: 10,
  muzzleVelocity: 100,
  mass: 0.01,
  color: 0xff9900,
  bulletsPerShot: 1,

  dropSounds: [
    snd_casingDropBoard1,
    snd_casingDropBoard2,
    snd_casingDropBoard3,
    snd_casingDropBoard4,
  ],
  dropTexture: img_pistolCasing,
};

// 9mm pistol round
export const NineMil: BulletStats = {
  ...defaultBulletStats,
  color: 0xffaa00,
  damage: 25,
  mass: 0.01,
  muzzleVelocity: 60,

  dropSounds: [
    snd_casingDropBoard1,
    snd_casingDropBoard2,
    snd_casingDropBoard3,
    snd_casingDropBoard4,
  ],

  dropTexture: img_pistolCasing,
};

// .45 caliber pistol round
export const FourtyFive: BulletStats = {
  ...NineMil,
  damage: 34,
  mass: 0.015,
};

// .50 caliber big pistol round
export const Magnum: BulletStats = {
  ...NineMil,
  damage: 60,
  mass: 0.02,
};

// 5.56mm rifle round for AR-15
export const FiveFiveSix: BulletStats = {
  ...defaultBulletStats,
  damage: 45,
  mass: 0.01,
  muzzleVelocity: 120,
  dropTexture: img_rifleCasing,
};

// 7.62mm rifle round for AK-47
export const SevenSixTwo: BulletStats = {
  ...defaultBulletStats,
  damage: 50,
  mass: 0.016,
  muzzleVelocity: 120,
  dropTexture: img_rifleCasing,
};

// 12ga shotgun shell with 9 buckshot pellets
export const TwelveGuageBuckshot: BulletStats = {
  ...defaultBulletStats,
  damage: 20,
  mass: 0.016,
  muzzleVelocity: 55,
  bulletsPerShot: 9,
  dropTexture: img_shotgunCasing,
  dropSounds: [snd_shotgunCasingDrop1],
};
