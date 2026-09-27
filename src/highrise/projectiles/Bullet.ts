import { Graphics } from "pixi.js";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { polarToVec } from "../../core/util/MathUtil";
import { V2d } from "../../core/Vector";
import { isEnemy } from "../enemies/base/Enemy";
import { isHittable } from "../environment/Hittable";
import { getFireGrid } from "../fire/FireGrid";
import Human from "../human/Human";
import Light from "../lighting-and-vision/Light";
import { BulletStats, LONG_RANGE } from "../weapons/guns/BulletStats";
import type Gun from "../weapons/guns/Gun";
import { HitResult, Projectile, projectileRaycast } from "./Projectile";

export default class Bullet extends Projectile implements Entity {
  sprite: Graphics & GameSprite;
  light: Light;
  lightGraphics: Graphics;

  // Set by the gun that fires it, from its attachments and the shooter's items
  /** The gun that fired it */
  gun?: Gun;
  /** Sets what it hits on fire */
  incendiary = false;
  /** Enemies it can still go through */
  pierce = 0;
  /** Every this many of the gun's enemy hits, it goes off (Exploding Rounds) */
  explodeEvery?: number;
  /** Bounces off walls left */
  ricochets = 0;
  /** Multiplier on its damage (the last round in the magazine) */
  damageMultiplier = 1;
  /** Multiplier on its damage once it's gone `LONG_RANGE` */
  longRangeDamage = 1;
  /** A kill puts the round back in the gun */
  refundOnKill = false;
  /** Where it was fired from */
  private origin: V2d;
  /** Enemies it went through, so it doesn't hit them again */
  private pierced = new Set<Entity>();

  constructor(
    position: V2d,
    direction: number,
    public stats: BulletStats,
    public readonly shooter?: Human,
  ) {
    super(position, polarToVec(direction, stats.muzzleVelocity));
    this.origin = position.clone();

    this.sprite = new Graphics();
    this.sprite.layerName = Layer.WEAPONS;

    this.lightGraphics = new Graphics();
    this.light = this.addChild(new Light(this.lightGraphics));
  }

  makeCollisionMask() {
    return (
      CollisionGroups.All ^ CollisionGroups.Humans ^ CollisionGroups.Furniture
    );
  }

  get damage(): number {
    const longRange =
      this.position.distanceTo(this.origin) > LONG_RANGE
        ? this.longRangeDamage
        : 1;
    return (
      this.stats.damage *
      (this.shooter?.stats.damage ?? 1) *
      (this.velocity.magnitude / this.stats.muzzleVelocity) *
      this.damageMultiplier *
      longRange
    );
  }

  /**
   * Like any projectile's, but going straight through the enemies it's
   * already pierced, and carving its path through any smoke
   */
  checkForCollision(dt: number): HitResult | undefined {
    const from = (this.sweepFrom ?? this.position).clone();
    this.sweepFrom = undefined;
    const hit = projectileRaycast(
      this.game,
      from,
      this.position.addScaled(this.velocity, dt),
      this.makeCollisionMask(),
      this.pierced,
    );
    const to = hit?.hitPosition ?? this.position.addScaled(this.velocity, dt);
    getFireGrid(this.game)?.smoke.disturb(from, to);
    return hit;
  }

  handleHit({ hitPosition, hitNormal, hit }: HitResult) {
    if (!isHittable(hit)) {
      return false;
    }
    const stopped = hit.hitByBullet(this, hitPosition, hitNormal);
    if (isEnemy(hit)) {
      // Through it and on to the next (Armor Piercing)
      if (stopped && this.pierce > 0) {
        this.pierce -= 1;
        this.pierced.add(hit);
        return false;
      }
      return stopped;
    }
    // Off a wall (Buckshot Bounce)
    if (stopped && this.ricochets > 0) {
      this.ricochets -= 1;
      const normal = hitNormal.clone().inormalize();
      this.velocity.isub(normal.mul(2 * this.velocity.dot(normal)));
      this.position.set(hitPosition.add(normal.mul(0.02)));
      return false;
    }
    return stopped;
  }

  // In local coordinates, the end point to render
  getRelativeEndPoint(dt: number) {
    if (this.hitPosition) {
      return this.hitPosition.sub(this.renderPosition);
    } else {
      return this.velocity.mul(dt);
    }
  }

  @on("render")
  onRender(dt: number) {
    const endPoint = this.getRelativeEndPoint(dt);

    this.sprite
      .clear()
      .moveTo(0, 0)
      .lineTo(endPoint.x, endPoint.y)
      .stroke({ width: 0.03, color: this.stats.color, alpha: 0.6 });

    this.lightGraphics
      .clear()
      .moveTo(0, 0)
      .lineTo(endPoint.x, endPoint.y)
      .stroke({ width: 0.2, color: this.stats.color, alpha: 1.0 });

    this.sprite.position.copyFrom(this.renderPosition);
    this.lightGraphics.position.copyFrom(this.renderPosition);
  }
}
