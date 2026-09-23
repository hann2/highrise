import { degToRad } from "../../../../core/util/MathUtil";
import { SevenSixTwo } from "../BulletStats";
import {
  defaultGunStats,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";

export const AK47: GunStats = {
  ...defaultGunStats,

  name: "AK-47",
  fireRate: 10,
  bulletStats: SevenSixTwo,
  fireMode: FireMode.FULL_AUTO,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 1.8,
  ammoCapacity: 30,
  ammoClass: "rifle",

  textures: {
    ...defaultGunStats.textures,
    pickup: "ak47Pickup",
    holding: "ak47Hold",
    shellCasing: "rifleCasing",
  },
  size: [1.4, 1.4],

  recoilAmount: degToRad(4),
  recoilRecovery: 3.1,

  leftHandPosition: [0.65, -0.03],
  rightHandPosition: [0.32, 0],
  holdPosition: [0.55, 0],
  stanceAngle: degToRad(55),
  stanceOffset: [0, -0.25],
  muzzleLength: 1.1,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["rifle2Shot1"],
    empty: ["dryFire3"],
    pickup: ["magazineLoad1"],
    reload: ["ar15Reload1", "ar15ReloadEmpty"],
  },
};
