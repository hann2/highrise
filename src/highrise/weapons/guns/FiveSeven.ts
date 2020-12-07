import dryFire2 from "../../../../resources/audio/guns/misc/dry-fire-2.mp3";
import m1911Reload1 from "../../../../resources/audio/guns/pistol/m1911-reload-1.flac";
import pistolCock1 from "../../../../resources/audio/guns/pistol/pistol-cock-1.mp3";
import pistolShot1 from "../../../../resources/audio/guns/pistol/pistol-shot-1.mp3";
import fiveseven from "../../../../resources/images/weapons/fiveseven.png";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";

export const FiveSeven: GunStats = {
  ...defaultGunStats,

  name: "Five Seven",
  fireRate: 10,
  bulletDamage: 25,
  muzzleVelocity: 60,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadTime: 0.8,
  ammoCapacity: 20,

  textures: { pickup: fiveseven },
  size: [0.45, 0.45],

  sounds: {
    shoot: [pistolShot1],
    empty: [dryFire2],
    pickup: [pistolCock1],
    reload: [m1911Reload1],
  },
};
