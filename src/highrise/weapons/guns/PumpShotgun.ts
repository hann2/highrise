import snd_shotgunCasingDrop1 from "../../../../resources/audio/guns/casing-drops/shotgun-casing-drop-1.mp3";
import snd_dryFire1 from "../../../../resources/audio/guns/misc/dry-fire-1.mp3";
import snd_shotgunLoadShell2 from "../../../../resources/audio/guns/shotgun/shotgun-load-shell-2.flac";
import snd_shotgunPump1 from "../../../../resources/audio/guns/shotgun/shotgun-pump-1.mp3";
import snd_shotgunShot3 from "../../../../resources/audio/guns/shotgun/shotgun-shot-3.mp3";
import img_shotgunCasing from "../../../../resources/images/shell-casings/shotgun-casing.png";
import img_remington from "../../../../resources/images/weapons/remington.png";
import img_rifle from "../../../../resources/images/weapons/rifle.png";
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
    pickup: img_remington,
    holding: img_rifle,
    shellCasing: img_shotgunCasing,
  },
  size: [1.1, 1.1],

  leftHandPosition: [0.45, 0],
  rightHandPosition: [0.2, 0],

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
