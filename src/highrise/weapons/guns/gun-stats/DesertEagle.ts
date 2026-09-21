import { degToRad } from "../../../../core/util/MathUtil";
import { Magnum } from "../BulletStats";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";

export const DesertEagle: GunStats = {
  ...defaultGunStats,

  name: "Desert Eagle",
  fireRate: 10,
  bulletStats: Magnum,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 0.8,
  ammoCapacity: 7,

  textures: {
    ...defaultGunStats.textures,
    pickup: "desertEaglePickup",
    holding: "desertEagleHold",
    shellCasing: "rifleCasing",
  },
  size: [0.55, 0.55],

  recoilAmount: degToRad(6),
  recoilRecovery: 4,

  leftHandPosition: [0.4, 0],
  rightHandPosition: [0.4, 0],
  holdPosition: [0.52, 0],
  muzzleLength: 0.62,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["deagleShot1", "deagleShot2"],
    empty: ["dryFire2"],
    pickup: ["pistolCock1"],
    reload: ["m1911Reload1"],
  },
};
