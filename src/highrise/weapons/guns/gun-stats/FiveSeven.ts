import snd_dryFire2 from "../../../../../resources/audio/guns/misc/dry-fire-2.mp3";
import snd_m1911Reload1 from "../../../../../resources/audio/guns/pistol/m1911-reload-1.flac";
import snd_pistolCock1 from "../../../../../resources/audio/guns/pistol/pistol-cock-1.mp3";
import snd_pistolShot1 from "../../../../../resources/audio/guns/pistol/pistol-shot-1.mp3";
import img_pistolCasing from "../../../../../resources/images/shell-casings/pistol-casing.png";
import img_fiveSevenHold from "../../../../../resources/images/weapons/five-seven-hold.png";
import img_fiveSevenPickup from "../../../../../resources/images/weapons/five-seven-pickup.png";
import { degToRad } from "../../../../core/util/MathUtil";
import { NineMil } from "../BulletStats";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";

export const FiveSeven: GunStats = {
  ...defaultGunStats,

  name: "Five Seven",
  fireRate: 20,
  bulletStats: NineMil,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 0.8,
  ammoCapacity: 20,

  textures: {
    ...defaultGunStats.textures,
    pickup: img_fiveSevenPickup,
    holding: img_fiveSevenHold,
    shellCasing: img_pistolCasing,
  },
  size: [0.45, 0.45],

  leftHandPosition: [0.4, 0],
  rightHandPosition: [0.4, 0],
  holdPosition: [0.5, 0],
  muzzleLength: 0.6,

  laserSightColor: 0x00ff00,

  recoilAmount: degToRad(8),
  recoilRecovery: 10,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [snd_pistolShot1],
    empty: [snd_dryFire2],
    pickup: [snd_pistolCock1],
    reload: [snd_m1911Reload1],
  },
};
