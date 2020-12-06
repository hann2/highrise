import doubleBarrelShotgun from "../../../../resources/images/weapons/double-barrel-shotgun.png";
import { degToRad } from "../../../core/util/MathUtil";
import { rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import Bullet from "../Bullet";
import Gun from "./Gun";
import { FireMode, ReloadingStyle } from "./GunStats";

const NUM_BULLETS = 9;
const CONE_ANGLE = degToRad(20);

export default class DoubleBarrelShotgun extends Gun {
  constructor() {
    super({
      name: "Sawn Off Shotgun",
      fireRate: 8,
      bulletDamage: 30,
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

  makeProjectile(position: V2d, direction: number) {
    for (let i = 0; i < NUM_BULLETS; i++) {
      const angleOffset = rUniform(-CONE_ANGLE / 2, CONE_ANGLE / 2);
      this.game?.addEntity(
        new Bullet(
          position,
          direction + angleOffset,
          this.stats.muzzleVelocity,
          this.stats.bulletDamage
        )
      );
    }
  }
}
