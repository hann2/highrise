import dryFire2 from "../../../../resources/audio/guns/misc/dry-fire-2.mp3";
import m1911Reload1 from "../../../../resources/audio/guns/pistol/m1911-reload-1.flac";
import pistolCock1 from "../../../../resources/audio/guns/pistol/pistol-cock-1.mp3";
import pistolShot2 from "../../../../resources/audio/guns/pistol/pistol-shot-2.mp3";
import glock from "../../../../resources/images/weapons/glock.png";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";

export const Glock: GunStats = {
  ...defaultGunStats,

  name: "Glock",
  fireRate: 10,
  bulletDamage: 25,
  muzzleVelocity: 60,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadTime: 0.8,
  ammoCapacity: 15,

  textures: { pickup: glock },
  size: [0.45, 0.45],

  sounds: {
    shoot: [pistolShot2],
    empty: [dryFire2],
    pickup: [pistolCock1],
    reload: [m1911Reload1],
  },
};
