import glock from "../../../../resources/images/weapons/glock.png";
import Gun from "./Gun";
import { ReloadingStyle } from "./GunStats";

export default class M1911 extends Gun {
  constructor() {
    super({
      name: "M1911",
      fireRate: 9,
      bulletDamage: 34,
      muzzleVelocity: 60,
      reloadingStyle: ReloadingStyle.MAGAZINE,
      reloadTime: 0.8,
      ammoCapacity: 7,

      pickupTexture: glock,
      size: [0.45, 0.45],

      sounds: {
        shoot: ["pistol2Shot1"],
        empty: ["m1911DryFire"],
        pickup: ["m1911Pickup"],
        reload: ["m1911Reload1"],
      },
    });
  }
}
