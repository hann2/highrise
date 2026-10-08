import { degToRad } from "../../../../core/util/MathUtil";
import { Magnum } from "../BulletStats";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";
import { PISTOL_ANIMATIONS } from "../gun-animations/pistolReload";
import { DESERT_EAGLE_FLASH } from "../muzzleFlashes";

export const DesertEagle: GunStats = {
  ...defaultGunStats,

  name: "Desert Eagle",
  flash: DESERT_EAGLE_FLASH,
  fireRate: 10,
  bulletStats: Magnum,
  // .50 AE from a 6" barrel
  muzzleVelocity: 450,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 0.8,
  ammoCapacity: 7,

  art: "desertEagle",
  textures: {
    ...defaultGunStats.textures,
    pickup: "desertEaglePickup",
    shellCasing: "rifleCasing",
  },
  size: [0.288, 0.288],

  recoilAmount: degToRad(6),
  recoilRecovery: 4,
  recoilSlide: 0.09,
  recoilTime: 0.04,

  // From its top view (bin/gun-art/guns/desert-eagle.ts), at true scale: the
  // hands round the top of the grip, the other racking it by the serrations
  points: {
    grip: [-0.073, 0],
    foregrip: [-0.073, 0],
    magazine: [-0.073, 0],
    action: [-0.07, 0],
  },
  // The slide goes back with each shot (clearing a .50 AE round), and stays
  // back when it's empty; the hammer, drawn cocked, falls each shot (tipping up
  // against the slide's back, shorter from above) and is cocked again
  parts: {
    slide: { offset: [-0.048, 0], carries: ["action"] },
    hammer: { stretch: 0.3, pivot: [-0.1015, 0] },
  },
  cycles: ["slide", "hammer"],
  locksBackWhenEmpty: true,
  animations: PISTOL_ANIMATIONS,
  magazine: { texture: "pistolMagazine", length: 0.14 },
  // The hands where every pistol's are (0.415 m out, as the M1911's)
  holdPosition: [0.488, 0],
  muzzleLength: 0.1365,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["deagleShot1", "deagleShot2"],
    empty: ["dryFire2"],
    pickup: ["pistolCock1"],
    reload: ["m1911Reload1"],
  },
};
