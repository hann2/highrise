import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { polarToVec } from "../../../core/util/MathUtil";
import { choose, rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import MuzzleFlash from "../../effects/MuzzleFlash";
import Bullet from "../Bullet";
import Human from "../Human";
import { FireMode, GunStats, ReloadingStyle } from "./GunStats";

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
    pump: ["shotgunPump1"],
  },
};

export default class Gun extends BaseEntity implements Entity {
  stats: GunStats;
  shootCooldown: number = 0;
  ammo: number;
  isReloading: boolean = false;

  constructor(stats: Partial<GunStats> = {}) {
    super();
    this.stats = {
      ...defaultGunStats,
      ...stats,
      sounds: { ...defaultGunStats.sounds, ...stats.sounds },
    };
    this.ammo = this.stats.ammoCapacity;
  }

  async pullTrigger(shooter: Human) {
    if (this.isReloading) {
      if (this.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL) {
        this.cancelReload();
        this.playSound("pump", shooter.getPosition());
      }
    } else if (this.shootCooldown <= 0) {
      const direction = shooter.getDirection();
      const muzzlePosition = shooter
        .getPosition()
        .add(polarToVec(direction, this.stats.muzzleLength));

      if (this.ammo > 0) {
        // Actually shoot
        this.makeProjectile(muzzlePosition, direction);
        this.playSound("shoot", muzzlePosition);
        this.game?.addEntity(new MuzzleFlash(muzzlePosition, direction));
        this.shootCooldown += 1.0 / this.stats.fireRate;
        this.ammo -= 1;

        if (this.stats.fireMode === FireMode.PUMP) {
          await this.wait(0.1);
          this.playSound("pump", shooter.getPosition());
        }
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
    if (sounds?.length) {
      const sound = choose(...sounds);
      return this.game?.addEntity(new PositionalSound(sound, position));
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

  async reload(shooter: Human) {
    if (!this.isReloading && this.ammo < this.stats.ammoCapacity) {
      if (this.stats.reloadingStyle === ReloadingStyle.MAGAZINE) {
        console.log("start magazine reloading", this.stats.ammoCapacity);
        this.isReloading = true;
        this.playSound("reload", shooter.getPosition());
        this.ammo = 0;
        await this.wait(this.stats.reloadTime, undefined, "reload");
        this.ammo = this.stats.ammoCapacity;
        this.isReloading = false;
        console.log(
          "end magazine reloading",
          this.stats.ammoCapacity,
          this.ammo
        );
      } else if (this.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL) {
        console.log("start individual reloading");
        this.isReloading = true;
        while (this.ammo < this.stats.ammoCapacity) {
          this.playSound("reload", shooter.getPosition());
          await this.wait(this.stats.reloadTime, undefined, "reload");
          this.ammo += 1;
        }
        this.playSound("pump", shooter.getPosition());
        this.isReloading = false;
        console.log("end individual reloading");
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
}
