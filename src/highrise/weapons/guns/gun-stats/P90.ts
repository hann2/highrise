import { degToRad } from "../../../../core/util/MathUtil";
import { NineMil } from "../BulletStats";
import {
  defaultGunStats,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";
import { rifleAnimations } from "../gun-animations/rifleReload";
import { P90_FLASH } from "../muzzleFlashes";

export const P90: GunStats = {
  ...defaultGunStats,

  name: "P90",
  flash: P90_FLASH,
  fireRate: 16,
  bulletStats: NineMil,
  // 5.7x28mm from a 10.4" barrel
  muzzleVelocity: 715,
  fireMode: FireMode.FULL_AUTO,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 2.0,
  ammoCapacity: 50,
  ammoClass: "rifle",

  art: "p90",
  textures: {
    ...defaultGunStats.textures,
    pickup: "p90Pickup",
    shellCasing: "pistolCasing",
  },
  size: [0.51, 0.51],

  laserSightColor: 0x00ffff,
  recoilAmount: degToRad(2.5),
  recoilRecovery: 6,
  recoilSlide: 0.025,
  recoilTime: 0.028,

  points: {
    grip: [-0.15, 0],
    foregrip: [0.1, -0.03],
    magazine: [-0.03, 0],
    // The charging handle, on the left
    action: [0.197, -0.05],
  },
  // Pulled back to chamber a round from empty (it doesn't move when firing).
  // The magazine on top is hidden while it's out of the gun
  parts: {
    "charging-handle": { offset: [-0.09, 0], carries: ["action"] },
  },
  // Fed from the back of the magazine, so they slide back as it empties, half
  // the gap between rounds in a row at a time (they're in two staggered rows)
  rounds: { count: 50, travel: -0.325 },
  animations: rifleAnimations({ magazineOnTop: true }),
  magazine: "art",
  holdPosition: [0.35, 0],
  stanceAngle: degToRad(50),
  sideOffset: 0.2,
  muzzleLength: 0.7,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["pistol2Shot1"],
    empty: ["dryFire3"],
    pickup: ["magazineLoad1"],
    reload: ["ar15Reload1", "ar15ReloadEmpty"],
  },
};
