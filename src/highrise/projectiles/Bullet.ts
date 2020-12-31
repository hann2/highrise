import { Graphics } from "pixi.js";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { polarToVec } from "../../core/util/MathUtil";
import { V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Layer } from "../config/layers";
import { isHittable } from "../environment/Hittable";
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
    public readonly shooter?: Human
  ) {
    super(position, polarToVec(direction, stats.muzzleVelocity));

    this.sprite = new Graphics();
    this.sprite.layerName = Layer.WEAPONS;

    this.lightGraphics = new Graphics();
    this.light = this.addChild(new Light());
    this.light.lightSprite.addChild(this.lightGraphics);

    this.renderPosition = position.clone();
  }

  makeCollisionMask() {
    return (
      CollisionGroups.All ^ CollisionGroups.Humans ^ CollisionGroups.Furniture
    );
  }

  get damage(): number {
    return (
      this.stats.damage * (this.velocity.magnitude / this.stats.muzzleVelocity)
    );
  }

  onHit({ hitPosition, hitNormal, hit }: HitResult) {
    if (isHittable(hit)) {
      return hit.onBulletHit(this, hitPosition, hitNormal);
    }

    console.log("isn't hittable", hit);
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

  onRender(dt: number) {
    const endPoint = this.getRelativeEndPoint(dt);

    this.sprite
      .clear()
      .lineStyle(0.03, this.stats.color, 0.6)
      .moveTo(0, 0)
      .lineTo(endPoint[0], endPoint[1]);

    this.lightGraphics
      .clear()
      .lineStyle(0.2, this.stats.color, 1.0)
      .moveTo(0, 0)
      .lineTo(endPoint[0], endPoint[1]);

    this.sprite.position.set(...this.renderPosition);
    this.light.lightSprite.position.set(...this.renderPosition);
  }
}
