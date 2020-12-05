import glock from "../../../../resources/images/weapons/glock.png";
import Gun from "./Gun";
import { ReloadingStyle } from "./GunStats";

export default class Glock extends Gun {
  constructor() {
    super({
      name: "Glock",
      fireRate: 10,
      bulletDamage: 25,
      muzzleVelocity: 60,
      reloadingStyle: ReloadingStyle.MAGAZINE,
      reloadTime: 0.8,
      ammoCapacity: 15,

      pickupTexture: glock,
      size: [0.45, 0.45],

      sounds: {
        shoot: ["pistolShot2"],
        empty: ["dryFire2"],
        pickup: ["pistolCock1"],
        reload: ["m1911Reload1"],
      },
    });
  }
}
