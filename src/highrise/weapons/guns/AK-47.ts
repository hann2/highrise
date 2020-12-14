import snd_casingDropBoard1 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-1.flac";
import snd_casingDropBoard2 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-2.flac";
import snd_casingDropBoard3 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-3.flac";
import snd_casingDropBoard4 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-4.flac";
import snd_dryFire3 from "../../../../resources/audio/guns/misc/dry-fire-3.mp3";
import snd_magazineLoad1 from "../../../../resources/audio/guns/misc/magazine-load-1.mp3";
import snd_ar15Reload1 from "../../../../resources/audio/guns/rifle/ar-15-reload-1.flac";
import snd_ar15ReloadEmpty from "../../../../resources/audio/guns/rifle/ar-15-reload-empty.flac";
import snd_rifle2Shot1 from "../../../../resources/audio/guns/rifle/rifle2-shot-1.mp3";
import img_rifleCasing from "../../../../resources/images/shell-casings/rifle-casing.png";
import img_ak47 from "../../../../resources/images/weapons/ak47.png";
import img_rifle from "../../../../resources/images/weapons/rifle.png";
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
  reloadTime: 1.8,
  ammoCapacity: 30,

  textures: {
    ...defaultGunStats.textures,
    pickup: img_ak47,
    holding: img_rifle,
    shellCasing: img_rifleCasing,
  },
  size: [1.4, 1.4],

  leftHandPosition: [0.5, -0.03],
  rightHandPosition: [0.25, 0.07],

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
