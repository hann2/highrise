import snd_dryFire1 from "../../../../../resources/audio/guns/misc/dry-fire-1.mp3";
import snd_shotgunLoadShell2 from "../../../../../resources/audio/guns/shotgun/shotgun-load-shell-2.flac";
import snd_shotgunPump1 from "../../../../../resources/audio/guns/shotgun/shotgun-pump-1.mp3";
import snd_shotgunShot3 from "../../../../../resources/audio/guns/shotgun/shotgun-shot-3.mp3";
import img_shotgunCasing from "../../../../../resources/images/shell-casings/shotgun-casing.png";
import img_remington870Hold from "../../../../../resources/images/weapons/remington-870-hold.png";
import img_remingtonPickup from "../../../../../resources/images/weapons/remington-pickup.png";
import { degToRad } from "../../../../core/util/MathUtil";
import { TwelveGuageBuckshot } from "../BulletStats";
import {
  defaultGunStats,
  EjectionType,
  GunStats,
  ReloadingStyle,
} from "../GunStats";

export const PumpShotgun: GunStats = {
  ...defaultGunStats,

  name: "Remington Shotgun",
  fireRate: 2,
  bulletStats: TwelveGuageBuckshot,
  bulletSpread: degToRad(9),
  reloadingStyle: ReloadingStyle.INDIVIDUAL,
  ejectionType: EjectionType.PUMP,
  reloadInsertTime: 0.4,
  ammoCapacity: 7,

  textures: {
    ...defaultGunStats.textures,
    pickup: img_remingtonPickup,
    holding: img_remington870Hold,
    shellCasing: img_shotgunCasing,
  },
  size: [1.1, 1.1],
  recoilAmount: degToRad(8),
  recoilRecovery: 2,

  leftHandPosition: [0.7, -0.03],
  rightHandPosition: [0.3, 0],
  holdPosition: [0.5, 0],
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
  },
};
