import doubleBarrelShotgun from "../../../../resources/images/weapons/double-barrel-shotgun.png";
import { degToRad } from "../../../core/util/MathUtil";
import { rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import Bullet from "../Bullet";
import Gun from "./Gun";
import { FireMode, ReloadingStyle } from "./GunStats";

export default class DoubleBarrelShotgun extends Gun {
  constructor() {
    super({
      name: "Sawn Off Shotgun",
      fireRate: 8,
      bulletDamage: 20,
      bulletsPerShot: 15,
      bulletSpread: degToRad(22),
      muzzleVelocity: 55,
      reloadingStyle: ReloadingStyle.MAGAZINE,
      fireMode: FireMode.SEMI_AUTO,
      reloadTime: 1.2,
      ammoCapacity: 2,

      pickupTexture: doubleBarrelShotgun,
      size: [1.1, 1.1],

      sounds: {
        shoot: ["shotgunShot1"],
        empty: ["dryFire1"],
        pickup: ["shotgunPump1"],
        reload: ["shotgunLoadShell2"],
      },
    });
  }
}
