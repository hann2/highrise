import snd_dryFire3 from "../../../../../resources/audio/guns/misc/dry-fire-3.mp3";
import snd_magazineLoad1 from "../../../../../resources/audio/guns/misc/magazine-load-1.mp3";
import snd_pistol2Shot1 from "../../../../../resources/audio/guns/pistol/pistol2-shot-1.mp3";
import snd_ar15Reload1 from "../../../../../resources/audio/guns/rifle/ar-15-reload-1.flac";
import snd_ar15ReloadEmpty from "../../../../../resources/audio/guns/rifle/ar-15-reload-empty.flac";
import img_pistolCasing from "../../../../../resources/images/shell-casings/pistol-casing.png";
import img_p90Hold from "../../../../../resources/images/weapons/p90-hold.png";
import img_p90Pickup from "../../../../../resources/images/weapons/p90-pickup.png";
import { degToRad } from "../../../../core/util/MathUtil";
import { NineMil } from "../BulletStats";
import {
  defaultGunStats,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";

export const P90: GunStats = {
  ...defaultGunStats,

  name: "P90",
  fireRate: 15,
  bulletStats: NineMil,
  fireMode: FireMode.FULL_AUTO,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 2.0,
  ammoCapacity: 50,

  textures: {
    ...defaultGunStats.textures,
    pickup: img_p90Pickup,
    holding: img_p90Hold,
    shellCasing: img_pistolCasing,
  },
  size: [1.0, 1.0],

  laserSightColor: 0x00ffff,
  recoilAmount: degToRad(2.5),
  recoilRecovery: 6,

  leftHandPosition: [0.45, -0.03],
  rightHandPosition: [0.2, 0],
  holdPosition: [0.35, 0],
  stanceAngle: degToRad(50),
  stanceOffset: [0, -0.2],
  muzzleLength: 0.7,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [snd_pistol2Shot1],
    empty: [snd_dryFire3],
    pickup: [snd_magazineLoad1],
    reload: [snd_ar15Reload1, snd_ar15ReloadEmpty],
  },
};
