import dryFire2 from "../../../../resources/audio/guns/misc/dry-fire-2.mp3";
import deagleShot1 from "../../../../resources/audio/guns/pistol/deagle-shot-1.mp3";
import deagleShot2 from "../../../../resources/audio/guns/pistol/deagle-shot-2.mp3";
import m1911Reload1 from "../../../../resources/audio/guns/pistol/m1911-reload-1.flac";
import pistolCock1 from "../../../../resources/audio/guns/pistol/pistol-cock-1.mp3";
import rifleCasing from "../../../../resources/images/shell-casings/rifle-casing.png";
import desertEagle from "../../../../resources/images/weapons/desert-eagle.png";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";

export const DesertEagle: GunStats = {
  ...defaultGunStats,

  name: "Desert Eagle",
  fireRate: 5,
  bulletDamage: 50,
  muzzleVelocity: 60,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadTime: 0.8,
  ammoCapacity: 7,

  textures: {
    ...defaultGunStats.textures,
    pickup: desertEagle,
    shellCasing: rifleCasing,
  },
  size: [0.55, 0.55],

  sounds: {
    shoot: [deagleShot1, deagleShot2],
    empty: [dryFire2],
    pickup: [pistolCock1],
    reload: [m1911Reload1],
  },
};
