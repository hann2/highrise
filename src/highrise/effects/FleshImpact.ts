import { BLEND_MODES, Container, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { darken } from "../../core/util/ColorUtils";
import { clampUp, polarToVec } from "../../core/util/MathUtil";
import { choose, rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import BloodSplat from "./BloodSplat";
import { BLOB_TEXTURES, getSplatSound } from "./Splat";

const FRICTION = 5.0;

interface Particle {
  color: number;
  position: V2d;
  radius: number;
  spin: number;
  sprite: Sprite;
  velocity: V2d;
  z: number;
  zVelocity: number;
}

export default class FleshImpact extends BaseEntity implements Entity {
  sprite: Container & GameSprite;
  particles: Particle[] = [];

  constructor(
    position: V2d,
    amount: number = 3,
    direction?: V2d,
    height: number = 1.0
  ) {
    super();

    this.sprite = new Container();
    this.sprite.layerName = Layer.PARTICLES;
    this.sprite.position.set(...position);
    this.particles = [];

    for (let i = 0; i < amount; i++) {
      const sprite = Sprite.from(choose(...BLOB_TEXTURES));
      sprite.blendMode = BLEND_MODES.NORMAL;
      sprite.anchor.set(0.5, 0.5);
      sprite.rotation = rUniform(0, Math.PI * 2);
      this.sprite.addChild(sprite);
      this.particles.push({
        color: darken(0xff0000, rUniform(0, 0.2)),
        position: V(0, 0),
        radius: rUniform(0.1, 0.1 * amount),
        sprite,
        velocity: polarToVec(rUniform(0, Math.PI * 2), rUniform(0.8, 6.0)),
        z: rUniform(height * 0.3, height * 1.5),
        zVelocity: rUniform(-5, 3),
        spin: rUniform(-10, 10),
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
        particle.z = clampUp(particle.z);
        particle.sprite.rotation += particle.spin * dt;

        if (particle.z <= 0) {
          this.particleToSplat(particle);
        }
      }
    }

    if (this.particles.every((p) => p.z <= 0)) {
      this.destroy();
    }
  }

  onRender() {
    for (const { position, color, radius, sprite, z } of this.particles) {
      sprite.position.set(...position);
      sprite.tint = color;
      sprite.scale.set((radius * (1.0 + z)) / sprite.texture.width);
    }
  }

  particleToSplat(particle: Particle) {
    const splatPos = particle.position.add([this.sprite.x, this.sprite.y]);
    this.game?.addEntity(new BloodSplat(splatPos, particle.radius * 2));
    this.game?.addEntity(new PositionalSound(getSplatSound(), splatPos));
  }
}
