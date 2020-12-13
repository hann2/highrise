import dryFire1 from "../../../../resources/audio/guns/misc/dry-fire-1.mp3";
import shellDrop2 from "../../../../resources/audio/guns/misc/shell-drop-2.mp3";
import shotgunLoadShell2 from "../../../../resources/audio/guns/shotgun/shotgun-load-shell-2.flac";
import shotgunPump1 from "../../../../resources/audio/guns/shotgun/shotgun-pump-1.mp3";
import shotgunShot1 from "../../../../resources/audio/guns/shotgun/shotgun-shot-1.mp3";
import shotgunCasing from "../../../../resources/images/shell-casings/shotgun-casing.png";
import doubleBarrelShotgun from "../../../../resources/images/weapons/double-barrel-shotgun.png";
import rifle from "../../../../resources/images/weapons/rifle.png";
import { degToRad } from "../../../core/util/MathUtil";
import {
  defaultGunStats,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";

export const DoubleBarrelShotgun: GunStats = {
  ...defaultGunStats,

  name: "Sawn Off Shotgun",
  fireRate: 10,
  bulletDamage: 20,
  bulletsPerShot: 15,
  bulletSpread: degToRad(20),
  muzzleVelocity: 55,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  fireMode: FireMode.SEMI_AUTO,
  reloadTime: 1.2,
  ammoCapacity: 2,

  textures: {
    ...defaultGunStats.textures,
    pickup: doubleBarrelShotgun,
    holding: rifle,
    shellCasing: shotgunCasing,
  },
  size: [1.1, 1.1],

  leftHandPosition: [0.35, 0],
  rightHandPosition: [0.2, 0],

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [shotgunShot1],
    empty: [dryFire1],
    pickup: [shotgunPump1],
    reload: [shotgunLoadShell2],
    shellDrop: [shellDrop2],
  },
};
