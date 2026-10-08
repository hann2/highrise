import { degToRad } from "../../../../core/util/MathUtil";
import { NineMil } from "../BulletStats";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";
import { PISTOL_ANIMATIONS } from "../gun-animations/pistolReload";
import { GLOCK_FLASH } from "../muzzleFlashes";

export const Glock: GunStats = {
  ...defaultGunStats,

  name: "Glock",
  flash: GLOCK_FLASH,
  fireRate: 20,
  bulletStats: NineMil,
  // 9mm from a 4.5" barrel
  muzzleVelocity: 360,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 0.8,
  ammoCapacity: 15,

  art: "glock",
  textures: {
    ...defaultGunStats.textures,
    pickup: "glockPickup",
    shellCasing: "pistolCasing",
  },
  size: [0.192, 0.192],

  points: {
    grip: [-0.1, 0],
    foregrip: [-0.1, 0],
    magazine: [-0.1, 0],
    action: [-0.12, 0],
  },
  // The slide goes back with each shot, and stays back when it's empty
  parts: { slide: { offset: [-0.06, 0], carries: ["action"] } },
  cycles: ["slide"],
  locksBackWhenEmpty: true,
  animations: PISTOL_ANIMATIONS,
  magazine: { texture: "pistolMagazine", length: 0.125 },
  holdPosition: [0.5, 0],
  muzzleLength: 0.28,

  recoilAmount: degToRad(8),
  recoilRecovery: 10,
  recoilSlide: 0.05,
  recoilTime: 0.03,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["pistolShot2"],
    empty: ["dryFire2"],
    pickup: ["pistolCock1"],
    reload: ["m1911Reload1"],
  },
};
