import { BLEND_MODES, Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { polarToVec } from "../../core/util/MathUtil";
import { rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";

export default class WallImpact extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;
  particles: Particle[] = [];

  constructor(position: V2d, normal: V2d) {
    super();

    this.sprite = new Graphics();
    this.sprite.blendMode = BLEND_MODES.SCREEN;
    this.sprite.position.set(...position);
    this.particles = [];

    for (let i = 0; i < 10; i++) {
      this.particles.push({
        position: V(0, 0),
        velocity: polarToVec(rUniform(0, Math.PI * 2), rUniform(0.1, 2.0)),
        color: 0xffff00,
        radius: 0.05,
        alpha: rUniform(0.5, 1.0),
      });
    }
  }

  onTick(dt: number) {
    for (const particle of this.particles) {
      particle.position.iaddScaled(particle.velocity, dt);
      // TODO: Friction
      particle.alpha = Math.max(particle.alpha - dt, 0);
    }

    if (this.particles.every((p) => p.alpha === 0)) {
      this.destroy();
    }
  }

  onRender() {
    this.sprite.clear();

    for (const { position, color, radius, alpha } of this.particles) {
      if (alpha > 0) {
        this.sprite
          .beginFill(color, alpha)
          .drawCircle(position.x, position.y, radius)
          .endFill();
      }
    }
  }
}

interface Particle {
  position: V2d;
  velocity: V2d;
  color: number;
  radius: number;
  alpha: number;
}
