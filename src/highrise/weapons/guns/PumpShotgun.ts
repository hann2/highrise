import dryFire1 from "../../../../resources/audio/guns/misc/dry-fire-1.mp3";
import shotgunLoadShell2 from "../../../../resources/audio/guns/shotgun/shotgun-load-shell-2.flac";
import shotgunPump1 from "../../../../resources/audio/guns/shotgun/shotgun-pump-1.mp3";
import shotgunShot3 from "../../../../resources/audio/guns/shotgun/shotgun-shot-3.mp3";
import remington from "../../../../resources/images/weapons/remington.png";
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
  bulletSpread: degToRad(10),
  muzzleVelocity: 55,
  reloadingStyle: ReloadingStyle.INDIVIDUAL,
  fireMode: FireMode.PUMP,
  reloadTime: 0.5,
  ammoCapacity: 7,

  textures: { pickup: remington },
  size: [1.1, 1.1],

  sounds: {
    shoot: [shotgunShot3],
    empty: [dryFire1],
    pickup: [shotgunPump1],
    reload: [],
    reloadInsert: [shotgunLoadShell2],
    reloadFinish: [shotgunPump1],
    pump: [shotgunPump1],
  },
};
