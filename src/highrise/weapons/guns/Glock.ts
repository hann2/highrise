import snd_dryFire2 from "../../../../resources/audio/guns/misc/dry-fire-2.mp3";
import snd_shellDrop1 from "../../../../resources/audio/guns/misc/shell-drop-1.mp3";
import snd_m1911Reload1 from "../../../../resources/audio/guns/pistol/m1911-reload-1.flac";
import snd_pistolCock1 from "../../../../resources/audio/guns/pistol/pistol-cock-1.mp3";
import snd_pistolShot2 from "../../../../resources/audio/guns/pistol/pistol-shot-2.mp3";
import img_pistolCasing from "../../../../resources/images/shell-casings/pistol-casing.png";
import img_glock from "../../../../resources/images/weapons/glock.png";
import img_pistol from "../../../../resources/images/weapons/pistol.png";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";

export const Glock: GunStats = {
  ...defaultGunStats,

  name: "Glock",
  fireRate: 20,
  bulletDamage: 25,
  muzzleVelocity: 60,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadTime: 0.8,
  ammoCapacity: 15,

  textures: {
    ...defaultGunStats.textures,
    pickup: img_glock,
    holding: img_pistol,
    shellCasing: img_pistolCasing,
  },
  size: [0.45, 0.45],

  leftHandPosition: [0.4, 0],
  rightHandPosition: [0.4, 0],

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [snd_pistolShot2],
    empty: [snd_dryFire2],
    pickup: [snd_pistolCock1],
    reload: [snd_m1911Reload1],
    shellDrop: [snd_shellDrop1],
  },
};
