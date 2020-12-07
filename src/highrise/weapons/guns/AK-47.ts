import dryFire3 from "../../../../resources/audio/guns/misc/dry-fire-3.mp3";
import magazineLoad1 from "../../../../resources/audio/guns/misc/magazine-load-1.mp3";
import ar15Reload1 from "../../../../resources/audio/guns/rifle/ar-15-reload-1.flac";
import ar15ReloadEmpty from "../../../../resources/audio/guns/rifle/ar-15-reload-empty.flac";
import rifle2Shot1 from "../../../../resources/audio/guns/rifle/rifle2-shot-1.mp3";
import ak47 from "../../../../resources/images/weapons/ak47.png";
import {
  defaultGunStats,
  FireMode,
  GunStats,
  ReloadingStyle,
} from "../GunStats";

export const AK47: GunStats = {
  ...defaultGunStats,

  name: "AK-47",
  fireRate: 9,
  bulletDamage: 45,
  muzzleVelocity: 120,
  fireMode: FireMode.FULL_AUTO,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadTime: 1.8,
  ammoCapacity: 30,

  textures: { pickup: ak47 },
  size: [1.4, 1.4],

  sounds: {
    shoot: [rifle2Shot1],
    empty: [dryFire3],
    pickup: [magazineLoad1],
    reload: [ar15Reload1, ar15ReloadEmpty],
  },
};
