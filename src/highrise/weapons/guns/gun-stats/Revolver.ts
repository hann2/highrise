import { degToRad } from "../../../../core/util/MathUtil";
import { Magnum } from "../BulletStats";
import {
  defaultGunStats,
  EjectionType,
  GunStats,
  ReloadingStyle,
} from "../GunStats";
import { REVOLVER_ANIMATIONS } from "../gun-animations/revolverReload";
import { REVOLVER_FLASH } from "../muzzleFlashes";

export const Revolver: GunStats = {
  ...defaultGunStats,

  name: "S&W Revolver",
  flash: REVOLVER_FLASH,
  fireRate: 10,
  bulletStats: Magnum,
  // .44 Magnum from a 6.5" barrel
  muzzleVelocity: 430,
  reloadingStyle: ReloadingStyle.INDIVIDUAL,
  ejectionType: EjectionType.RELOAD,
  reloadInsertTime: 0.22,
  ammoCapacity: 6,

  art: "revolver",
  textures: {
    ...defaultGunStats.textures,
    pickup: "magnumPickup",
    shellCasing: "pistolCasing",
  },
  size: [0.55, 0.55],

  recoilAmount: degToRad(8.5),
  recoilRecovery: 8,
  recoilSlide: 0.07,
  recoilTime: 0.035,

  points: {
    grip: [-0.15, 0],
    foregrip: [-0.15, 0],
    magazine: [-0.04, 0],
    action: [-0.15, 0],
  },
  // The cylinder swings out to the left to load, with the chamber the hand
  // loads. Each shot, the hammer's cocked (tipping up and back over the grip,
  // which from above is back and longer) and falls
  parts: {
    cylinder: { offset: [0, -0.062], carries: ["magazine"] },
    hammer: { offset: [-0.016, 0], stretch: 1.2, pivot: [-0.112, 0] },
  },
  cycles: ["hammer"],
  animations: REVOLVER_ANIMATIONS,
  magazine: { texture: "revolverRound", length: 0.04 },
  holdPosition: [0.55, 0],
  muzzleLength: 0.35,

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
