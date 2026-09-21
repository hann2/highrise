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
  fireRate: 16,
  bulletStats: NineMil,
  fireMode: FireMode.FULL_AUTO,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 2.0,
  ammoCapacity: 50,

  textures: {
    ...defaultGunStats.textures,
    pickup: "p90Pickup",
    holding: "p90Hold",
    shellCasing: "pistolCasing",
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
    shoot: ["pistol2Shot1"],
    empty: ["dryFire3"],
    pickup: ["magazineLoad1"],
    reload: ["ar15Reload1", "ar15ReloadEmpty"],
  },
};
