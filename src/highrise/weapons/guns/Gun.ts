import { SoundName } from "../../../../resources/resources";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { on } from "../../../core/entity/handler";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import {
  clamp,
  degToRad,
  lerp,
  polarToVec,
  smoothStep,
} from "../../../core/util/MathUtil";
import {
  rDirection,
  rNormal,
  rSign,
  rUniform,
} from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import MuzzleFlash from "../../effects/MuzzleFlash";
import ShellCasing from "../../effects/ShellCasing";
import Human from "../../human/Human";
import Bullet from "../../projectiles/Bullet";
import { PhasedAction } from "../../utils/PhasedAction";
import { ShuffleRing } from "../../utils/ShuffleRing";
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

  aimOffset = 0;

  constructor(stats: GunStats) {
    super();
    this.stats = stats;
    this.ammo = this.stats.ammoCapacity;
    this.sounds = makeSoundRings(stats.sounds);

    this.reloadAction = this.addChild(
      new PhasedAction([
        {
          name: "start",
          duration: (shooter: Human) =>
            this.stats.reloadStartTime / shooter.stats.reloadSpeed,
          startAction: (shooter: Human) => {
            this.playSound("reload", shooter.getPosition());
          },
        },
        {
          name: "insert",
          duration: (shooter: Human) =>
            this.stats.reloadInsertTime / shooter.stats.reloadSpeed,
          startAction: (shooter: Human) => {
            this.playSound("reloadInsert", shooter.getPosition());
          },
          endAction: (shooter: Human) => {
            if (this.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL) {
              this.ammo += 1;
            } else {
              this.ammo = this.getCapacity(shooter);
            }
          },
        },
        {
          name: "finish",
          duration: (shooter: Human) =>
            this.stats.reloadEndTime / shooter.stats.reloadSpeed,
          startAction: (shooter: Human) => {
            this.playSound("reloadFinish", shooter.getPosition());

            if (this.stats.ejectionType === EjectionType.PUMP) {
              this.pump(shooter);
            } else {
              this.playSound("reloadFinish", shooter.getPosition());
            }
          },
        },
      ]),
    );
  }

  // Whether or not we're currently in the middle of reloading
  get isReloading() {
    return this.reloadAction.isActive();
  }

  canShoot(): boolean {
    return !this.isReloading && this.shootCooldown <= 0 && this.ammo > 0;
  }

  // Pull the trigger and do whatever the gun will do when that happens
  pullTrigger(shooter: Human) {
    if (this.isReloading) {
      if (this.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL) {
        this.cancelReload();
        this.playSound("reloadFinish", shooter.getPosition());
      }
    } else if (this.shootCooldown <= 0 && this.pumpAmount <= 0) {
      const direction = shooter.getDirection() + this.getCurrentHoldAngle();
      const muzzlePosition = shooter.localToWorld(this.getMuzzlePosition());

      if (this.ammo > 0) {
        // Actually shoot
        this.shoot(muzzlePosition, direction, shooter);
      } else {
        this.playSound("empty", muzzlePosition);
      }
    }
  }

  // Called when actually shooting a bullet
  async shoot(position: V2d, direction: number, shooter: Human) {
    // Actual shot
    this.makeProjectile(position, direction, shooter);

    this.shootCooldown += 1.0 / (this.stats.fireRate * shooter.stats.fireRate);
    this.ammo -= 1;
    this.shellsToEject += 1;
    this.aimOffset += rSign() * this.stats.recoilAmount;

    // Various effects
    this.playSound("shoot", position);
    this.game.addEntity(new MuzzleFlash(position, direction));

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
      "pump",
    );

    if (this.shellsToEject > 0) {
      this.makeShellCasing(shooter);
    }
    await this.wait(0.05, undefined, "pump");

    await this.wait(
      0.13,
      (dt, t) => {
        this.pumpAmount = 1.0 - t;
      },
      "pump",
    );
    this.pumpAmount = 0;
  }

  makeShellCasing(shooter: Human) {
    this.shellsToEject -= 1;
    const shooterDirection = shooter.getDirection();
    const position = shooter.localToWorld(this.stats.holdPosition);

    let velocity;
    if (this.stats.ejectionType === EjectionType.RELOAD) {
      velocity = polarToVec(rDirection(), rUniform(0, 1));
    } else {
      velocity = polarToVec(
        rNormal(shooterDirection + Math.PI / 2, degToRad(20)),
        4 * rNormal(1, 0.3),
      );
    }

    this.game.addEntity(
      new ShellCasing(
        position,
        velocity,
        shooterDirection,
        this.stats.textures.shellCasing,
        this.stats.bulletStats.dropSounds,
      ),
    );
  }

  makeProjectile(position: V2d, direction: number, shooter: Human) {
    for (let i = 0; i < this.stats.bulletStats.bulletsPerShot; i++) {
      const maxSpread = this.stats.bulletSpread * shooter.stats.spread;
      const spread = rUniform(-maxSpread / 2, maxSpread / 2);
      this.game.addEntity(
        new Bullet(
          position.clone(),
          direction + spread,
          this.stats.bulletStats,
          shooter,
        ),
      );
    }
  }

  /** How many rounds this gun holds for `shooter`, whose stats can enlarge the magazine */
  getCapacity(shooter?: Human): number {
    const multiplier = shooter?.stats.magazineSize ?? 1;
    return Math.max(
      this.stats.ammoCapacity,
      Math.round(this.stats.ammoCapacity * multiplier),
    );
  }

  async reload(shooter: Human) {
    const capacity = this.getCapacity(shooter);
    if (this.isReloading || this.ammo >= capacity) {
      return;
    }
    const instant = this.ammo === 0 && shooter.stats.instantEmptyReload;
    if (this.stats.ejectionType === EjectionType.RELOAD) {
      while (this.shellsToEject > 0) {
        this.makeShellCasing(shooter);
        if (!instant) {
          await this.wait(0.02);
        }
      }
    }

    if (instant) {
      this.ammo = capacity;
      this.playSound("reload", shooter.getPosition());
    } else if (this.stats.reloadingStyle === ReloadingStyle.MAGAZINE) {
      await this.reloadAction.do(shooter);
    } else if (this.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL) {
      await this.reloadAction.doSinglePhase("start", shooter);
      while (this.ammo < this.getCapacity(shooter)) {
        await this.reloadAction.doSinglePhase("insert", shooter);
      }
      await this.reloadAction.doSinglePhase("finish", shooter);
    }
  }

  cancelReload() {
    this.reloadAction.reset();
  }

  @on("tick")
  onTick(dt: number) {
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }

    this.aimOffset *= Math.exp(-dt * this.stats.recoilRecovery);
  }

  playSound(
    soundClass: GunSoundName,
    position: V2d,
  ): PositionalSound | undefined {
    const sound = this.sounds[soundClass].getNext();
    if (sound) {
      // TODO: We should really just edit the sound files to be balanced
      const gain = soundClass === "shoot" ? 0.3 : 1.0;
      return this.game.addEntity(
        new PositionalSound(sound, position, { gain }),
      );
    }
  }

  getCurrentRecoilAmount() {
    const maxShootCooldown = 1.0 / this.stats.fireRate;
    return clamp(this.shootCooldown / maxShootCooldown);
  }

  // Returns local positions for where the hands should go
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

  // Returns local coordinates for the center of the gun sprite
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
      return this.aimOffset;
    }
  }

  // Returns the local coordinates for the muzzle position
  getMuzzlePosition(): V2d {
    return this.getCurrentHoldPosition().iadd(
      polarToVec(this.getCurrentHoldAngle(), this.stats.muzzleLength / 2),
    );
  }
}

type GunSoundRings = { [gunSoundName in GunSoundName]: ShuffleRing<SoundName> };

function makeSoundRings(sounds: GunSounds): GunSoundRings {
  const result = {} as GunSoundRings;
  for (const [gunSound, soundNames] of Object.entries(sounds)) {
    result[gunSound as GunSoundName] = new ShuffleRing(soundNames);
  }
  return result;
}
