import fiveseven from "../../../../resources/images/weapons/fiveseven.png";
import Gun from "./Gun";
import { ReloadingStyle } from "./GunStats";

export default class FiveSeven extends Gun {
  constructor() {
    super({
      name: "Five Seven",
      fireRate: 10,
      bulletDamage: 25,
      muzzleVelocity: 60,
      reloadingStyle: ReloadingStyle.MAGAZINE,
      reloadTime: 0.85,
      ammoCapacity: 20,

      pickupTexture: fiveseven,

      sounds: {
        shoot: ["pistolShot1"],
        empty: ["dryFire2"],
        pickup: ["pistolCock1"],
        reload: ["magazineLoad1"],
      },
    });
  }
}
