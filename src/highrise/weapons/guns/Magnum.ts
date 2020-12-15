import snd_casingDropBoard1 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-1.flac";
import snd_casingDropBoard2 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-2.flac";
import snd_casingDropBoard3 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-3.flac";
import snd_casingDropBoard4 from "../../../../resources/audio/guns/casing-drops/casing-drop-board-4.flac";
import snd_revolverDryFire from "../../../../resources/audio/guns/revolver/revolver-dry-fire.flac";
import snd_revolverInsertShell1 from "../../../../resources/audio/guns/revolver/revolver-insert-shell-1.flac";
import snd_revolverInsertShell2 from "../../../../resources/audio/guns/revolver/revolver-insert-shell-2.flac";
import snd_revolverInsertShell3 from "../../../../resources/audio/guns/revolver/revolver-insert-shell-3.flac";
import snd_revolverPickup from "../../../../resources/audio/guns/revolver/revolver-pickup.flac";
import snd_revolverReloadFinish from "../../../../resources/audio/guns/revolver/revolver-reload-finish.flac";
import snd_revolverReloadStart from "../../../../resources/audio/guns/revolver/revolver-reload-start.flac";
import snd_revolverShot3 from "../../../../resources/audio/guns/revolver/revolver-shot-3.mp3";
import img_pistolCasing from "../../../../resources/images/shell-casings/pistol-casing.png";
import img_magnumHold from "../../../../resources/images/weapons/magnum-hold.png";
import img_magnumPickup from "../../../../resources/images/weapons/magnum-pickup.png";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";

export const Magnum: GunStats = {
  ...defaultGunStats,

  name: ".357 Magnum",
  fireRate: 10,
  bulletDamage: 55,
  muzzleVelocity: 60,
  reloadingStyle: ReloadingStyle.INDIVIDUAL,
  reloadTime: 0.28,
  ammoCapacity: 6,

  textures: {
    ...defaultGunStats.textures,
    pickup: img_magnumPickup,
    holding: img_magnumHold,
    shellCasing: img_pistolCasing,
  },
  size: [0.55, 0.55],

  leftHandPosition: [0.4, 0],
  rightHandPosition: [0.4, 0],
  holdPosition: [0.55, 0],

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [snd_revolverShot3],
    empty: [snd_revolverDryFire],
    pickup: [snd_revolverPickup],
    reload: [snd_revolverReloadStart],
    reloadInsert: [
      snd_revolverInsertShell1,
      snd_revolverInsertShell2,
      snd_revolverInsertShell3,
    ],
    reloadFinish: [snd_revolverReloadFinish],
    shellDrop: [
      snd_casingDropBoard1,
      snd_casingDropBoard2,
      snd_casingDropBoard3,
      snd_casingDropBoard4,
    ],
  },
};
