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
      reloadTime: 0.9,
      ammoCapacity: 7,

      pickupTexture: glock,

      sounds: {
        shoot: ["pistol2Shot1"],
        empty: ["dryFire2"],
        pickup: ["pistolCock1"],
        reload: ["magazineLoad1"],
      },
    });
  }
}
