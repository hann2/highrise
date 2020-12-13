import shellDrop1 from "../../../../resources/audio/guns/misc/shell-drop-1.mp3";
import m1911DryFire from "../../../../resources/audio/guns/pistol/m1911-dry-fire.flac";
import m1911Pickup from "../../../../resources/audio/guns/pistol/M1911-pickup.flac";
import m1911Reload1 from "../../../../resources/audio/guns/pistol/m1911-reload-1.flac";
import pistol2Shot1 from "../../../../resources/audio/guns/pistol/pistol2-shot-1.mp3";
import pistolCasing from "../../../../resources/images/shell-casings/pistol-casing.png";
import glock from "../../../../resources/images/weapons/glock.png";
import pistol from "../../../../resources/images/weapons/pistol.png";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";

export const M1911: GunStats = {
  ...defaultGunStats,

  name: "M1911",
  fireRate: 20,
  bulletDamage: 34,
  muzzleVelocity: 60,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadTime: 0.8,
  ammoCapacity: 7,

  textures: {
    ...defaultGunStats.textures,
    pickup: glock,
    holding: pistol,
    shellCasing: pistolCasing,
  },
  size: [0.45, 0.45],

  leftHandPosition: [0.4, 0],
  rightHandPosition: [0.4, 0],

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [pistol2Shot1],
    empty: [m1911DryFire],
    pickup: [m1911Pickup],
    reload: [m1911Reload1],
    shellDrop: [shellDrop1],
  },
};
