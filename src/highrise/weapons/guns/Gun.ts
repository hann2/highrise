import { SoundName } from "../../../../resources/resources";
import { CollisionGroups } from "../../../config/CollisionGroups";
import { AnimationPlayer } from "../../../core/animation/AnimationPlayer";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { on } from "../../../core/entity/handler";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import {
  clamp,
  degToRad,
  polarToVec,
  smoothStep,
  stepToward,
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
import {
  GUN_SMOKE_DISTANCE,
  GUN_SMOKE_PER_PELLET,
  GUN_SMOKE_PER_SHOT,
  GUN_SMOKE_RADIUS,
} from "../../fire/fireConstants";
import { getFireGrid } from "../../fire/FireGrid";
import Human from "../../human/Human";
import Bullet from "../../projectiles/Bullet";
import { PhasedAction } from "../../utils/PhasedAction";
import { ShuffleRing } from "../../utils/ShuffleRing";
import {
  blendGunPoses,
  GunAdjustments,
  GunEvent,
  GunPose,
  GunTracks,
  muzzleOf,
  PartAmounts,
  pointOnGun,
  poseGun,
} from "./GunPose";
import {
  bulletSpeed,
  EjectionType,
  GunAnimations,
  GunSoundName,
  GunSounds,
  GunStats,
  ReloadingStyle,
} from "./GunStats";

// Pulling the gun in when it would poke through a wall. It first slides back
// toward the body until the grip is at MIN_GRIP_X, then swings aside around the
// grip, up to MAX_WALL_TILT.
/** How far in front of the muzzle a wall has to be to leave the gun alone */
const WALL_MARGIN = 0.1; // meters
/** Closest the grip hand can come to the shoulders */
const MIN_GRIP_X = 0.12; // meters, forward of the body's center
const MAX_WALL_TILT = degToRad(75);
/** Past this the gun isn't pointed anywhere useful, so it won't fire */
const MAX_FIRING_TILT = degToRad(20);
/** Meters per second. Pulling in is quick so the gun doesn't lag into a wall */
const RETRACT_SPEED = 8;
const EXTEND_SPEED = 3;

/** Seconds of the pump's stroke: back (when the shell comes out), held, and forward */
const PUMP_BACK = 0.15;
const PUMP_HOLD = 0.05;
const PUMP_FORWARD = 0.13;
/**
 * Seconds a slide or bolt takes to go back and forward after a shot (a real
 * one's quicker, but this is a few frames), at most this share of the time
 * between shots, and the share of it spent going back
 */
const CYCLE_TIME = 0.08;
const CYCLE_SHARE = 0.8;
const CYCLE_BACK = 0.3;
/** Meters off the floor a dropped magazine falls from */
const MAGAZINE_DROP_HEIGHT = 0.9;
// TODO: A real magazine hitting the floor
const MAGAZINE_DROP_SOUNDS: SoundName[] = ["glowStickDrop1", "glowStickDrop2"];

export default class Gun extends BaseEntity implements Entity {
  // All the defining characteristics of this gun
  stats: GunStats;
  // Seconds until we can shoot again
  shootCooldown: number = 0;
  // Amount of ammo currently loaded in the gun
  ammo: number;
  // Whether this gun's bonus reserve (`NEW_GUN_RESERVE_BONUS`) has been handed
  // out, so dropping it and picking it up again doesn't make ammo
  reserveBonusGiven = false;

  reloadAction: PhasedAction<"start" | "insert" | "finish", [Human]>;
  // Easy way to play random characteristic sounds for this gun
  sounds: GunSoundRings;
  /** Working the pump after a shot (or a reload), which it can't fire during. Unused for non-pump guns */
  pumping = false;
  // How many shells we've fired that haven't been ejected yet
  shellsToEject = 0;

  aimOffset = 0;
  /**
   * How far the gun is slid back by recoil, in meters, and how fast it's
   * moving: a critically damped spring that each shot kicks back
   * (`GunStats.recoilSlide`, `recoilTime`)
   */
  private recoilSlide = 0;
  private recoilVelocity = 0;
  /** Kicks from shots this tick, put into the spring after it's moved on */
  private recoilKick = 0;
  /** Seconds since the last shot, for the parts that cycle with each one (`GunStats.cycles`) */
  private sinceShot = Infinity;
  /** How far the muzzle is pulled back from its usual spot to keep it out of a wall */
  wallRetraction = 0;
  /**
   * Plays the gun's animations (`GunStats.animations`): how it's held and
   * worked, beyond the gameplay, and the sounds of it
   */
  readonly animator = new AnimationPlayer<GunTracks, GunEvent>((event) =>
    this.handleAnimationEvent(event),
  );
  /** Who's working the gun in the animation playing, for its events */
  private animatedBy?: Human;

  /** Whether whoever has it holds it left-handed, which mirrors how it's held (see `poseGun`) */
  get leftHanded(): boolean {
    return this.parent instanceof Human && this.parent.leftHanded;
  }

  /** How far to the holder's right it's held: `sideOffset`, mirrored left-handed */
  get side(): number {
    return this.leftHanded ? -this.stats.sideOffset : this.stats.sideOffset;
  }

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
          startAction: (shooter: Human) =>
            this.startReloadPart("reloadStart", "reload", shooter),
        },
        {
          name: "insert",
          duration: (shooter: Human) =>
            this.stats.reloadInsertTime / shooter.stats.reloadSpeed,
          startAction: (shooter: Human) =>
            this.startReloadPart("reloadInsert", "reloadInsert", shooter),
          endAction: (shooter: Human) => {
            if (this.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL) {
              this.ammo += shooter.takeReserve(this.stats.ammoClass, 1);
            } else {
              this.loadFromReserve(shooter);
            }
          },
        },
        {
          name: "finish",
          duration: (shooter: Human) =>
            this.stats.reloadEndTime / shooter.stats.reloadSpeed,
          startAction: (shooter: Human) => {
            if (this.stats.ejectionType === EjectionType.PUMP) {
              this.pump(shooter);
            } else {
              this.startReloadPart("reloadFinish", "reloadFinish", shooter);
            }
          },
        },
      ]),
    );
  }

  /** Whether the reload going on is animated (and so makes its own sounds) */
  private reloadAnimated = false;

  /**
   * Plays the animation for a part of a reload, if the gun has one and loads
   * a round at a time (a magazine gun's reload is one animation, played when
   * it starts), or else that part's sound
   */
  private startReloadPart(
    animation: "reloadStart" | "reloadInsert" | "reloadFinish",
    sound: GunSoundName,
    shooter: Human,
  ) {
    if (this.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL) {
      this.reloadAnimated = this.animate(animation, shooter);
    }
    if (!this.reloadAnimated) {
      this.playSound(sound, shooter.getPosition());
    }
  }

  // Whether or not we're currently in the middle of reloading
  get isReloading() {
    return this.reloadAction.isActive();
  }

  canShoot(): boolean {
    return (
      !this.isReloading &&
      this.shootCooldown <= 0 &&
      this.ammo > 0 &&
      !this.isRaisedByWall()
    );
  }

  /** Whether the gun is swung so far aside by a wall that it can't fire */
  isRaisedByWall(): boolean {
    return this.getWallPose().tilt > MAX_FIRING_TILT;
  }

  // Pull the trigger and do whatever the gun will do when that happens
  pullTrigger(shooter: Human) {
    if (this.isReloading) {
      if (this.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL) {
        this.cancelReload();
        this.playSound("reloadFinish", shooter.getPosition());
      }
    } else if (
      this.shootCooldown <= 0 &&
      !this.pumping &&
      !this.isRaisedByWall()
    ) {
      const pose = this.getPose();
      const direction = shooter.getDirection() + pose.angle;
      const muzzlePosition = shooter.localToWorld(muzzleOf(this.stats, pose));

      if (this.ammo > 0) {
        // Actually shoot
        this.shoot(muzzlePosition, direction, shooter);
      } else {
        this.playSound("empty", muzzlePosition);
      }
    }
  }

  /** Enemies this gun's bullets have hit, for attachments that count hits */
  enemyHits = 0;
  private statsCache?: { shooter: Human; version: number; stats: GunStats };

  /**
   * The gun's stats with the attachments `shooter` has for it (see
   * `Human.attachmentsFor`) applied. Cached until their attachments change.
   */
  effectiveStats(shooter?: Human): GunStats {
    if (!shooter || shooter.attachments.length === 0) {
      return this.stats;
    }
    const cache = this.statsCache;
    if (
      cache?.shooter === shooter &&
      cache.version === shooter.attachmentsVersion
    ) {
      return cache.stats;
    }
    let stats = this.stats;
    for (const attachment of shooter.attachmentsFor(this)) {
      if (attachment.modify) {
        stats = { ...stats, ...attachment.modify(stats) };
      }
    }
    this.statsCache = { shooter, version: shooter.attachmentsVersion, stats };
    return stats;
  }

  // Called when actually shooting a bullet
  async shoot(position: V2d, direction: number, shooter: Human) {
    const stats = this.effectiveStats(shooter);
    // Actual shot
    this.makeProjectile(position, direction, shooter);

    this.shootCooldown += 1.0 / (stats.fireRate * shooter.stats.fireRate);
    this.ammo -= 1;
    this.shellsToEject += 1;
    this.aimOffset += rSign() * stats.recoilAmount;
    this.recoilKick += 1;
    this.sinceShot = 0;

    // Various effects
    this.playSound("shoot", position);
    this.game.addEntity(
      new MuzzleFlash(
        position,
        direction,
        stats.flash,
        () =>
          shooter.weapon === this && !shooter.isDestroyed
            ? shooter.localToWorld(this.getMuzzlePosition())
            : undefined,
        undefined,
        this.leftHanded,
      ),
    );
    this.makeSmoke(position, direction);

    if (this.stats.ejectionType === EjectionType.AUTOMATIC) {
      this.makeShellCasing(shooter);
    } else if (this.stats.ejectionType === EjectionType.PUMP) {
      await this.wait(0.175);
      this.pump(shooter);
    }
  }

  /** Back (ejecting the shell at the back of the stroke), and forward again */
  private async pump(shooter: Human) {
    this.pumping = true;
    if (!this.animate("pump", shooter)) {
      this.playSound("pump", shooter.getPosition());
    }
    await this.wait(PUMP_BACK, undefined, "pump");
    if (this.shellsToEject > 0) {
      this.makeShellCasing(shooter);
    }
    await this.wait(PUMP_HOLD + PUMP_FORWARD, undefined, "pump");
    this.pumping = false;
  }

  /** Seconds `shooter` takes for what one of the gun's animations shows (what it's stretched to) */
  animationDuration(name: keyof GunAnimations, shooter: Human): number {
    const { reloadStartTime, reloadInsertTime, reloadEndTime } = this.stats;
    const speed = shooter.stats.reloadSpeed;
    switch (name) {
      case "reload":
      case "reloadEmpty":
        return (reloadStartTime + reloadInsertTime + reloadEndTime) / speed;
      case "reloadStart":
        return reloadStartTime / speed;
      case "reloadInsert":
        return reloadInsertTime / speed;
      case "reloadFinish":
        return reloadEndTime / speed;
      case "pump":
        return PUMP_BACK + PUMP_HOLD + PUMP_FORWARD;
    }
  }

  /**
   * Plays one of the gun's animations as worked by `shooter`, stretched to
   * the time it takes them. False if the gun doesn't have it.
   */
  animate(name: keyof GunAnimations, shooter: Human): boolean {
    const animation = this.stats.animations[name];
    if (animation) {
      this.animatedBy = shooter;
      this.animator.play(animation, {
        duration: this.animationDuration(name, shooter),
      });
    }
    return animation !== undefined;
  }

  private handleAnimationEvent(event: GunEvent) {
    const shooter = this.animatedBy;
    if (!shooter || !this.isAdded) {
      return;
    }
    if ("sound" in event) {
      const { sound, offset, duration, gain } = event;
      this.game.addEntity(
        new PositionalSound(sound, shooter.getPosition(), {
          offset,
          duration,
          gain,
        }),
      );
    } else if ("gunSound" in event) {
      this.playSound(event.gunSound, shooter.getPosition());
    } else if (event.effect === "dropMagazine") {
      this.dropMagazine(shooter);
    }
  }

  /** Lets the magazine fall out of the gun to the floor */
  private dropMagazine(shooter: Human) {
    const { magazine, points } = this.stats;
    if (!magazine) {
      return;
    }
    const pose = this.getPose();
    const position = shooter.localToWorld(pointOnGun(pose, points.magazine));
    const velocity = shooter.body.velocity
      .clone()
      .iadd(polarToVec(rDirection(), rUniform(0, 0.4)));
    this.game.addEntity(
      new ShellCasing(
        position,
        velocity,
        shooter.getDirection() + pose.angle,
        magazine.texture,
        MAGAZINE_DROP_SOUNDS,
        { size: magazine.length, height: MAGAZINE_DROP_HEIGHT, spin: 0.15 },
      ),
    );
  }

  makeShellCasing(shooter: Human) {
    this.shellsToEject -= 1;
    const shooterDirection = shooter.getDirection();
    const position = shooter.localToWorld(
      V(this.stats.holdPosition).iadd([0, this.side]),
    );
    // Out of its right side, which held left-handed (mirrored) is its left
    const out = this.leftHanded ? -Math.PI / 2 : Math.PI / 2;

    let velocity;
    if (this.stats.ejectionType === EjectionType.RELOAD) {
      velocity = polarToVec(rDirection(), rUniform(0, 1));
    } else {
      velocity = polarToVec(
        rNormal(shooterDirection + out, degToRad(20)),
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

  /** A puff of gun smoke just in front of the muzzle */
  private makeSmoke(position: V2d, direction: number) {
    const smoke = getFireGrid(this.game)?.smoke;
    if (smoke) {
      const amount =
        this.stats.smoke ??
        GUN_SMOKE_PER_SHOT *
          (1 +
            GUN_SMOKE_PER_PELLET * (this.stats.bulletStats.bulletsPerShot - 1));
      smoke.puff(
        position.add(polarToVec(direction, GUN_SMOKE_DISTANCE)),
        GUN_SMOKE_RADIUS,
        amount,
      );
    }
  }

  makeProjectile(position: V2d, direction: number, shooter: Human) {
    const stats = this.effectiveStats(shooter);
    const attachments = shooter.attachmentsFor(this);
    const family = stats.ammoClass;
    // Before the round is taken out, so 1 means this is the last
    const lastRound = this.ammo === 1;
    for (let i = 0; i < stats.bulletStats.bulletsPerShot; i++) {
      const maxSpread = stats.bulletSpread * shooter.stats.spread;
      const spread = rUniform(-maxSpread / 2, maxSpread / 2);
      const bullet = new Bullet(
        position.clone(),
        direction + spread,
        stats.bulletStats,
        stats.muzzleVelocity / bulletSpeed.slowdown,
        shooter,
      );
      // What the attachments and the shooter's items do to this bullet
      bullet.gun = this;
      bullet.incendiary = attachments.some((a) => a.incendiary);
      bullet.pierce = attachments.reduce((sum, a) => sum + (a.pierce ?? 0), 0);
      bullet.explodeEvery = attachments.find(
        (a) => a.explodeEvery,
      )?.explodeEvery;
      bullet.ricochets =
        family === "shotgun" ? shooter.stats.shotgunRicochets : 0;
      bullet.damageMultiplier = lastRound ? shooter.stats.lastRoundDamage : 1;
      bullet.longRangeDamage =
        family === "rifle" ? shooter.stats.rifleLongRangeDamage : 1;
      bullet.refundOnKill =
        family === "pistol" && shooter.stats.pistolKillRefund;
      // Anything between the shooter and the muzzle gets hit too
      bullet.sweepFrom = shooter.getPosition();
      this.game.addEntity(bullet);
    }
  }

  /** How many rounds this gun holds for `shooter`, whose attachments can enlarge the magazine */
  getCapacity(shooter?: Human): number {
    return this.effectiveStats(shooter).ammoCapacity;
  }

  /** Whether reloading would do anything: there's room in the gun and rounds in `shooter`'s reserve */
  canReload(shooter: Human): boolean {
    return (
      !this.isReloading &&
      this.ammo < this.getCapacity(shooter) &&
      shooter.getReserve(this.stats.ammoClass) > 0
    );
  }

  /** Fills the gun from `shooter`'s reserve, as far as the reserve goes */
  private loadFromReserve(shooter: Human) {
    const wanted = Math.max(0, this.getCapacity(shooter) - this.ammo);
    this.ammo += shooter.takeReserve(this.stats.ammoClass, wanted);
  }

  async reload(shooter: Human) {
    if (!this.canReload(shooter)) {
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
      this.loadFromReserve(shooter);
      this.playSound("reload", shooter.getPosition());
    } else if (this.stats.reloadingStyle === ReloadingStyle.MAGAZINE) {
      this.reloadAnimated =
        (this.ammo === 0 && this.animate("reloadEmpty", shooter)) ||
        this.animate("reload", shooter);
      await this.reloadAction.do(shooter);
    } else if (this.stats.reloadingStyle === ReloadingStyle.INDIVIDUAL) {
      await this.reloadAction.doSinglePhase("start", shooter);
      while (
        this.ammo < this.getCapacity(shooter) &&
        shooter.getReserve(this.stats.ammoClass) > 0
      ) {
        await this.reloadAction.doSinglePhase("insert", shooter);
      }
      await this.reloadAction.doSinglePhase("finish", shooter);
    }
  }

  cancelReload() {
    if (this.isReloading) {
      this.animator.stop();
    }
    this.reloadAction.reset();
  }

  @on("tick")
  onTick(dt: number) {
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }

    this.aimOffset *= Math.exp(-dt * this.stats.recoilRecovery);
    this.updateRecoil(dt);
    this.sinceShot += dt;
    this.animator.advance(dt);
  }

  /**
   * Moves the recoil spring on by `dt` (exactly, so it's the same at any tick
   * rate), then kicks it with this tick's shots. Kicked after, so the frame a
   * shot goes off shows the gun where it fired from, not already slid back
   */
  private updateRecoil(dt: number) {
    const omega = 1 / this.stats.recoilTime;
    const decay = Math.exp(-omega * dt);
    const x = this.recoilSlide;
    const v = this.recoilVelocity;
    const w = (v + omega * x) * dt;
    this.recoilSlide = (x + w) * decay;
    this.recoilVelocity = (v - omega * w) * decay;
    // A kick of this speed takes it recoilSlide back at its furthest
    this.recoilVelocity +=
      this.recoilKick * this.stats.recoilSlide * Math.E * omega;
    this.recoilKick = 0;
  }

  /** Pulls the gun in (or lets it back out) depending on how close the wall in front of `holder` is */
  updateWallRetraction(holder: Human, dt: number) {
    const reach = this.stats.holdPosition[0] + this.stats.muzzleLength / 2;
    const side = this.side;
    const hit = this.game.world.raycast(
      holder.localToWorld([0, side]),
      holder.localToWorld([reach + WALL_MARGIN, side]),
      { collisionMask: CollisionGroups.Walls, skipBackfaces: true },
    );
    const target = hit ? reach + WALL_MARGIN - hit.distance : 0;
    const speed = target > this.wallRetraction ? RETRACT_SPEED : EXTEND_SPEED;
    this.wallRetraction = stepToward(this.wallRetraction, target, dt * speed);
  }

  /** How `wallRetraction` is split between sliding the gun back and swinging it aside */
  private getWallPose(): { slide: number; tilt: number } {
    if (this.wallRetraction <= 0) {
      return { slide: 0, tilt: 0 };
    }
    const gripX = this.stats.holdPosition[0] + this.stats.points.grip[0];
    const slide = clamp(
      this.wallRetraction,
      0,
      Math.max(0, gripX - MIN_GRIP_X),
    );
    // The rest comes from swinging the barrel aside around the grip
    const barrel =
      this.stats.holdPosition[0] + this.stats.muzzleLength / 2 - gripX;
    const cos = (barrel - (this.wallRetraction - slide)) / barrel;
    const tilt = Math.min(Math.acos(clamp(cos, -1, 1)), MAX_WALL_TILT);
    return { slide, tilt };
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

  /**
   * Where the gun and the hands holding it are, in the holder's frame: the
   * animation playing, moved by recoil, a wall in the way, and `push` meters
   * and `twist` radians of a push (see `poseGun`)
   */
  getPose(push = 0, twist = 0): GunPose {
    const wall = this.getWallPose();
    const adjust: GunAdjustments = {
      recoil: this.recoilSlide,
      kick: this.aimOffset,
      wallSlide: wall.slide,
      wallTilt: wall.tilt,
      push,
      twist,
      parts: this.getCyclingParts(),
      leftHanded: this.leftHanded,
    };
    return this.animator.pose(
      (frame) => poseGun(this.stats, frame, adjust),
      () => poseGun(this.stats, undefined, adjust),
      blendGunPoses,
    );
  }

  /**
   * How far back the parts that cycle with each shot are: snapped back, then
   * eased forward, within the time between shots, or held back once the last
   * round's gone if the gun locks back. The frame a shot goes off shows them
   * at rest, like the recoil.
   */
  private getCyclingParts(): PartAmounts {
    const { cycles, locksBackWhenEmpty, fireRate } = this.stats;
    if (!cycles) {
      return {};
    }
    const time = Math.min(CYCLE_TIME, CYCLE_SHARE / fireRate);
    const back = time * CYCLE_BACK;
    const t = this.sinceShot;
    let amount =
      t < back
        ? t / back
        : t < time
          ? 1 - smoothStep((t - back) / (time - back))
          : 0;
    if (locksBackWhenEmpty && this.ammo === 0 && t >= back) {
      amount = 1;
    }
    const parts: PartAmounts = {};
    for (const part of cycles) {
      parts[part] = amount;
    }
    return parts;
  }

  /** Which way the gun points, from the way its holder faces */
  getCurrentHoldAngle(): number {
    return this.getPose().angle;
  }

  /** Where the muzzle is, in the holder's frame */
  getMuzzlePosition(): V2d {
    return muzzleOf(this.stats, this.getPose());
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
