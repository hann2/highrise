import { Ray, RaycastResult } from "p2";
import { BLEND_MODES, Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite, WithOwner } from "../../core/entity/Entity";
import { polarToVec } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import Light from "../lighting-and-vision/Light";
import { CollisionGroups } from "../config/CollisionGroups";
import Hittable, { isHittable } from "../environment/Hittable";
import Human from "../human/Human";

export const BULLET_RADIUS = 0.05; // meters
const MAX_LIFESPAN = 3.0; // seconds

export default class Bullet extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;
  light: Light;
  lightGraphics: Graphics;
  velocity: V2d;

  private ray: Ray;
  private raycastResult = new RaycastResult();

  renderPosition: V2d;
  hitPosition?: V2d;

  constructor(
    public position: V2d,
    direction: number,
    speed: number = 50,
    public damage: number = 40,
    public readonly shooter?: Human,
    public mass: number = 0.01 // kg?
  ) {
    super();

    this.velocity = polarToVec(direction, speed);
    this.ray = new Ray({
      from: position.clone(), // to be set later
      to: V(0, 0),
      mode: Ray.ALL,
      collisionGroup: CollisionGroups.Projectiles,
      collisionMask:
        CollisionGroups.All ^
        CollisionGroups.Humans ^
        CollisionGroups.Furniture,
      checkCollisionResponse: true,
    });

    this.sprite = new Graphics();
    this.sprite.layerName = Layer.WEAPONS;

    this.lightGraphics = new Graphics();
    this.light = this.addChild(new Light());
    this.light.lightSprite.addChild(this.lightGraphics);

    this.renderPosition = position.clone();
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
      this.hitPosition = hitPosition;
      hit.onBulletHit(this, this.hitPosition, hitNormal);
      this.destroy();
    } else {
      this.position.iaddScaled(this.velocity, dt);
    }
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

  afterPhysics() {
    const dt = this.game!.renderTimestep;

    const endPoint = this.getRenderEndPoint(dt);

    this.sprite
      .clear()
      .lineStyle(0.03, 0xffaa00, 0.6)
      .moveTo(0, 0)
      .lineTo(endPoint[0], endPoint[1]);

    this.lightGraphics
      .clear()
      .lineStyle(0.2, 0xffaa00, 1.0)
      .moveTo(0, 0)
      .lineTo(endPoint[0], endPoint[1]);

    this.sprite.position.set(...this.renderPosition);
    this.light.lightSprite.position.set(...this.renderPosition);
  }
}
