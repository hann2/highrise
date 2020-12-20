import snd_m1911DryFire from "../../../../../resources/audio/guns/pistol/m1911-dry-fire.flac";
import snd_m1911Pickup from "../../../../../resources/audio/guns/pistol/M1911-pickup.flac";
import snd_m1911Reload1 from "../../../../../resources/audio/guns/pistol/m1911-reload-1.flac";
import snd_pistol2Shot1 from "../../../../../resources/audio/guns/pistol/pistol2-shot-1.mp3";
import img_pistolCasing from "../../../../../resources/images/shell-casings/pistol-casing.png";
import img_glockHold from "../../../../../resources/images/weapons/glock-hold.png";
import img_glockPickup from "../../../../../resources/images/weapons/glock-pickup.png";
import { degToRad } from "../../../../core/util/MathUtil";
import { FourtyFive } from "../BulletStats";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";

export const M1911: GunStats = {
  ...defaultGunStats,

  name: "M1911",
  fireRate: 20,
  bulletStats: FourtyFive,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 0.8,
  ammoCapacity: 7,

  textures: {
    ...defaultGunStats.textures,
    pickup: img_glockPickup,
    holding: img_glockHold,
    shellCasing: img_pistolCasing,
  },
  size: [0.45, 0.45],

  leftHandPosition: [0.4, 0],
  rightHandPosition: [0.4, 0],
  holdPosition: [0.5, 0],
  muzzleLength: 0.6,

  recoilAmount: degToRad(8),
  recoilRecovery: 10,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [snd_pistol2Shot1],
    empty: [snd_m1911DryFire],
    pickup: [snd_m1911Pickup],
    reload: [snd_m1911Reload1],
  },
};
