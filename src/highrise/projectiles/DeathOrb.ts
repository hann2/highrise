import { Ray, RaycastResult } from "p2";
import { BLEND_MODES, Graphics, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite, WithOwner } from "../../core/entity/Entity";
import { polarToVec } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { getBlobPair } from "../effects/Splat";
import { Layer } from "../config/layers";
import { CollisionGroups } from "../config/CollisionGroups";
import Human from "../human/Human";
import Spitter from "../enemies/spitter/Spitter";

export const DEATH_ORB_RADIUS = 0.4; // meters
const MAX_LIFESPAN = 3.0; // seconds

export default class DeathOrb extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;
  velocity: V2d;

  private ray: Ray;
  private raycastResult = new RaycastResult();

  renderPosition: V2d;
  hitPosition?: V2d;

  constructor(
    public position: V2d,
    direction: number,
    speed: number = 15,
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
      collisionMask: CollisionGroups.All ^ CollisionGroups.Enemies,
      checkCollisionResponse: true,
    });

    const [texture, glowTexture] = getBlobPair();

    this.sprite = Sprite.from(texture);
    const scale = (2 * DEATH_ORB_RADIUS) / this.sprite.texture.width;
    this.sprite.scale.set(scale);
    this.sprite.tint = 0xff0000;
    this.sprite.layerName = Layer.WEAPONS;
    const glow = Sprite.from(glowTexture);
    glow.tint = 0xff3333;
    glow.blendMode = BLEND_MODES.ADD;
    glow.alpha = 0.3;
    this.sprite.addChild(glow);

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

  onRender(dt: number) {
    this.sprite.position.set(...this.renderPosition);
    this.sprite.rotation += dt * 1.5;
  }
}
