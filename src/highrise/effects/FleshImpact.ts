import { BLEND_MODES, Graphics, Sprite } from "pixi.js";
import bloodDrop from "../../../resources/images/bloodsplats/blood-drop.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { darken } from "../../core/util/ColorUtils";
import { polarToVec } from "../../core/util/MathUtil";
import { rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import BloodSplat from "./BloodSplat";

const FRICTION = 5.0;

export default class FleshImpact extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;
  particles: Particle[] = [];

  constructor(position: V2d, amount: number = 3, direction?: V2d) {
    super();

    this.sprite = new Graphics();
    this.sprite.blendMode = BLEND_MODES.ADD;
    this.sprite.position.set(...position);
    this.particles = [];

    for (let i = 0; i < amount; i++) {
      const particleSprite = Sprite.from(bloodDrop);
      particleSprite.blendMode = BLEND_MODES.NORMAL;
      particleSprite.anchor.set(0.5, 0.5);
      this.sprite.addChild(particleSprite);
      this.particles.push({
        position: V(0, 0),
        velocity: polarToVec(rUniform(0, Math.PI * 2), rUniform(0.8, 6.0)),
        color: darken(0xff0000, rUniform(0, 0.2)),
        radius: rUniform(0.1, 0.1 * amount),
        z: rUniform(0.4, 1.6),
        zVelocity: rUniform(-20, 3),
        sprite: particleSprite,
      });
    }
  }

  onTick(dt: number) {
    for (const particle of this.particles) {
      if (particle.z > 0) {
        particle.position.iaddScaled(particle.velocity, dt);
        particle.velocity.imul(Math.exp(-FRICTION * dt));
        particle.zVelocity += -9.8 * dt;
        particle.z += particle.zVelocity * dt;

        if (particle.z < 0) {
          const splatPos = particle.position.add([
            this.sprite.x,
            this.sprite.y,
          ]);
          this.game?.addEntity(new BloodSplat(splatPos, particle.radius * 2));
        }
      }
    }

    if (this.particles.every((p) => p.z <= 0)) {
      this.destroy();
    }
  }

  onRender() {
    this.sprite.clear();

    for (const { position, color, radius, sprite, z } of this.particles) {
      if (z > 0) {
        sprite.position.set(...position);
        sprite.tint = color;
        sprite.scale.set((radius * (1.0 + z)) / 64);
      }
    }
  }
}

interface Particle {
  position: V2d;
  velocity: V2d;
  color: number;
  radius: number;
  z: number;
  zVelocity: number;
  sprite: Sprite;
}
