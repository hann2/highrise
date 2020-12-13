import snd_dryFire3 from "../../../../resources/audio/guns/misc/dry-fire-3.mp3";
import snd_magazineLoad1 from "../../../../resources/audio/guns/misc/magazine-load-1.mp3";
import snd_shellDrop1 from "../../../../resources/audio/guns/misc/shell-drop-1.mp3";
import snd_ar15Reload1 from "../../../../resources/audio/guns/rifle/ar-15-reload-1.flac";
import snd_ar15ReloadEmpty from "../../../../resources/audio/guns/rifle/ar-15-reload-empty.flac";
import snd_rifleShot1 from "../../../../resources/audio/guns/rifle/rifle-shot-1.mp3";
import snd_rifleShot2 from "../../../../resources/audio/guns/rifle/rifle-shot-2.mp3";
import snd_rifleShot3 from "../../../../resources/audio/guns/rifle/rifle-shot-3.mp3";
import img_rifleCasing from "../../../../resources/images/shell-casings/rifle-casing.png";
import img_ar15 from "../../../../resources/images/weapons/ar-15.png";
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
    pickup: img_ar15,
    holding: img_rifle,
    shellCasing: img_rifleCasing,
  },
  size: [0.8, 0.4],

  leftHandPosition: [0.5, 0],
  rightHandPosition: [0.2, 0],

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [snd_rifleShot1, snd_rifleShot2, snd_rifleShot3],
    empty: [snd_dryFire3],
    pickup: [snd_magazineLoad1],
    reload: [snd_ar15Reload1, snd_ar15ReloadEmpty],
    shellDrop: [snd_shellDrop1],
  },
};
