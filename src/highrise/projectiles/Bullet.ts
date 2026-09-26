import { Graphics } from "pixi.js";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { polarToVec } from "../../core/util/MathUtil";
import { V2d } from "../../core/Vector";
import { isHittable } from "../environment/Hittable";
import { getFireGrid } from "../fire/FireGrid";
import Human from "../human/Human";
import Light from "../lighting-and-vision/Light";
import { BulletStats } from "../weapons/guns/BulletStats";
import { HitResult, Projectile } from "./Projectile";

export default class Bullet extends Projectile implements Entity {
  sprite: Graphics & GameSprite;
  light: Light;
  lightGraphics: Graphics;

  constructor(
    position: V2d,
    direction: number,
    public stats: BulletStats,
    public readonly shooter?: Human,
  ) {
    super(position, polarToVec(direction, stats.muzzleVelocity));

    this.sprite = new Graphics();
    this.sprite.layerName = Layer.WEAPONS;

    this.lightGraphics = new Graphics();
    this.light = this.addChild(new Light());
    this.light.lightSprite.addChild(this.lightGraphics);
  }

  makeCollisionMask() {
    return (
      CollisionGroups.All ^ CollisionGroups.Humans ^ CollisionGroups.Furniture
    );
  }

  get damage(): number {
    return (
      this.stats.damage *
      (this.shooter?.stats.damage ?? 1) *
      (this.velocity.magnitude / this.stats.muzzleVelocity)
    );
  }

  /** Also carves the bullet's path through any smoke */
  checkForCollision(dt: number): HitResult | undefined {
    const from = (this.sweepFrom ?? this.position).clone();
    const hit = super.checkForCollision(dt);
    const to = hit?.hitPosition ?? this.position.addScaled(this.velocity, dt);
    getFireGrid(this.game)?.smoke.disturb(from, to);
    return hit;
  }

  handleHit({ hitPosition, hitNormal, hit }: HitResult) {
    if (isHittable(hit)) {
      return hit.hitByBullet(this, hitPosition, hitNormal);
    }

    return false;
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
    this.light.lightSprite.position.copyFrom(this.renderPosition);
  }
}
