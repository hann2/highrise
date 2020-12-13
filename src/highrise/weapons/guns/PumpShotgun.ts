import dryFire1 from "../../../../resources/audio/guns/misc/dry-fire-1.mp3";
import shellDrop2 from "../../../../resources/audio/guns/misc/shell-drop-2.mp3";
import shotgunLoadShell2 from "../../../../resources/audio/guns/shotgun/shotgun-load-shell-2.flac";
import shotgunPump1 from "../../../../resources/audio/guns/shotgun/shotgun-pump-1.mp3";
import shotgunShot3 from "../../../../resources/audio/guns/shotgun/shotgun-shot-3.mp3";
import shotgunCasing from "../../../../resources/images/shell-casings/shotgun-casing.png";
import remington from "../../../../resources/images/weapons/remington.png";
import rifle from "../../../../resources/images/weapons/rifle.png";
import { degToRad } from "../../../core/util/MathUtil";
import {
  defaultGunStats,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";

export const PumpShotgun: GunStats = {
  ...defaultGunStats,

  name: "Remington Shotgun",
  fireRate: 2,
  bulletDamage: 30,
  bulletsPerShot: 9,
  bulletSpread: degToRad(9),
  muzzleVelocity: 55,
  reloadingStyle: ReloadingStyle.INDIVIDUAL,
  fireMode: FireMode.PUMP,
  reloadTime: 0.5,
  ammoCapacity: 7,

  textures: {
    ...defaultGunStats.textures,
    pickup: remington,
    holding: rifle,
    shellCasing: shotgunCasing,
  },
  size: [1.1, 1.1],

  leftHandPosition: [0.45, 0],
  rightHandPosition: [0.2, 0],

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [shotgunShot3],
    empty: [dryFire1],
    pickup: [shotgunPump1],
    reload: [],
    reloadInsert: [shotgunLoadShell2],
    reloadFinish: [shotgunPump1],
    pump: [shotgunPump1],
    shellDrop: [shellDrop2],
  },
};
