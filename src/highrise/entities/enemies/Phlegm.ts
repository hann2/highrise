import { Ray, RaycastResult } from "p2";
import { Graphics } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite, WithOwner } from "../../../core/entity/Entity";
import { polarToVec } from "../../../core/util/MathUtil";
import { V, V2d } from "../../../core/Vector";
import { Layers } from "../../layers";
import { CollisionGroups } from "../../physics/CollisionGroups";
import Human from "../human/Human";
import Spitter from "./Spitter";

export const PHLEGM_RADIUS = 0.1; // meters
const MAX_LIFESPAN = 3.0; // seconds

export default class Phlegm extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;
  velocity: V2d;

  private ray: Ray;
  private raycastResult = new RaycastResult();

  renderPosition: V2d;
  hitPosition?: V2d;

  constructor(
    public position: V2d,
    direction: number,
    speed: number = 5,
    public damage: number = 40,
    public readonly shooter?: Spitter,
    public mass: number = 0.25
  ) {
    super();

    this.velocity = polarToVec(direction, speed);
    this.ray = new Ray({
      from: position.clone(), // to be set later
      to: V(0, 0),
      mode: Ray.ALL,
      collisionGroup: CollisionGroups.Projectiles,
      collisionMask: CollisionGroups.All ^ CollisionGroups.Zombies,
      checkCollisionResponse: true,
    });

    this.sprite = new Graphics();
    this.sprite.beginFill(0x00ff00);
    this.sprite.drawCircle(0, 0, 0.1);
    this.sprite.endFill();
    this.sprite.layerName = Layers.WEAPONS;

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
      if (hit instanceof Human) {
        hit.inflictDamage(this.damage);
      }
      this.destroy();
    } else {
      this.position.iaddScaled(this.velocity, dt);
    }
  }

  checkForCollision(
    dt: number
  ): { hit: Entity; hitNormal: V2d; hitPosition: V2d } | undefined {
    this.raycastResult.reset();
    this.ray.to = this.position.addScaled(this.velocity, dt);
    this.ray.update();

    let hitFraction = Infinity;
    let hit: Entity | undefined;
    let hitNormal: V2d;
    this.ray.callback = ({ fraction, body, normal }) => {
      const owner = (body as WithOwner).owner;
      if (fraction < hitFraction) {
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
    this.sprite.position.set(...this.renderPosition);
  }
}
