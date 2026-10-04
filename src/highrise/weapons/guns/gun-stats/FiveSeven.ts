import { degToRad } from "../../../../core/util/MathUtil";
import { NineMil } from "../BulletStats";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";
import { PISTOL_ANIMATIONS } from "../gun-animations/pistolReload";
import { FIVE_SEVEN_FLASH } from "../muzzleFlashes";

export const FiveSeven: GunStats = {
  ...defaultGunStats,

  name: "Five Seven",
  flash: FIVE_SEVEN_FLASH,
  fireRate: 20,
  bulletStats: NineMil,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 0.8,
  ammoCapacity: 20,

  textures: {
    ...defaultGunStats.textures,
    pickup: "fiveSevenPickup",
    holding: "fiveSevenHold",
    shellCasing: "pistolCasing",
  },
  size: [0.45, 0.45],

  points: {
    grip: [-0.1, 0],
    foregrip: [-0.1, 0],
    magazine: [-0.1, 0],
    action: [-0.115, 0],
  },
  animations: PISTOL_ANIMATIONS,
  magazine: { texture: "pistolMagazine", length: 0.125 },
  holdPosition: [0.5, 0],
  muzzleLength: 0.26,

  laserSightColor: 0x00ff00,

  recoilAmount: degToRad(8),
  recoilRecovery: 10,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["pistolShot1"],
    empty: ["dryFire2"],
    pickup: ["pistolCock1"],
    reload: ["m1911Reload1"],
  },
};
