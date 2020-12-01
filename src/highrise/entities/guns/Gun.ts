import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import Bullet from "../Bullet";
import Human from "../Human";
import { polarToVec } from "../../../core/util/MathUtil";
import { rUniform } from "../../../core/util/Random";

// Stats that make a gun unique
export interface GunStats {
  // Maximum rounds per second
  fireRate: number;
  // meters/second of bullet when fired
  muzzleVelocity: number;
  // base damage the bullet does
  bulletDamage: number;
  // Distance from the shooter that the bullet is created
  muzzleLength: number;
  //
  fireMode: FireMode;
}

export enum FireMode {
  // One bullet per trigger pull
  SEMI_AUTO,
  // Constant bullets as long as trigger is down
  FULL_AUTO,
  // 3 bullets per trigger pull
  BURST,
}

const defaultGunStats: GunStats = {
  fireRate: 1.0,
  muzzleLength: 0.7,
  muzzleVelocity: 80,
  bulletDamage: 40,
  fireMode: FireMode.SEMI_AUTO,
};

export default class Gun extends BaseEntity implements Entity {
  stats: GunStats;
  currentCooldown: number = 0;

  constructor(stats: Partial<GunStats>) {
    super();
    this.stats = { ...defaultGunStats, ...stats };
  }

  pullTrigger(shooter: Human) {
    if (this.currentCooldown <= 0) {
      const direction = shooter.getDirection();
      const muzzlePosition = shooter
        .getPosition()
        .add(polarToVec(direction, this.stats.muzzleLength));

      this.onShoot(muzzlePosition, direction);
      this.currentCooldown += 1.0 / this.stats.fireRate;
    }
  }

  onShoot(position: V2d, direction: number) {
    this.game!.addEntity(
      new Bullet(
        position,
        direction,
        this.stats.muzzleVelocity * rUniform(0.9, 1.1),
        this.stats.bulletDamage
      )
    );
  }

  onTick(dt: number) {
    if (this.currentCooldown > 0) {
      (this.currentCooldown -= dt), 0;
    }
  }
}
