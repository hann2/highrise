import snd_dryFire2 from "../../../../../resources/audio/guns/misc/dry-fire-2.mp3";
import snd_deagleShot1 from "../../../../../resources/audio/guns/pistol/deagle-shot-1.mp3";
import snd_deagleShot2 from "../../../../../resources/audio/guns/pistol/deagle-shot-2.mp3";
import snd_m1911Reload1 from "../../../../../resources/audio/guns/pistol/m1911-reload-1.flac";
import snd_pistolCock1 from "../../../../../resources/audio/guns/pistol/pistol-cock-1.mp3";
import img_rifleCasing from "../../../../../resources/images/shell-casings/rifle-casing.png";
import img_desertEagleHold from "../../../../../resources/images/weapons/desert-eagle-hold.png";
import img_desertEaglePickup from "../../../../../resources/images/weapons/desert-eagle-pickup.png";
import { degToRad } from "../../../../core/util/MathUtil";
import { Magnum } from "../BulletStats";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";

export const DesertEagle: GunStats = {
  ...defaultGunStats,

  name: "Desert Eagle",
  fireRate: 10,
  bulletStats: Magnum,
  reloadingStyle: ReloadingStyle.MAGAZINE,
  reloadInsertTime: 0.8,
  ammoCapacity: 7,

  textures: {
    ...defaultGunStats.textures,
    pickup: img_desertEaglePickup,
    holding: img_desertEagleHold,
    shellCasing: img_rifleCasing,
  },
  size: [0.55, 0.55],

  recoilAmount: degToRad(6),
  recoilRecovery: 4,

  leftHandPosition: [0.4, 0],
  rightHandPosition: [0.4, 0],
  holdPosition: [0.52, 0],
  muzzleLength: 0.62,

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [snd_deagleShot1, snd_deagleShot2],
    empty: [snd_dryFire2],
    pickup: [snd_pistolCock1],
    reload: [snd_m1911Reload1],
  },
};
