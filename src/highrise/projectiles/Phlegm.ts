import { BLEND_MODES, Sprite } from "pixi.js";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { clampUp, polarToVec } from "../../core/util/MathUtil";
import { choose, rSign, rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Layer } from "../config/layers";
import GooImpact from "../effects/GooImpact";
import GooSplat from "../effects/GooSplat";
import { getBlobPair, getSplatSound } from "../effects/Splat";
import Spitter from "../enemies/spitter/Spitter";
import Human from "../human/Human";
import { PointLight } from "../lighting-and-vision/PointLight";
import { HitResult, Projectile } from "./Projectile";

export const PHLEGM_RADIUS = 0.1; // meters
const FRICTION = 0.12; // Something

export default class Phlegm extends Projectile implements Entity {
  light: PointLight;
  spin: number;
  z: number;
  zVelocity: number;
  mainSprite: Sprite;
  glowSprite: Sprite;

  constructor(
    position: V2d,
    direction: number,
    speed: number = 8,
    public damage: number = 15,
    public readonly shooter?: Spitter,
    public mass: number = 0.25
  ) {
    super(position, polarToVec(direction, speed));

    this.spin = rSign() * rUniform(5, 20);
    this.z = 1;
    this.zVelocity = rUniform(1, 5);

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

  makeCollisionMask() {
    return (
      CollisionGroups.All ^ CollisionGroups.Enemies ^ CollisionGroups.Furniture
    );
  }

  onTick(dt: number) {
    this.zVelocity += -9.8 * dt;
    this.z = clampUp(this.z + this.zVelocity * dt);

    if (this.z < 0) {
      this.game?.addEntity(new PositionalSound(getSplatSound(), this.position));
      this.game?.addEntity(new GooSplat(this.position, PHLEGM_RADIUS * 2));
      this.destroy();
      return;
    }

    super.onTick(dt);
  }

  onHit({ hit, hitPosition, hitNormal }: HitResult) {
    if (hit instanceof Human) {
      hit.inflictDamage(this.damage);
    }
    this.game?.addEntity(new PositionalSound(getSplatSound(), this.position));
    this.game?.addEntity(new GooImpact(hitPosition, 3, hitNormal, 0.7));

    return true;
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
