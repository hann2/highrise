import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { SoundName } from "../../core/resources/sounds";
import { PositionalSound } from "../../core/sound/PositionalSound";
import {
  clamp,
  degToRad,
  lerp,
  polarToVec,
  smoothStep,
} from "../../core/util/MathUtil";
import { rNormal, rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import MuzzleFlash from "../effects/MuzzleFlash";
import ShellCasing from "../effects/ShellCasing";
import Human from "../human/Human";
import Bullet from "../projectiles/Bullet";
import { PhasedAction } from "../utils/PhasedAction";
import { ShuffleRing } from "../utils/ShuffleRing";
import {
  EjectionType,
  GunSoundName,
  GunSounds,
  GunStats,
  ReloadingStyle,
} from "./GunStats";

export default class Gun extends BaseEntity implements Entity {
  // All the defining characteristics of this gun
  stats: GunStats;
  // Seconds until we can shoot again
  shootCooldown: number = 0;
  // Amount of ammo currently loaded in the gun
  ammo: number;

  reloadAction: PhasedAction<"start" | "insert" | "finish", [Human]>;
  // Easy way to play random characteristic sounds for this gun
  sounds: GunSoundRings;
  // What percentage we're currently pumping the gun. Unused for non-pump guns
  pumpAmount = 0;
  // How many shells we've fired that haven't been ejected yet
  shellsToEject = 0;

  constructor(stats: GunStats) {
    super();
    this.stats = stats;
    this.ammo = this.stats.ammoCapacity;
    this.sounds = makeSoundRings(stats.sounds);

    this.reloadAction = this.addChild(
      new PhasedAction([
        {
          name: "start",
          duration: this.stats.reloadStartTime,
          startAction: (shooter: Human) => {
            this.playSound("reload", shooter.getPosition());
          },
          endAction: () => {},
        },
        {
          name: "insert",
          duration: this.stats.reloadInsertTime,
          startAction: (shooter: Human) => {
            this.playSound("reloadInsert", shooter.getPosition());
          },
          endAction: () => {
            if (this.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL) {
              this.ammo += 1;
            } else {
              this.ammo = this.stats.ammoCapacity;
            }
          },
        },
        {
          name: "finish",
          duration: this.stats.reloadEndTime,
          startAction: (shooter: Human) => {
            this.playSound("reloadFinish", shooter.getPosition());

            if (this.stats.ejectionType === EjectionType.PUMP) {
              this.pump(shooter);
            } else {
              this.playSound("reloadFinish", shooter.getPosition());
            }
          },

          endAction: () => {},
        },
      ])
    );
  }

  // Whether or not we're currently in the middle of reloading
  get isReloading() {
    return Boolean(this.reloadAction.isActive());
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
    } else if (this.shootCooldown <= 0 && this.pumpAmount <= 0) {
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
    this.shellsToEject += 1;

    // Various effects
    this.playSound("shoot", position);
    this.game?.addEntity(new MuzzleFlash(position, direction));

    if (this.stats.ejectionType === EjectionType.AUTOMATIC) {
      this.makeShellCasing(shooter);
    } else if (this.stats.ejectionType === EjectionType.PUMP) {
      await this.wait(0.175);
      this.pump(shooter);
    }
  }

  private async pump(shooter: Human) {
    this.playSound("pump", shooter.getPosition());
    await this.wait(
      0.15,
      (dt, t) => {
        this.pumpAmount = t;
      },
      "pump"
    );

    await this.wait(0.05, undefined, "pump");
    if (this.shellsToEject > 0) {
      this.makeShellCasing(shooter);
    }

    await this.wait(
      0.13,
      (dt, t) => {
        this.pumpAmount = 1.0 - t;
      },
      "pump"
    );
    this.pumpAmount = 0;
  }

  makeShellCasing(shooter: Human) {
    this.shellsToEject -= 1;
    const shooterDirection = shooter.getDirection();
    const position = shooter.localToWorld(this.stats.holdPosition);

    let velocity;
    if (this.stats.ejectionType === EjectionType.RELOAD) {
      velocity = V(polarToVec(rUniform(0, Math.PI * 2), rUniform(0, 1)));
    } else {
      velocity = polarToVec(
        rNormal(shooterDirection + Math.PI / 2, degToRad(20)),
        4 * rNormal(1, 0.3)
      );
    }

    this.game?.addEntity(
      new ShellCasing(
        position,
        velocity,
        shooterDirection,
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
      if (this.stats.ejectionType === EjectionType.RELOAD) {
        while (this.shellsToEject > 0) {
          this.makeShellCasing(shooter);
          await this.wait(0.02);
        }
      }

      if (this.stats.reloadingStyle === ReloadingStyle.MAGAZINE) {
        await this.reloadAction.do(shooter);
      } else if (this.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL) {
        await this.reloadAction.doSinglePhase("start", shooter);
        while (this.ammo < this.stats.ammoCapacity) {
          await this.reloadAction.doSinglePhase("insert", shooter);
        }
        await this.reloadAction.doSinglePhase("finish", shooter);
      }
    }
  }

  cancelReload() {
    this.reloadAction.reset();
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

  getCurrentRecoilAmount() {
    const maxShootCooldown = 1.0 / this.stats.fireRate;
    return clamp(this.shootCooldown / maxShootCooldown);
  }

  getCurrentHandPositions(): [V2d, V2d] {
    const recoilOffset = -0.125 * this.getCurrentRecoilAmount() ** 1.5;
    const pumpOffset = -0.2 * this.pumpAmount;
    const [leftX, leftY] = this.stats.leftHandPosition;
    const [rightX, rightY] = this.stats.rightHandPosition;

    return [
      V(leftX + recoilOffset + pumpOffset, leftY),
      V(rightX + recoilOffset, rightY),
    ];
  }

  getCurrentHoldPosition(): V2d {
    if (this.isReloading) {
      return V(this.stats.holdPosition).imul(0.9);
    } else {
      const recoilOffset = -0.125 * this.getCurrentRecoilAmount() ** 1.5;
      return V(this.stats.holdPosition).iadd([recoilOffset, 0]);
    }
  }

  getCurrentHoldAngle(): number {
    if (this.isReloading) {
      const t = smoothStep(this.reloadAction.phasePercent);
      switch (this.reloadAction.currentPhase!.name) {
        case "start":
          return lerp(0, degToRad(-30), t);
        case "insert":
          return degToRad(-30);
        case "finish":
          return lerp(degToRad(-30), 0, t);
      }
    } else {
      return 0;
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
