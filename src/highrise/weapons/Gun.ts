import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { SoundName } from "../../core/resources/sounds";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { polarToVec } from "../../core/util/MathUtil";
import { rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import MuzzleFlash from "../effects/MuzzleFlash";
import ShellCasing from "../effects/ShellCasing";
import Bullet from "../entities/Bullet";
import Human from "../entities/human/Human";
import { ShuffleRing } from "../utils/ShuffleRing";
import {
  FireMode,
  GunSoundName,
  GunSounds,
  GunStats,
  ReloadingStyle,
} from "./GunStats";

export default class Gun extends BaseEntity implements Entity {
  stats: GunStats;
  shootCooldown: number = 0;
  ammo: number;
  isReloading: boolean = false;
  sounds: GunSoundRings;

  constructor(stats: GunStats) {
    super();
    this.stats = stats;
    this.ammo = this.stats.ammoCapacity;

    this.sounds = makeSoundRings(stats.sounds);
  }

  canShoot(): boolean {
    return !this.isReloading && this.shootCooldown <= 0 && this.ammo > 0;
  }

  pullTrigger(shooter: Human) {
    if (this.isReloading) {
      if (this.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL) {
        this.cancelReload();
        this.playSound("reloadFinish", shooter.getPosition());
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
        this.stats.textures.shellCasing,
        this.stats.sounds.shellDrop
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
          position.clone(),
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
        this.playSound("reload", shooter.getPosition());
        this.ammo = 0;
        await this.wait(this.stats.reloadTime, undefined, "reload");
        this.playSound("reloadFinish", shooter.getPosition());
        this.ammo = this.stats.ammoCapacity;
        this.isReloading = false;
      } else if (this.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL) {
        this.playSound("reload", shooter.getPosition());
        this.isReloading = true;
        await this.wait(this.stats.reloadTime * 0.4, undefined, "reload");
        while (this.ammo < this.stats.ammoCapacity) {
          this.playSound("reloadInsert", shooter.getPosition());
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
    soundClass: GunSoundName,
    position: V2d
  ): PositionalSound | undefined {
    const sound = this.sounds[soundClass].getNext();
    if (sound) {
      // TODO: We should really just edit the sound files to be balanced
      const gain = soundClass === "shoot" ? 0.2 : 1.0;
      return this.game?.addEntity(
        new PositionalSound(sound, position, { gain })
      );
    }
  }
}

type GunSoundRings = { [gunSoundName in GunSoundName]: ShuffleRing<SoundName> };
function makeSoundRings(sounds: GunSounds): GunSoundRings {
  const result = {} as any;
  for (const [gunSound, soundNames] of Object.entries(sounds)) {
    result[gunSound as GunSoundName] = new ShuffleRing(
      (soundNames as SoundName[]) ?? []
    );
  }
  return result;
}
