// Stats that make a gun unique

import { ImageName, SoundName } from "../../../../resources/resources";
import { degToRad } from "../../../core/util/MathUtil";
import { BaseWeaponStats } from "../WeaponStats";
import { AmmoClass } from "./ammo";
import { BulletStats, defaultBulletStats } from "./BulletStats";
import { TILT_ANIMATIONS } from "./gun-animations/tiltReload";
import type { GunArtName } from "./gunArt";
import {
  GunAnimation,
  GunPartName,
  GunParts,
  GunPoints,
  MagazineStats,
} from "./GunPose";
import { MuzzleFlashStyle } from "./MuzzleFlashStyle";

/**
 * The animations a gun plays, each stretched to the time it takes (so the
 * times in `GunStats` stay the gameplay's, and an animation can be shared by
 * guns that take different times). Magazine guns play `reload` (or
 * `reloadEmpty` when empty) over the whole reload; guns loaded a round at a
 * time play `reloadStart`, then `reloadInsert` per round, then
 * `reloadFinish`, over each part.
 */
export interface GunAnimations {
  readonly reload?: GunAnimation;
  readonly reloadEmpty?: GunAnimation;
  readonly reloadStart?: GunAnimation;
  readonly reloadInsert?: GunAnimation;
  readonly reloadFinish?: GunAnimation;
  /** Working the pump (`EjectionType.PUMP`), played as long as it takes */
  readonly pump?: GunAnimation;
}

export interface GunStats extends BaseWeaponStats {
  // Maximum rounds per second
  readonly fireRate: number;
  // Distance from the shooter that the bullet is created
  readonly muzzleLength: number;
  // Full Auto, Semi Auto, Pump, Burst ...
  readonly fireMode: FireMode;
  // Maximum number of rounds in the gun
  readonly ammoCapacity: number;
  // Which reserve it reloads from. Also its family, for attachments.
  readonly ammoClass: AmmoClass;
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
  /**
   * The real gun's muzzle velocity in meters/sec, with its barrel and usual
   * load. Bullets leave at this divided by `bulletSpeed.slowdown`.
   */
  readonly muzzleVelocity: number;
  // The maximum spread of bullets fired
  readonly bulletSpread: number;
  /**
   * Smoke put into the air in front of the muzzle with each shot (see
   * `SmokeField`). Left out, it comes from the number of bullets per shot.
   */
  readonly smoke?: number;
  /** How its muzzle flash looks: each gun's is its own (see `MuzzleFlash`) */
  readonly flash?: MuzzleFlashStyle;

  // Whether the shells eject after each shot or on reload
  readonly ejectionType: EjectionType;

  // Color of the laser sight, or none if this doesn't have one
  readonly laserSightColor?: number;

  // Angle delta on each shot
  readonly recoilAmount: number;
  // Percent of aim recovered per second I think
  readonly recoilRecovery: number;
  /** Meters the gun slides back from one shot, at its furthest */
  readonly recoilSlide: number;
  /**
   * Seconds from the shot to the gun being furthest back; it's back where it
   * was about five times that after
   */
  readonly recoilTime: number;

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

  /** The gun as it's held, drawn from its SVG in `art/` (see `gunArt.ts`) */
  readonly art: GunArtName;

  readonly textures: {
    // Texture to use when the item's on the ground
    readonly pickup: ImageName;
    // Texture of the ejected shell casing
    readonly shellCasing: ImageName;
  };

  /**
   * Where the hands go and things happen, in the gun's own frame: meters from
   * the middle of its `art`, x toward the muzzle (see `GunPose`)
   */
  points: GunPoints;
  /** How its moving parts (groups of its `art` with those names) move at the end of their strokes */
  parts?: GunParts;
  /** Parts that go back and forward through their strokes with each shot, like a slide */
  cycles?: readonly GunPartName[];
  /** Whether they stay back once the last round's fired, until it's reloaded */
  locksBackWhenEmpty?: boolean;
  /** How it's reloaded and worked (see `GunAnimations`), which can move its parts too */
  animations: GunAnimations;
  /** What its reload animations show outside the gun, if anything */
  magazine?: MagazineStats;
  // Position of the sprite
  holdPosition: [number, number];
  // Angle that the shooter stands at while holding the gun
  stanceAngle: number;
  // How far to the shooter's right the gun is held, in meters: the shooter
  // turns in place, with the gun at their shoulder rather than in the middle
  sideOffset: number;
}

/**
 * How many times slower than the real thing bullets are, so they can be
 * seen: at real speeds a pistol round crosses the screen in a frame or two
 */
export const DEFAULT_BULLET_SLOWDOWN = 3;

/** The slowdown bullets are fired with. The arena changes it to try others. */
export const bulletSpeed = { slowdown: DEFAULT_BULLET_SLOWDOWN };

export type GunSounds = GunStats["sounds"];
export type GunSoundName = keyof GunSounds;

export enum FireMode {
  // One bullet per trigger pull
  SEMI_AUTO,
  // Constant bullets as long as trigger is down
  FULL_AUTO,
}

/** How the gun fires, for players: "Pump action", "Full auto" or "Semi auto" */
export function fireModeName(gun: GunStats): string {
  if (gun.ejectionType === EjectionType.PUMP) {
    return "Pump action";
  }
  return gun.fireMode === FireMode.FULL_AUTO ? "Full auto" : "Semi auto";
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
  ammoClass: "pistol",
  reloadStartTime: 0.1,
  reloadInsertTime: 1,
  reloadEndTime: 0.1,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  ejectionType: EjectionType.AUTOMATIC,
  bulletSpread: degToRad(0.5),

  bulletStats: defaultBulletStats,
  muzzleVelocity: 360,

  recoilAmount: degToRad(2),
  recoilRecovery: 5,
  recoilSlide: 0.05,
  recoilTime: 0.035,

  size: [1, 1],
  muzzleLength: 0.5,
  points: {
    grip: [0, 0],
    foregrip: [0, 0],
    magazine: [0, 0],
    action: [0, 0],
  },
  animations: TILT_ANIMATIONS,
  holdPosition: [0.3, 0],
  stanceAngle: 0,
  sideOffset: 0,

  art: "glock",
  textures: {
    pickup: "glockPickup",
    shellCasing: "pistolCasing",
  },

  sounds: {
    shoot: ["pistol2Shot1"],
    empty: ["dryFire1"],
    pickup: ["pistolCock1"],
    reload: ["ar15Reload1"],
    reloadInsert: [],
    reloadFinish: [],
    pump: ["shotgunPump1"],
  },
};
