import remington from "../../../../resources/images/weapons/remington.png";
import { rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import Bullet from "../Bullet";
import Gun from "./Gun";
import { ReloadingStyle, FireMode } from "./GunStats";

const NUM_BULLETS = 9;
const CONE_ANGLE = Math.PI / 24;

export default class PumpShotgun extends Gun {
  constructor() {
    super({
      name: "Remington Shotgun",
      fireRate: 2,
      bulletDamage: 30,
      muzzleVelocity: 55,
      reloadingStyle: ReloadingStyle.INDIVIDUAL,
      fireMode: FireMode.PUMP,
      reloadTime: 0.5,
      ammoCapacity: 7,

      pickupTexture: remington,
      size: [1.1, 1.1],

      sounds: {
        shoot: ["shotgunShot3"],
        empty: ["dryFire1"],
        pickup: ["shotgunPump1"],
        reload: [],
        reloadInsert: ["shotgunLoadShell2"],
        reloadFinish: ["shotgunPump1"],
        pump: ["shotgunPump1"],
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
