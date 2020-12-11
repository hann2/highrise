import shellDrop1 from "../../../../resources/audio/guns/misc/shell-drop-1.mp3";
import revolverDryFire from "../../../../resources/audio/guns/revolver/revolver-dry-fire.flac";
import revolverInsertShell1 from "../../../../resources/audio/guns/revolver/revolver-insert-shell-1.flac";
import revolverInsertShell2 from "../../../../resources/audio/guns/revolver/revolver-insert-shell-2.flac";
import revolverInsertShell3 from "../../../../resources/audio/guns/revolver/revolver-insert-shell-3.flac";
import revolverPickup from "../../../../resources/audio/guns/revolver/revolver-pickup.flac";
import revolverReloadFinish from "../../../../resources/audio/guns/revolver/revolver-reload-finish.flac";
import revolverReloadStart from "../../../../resources/audio/guns/revolver/revolver-reload-start.flac";
import revolverShot3 from "../../../../resources/audio/guns/revolver/revolver-shot-3.mp3";
import pistolCasing from "../../../../resources/images/shell-casings/pistol-casing.png";
import magnum from "../../../../resources/images/weapons/magnum.png";
import pistol from "../../../../resources/images/weapons/pistol.png";
import { defaultGunStats, GunStats, ReloadingStyle } from "../GunStats";

export const Magnum: GunStats = {
  ...defaultGunStats,

  name: ".357 Magnum",
  fireRate: 10,
  bulletDamage: 55,
  muzzleVelocity: 60,
  reloadingStyle: ReloadingStyle.INDIVIDUAL,
  reloadTime: 0.3,
  ammoCapacity: 6,

  textures: {
    ...defaultGunStats.textures,
    pickup: magnum,
    holding: pistol,
    shellCasing: pistolCasing,
  },
  size: [0.55, 0.55],

  sounds: {
    ...defaultGunStats.sounds,
    shoot: [revolverShot3],
    empty: [revolverDryFire],
    pickup: [revolverPickup],
    reload: [revolverReloadStart],
    reloadInsert: [
      revolverInsertShell1,
      revolverInsertShell2,
      revolverInsertShell3,
    ],
    reloadFinish: [revolverReloadFinish],
    shellDrop: [shellDrop1],
  },
};
