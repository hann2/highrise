import { Ray, RaycastResult } from "p2";
import { Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite, WithOwner } from "../../core/entity/Entity";
import { polarToVec } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Layer } from "../config/layers";
import Hittable, { isHittable } from "../environment/Hittable";
import Human from "../human/Human";
import Light from "../lighting-and-vision/Light";
import { BulletStats } from "../weapons/guns/BulletStats";
import { Projectile } from "./Projectile";

export const BULLET_RADIUS = 0.05; // meters
const MAX_LIFESPAN = 3.0; // seconds

export default class Bullet extends Projectile implements Entity {
  sprite: Graphics & GameSprite;
  light: Light;
  lightGraphics: Graphics;

  private raycastResult = new RaycastResult();

  renderPosition: V2d;
  hitPosition?: V2d;

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

  get damage(): number {
    return (
      this.stats.damage * (this.velocity.magnitude / this.stats.muzzleVelocity)
    );
  }

  async onAdd() {
    // Make sure we don't have any infinitely living bullets around
    await this.wait(MAX_LIFESPAN, undefined, "life_timer");
    this.destroy();
  }

  onTick(dt: number) {
    if (this.hitPosition) {
      this.destroy();
      return;
    }

    // Every frame we want to render the bullet starting from where we started checking
    this.renderPosition.set(this.position);

    const hitResult = this.checkForCollision(dt);

    if (hitResult) {
      const { hitPosition, hitNormal, hit } = hitResult;
      hitPosition;
      const shouldHit = hit.onBulletHit(this, hitPosition, hitNormal);

      if (shouldHit) {
        this.hitPosition = hitPosition;
        this.destroy();
        return;
      }
    }

    this.position.iaddScaled(this.velocity, dt);
  }

  checkForCollision(
    dt: number
  ): { hit: Hittable; hitNormal: V2d; hitPosition: V2d } | undefined {
    this.raycastResult.reset();
    this.ray.to = this.position.addScaled(this.velocity, dt);
    this.ray.update();

    let hitFraction = Infinity;
    let hit: Hittable | undefined;
    let hitNormal: V2d;
    this.ray.callback = ({ fraction, body, normal }) => {
      const owner = (body as WithOwner).owner;
      if (fraction < hitFraction && isHittable(owner)) {
        hitFraction = fraction;
        hit = owner;
        // To keep at most one allocation
        if (hitNormal) {
          hitNormal.set(normal);
        } else {
          hitNormal = V(normal);
        }
      }
    };

    this.game!.world.raycast(this.raycastResult, this.ray);

    if (hit) {
      const hitPosition = V(this.ray.from).ilerp(this.ray.to, hitFraction);
      return { hit, hitNormal: hitNormal!, hitPosition };
    } else {
      return undefined;
    }
  }

  getRenderEndPoint(dt: number) {
    if (this.hitPosition) {
      return this.hitPosition.sub(this.renderPosition);
    } else {
      return this.velocity.mul(dt);
    }
  }

  onRender(dt: number) {
    const endPoint = this.getRenderEndPoint(dt);

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
