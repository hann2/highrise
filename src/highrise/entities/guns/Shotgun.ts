import { rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import Bullet from "../Bullet";
import Gun, { FireMode, ReloadingStyle } from "./Gun";

const NUM_BULLETS = 9;
const CONE_ANGLE = Math.PI / 24;

export default class PumpShotgun extends Gun {
  constructor() {
    super({
      name: "Shotgun",
      fireRate: 2,
      bulletDamage: 30,
      muzzleVelocity: 55,
      reloadingStyle: ReloadingStyle.INDIVIDUAL,
      fireMode: FireMode.PUMP,
      reloadTime: 0.5,
      ammoCapacity: 7,

      sounds: {
        shoot: ["shotgunShot3"],
        empty: ["dryFire1"],
        pickup: ["shotgunPump1"],
        reload: ["shotgunLoadShell2"],
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
