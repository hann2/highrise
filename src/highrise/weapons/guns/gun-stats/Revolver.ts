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
    pickup: "revolverPickup",
    shellCasing: "pistolCasing",
  },
  size: [0.38, 0.38],

  recoilAmount: degToRad(8.5),
  recoilRecovery: 8,
  recoilSlide: 0.07,
  recoilTime: 0.035,

  // From its top view (bin/gun-art/guns/revolver.ts), at true scale: the hand
  // round the middle of the grip, the rounds into the cylinder's back face,
  // the thumb on the hammer's spur
  points: {
    grip: [-0.13, 0],
    foregrip: [-0.13, 0],
    magazine: [-0.075, 0],
    action: [-0.118, 0],
  },
  // The cylinder swings out to the left to load, on its crane, just clear of
  // the frame, with the chamber the hand loads. Each shot, the hammer's cocked
  // (tipping back about its stud: from above its top comes back along the
  // channel and it gets shorter about the spur's tip) and falls
  parts: {
    cylinder: { offset: [0, -0.045], carries: ["magazine"] },
    hammer: { offset: [-0.0016, 0], stretch: 0.58, pivot: [-0.127, 0] },
  },
  cycles: ["hammer"],
  animations: REVOLVER_ANIMATIONS,
  magazine: { texture: "revolverRound", length: 0.04 },
  holdPosition: [0.55, 0],
  muzzleLength: 0.18,

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
