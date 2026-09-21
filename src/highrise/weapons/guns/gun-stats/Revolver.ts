import { degToRad } from "../../../../core/util/MathUtil";
import { Magnum } from "../BulletStats";
import {
  defaultGunStats,
  EjectionType,
  GunStats,
  ReloadingStyle,
} from "../GunStats";

export const Revolver: GunStats = {
  ...defaultGunStats,

  name: "S&W Revolver",
  fireRate: 10,
  bulletStats: Magnum,
  reloadingStyle: ReloadingStyle.INDIVIDUAL,
  ejectionType: EjectionType.RELOAD,
  reloadInsertTime: 0.22,
  ammoCapacity: 6,

  textures: {
    ...defaultGunStats.textures,
    pickup: "magnumPickup",
    holding: "magnumHold",
    shellCasing: "pistolCasing",
  },
  size: [0.55, 0.55],

  recoilAmount: degToRad(8.5),
  recoilRecovery: 8,

  leftHandPosition: [0.4, 0],
  rightHandPosition: [0.4, 0],
  holdPosition: [0.55, 0],
  muzzleLength: 0.64,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["revolverShot3"],
    empty: ["revolverDryFire"],
    pickup: ["revolverPickup"],
    reload: ["revolverReloadStart"],
    reloadInsert: [
      "revolverInsertShell1",
      "revolverInsertShell2",
      "revolverInsertShell3",
    ],
    reloadFinish: ["revolverReloadFinish"],
  },
};
