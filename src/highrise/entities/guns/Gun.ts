import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { SoundName } from "../../../core/resources/sounds";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { polarToVec } from "../../../core/util/MathUtil";
import { rUniform, choose } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import Bullet from "../Bullet";
import Human from "../Human";
import { SoundInstance } from "../../../core/sound/SoundInstance";

// Stats that make a gun unique
export interface GunStats {
  // Friendly name for the gun
  name: string;
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

  sounds: {
    shoot: SoundName[];
    empty: SoundName[];
    pickup: SoundName[];
    reload: SoundName[];
  };
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
  name: "Gun",
  fireRate: 1.0,
  muzzleLength: 0.7,
  muzzleVelocity: 80,
  bulletDamage: 40,
  fireMode: FireMode.SEMI_AUTO,

  sounds: {
    shoot: ["pistol2Shot1"],
    empty: ["dryFire1"],
    pickup: ["pistolCock1"],
    reload: ["reload1"],
  },
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
      this.makeProjectile(muzzlePosition, direction);

      this.playSound("shoot", muzzlePosition);

      this.currentCooldown += 1.0 / this.stats.fireRate;
    }
  }

  playSound(
    soundClass: keyof GunStats["sounds"],
    position: V2d
  ): PositionalSound | undefined {
    const sounds = this.stats.sounds[soundClass];
    if (sounds.length > 0) {
      const sound = choose(...sounds);
      return this.game!.addEntity(new PositionalSound(sound, position));
    }
  }

  makeProjectile(position: V2d, direction: number) {
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
