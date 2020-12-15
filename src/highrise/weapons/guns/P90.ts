import snd_casingDropBoard1 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-1.flac";
import snd_casingDropBoard2 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-2.flac";
import snd_casingDropBoard3 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-3.flac";
import snd_casingDropBoard4 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-4.flac";
import snd_dryFire3 from "../../../../resources/audio/guns/misc/dry-fire-3.mp3";
import snd_magazineLoad1 from "../../../../resources/audio/guns/misc/magazine-load-1.mp3";
import snd_pistol2Shot1 from "../../../../resources/audio/guns/pistol/pistol2-shot-1.mp3";
import snd_ar15Reload1 from "../../../../resources/audio/guns/rifle/ar-15-reload-1.flac";
import snd_ar15ReloadEmpty from "../../../../resources/audio/guns/rifle/ar-15-reload-empty.flac";
import img_pistolCasing from "../../../../resources/images/shell-casings/pistol-casing.png";
import img_p90Hold from "../../../../resources/images/weapons/p90-hold.png";
import img_p90Pickup from "../../../../resources/images/weapons/p90-pickup.png";
import { degToRad } from "../../../core/util/MathUtil";
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
    pickup: img_p90Pickup,
    holding: img_p90Hold,
    shellCasing: img_pistolCasing,
  },
  size: [1.0, 1.0],

  leftHandPosition: [0.45, -0.03],
  rightHandPosition: [0.2, 0],
  holdPosition: [0.35, 0],
  stanceAngle: degToRad(50),
  stanceOffset: [0, -0.2],
  muzzleLength: 0.7,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [snd_pistol2Shot1],
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
