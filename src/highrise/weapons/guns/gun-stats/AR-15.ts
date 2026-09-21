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
    pickup: "ar15Pickup",
    holding: "ar15Hold",
    shellCasing: "rifleCasing",
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
    shoot: ["rifleShot1", "rifleShot2", "rifleShot3"],
    empty: ["dryFire3"],
    pickup: ["magazineLoad1"],
    reload: ["ar15Reload1", "ar15ReloadEmpty"],
  },
};
