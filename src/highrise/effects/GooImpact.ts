import { Container, Sprite } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { darken } from "../../core/util/ColorUtils";
import { clampUp, polarToVec } from "../../core/util/MathUtil";
import { rDirection, rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import GooSplat from "./GooSplat";
import { getBlobPair, getSplatSound } from "./Splat";

const FRICTION = 5.0;

interface Particle {
  color: number;
  position: V2d;
  radius: number;
  spin: number;
  sprite: Sprite;
  glowSprite: Sprite;
  velocity: V2d;
  z: number;
  zVelocity: number;
}

export default class GooImpact extends BaseEntity implements Entity {
  particles: Particle[] = [];

  constructor(
    position: V2d,
    amount: number = 3,
    direction?: V2d,
    height: number = 1.0,
  ) {
    super();

    const mainContainer: GameSprite = new Container();
    mainContainer.layerName = Layer.PARTICLES;
    mainContainer.position.copyFrom(position);

    const emissiveContainer: GameSprite = new Container();
    emissiveContainer.layerName = Layer.EMISSIVES;
    emissiveContainer.alpha = 0.3;
    emissiveContainer.position.copyFrom(position);

    this.sprites = [mainContainer, emissiveContainer];

    for (let i = 0; i < amount; i++) {
      const [texture, glowTexture] = getBlobPair();

      const sprite = Sprite.from(texture);
      sprite.blendMode = "add";
      sprite.anchor.set(0.5, 0.5);
      sprite.rotation = rDirection();
      mainContainer.addChild(sprite);

      const glowSprite = Sprite.from(glowTexture);
      glowSprite.blendMode = "add";
      glowSprite.anchor.set(0.5, 0.5);
      glowSprite.rotation = sprite.rotation;
      emissiveContainer.addChild(glowSprite);

      this.particles.push({
        color: darken(0x00ff00, rUniform(0, 0.1)),
        position: V(0, 0),
        radius: rUniform(0.1, 0.1 * amount),
        sprite,
        glowSprite,
        velocity: polarToVec(rDirection(), rUniform(0.8, 6.0)),
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
    for (const { position, color, radius, sprite, glowSprite, z } of this
      .particles) {
      const scale = (radius * (1.0 + z)) / sprite.texture.width;

      sprite.position.copyFrom(position);
      sprite.tint = color;
      sprite.scale.set(scale);

      glowSprite.position.copyFrom(position);
      glowSprite.tint = color;
      glowSprite.scale.set(scale);
    }
  }

  particleToSplat(particle: Particle) {
    const { x, y } = this.sprites![0];
    const splatPos = particle.position.add([x, y]);
    this.game?.addEntities(
      new GooSplat(splatPos, particle.radius * 2),
      new PositionalSound(getSplatSound(), splatPos),
    );
  }
}
