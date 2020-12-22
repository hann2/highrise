import { Ray, RaycastResult } from "p2";
import { BLEND_MODES, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite, WithOwner } from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { clampUp, polarToVec } from "../../core/util/MathUtil";
import { choose, rSign, rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Layer } from "../config/layers";
import GooImpact from "../effects/GooImpact";
import GooSplat from "../effects/GooSplat";
import { getBlobPair, getSplatSound } from "../effects/Splat";
import Spitter from "../enemies/spitter/Spitter";
import Human from "../human/Human";
import { PointLight } from "../lighting-and-vision/PointLight";

export const PHLEGM_RADIUS = 0.1; // meters
const MAX_LIFESPAN = 3.0; // seconds
const FRICTION = 0.12; // Something

export default class Phlegm extends BaseEntity implements Entity {
  light: PointLight;
  private ray: Ray;
  private raycastResult = new RaycastResult();

  velocity: V2d;
  spin: number;
  renderPosition: V2d;
  hitPosition?: V2d;
  z: number;
  zVelocity: number;
  mainSprite: Sprite;
  glowSprite: Sprite;

  constructor(
    public position: V2d,
    direction: number,
    speed: number = 8,
    public damage: number = 15,
    public readonly shooter?: Spitter,
    public mass: number = 0.25
  ) {
    super();

    this.velocity = polarToVec(direction, speed);
    this.spin = rSign() * rUniform(5, 20);
    this.z = 1;
    this.zVelocity = rUniform(1, 5);

    this.ray = new Ray({
      from: position.clone(), // to be set later
      to: V(0, 0),
      mode: Ray.ALL,
      collisionGroup: CollisionGroups.Projectiles,
      collisionMask:
        CollisionGroups.All ^
        CollisionGroups.Zombies ^
        CollisionGroups.Furniture,
      checkCollisionResponse: true,
    });

    const color = 0x00ff00;

    const [blobTexture, glowTexture] = getBlobPair();

    this.mainSprite = Sprite.from(choose(blobTexture));
    const scale = (2 * PHLEGM_RADIUS) / this.mainSprite.texture.width;
    this.mainSprite.anchor.set(0.5);
    this.mainSprite.scale.set(scale);
    this.mainSprite.rotation = rUniform(0, Math.PI * 2);
    this.mainSprite.tint = color;
    (this.mainSprite as GameSprite).layerName = Layer.WEAPONS;

    this.glowSprite = Sprite.from(glowTexture);
    this.glowSprite.blendMode = BLEND_MODES.ADD;
    this.glowSprite.anchor.set(0.5);
    this.glowSprite.scale.set(scale);
    this.glowSprite.tint = color;
    this.glowSprite.alpha = 0.3;
    this.mainSprite.rotation = this.mainSprite.rotation;
    (this.glowSprite as GameSprite).layerName = Layer.EMISSIVES;

    this.sprites = [this.mainSprite, this.glowSprite];

    this.light = this.addChild(
      new PointLight({ radius: 1, shadowsEnabled: false, position, color })
    );

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

    this.velocity.imul(Math.exp(-dt * FRICTION));

    this.zVelocity += -9.8 * dt;
    this.z = clampUp(this.z + this.zVelocity * dt);

    if (this.z < 0) {
      this.game?.addEntity(new PositionalSound(getSplatSound(), this.position));
      this.game?.addEntity(new GooSplat(this.position, PHLEGM_RADIUS * 2));
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
      this.game?.addEntity(new PositionalSound(getSplatSound(), this.position));
      this.game?.addEntity(new GooImpact(hitPosition, 3, hitNormal, 0.7));
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
    this.mainSprite.position.set(...this.renderPosition);
    this.glowSprite.position.set(...this.renderPosition);
    this.light.setPosition(this.renderPosition);

    this.mainSprite.rotation += dt * this.spin;
    this.glowSprite.rotation = this.mainSprite.rotation;

    const baseScale = (2 * PHLEGM_RADIUS) / this.mainSprite.texture.width;
    const heightScale = 1 + 0.7 * this.z;
    const scale = baseScale * heightScale;
    this.mainSprite.scale.set(scale);
    this.glowSprite.scale.set(scale);
  }
}
