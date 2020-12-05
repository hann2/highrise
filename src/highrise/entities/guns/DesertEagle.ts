import desertEagle from "../../../../resources/images/weapons/desert-eagle.png";
import Gun from "./Gun";
import { ReloadingStyle } from "./GunStats";

export default class DesertEagle extends Gun {
  constructor() {
    super({
      name: "Desert Eagle",
      fireRate: 5,
      bulletDamage: 50,
      muzzleVelocity: 60,
      reloadingStyle: ReloadingStyle.MAGAZINE,
      reloadTime: 0.8,
      ammoCapacity: 7,

      pickupTexture: desertEagle,
      size: [0.55, 0.55],

      sounds: {
        shoot: ["deagleShot1", "deagleShot2"],
        empty: ["dryFire2"],
        pickup: ["pistolCock1"],
        reload: ["m1911Reload1"],
      },
    });
  }
}
