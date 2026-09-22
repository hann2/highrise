import { Container, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { clampUp, polarToVec } from "../../core/util/MathUtil";
import { choose, rDirection, rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { BLOB_TEXTURES } from "./Splat";

const FRICTION = 5.0;

export default class WallImpact extends BaseEntity implements Entity {
  sprite: Container & GameSprite;
  particles: Particle[] = [];

  constructor(position: V2d, normal?: V2d, color: number = 0xffff00) {
    super();

    this.sprite = new Container();
    this.sprite.position.copyFrom(position);

    for (let i = 0; i < 10; i++) {
      const particleSprite = Sprite.from(choose(...BLOB_TEXTURES));
      particleSprite.blendMode = "add";
      particleSprite.rotation = rDirection();
      this.sprite.addChild(particleSprite);
      this.particles.push({
        position: V(0, 0),
        velocity: polarToVec(rDirection(), rUniform(0.8, 6.0)),
        color,
        radius: rUniform(0.1, 0.4) ** 2,
        alpha: rUniform(0.5, 1.0),
        sprite: particleSprite,
      });
    }
  }

  @on("tick")
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

  @on("render")
  onRender() {
    for (const { position, color, radius, alpha, sprite } of this.particles) {
      sprite.position.copyFrom(position);
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
