import { degToRad } from "../../../../core/util/MathUtil";
import { Magnum } from "../BulletStats";
import {
  defaultGunStats,
  EjectionType,
  GunStats,
  ReloadingStyle,
} from "../GunStats";
import { REVOLVER_ANIMATIONS } from "../gun-animations/revolverReload";

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

  points: {
    grip: [-0.15, 0],
    foregrip: [-0.15, 0],
    magazine: [-0.04, 0],
    action: [-0.15, 0],
  },
  animations: REVOLVER_ANIMATIONS,
  magazine: { texture: "revolverRound", length: 0.04 },
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
