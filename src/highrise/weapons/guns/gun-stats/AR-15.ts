import { degToRad } from "../../../../core/util/MathUtil";
import { FiveFiveSix } from "../BulletStats";
import {
  defaultGunStats,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";
import { rifleAnimations } from "../gun-animations/rifleReload";
import { AR15_FLASH } from "../muzzleFlashes";

export const AR15: GunStats = {
  ...defaultGunStats,

  name: "AR-15",
  flash: AR15_FLASH,
  fireRate: 12,
  bulletStats: FiveFiveSix,
  // 5.56mm from a 16" barrel
  muzzleVelocity: 930,
  fireMode: FireMode.SEMI_AUTO,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 1.5,
  ammoCapacity: 30,
  ammoClass: "rifle",

  art: "ar15",
  textures: {
    ...defaultGunStats.textures,
    pickup: "ar15Pickup",
    shellCasing: "rifleCasing",
  },
  size: [0.84, 0.84],

  laserSightColor: 0xff0000,
  recoilAmount: degToRad(2),
  recoilRecovery: 5,
  recoilSlide: 0.03,
  recoilTime: 0.03,

  points: {
    grip: [-0.152, 0],
    foregrip: [0.171, -0.021],
    magazine: [-0.02, 0],
    action: [-0.163, 0],
  },
  // Pulled back to chamber a round from empty (it doesn't move when firing)
  parts: {
    "charging-handle": { offset: [-0.076, 0], carries: ["action"] },
  },
  animations: rifleAnimations(),
  magazine: { texture: "rifleMagazine", length: 0.19 },
  holdPosition: [0.472, 0],
  stanceAngle: degToRad(55),
  sideOffset: 0.25,
  muzzleLength: 0.391,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["rifleShot1", "rifleShot2", "rifleShot3"],
    empty: ["dryFire3"],
    pickup: ["magazineLoad1"],
    reload: ["ar15Reload1", "ar15ReloadEmpty"],
  },
};
