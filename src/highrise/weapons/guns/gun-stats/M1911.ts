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

  art: "m1911",
  textures: {
    ...defaultGunStats.textures,
    pickup: "m1911Pickup",
    shellCasing: "pistolCasing",
  },
  // The pickup's square (bin/gun-art/guns/m1911.ts), so it lies on the floor at the same scale it's held at
  size: [0.224, 0.224],

  // Its art is drawn to scale with its pickup (bin/gun-art/guns/m1911.ts), smaller than the other guns'
  points: {
    grip: [-0.085, 0],
    foregrip: [-0.085, 0],
    magazine: [-0.085, 0],
    action: [-0.08, 0],
  },
  // The slide goes back with each shot, and stays back when it's empty. The hammer falls forward as it fires
  // (shorter from above, tipping up against the slide), and the slide cocks it again
  parts: {
    slide: { offset: [-0.045, 0], carries: ["action"] },
    hammer: { stretch: 0.55, pivot: [-0.0878, 0] },
  },
  cycles: ["slide", "hammer"],
  locksBackWhenEmpty: true,
  animations: PISTOL_ANIMATIONS,
  magazine: { texture: "pistolMagazine", length: 0.125 },
  holdPosition: [0.5, 0],
  muzzleLength: 0.11,

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
