import { rUniform, rNormal } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import Bullet from "../Bullet";
import Gun from "./Gun";

const NUM_BULLETS = 8;
const CONE_ANGLE = Math.PI / 24;

export default class Shotgun extends Gun {
  constructor() {
    super({ fireRate: 4.0, bulletDamage: 30 });
  }

  onShoot(position: V2d, direction: number) {
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
