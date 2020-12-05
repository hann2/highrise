import magnum from "../../../../resources/images/weapons/magnum.png";
import Gun from "./Gun";
import { ReloadingStyle } from "./GunStats";

export default class Magnum extends Gun {
  constructor() {
    super({
      name: ".357 Magnum",
      fireRate: 5,
      bulletDamage: 40,
      muzzleVelocity: 60,
      reloadingStyle: ReloadingStyle.INDIVIDUAL,
      reloadTime: 0.3,
      ammoCapacity: 6,

      pickupTexture: magnum,
      size: [0.55, 0.55],

      sounds: {
        shoot: ["revolverShot3"],
        empty: ["revolverDryFire"],
        pickup: ["revolverPickup"],
        reload: ["revolverReloadStart"],
        reloadInsert: [
          "revolverInsertShell1",
          "revolverInsertShell2",
          "revolverInsertShell3",
        ],
        reloadFinish: ["revolverReloadFinish"],
      },
    });
  }
}
