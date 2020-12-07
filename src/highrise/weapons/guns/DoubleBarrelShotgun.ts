import dryFire1 from "../../../../resources/audio/guns/misc/dry-fire-1.mp3";
import shotgunLoadShell2 from "../../../../resources/audio/guns/shotgun/shotgun-load-shell-2.flac";
import shotgunPump1 from "../../../../resources/audio/guns/shotgun/shotgun-pump-1.mp3";
import shotgunShot1 from "../../../../resources/audio/guns/shotgun/shotgun-shot-1.mp3";
import doubleBarrelShotgun from "../../../../resources/images/weapons/double-barrel-shotgun.png";
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
  fireRate: 8,
  bulletDamage: 20,
  bulletsPerShot: 15,
  bulletSpread: degToRad(22),
  muzzleVelocity: 55,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  fireMode: FireMode.SEMI_AUTO,
  reloadTime: 1.2,
  ammoCapacity: 2,

  textures: { pickup: doubleBarrelShotgun },
  size: [1.1, 1.1],

  sounds: {
    shoot: [shotgunShot1],
    empty: [dryFire1],
    pickup: [shotgunPump1],
    reload: [shotgunLoadShell2],
  },
};
