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
  // 5.7x28mm from a 4.8" barrel
  muzzleVelocity: 650,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 0.8,
  ammoCapacity: 20,

  art: "fiveSeven",
  textures: {
    ...defaultGunStats.textures,
    pickup: "fiveSevenPickup",
    shellCasing: "pistolCasing",
  },
  size: [0.218, 0.218],

  // From its top view (bin/gun-art/guns/five-seven.ts), at true scale: the
  // hands round the grip, the other racking it by the finger pockets
  points: {
    grip: [-0.06, 0],
    foregrip: [-0.06, 0],
    magazine: [-0.06, 0],
    action: [-0.095, 0],
  },
  // The slide goes back with each shot, and stays back when it's empty
  parts: { slide: { offset: [-0.045, 0], carries: ["action"] } },
  cycles: ["slide"],
  locksBackWhenEmpty: true,
  animations: PISTOL_ANIMATIONS,
  magazine: { texture: "pistolMagazine", length: 0.125 },
  // The hands where every pistol's are (0.415 m out, as the M1911's)
  holdPosition: [0.475, 0],
  muzzleLength: 0.104,

  laserSightColor: 0x00ff00,

  recoilAmount: degToRad(8),
  recoilRecovery: 10,
  recoilSlide: 0.045,
  recoilTime: 0.028,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: ["pistolShot1"],
    empty: ["dryFire2"],
    pickup: ["pistolCock1"],
    reload: ["m1911Reload1"],
  },
};
