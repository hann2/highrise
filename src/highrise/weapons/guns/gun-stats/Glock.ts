import snd_dryFire2 from "../../../../../resources/audio/guns/misc/dry-fire-2.mp3";
import snd_m1911Reload1 from "../../../../../resources/audio/guns/pistol/m1911-reload-1.flac";
import snd_pistolCock1 from "../../../../../resources/audio/guns/pistol/pistol-cock-1.mp3";
import snd_pistolShot2 from "../../../../../resources/audio/guns/pistol/pistol-shot-2.mp3";
import img_pistolCasing from "../../../../../resources/images/shell-casings/pistol-casing.png";
import img_glockHold from "../../../../../resources/images/weapons/glock-hold.png";
import img_glockPickup from "../../../../../resources/images/weapons/glock-pickup.png";
import { degToRad } from "../../../../core/util/MathUtil";
import { NineMil } from "../BulletStats";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";

export const Glock: GunStats = {
  ...defaultGunStats,

  name: "Glock",
  fireRate: 20,
  bulletStats: NineMil,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 0.8,
  ammoCapacity: 15,

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
    shoot: [snd_pistolShot2],
    empty: [snd_dryFire2],
    pickup: [snd_pistolCock1],
    reload: [snd_m1911Reload1],
  },
};
