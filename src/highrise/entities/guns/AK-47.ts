import ak47 from "../../../../resources/images/weapons/ak47.png";
import Gun from "./Gun";
import { FireMode, ReloadingStyle } from "./GunStats";

export default class AK47 extends Gun {
  constructor() {
    super({
      name: "AK-47",
      fireRate: 9,
      bulletDamage: 45,
      muzzleVelocity: 120,
      fireMode: FireMode.FULL_AUTO,
      reloadingStyle: ReloadingStyle.MAGAZINE,
      reloadTime: 1.8,
      ammoCapacity: 30,

      pickupTexture: ak47,
      size: [1.4, 1.4],

      sounds: {
        shoot: ["rifle2Shot1"],
        empty: ["dryFire3"],
        pickup: ["magazineLoad1"],
        reload: ["ar15Reload1", "ar15ReloadEmpty"],
      },
    });
  }
}
