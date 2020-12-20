import snd_dryFire3 from "../../../../../resources/audio/guns/misc/dry-fire-3.mp3";
import snd_magazineLoad1 from "../../../../../resources/audio/guns/misc/magazine-load-1.mp3";
import snd_ar15Reload1 from "../../../../../resources/audio/guns/rifle/ar-15-reload-1.flac";
import snd_ar15ReloadEmpty from "../../../../../resources/audio/guns/rifle/ar-15-reload-empty.flac";
import snd_rifleShot1 from "../../../../../resources/audio/guns/rifle/rifle-shot-1.mp3";
import snd_rifleShot2 from "../../../../../resources/audio/guns/rifle/rifle-shot-2.mp3";
import snd_rifleShot3 from "../../../../../resources/audio/guns/rifle/rifle-shot-3.mp3";
import img_rifleCasing from "../../../../../resources/images/shell-casings/rifle-casing.png";
import img_ar15Pickup from "../../../../../resources/images/weapons/ar-15-pickup.png";
import img_ar15Hold from "../../../../../resources/images/weapons/ar15-hold.png";
import { degToRad } from "../../../../core/util/MathUtil";
import { FiveFiveSix } from "../BulletStats";
import {
  defaultGunStats,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";

export const AR15: GunStats = {
  ...defaultGunStats,

  name: "AR-15",
  fireRate: 12,
  bulletStats: FiveFiveSix,
  fireMode: FireMode.SEMI_AUTO,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 1.5,
  ammoCapacity: 30,

  textures: {
    ...defaultGunStats.textures,
    pickup: img_ar15Pickup,
    holding: img_ar15Hold,
    shellCasing: img_rifleCasing,
  },
  size: [0.8, 0.4],

  laserSightColor: 0xff0000,
  recoilAmount: degToRad(2),
  recoilRecovery: 5,

  leftHandPosition: [0.65, -0.03],
  rightHandPosition: [0.32, 0],
  holdPosition: [0.55, 0],
  stanceAngle: degToRad(55),
  stanceOffset: [0, -0.25],
  muzzleLength: 1.1,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [snd_rifleShot1, snd_rifleShot2, snd_rifleShot3],
    empty: [snd_dryFire3],
    pickup: [snd_magazineLoad1],
    reload: [snd_ar15Reload1, snd_ar15ReloadEmpty],
  },
};
