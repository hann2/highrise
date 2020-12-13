import snd_dryFire3 from "../../../../resources/audio/guns/misc/dry-fire-3.mp3";
import snd_magazineLoad1 from "../../../../resources/audio/guns/misc/magazine-load-1.mp3";
import snd_shellDrop1 from "../../../../resources/audio/guns/misc/shell-drop-1.mp3";
import snd_ar15Reload1 from "../../../../resources/audio/guns/rifle/ar-15-reload-1.flac";
import snd_ar15ReloadEmpty from "../../../../resources/audio/guns/rifle/ar-15-reload-empty.flac";
import rifle2Shot1 from "../../../../resources/audio/guns/rifle/rifle2-shot-1.mp3";
import snd_p90Shoot1 from "../../../../resources/audio/guns/smg/p90-shoot-1.flac";
import snd_p90Shoot2 from "../../../../resources/audio/guns/smg/p90-shoot-2.flac";
import snd_p90Shoot3 from "../../../../resources/audio/guns/smg/p90-shoot-3.flac";
import img_rifleCasing from "../../../../resources/images/shell-casings/rifle-casing.png";
import ak47 from "../../../../resources/images/weapons/ak47.png";
import img_p90 from "../../../../resources/images/weapons/p90.png";
import img_rifle from "../../../../resources/images/weapons/rifle.png";
import {
  defaultGunStats,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";

export const P90: GunStats = {
  ...defaultGunStats,

  name: "P90",
  fireRate: 15,
  bulletDamage: 30,
  muzzleVelocity: 150,
  fireMode: FireMode.FULL_AUTO,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadTime: 2.2,
  ammoCapacity: 50,

  textures: {
    ...defaultGunStats.textures,
    pickup: img_p90,
    holding: img_rifle,
    shellCasing: img_rifleCasing,
  },
  size: [1.0, 1.0],

  leftHandPosition: [0.4, 0],
  rightHandPosition: [0.2, 0],

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [snd_p90Shoot1, snd_p90Shoot2, snd_p90Shoot3],
    empty: [snd_dryFire3],
    pickup: [snd_magazineLoad1],
    reload: [snd_ar15Reload1, snd_ar15ReloadEmpty],
    shellDrop: [snd_shellDrop1],
  },
};
