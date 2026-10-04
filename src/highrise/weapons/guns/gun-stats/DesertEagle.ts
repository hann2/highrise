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
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 0.8,
  ammoCapacity: 7,

  textures: {
    ...defaultGunStats.textures,
    pickup: "desertEaglePickup",
    holding: "desertEagleHold",
    shellCasing: "rifleCasing",
  },
  size: [0.55, 0.55],

  recoilAmount: degToRad(6),
  recoilRecovery: 4,

  points: {
    grip: [-0.12, 0],
    foregrip: [-0.12, 0],
    magazine: [-0.12, 0],
    action: [-0.15, 0],
  },
  animations: PISTOL_ANIMATIONS,
  magazine: { texture: "pistolMagazine", length: 0.14 },
  holdPosition: [0.52, 0],
  muzzleLength: 0.35,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["deagleShot1", "deagleShot2"],
    empty: ["dryFire2"],
    pickup: ["pistolCock1"],
    reload: ["m1911Reload1"],
  },
};
