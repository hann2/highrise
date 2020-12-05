import ar15 from "../../../../resources/images/weapons/ar-15.png";
import Gun from "./Gun";
import { FireMode, ReloadingStyle } from "./GunStats";

export default class AR15 extends Gun {
  constructor() {
    super({
      name: "AR-15",
      fireRate: 9,
      bulletDamage: 45,
      muzzleVelocity: 120,
      fireMode: FireMode.SEMI_AUTO,
      reloadingStyle: ReloadingStyle.MAGAZINE,
      reloadTime: 1.5,
      ammoCapacity: 30,

      pickupTexture: ar15,

      sounds: {
        shoot: ["rifleShot1", "rifleShot2", "rifleShot3"],
        empty: ["dryFire3"],
        pickup: ["magazineLoad1"],
        reload: ["reload1"],
      },
    });
  }
}
