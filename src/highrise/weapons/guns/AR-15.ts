import dryFire3 from "../../../../resources/audio/guns/misc/dry-fire-3.mp3";
import magazineLoad1 from "../../../../resources/audio/guns/misc/magazine-load-1.mp3";
import ar15Reload1 from "../../../../resources/audio/guns/rifle/ar-15-reload-1.flac";
import ar15ReloadEmpty from "../../../../resources/audio/guns/rifle/ar-15-reload-empty.flac";
import rifleShot1 from "../../../../resources/audio/guns/rifle/rifle-shot-1.mp3";
import rifleShot2 from "../../../../resources/audio/guns/rifle/rifle-shot-2.mp3";
import rifleShot3 from "../../../../resources/audio/guns/rifle/rifle-shot-3.mp3";
import rifleCasing from "../../../../resources/images/shell-casings/rifle-casing.png";
import ar15 from "../../../../resources/images/weapons/ar-15.png";
import rifle from "../../../../resources/images/weapons/rifle.png";
import {
  defaultGunStats,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";

export const AR15: GunStats = {
  ...defaultGunStats,

  name: "AR-15",
  fireRate: 9,
  bulletDamage: 45,
  muzzleVelocity: 120,
  fireMode: FireMode.SEMI_AUTO,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadTime: 1.5,
  ammoCapacity: 30,

  textures: {
    ...defaultGunStats.textures,
    pickup: ar15,
    holding: rifle,
    shellCasing: rifleCasing,
  },
  size: [0.8, 0.4],

  sounds: {
    shoot: [rifleShot1, rifleShot2, rifleShot3],
    empty: [dryFire3],
    pickup: [magazineLoad1],
    reload: [ar15Reload1, ar15ReloadEmpty],
  },
};
