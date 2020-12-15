import snd_shotgunCasingDrop1 from "../../../../resources/audio/guns/casing-drops/shotgun-casing-drop-1.mp3";
import snd_dryFire1 from "../../../../resources/audio/guns/misc/dry-fire-1.mp3";
import snd_shotgunLoadShell2 from "../../../../resources/audio/guns/shotgun/shotgun-load-shell-2.flac";
import snd_shotgunPump1 from "../../../../resources/audio/guns/shotgun/shotgun-pump-1.mp3";
import snd_shotgunShot3 from "../../../../resources/audio/guns/shotgun/shotgun-shot-3.mp3";
import img_shotgunCasing from "../../../../resources/images/shell-casings/shotgun-casing.png";
import img_ar15Hold from "../../../../resources/images/weapons/ar15-hold.png";
import img_remington870Hold from "../../../../resources/images/weapons/remington-870-hold.png";
import img_remingtonPickup from "../../../../resources/images/weapons/remington-pickup.png";
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
    pickup: img_remingtonPickup,
    holding: img_remington870Hold,
    shellCasing: img_shotgunCasing,
  },
  size: [1.1, 1.1],

  leftHandPosition: [0.65, -0.03],
  rightHandPosition: [0.3, 0],
  holdPosition: [0.58, 0],
  stanceAngle: degToRad(55),
  stanceOffset: [0, -0.25],
  muzzleLength: 1.1,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [snd_shotgunShot3],
    empty: [snd_dryFire1],
    pickup: [snd_shotgunPump1],
    reload: [],
    reloadInsert: [snd_shotgunLoadShell2],
    reloadFinish: [snd_shotgunPump1],
    pump: [snd_shotgunPump1],
    shellDrop: [snd_shotgunCasingDrop1],
  },
};
