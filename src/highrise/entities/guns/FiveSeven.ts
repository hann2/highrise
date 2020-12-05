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
      reloadTime: 0.8,
      ammoCapacity: 20,

      pickupTexture: fiveseven,
      size: [0.45, 0.45],

      sounds: {
        shoot: ["pistolShot1"],
        empty: ["dryFire2"],
        pickup: ["pistolCock1"],
        reload: ["m1911Reload1"],
      },
    });
  }
}
