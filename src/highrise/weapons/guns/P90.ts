import dryFire3 from "../../../../resources/audio/guns/misc/dry-fire-3.mp3";
import magazineLoad1 from "../../../../resources/audio/guns/misc/magazine-load-1.mp3";
import shellDrop1 from "../../../../resources/audio/guns/misc/shell-drop-1.mp3";
import ar15Reload1 from "../../../../resources/audio/guns/rifle/ar-15-reload-1.flac";
import ar15ReloadEmpty from "../../../../resources/audio/guns/rifle/ar-15-reload-empty.flac";
import rifle2Shot1 from "../../../../resources/audio/guns/rifle/rifle2-shot-1.mp3";
import p90Shoot1 from "../../../../resources/audio/guns/smg/p90-shoot-1.flac";
import p90Shoot2 from "../../../../resources/audio/guns/smg/p90-shoot-2.flac";
import p90Shoot3 from "../../../../resources/audio/guns/smg/p90-shoot-3.flac";
import rifleCasing from "../../../../resources/images/shell-casings/rifle-casing.png";
import ak47 from "../../../../resources/images/weapons/ak47.png";
import p90 from "../../../../resources/images/weapons/p90.png";
import rifle from "../../../../resources/images/weapons/rifle.png";
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
    pickup: p90,
    holding: rifle,
    shellCasing: rifleCasing,
  },
  size: [1.0, 1.0],

  leftHandPosition: [0.4, 0],
  rightHandPosition: [0.2, 0],

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [p90Shoot1, p90Shoot2, p90Shoot3],
    empty: [dryFire3],
    pickup: [magazineLoad1],
    reload: [ar15Reload1, ar15ReloadEmpty],
    shellDrop: [shellDrop1],
  },
};
