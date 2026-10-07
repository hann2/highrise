import { degToRad } from "../../../../core/util/MathUtil";
import { FourtyFive } from "../BulletStats";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";
import { PISTOL_ANIMATIONS } from "../gun-animations/pistolReload";
import { M1911_FLASH } from "../muzzleFlashes";

export const M1911: GunStats = {
  ...defaultGunStats,

  name: "M1911",
  flash: M1911_FLASH,
  fireRate: 20,
  bulletStats: FourtyFive,
  // .45 ACP from a 5" barrel
  muzzleVelocity: 255,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 0.8,
  ammoCapacity: 7,

  art: "glock",
  textures: {
    ...defaultGunStats.textures,
    pickup: "glockPickup",
    shellCasing: "pistolCasing",
  },
  size: [0.45, 0.45],

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
  recoilSlide: 0.06,
  recoilTime: 0.032,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["pistol2Shot1"],
    empty: ["m1911DryFire"],
    pickup: ["m1911Pickup"],
    reload: ["m1911Reload1"],
  },
};
