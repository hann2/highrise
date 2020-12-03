import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { SoundName } from "../../../core/resources/sounds";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { polarToVec } from "../../../core/util/MathUtil";
import { choose, rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import Bullet from "../Bullet";
import Human from "../Human";

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
  // Maximum number of rounds in the gun
  ammoCapacity: number;

  reloadingStyle: ReloadingStyle;

  reloadTime: number;

  // Sounds that play for various things
  sounds: {
    shoot: SoundName[];
    empty: SoundName[];
    pickup: SoundName[];
    reload: SoundName[];
  };

  // Texture to use when the item's on the ground
  pickupTexture?: string;
  // Determines the size of the pickup image I guess
  weaponLength?: number;
}

export enum FireMode {
  // One bullet per trigger pull
  SEMI_AUTO,
  // Constant bullets as long as trigger is down
  FULL_AUTO,
  // 3 bullets per trigger pull
  BURST,
}

export enum ReloadingStyle {
  // One reload action brings the gun back to full ammo
  MAGAZINE,
  // Rounds are loaded one-at-a-time
  INDIVIDUAL,
}

const defaultGunStats: GunStats = {
  name: "Gun",
  fireRate: 1.0,
  muzzleLength: 0.7,
  muzzleVelocity: 80,
  bulletDamage: 40,
  fireMode: FireMode.SEMI_AUTO,
  ammoCapacity: 10,
  reloadTime: 1,
  reloadingStyle: ReloadingStyle.MAGAZINE,

  sounds: {
    shoot: ["pistol2Shot1"],
    empty: ["dryFire1"],
    pickup: ["pistolCock1"],
    reload: ["reload1"],
  },
};

export default class Gun extends BaseEntity implements Entity {
  stats: GunStats;
  shootCooldown: number = 0;
  reloadCooldown: number = 0;
  ammo: number;

  constructor(stats: Partial<GunStats> = {}) {
    super();
    this.stats = {
      ...defaultGunStats,
      ...stats,
      sounds: { ...defaultGunStats.sounds, ...stats.sounds },
    };
    this.ammo = this.stats.ammoCapacity;
  }

  isReloading() {
    return this.reloadCooldown > 0;
  }

  pullTrigger(shooter: Human) {
    if (this.isReloading()) {
      // TODO: Cancel reload? Nothing?
    } else if (this.shootCooldown <= 0) {
      const direction = shooter.getDirection();
      const muzzlePosition = shooter
        .getPosition()
        .add(polarToVec(direction, this.stats.muzzleLength));

      if (this.ammo > 0) {
        // Actually shoot
        this.makeProjectile(muzzlePosition, direction);
        this.playSound("shoot", muzzlePosition);
        this.shootCooldown += 1.0 / this.stats.fireRate;
      } else {
        this.playSound("empty", muzzlePosition);
      }
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

  async startReload(shooter: Human) {
    if (!this.isReloading()) {
      this.reloadCooldown = this.stats.reloadTime;
      this.ammo = 0;
      this.playSound("reload", shooter.getPosition());
    }
  }

  finishReload() {
    this.ammo = this.stats.ammoCapacity;
  }

  onTick(dt: number) {
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }
    if (this.reloadCooldown > 0) {
      this.reloadCooldown -= dt;
      if (this.reloadCooldown <= 0) {
        this.finishReload();
      }
    }
  }
}
