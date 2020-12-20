import snd_casingDropBoard1 from "../../../../../resources/audio/guns/casing-drops/casing-drop-board-1.flac";
import snd_casingDropBoard2 from "../../../../../resources/audio/guns/casing-drops/casing-drop-board-2.flac";
import snd_casingDropBoard3 from "../../../../../resources/audio/guns/casing-drops/casing-drop-board-3.flac";
import snd_casingDropBoard4 from "../../../../../resources/audio/guns/casing-drops/casing-drop-board-4.flac";
import snd_dryFire2 from "../../../../../resources/audio/guns/misc/dry-fire-2.mp3";
import snd_m1911Reload1 from "../../../../../resources/audio/guns/pistol/m1911-reload-1.flac";
import snd_pistolCock1 from "../../../../../resources/audio/guns/pistol/pistol-cock-1.mp3";
import snd_pistolShot1 from "../../../../../resources/audio/guns/pistol/pistol-shot-1.mp3";
import img_pistolCasing from "../../../../../resources/images/shell-casings/pistol-casing.png";
import img_fiveSevenHold from "../../../../../resources/images/weapons/five-seven-hold.png";
import img_fiveSevenPickup from "../../../../../resources/images/weapons/five-seven-pickup.png";
import { degToRad } from "../../../../core/util/MathUtil";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";

export const FiveSeven: GunStats = {
  ...defaultGunStats,

  name: "Five Seven",
  fireRate: 20,
  bulletDamage: 25,
  muzzleVelocity: 60,
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
    shellDrop: [
      snd_casingDropBoard1,
      snd_casingDropBoard2,
      snd_casingDropBoard3,
      snd_casingDropBoard4,
    ],
  },
};
