import snd_casingDropBoard1 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-1.flac";
import snd_casingDropBoard2 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-2.flac";
import snd_casingDropBoard3 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-3.flac";
import snd_casingDropBoard4 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-4.flac";
import snd_dryFire3 from "../../../../resources/audio/guns/misc/dry-fire-3.mp3";
import snd_magazineLoad1 from "../../../../resources/audio/guns/misc/magazine-load-1.mp3";
import snd_ar15Reload1 from "../../../../resources/audio/guns/rifle/ar-15-reload-1.flac";
import snd_ar15ReloadEmpty from "../../../../resources/audio/guns/rifle/ar-15-reload-empty.flac";
import snd_rifleShot1 from "../../../../resources/audio/guns/rifle/rifle-shot-1.mp3";
import snd_rifleShot2 from "../../../../resources/audio/guns/rifle/rifle-shot-2.mp3";
import snd_rifleShot3 from "../../../../resources/audio/guns/rifle/rifle-shot-3.mp3";
import img_rifleCasing from "../../../../resources/images/shell-casings/rifle-casing.png";
import img_ar15Pickup from "../../../../resources/images/weapons/ar-15-pickup.png";
import img_ar15Hold from "../../../../resources/images/weapons/ar15-hold.png";
import img_rifle from "../../../../resources/images/weapons/rifle.png";
import {
  defaultGunStats,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";

export const AR15: GunStats = {
  ...defaultGunStats,

  name: "AR-15",
  fireRate: 12,
  bulletDamage: 45,
  muzzleVelocity: 120,
  fireMode: FireMode.SEMI_AUTO,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadTime: 1.5,
  ammoCapacity: 30,

  textures: {
    ...defaultGunStats.textures,
    pickup: img_ar15Pickup,
    holding: img_ar15Hold,
    shellCasing: img_rifleCasing,
  },
  size: [0.8, 0.4],

  leftHandPosition: [0.5, 0],
  rightHandPosition: [0.3, 0],
  holdPosition: [0.5, 0],

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [snd_rifleShot1, snd_rifleShot2, snd_rifleShot3],
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
