import { SoundName } from "../../../core/resources/sounds";
import { V2d } from "../../../core/Vector";

// Stats that make a gun unique

export interface GunStats {
  // Friendly name for the gun
  name: string;
  // Maximum rounds per second
  fireRate: number;
  // meters/second of bullet when fired
  muzzleVelocity: number;
  // base damage the bullet does
  bulletDamage: number;
  // Distance from the shooter that the bullet is created
  muzzleLength: number;
  //
  fireMode: FireMode;
  // Maximum number of rounds in the gun
  ammoCapacity: number;

  reloadingStyle: ReloadingStyle;

  reloadTime: number;

  // Sounds that play for various things
  sounds: {
    shoot: SoundName[];
    empty: SoundName[];
    pickup: SoundName[];
    reload: SoundName[];
    pump?: SoundName[];
  };

  // Texture to use when the item's on the ground
  pickupTexture?: string;
  // Physical size of the weapon
  size: [number, number];
}

export enum FireMode {
  // One bullet per trigger pull
  SEMI_AUTO,
  // Constant bullets as long as trigger is down
  FULL_AUTO,
  // 3 bullets per trigger pull
  BURST,
  // Pumps after every shot
  PUMP,
}

export enum ReloadingStyle {
  // One reload action brings the gun back to full ammo
  MAGAZINE,
  // Rounds are loaded one-at-a-time
  INDIVIDUAL,
}
