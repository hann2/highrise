import snd_casingDropBoard1 from "../../../../../resources/audio/guns/casing-drops/casing-drop-board-1.flac";
import snd_casingDropBoard2 from "../../../../../resources/audio/guns/casing-drops/casing-drop-board-2.flac";
import snd_casingDropBoard3 from "../../../../../resources/audio/guns/casing-drops/casing-drop-board-3.flac";
import snd_casingDropBoard4 from "../../../../../resources/audio/guns/casing-drops/casing-drop-board-4.flac";
import snd_dryFire3 from "../../../../../resources/audio/guns/misc/dry-fire-3.mp3";
import snd_magazineLoad1 from "../../../../../resources/audio/guns/misc/magazine-load-1.mp3";
import snd_ar15Reload1 from "../../../../../resources/audio/guns/rifle/ar-15-reload-1.flac";
import snd_ar15ReloadEmpty from "../../../../../resources/audio/guns/rifle/ar-15-reload-empty.flac";
import snd_rifle2Shot1 from "../../../../../resources/audio/guns/rifle/rifle2-shot-1.mp3";
import img_rifleCasing from "../../../../../resources/images/shell-casings/rifle-casing.png";
import img_ak47Hold from "../../../../../resources/images/weapons/ak-47-hold.png";
import img_ak47Pickup from "../../../../../resources/images/weapons/ak47-pickup.png";
import { degToRad } from "../../../../core/util/MathUtil";
import {
  defaultGunStats,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";

export const AK47: GunStats = {
  ...defaultGunStats,

  name: "AK-47",
  fireRate: 9,
  bulletDamage: 50,
  muzzleVelocity: 120,
  fireMode: FireMode.FULL_AUTO,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 1.8,
  ammoCapacity: 30,

  textures: {
    ...defaultGunStats.textures,
    pickup: img_ak47Pickup,
    holding: img_ak47Hold,
    shellCasing: img_rifleCasing,
  },
  size: [1.4, 1.4],

  recoilAmount: degToRad(4),
  recoilRecovery: 3.1,

  leftHandPosition: [0.65, -0.03],
  rightHandPosition: [0.32, 0],
  holdPosition: [0.55, 0],
  stanceAngle: degToRad(55),
  stanceOffset: [0, -0.25],
  muzzleLength: 1.1,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [snd_rifle2Shot1],
    empty: [snd_dryFire3],
    pickup: [snd_magazineLoad1],
    reload: [snd_ar15Reload1, snd_ar15ReloadEmpty],
    shellDrop: [
      snd_casingDropBoard1,
      snd_casingDropBoard2,
      snd_casingDropBoard3,
      snd_casingDropBoard4,
    ],
  },
};
