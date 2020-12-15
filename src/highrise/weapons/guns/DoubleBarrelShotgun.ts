import snd_shotgunCasingDrop1 from "../../../../resources/audio/guns/casing-drops/shotgun-casing-drop-1.mp3";
import snd_dryFire1 from "../../../../resources/audio/guns/misc/dry-fire-1.mp3";
import snd_shotgunLoadShell2 from "../../../../resources/audio/guns/shotgun/shotgun-load-shell-2.flac";
import snd_shotgunPump1 from "../../../../resources/audio/guns/shotgun/shotgun-pump-1.mp3";
import snd_shotgunShot1 from "../../../../resources/audio/guns/shotgun/shotgun-shot-1.mp3";
import img_shotgunCasing from "../../../../resources/images/shell-casings/shotgun-casing.png";
import img_ak47Hold from "../../../../resources/images/weapons/ak-47-hold.png";
import img_ar15Hold from "../../../../resources/images/weapons/ar15-hold.png";
import img_doubleBarrelShotgunHold from "../../../../resources/images/weapons/double-barrel-shotgun-hold.png";
import img_doubleBarrelShotgunPickup from "../../../../resources/images/weapons/double-barrel-shotgun-pickup.png";
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
    pickup: img_doubleBarrelShotgunPickup,
    holding: img_doubleBarrelShotgunHold,
    shellCasing: img_shotgunCasing,
  },
  size: [1.1, 1.1],

  leftHandPosition: [0.45, -0.03],
  rightHandPosition: [0.3, 0],
  holdPosition: [0.4, 0],
  stanceAngle: degToRad(35),
  stanceOffset: [0, -0.2],

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [snd_shotgunShot1],
    empty: [snd_dryFire1],
    pickup: [snd_shotgunPump1],
    reload: [snd_shotgunLoadShell2],
    shellDrop: [snd_shotgunCasingDrop1],
  },
};
