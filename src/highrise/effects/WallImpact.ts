import { BLEND_MODES, Graphics, Sprite } from "pixi.js";
import impactParticle from "../../../resources/images/effects/impact-particle.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { clampUp, polarToVec } from "../../core/util/MathUtil";
import { choose, rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { BLOB_TEXTURES } from "./Splat";

const FRICTION = 5.0;
export default class WallImpact extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;
  particles: Particle[] = [];

  constructor(position: V2d, normal?: V2d, color: number = 0xffff00) {
    super();

    this.sprite = new Graphics();
    this.sprite.blendMode = BLEND_MODES.ADD;
    this.sprite.position.set(...position);
    this.particles = [];

    for (let i = 0; i < 10; i++) {
      const particleSprite = Sprite.from(choose(...BLOB_TEXTURES));
      particleSprite.blendMode = BLEND_MODES.ADD;
      particleSprite.rotation = rUniform(0, Math.PI * 2);
      this.sprite.addChild(particleSprite);
      this.particles.push({
        position: V(0, 0),
        velocity: polarToVec(rUniform(0, Math.PI * 2), rUniform(0.8, 6.0)),
        color: color,
        radius: rUniform(0.1, 0.4) ** 2,
        alpha: rUniform(0.5, 1.0),
        sprite: particleSprite,
      });
    }
  }

  onTick(dt: number) {
    for (const particle of this.particles) {
      particle.position.iaddScaled(particle.velocity, dt);
      particle.alpha = clampUp(particle.alpha - dt * 2.0);
      particle.velocity.imul(Math.exp(-FRICTION * dt));
      particle.radius *= Math.exp(dt);
    }

    if (this.particles.every((p) => p.alpha === 0)) {
      this.destroy();
    }
  }

  onRender() {
    this.sprite.clear();

    for (const { position, color, radius, alpha, sprite } of this.particles) {
      sprite.position.set(...position);
      sprite.tint = color;
      sprite.width = radius;
      sprite.height = radius;
      sprite.alpha = alpha;
    }
  }
}

interface Particle {
  position: V2d;
  velocity: V2d;
  color: number;
  radius: number;
  alpha: number;
  sprite: Sprite;
}
