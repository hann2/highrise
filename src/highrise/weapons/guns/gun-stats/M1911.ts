import { degToRad } from "../../../../core/util/MathUtil";
import { FourtyFive } from "../BulletStats";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";

export const M1911: GunStats = {
  ...defaultGunStats,

  name: "M1911",
  fireRate: 20,
  bulletStats: FourtyFive,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 0.8,
  ammoCapacity: 7,

  textures: {
    ...defaultGunStats.textures,
    pickup: "glockPickup",
    holding: "glockHold",
    shellCasing: "pistolCasing",
  },
  size: [0.45, 0.45],

  leftHandPosition: [0.4, 0],
  rightHandPosition: [0.4, 0],
  holdPosition: [0.5, 0],
  muzzleLength: 0.6,

  recoilAmount: degToRad(8),
  recoilRecovery: 10,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["pistol2Shot1"],
    empty: ["m1911DryFire"],
    pickup: ["m1911Pickup"],
    reload: ["m1911Reload1"],
  },
};
