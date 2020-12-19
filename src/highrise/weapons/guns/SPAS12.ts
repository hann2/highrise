import snd_shotgunCasingDrop1 from "../../../../resources/audio/guns/casing-drops/shotgun-casing-drop-1.mp3";
import snd_dryFire1 from "../../../../resources/audio/guns/misc/dry-fire-1.mp3";
import snd_shotgunLoadShell2 from "../../../../resources/audio/guns/shotgun/shotgun-load-shell-2.flac";
import snd_shotgunPump1 from "../../../../resources/audio/guns/shotgun/shotgun-pump-1.mp3";
import snd_shotgunShot2 from "../../../../resources/audio/guns/shotgun/shotgun-shot-2.mp3";
import img_shotgunCasing from "../../../../resources/images/shell-casings/shotgun-casing.png";
import img_ar15Hold from "../../../../resources/images/weapons/ar15-hold.png";
import img_spas12Hold from "../../../../resources/images/weapons/spas12-hold.png";
import img_spas12Pickup from "../../../../resources/images/weapons/spas12-pickup.png";
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
  reloadInsertTime: 0.4,
  ammoCapacity: 8,

  textures: {
    ...defaultGunStats.textures,
    pickup: img_spas12Pickup,
    holding: img_spas12Hold,
    shellCasing: img_shotgunCasing,
  },
  size: [1.1, 1.1],

  leftHandPosition: [0.65, -0.03],
  rightHandPosition: [0.3, 0],
  holdPosition: [0.6, 0],
  stanceAngle: degToRad(55),
  stanceOffset: [0, -0.25],
  muzzleLength: 1.2,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [snd_shotgunShot2],
    empty: [snd_dryFire1],
    pickup: [snd_shotgunPump1],
    reload: [],
    reloadInsert: [snd_shotgunLoadShell2],
    reloadFinish: [snd_shotgunPump1],
    pump: [snd_shotgunPump1],
    shellDrop: [snd_shotgunCasingDrop1],
  },
};
