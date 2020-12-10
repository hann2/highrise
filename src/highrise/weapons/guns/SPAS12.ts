import dryFire1 from "../../../../resources/audio/guns/misc/dry-fire-1.mp3";
import shellDrop2 from "../../../../resources/audio/guns/misc/shell-drop-2.mp3";
import shotgunLoadShell2 from "../../../../resources/audio/guns/shotgun/shotgun-load-shell-2.flac";
import shotgunPump1 from "../../../../resources/audio/guns/shotgun/shotgun-pump-1.mp3";
import shotgunShot2 from "../../../../resources/audio/guns/shotgun/shotgun-shot-2.mp3";
import shotgunCasing from "../../../../resources/images/shell-casings/shotgun-casing.png";
import rifle from "../../../../resources/images/weapons/rifle.png";
import spas12 from "../../../../resources/images/weapons/spas12.png";
import { degToRad } from "../../../core/util/MathUtil";
import {
  defaultGunStats,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";

export const SPAS12: GunStats = {
  ...defaultGunStats,

  name: "SPAS12",
  fireRate: 8,
  bulletDamage: 30,
  bulletsPerShot: 9,
  bulletSpread: degToRad(7),
  muzzleVelocity: 55,
  reloadingStyle: ReloadingStyle.INDIVIDUAL,
  fireMode: FireMode.SEMI_AUTO,
  reloadTime: 0.4,
  ammoCapacity: 8,

  textures: {
    ...defaultGunStats.textures,
    pickup: spas12,
    holding: rifle,
    shellCasing: shotgunCasing,
  },
  size: [1.1, 1.1],

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [shotgunShot2],
    empty: [dryFire1],
    pickup: [shotgunPump1],
    reload: [],
    reloadInsert: [shotgunLoadShell2],
    reloadFinish: [shotgunPump1],
    pump: [shotgunPump1],
    shellDrop: [shellDrop2],
  },
};
