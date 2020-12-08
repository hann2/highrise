import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { degToRad, polarToVec } from "../../core/util/MathUtil";
import { choose, rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import MuzzleFlash from "../effects/MuzzleFlash";
import ShellCasing from "../effects/ShellCasing";
import Bullet from "../entities/Bullet";
import Human from "../entities/human/Human";
import { FireMode, GunStats, ReloadingStyle } from "./GunStats";

export default class Gun extends BaseEntity implements Entity {
  stats: GunStats;
  shootCooldown: number = 0;
  ammo: number;
  isReloading: boolean = false;

  constructor(stats: GunStats) {
    super();
    this.stats = stats;
    this.ammo = this.stats.ammoCapacity;
  }

  canShoot(): boolean {
    return !this.isReloading && this.shootCooldown <= 0 && this.ammo > 0;
  }

  pullTrigger(shooter: Human) {
    if (this.isReloading) {
      if (this.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL) {
        this.cancelReload();
        this.playSound("reload", shooter.getPosition(), 2);
      }
    } else if (this.shootCooldown <= 0) {
      const direction = shooter.getDirection();
      const muzzlePosition = shooter
        .getPosition()
        .add(polarToVec(direction, this.stats.muzzleLength));

      if (this.ammo > 0) {
        // Actually shoot
        this.onShoot(muzzlePosition, direction, shooter);
      } else {
        this.playSound("empty", muzzlePosition);
      }
    }
  }

  async onShoot(position: V2d, direction: number, shooter: Human) {
    // Actual shot
    this.makeProjectile(position, direction, shooter);

    this.shootCooldown += 1.0 / this.stats.fireRate;
    this.ammo -= 1;

    // Various effects
    this.playSound("shoot", position);
    this.game?.addEntity(new MuzzleFlash(position, direction));

    //
    if (this.stats.fireMode === FireMode.PUMP) {
      await this.wait(0.1);
      this.playSound("pump", shooter.getPosition());
      this.makeShellCasing(direction, shooter);
    } else {
      this.makeShellCasing(direction, shooter);
    }
  }

  makeShellCasing(direction: number, shooter: Human) {
    const position = shooter
      .getPosition()
      .add(polarToVec(direction, this.stats.muzzleLength * 0.5)); // Halfway seems to be a good estimate
    this.game?.addEntity(
      new ShellCasing(
        position,
        direction + Math.PI / 2,
        direction,
        this.stats.textures.shellCasing
      )
    );
  }

  makeProjectile(position: V2d, direction: number, shooter: Human) {
    for (let i = 0; i < this.stats.bulletsPerShot; i++) {
      const spread = rUniform(
        -this.stats.bulletSpread / 2,
        this.stats.bulletSpread / 2
      );
      this.game?.addEntity(
        new Bullet(
          position,
          direction + spread,
          this.stats.muzzleVelocity * rUniform(0.9, 1.1),
          this.stats.bulletDamage,
          shooter
        )
      );
    }
  }

  async reload(shooter: Human) {
    if (!this.isReloading && this.ammo < this.stats.ammoCapacity) {
      if (this.stats.reloadingStyle === ReloadingStyle.MAGAZINE) {
        this.isReloading = true;
        const soundIndex = this.ammo > 0 ? 0 : 1; // play a special sound for reloading while empty
        this.playSound("reload", shooter.getPosition(), soundIndex);
        this.ammo = 0;
        await this.wait(this.stats.reloadTime, undefined, "reload");
        this.playSound("reloadFinish", shooter.getPosition());
        this.ammo = this.stats.ammoCapacity;
        this.isReloading = false;
      } else if (this.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL) {
        this.playSound("reload", shooter.getPosition());
        this.isReloading = true;
        await this.wait(this.stats.reloadTime, undefined, "reload");
        while (this.ammo < this.stats.ammoCapacity) {
          this.playSound("reloadInsert", shooter.getPosition(), 1);
          await this.wait(this.stats.reloadTime, undefined, "reload");
          this.ammo += 1;
        }
        this.playSound("reloadFinish", shooter.getPosition());
        this.isReloading = false;
      }
    }
  }

  cancelReload() {
    this.clearTimers("reload");
    this.isReloading = false;
  }

  onTick(dt: number) {
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }
  }

  playSound(
    soundClass: keyof GunStats["sounds"],
    position: V2d,
    index: number = -1
  ): PositionalSound | undefined {
    const sounds = this.stats.sounds[soundClass];
    if (sounds?.length) {
      const sound = sounds[index] ?? choose(...sounds);
      return this.game?.addEntity(
        new PositionalSound(sound, position, { gain: 0.5 })
      );
    }
  }
}
