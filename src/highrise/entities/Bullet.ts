import { Ray, RaycastResult, vec2 } from "p2";
import { Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite, WithOwner } from "../../core/entity/Entity";
import { polarToVec } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { Layers } from "../layers";
import Light from "../lighting/Light";
import { CollisionGroups } from "../physics/CollisionGroups";
import Hittable, { isHittable } from "./Hittable";
import Human from "./human/Human";

export const BULLET_RADIUS = 0.05; // meters
const MAX_LIFESPAN = 3.0; // seconds

// TODO: Don't draw line past collision point. I thought the code does that, but the results differ
export default class Bullet extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;
  light: Light;
  lightGraphics: Graphics;
  velocity: V2d;

  private ray: Ray;
  private raycastResult = new RaycastResult();

  hitPosition?: V2d;

  constructor(
    public position: V2d,
    direction: number,
    speed: number = 50,
    public damage: number = 40,
    public shooter?: Human
  ) {
    super();

    this.velocity = polarToVec(direction, speed);
    this.ray = new Ray({
      from: position,
      to: position.add(this.velocity),
      mode: Ray.ALL,
      collisionGroup: CollisionGroups.Bullets,
      collisionMask: CollisionGroups.All,
      checkCollisionResponse: true,
    });

    this.sprite = new Graphics();
    this.sprite.layerName = Layers.WEAPONS;

    this.lightGraphics = new Graphics();
    this.light = this.addChild(new Light());
    this.light.lightSprite.addChild(this.lightGraphics);
  }

  async onAdd() {
    // Make sure we don't have any infinitely living bullets around
    await this.wait(MAX_LIFESPAN, undefined, "life_timer");
    this.destroy();
  }

  onTick(dt: number) {
    this.raycastResult.reset();
    this.ray.from = this.position;
    this.ray.to = this.position.add(this.velocity.mul(dt));
    this.ray.update();

    let hitFraction = Infinity;
    let hit: Hittable | undefined;
    this.ray.callback = ({ fraction, body, getHitPoint }) => {
      const owner = (body as WithOwner).owner;
      if (fraction < hitFraction && isHittable(owner)) {
        hitFraction = fraction;
        hit = owner;
      }
    };

    this.game!.world.raycast(this.raycastResult, this.ray);

    if (hit) {
      this.hitPosition = V(0, 0);
      vec2.lerp(this.hitPosition, this.ray.from, this.ray.to, hitFraction);
      hit.onBulletHit(this, this.hitPosition);
      this.destroy();
    } else {
      this.position.set(this.ray.to);
    }
  }

  onBeginContact(other: Entity) {
    if (isHittable(other)) {
      // TODO: Get actual collision position. I believe it can be found on the third parameter
      other.onBulletHit(this, this.getPosition());
    }
    this.destroy();
  }

  getLocalEndPoint(dt: number) {
    if (this.hitPosition) {
      return this.hitPosition.sub(this.position);
    } else {
      return this.velocity.mul(dt);
    }
  }

  afterPhysics() {
    const velocity = this.velocity;
    const dt = this.game!.renderTimestep;

    const endPoint = this.getLocalEndPoint(dt);

    this.sprite.clear();
    this.sprite.lineStyle(0.03, 0xffaa00, 0.9);
    this.sprite.moveTo(0, 0);
    this.sprite.lineTo(endPoint[0], endPoint[1]);

    this.lightGraphics.clear();
    for (const t of [0.01, 0.02, 0.04]) {
      this.lightGraphics.lineStyle(t, 0xffdd33, 0.1);
      this.lightGraphics.moveTo(0, 0);
      this.lightGraphics.lineTo(endPoint[0], endPoint[1]);
    }

    [this.sprite.x, this.sprite.y] = this.position;
    [this.light.lightSprite.x, this.light.lightSprite.y] = this.position;
  }
}
