import { BLEND_MODES, Graphics, Sprite } from "pixi.js";
import snd_melonPlop1 from "../../../resources/audio/food/individual/melon-plop-1.flac";
import snd_melonPlop2 from "../../../resources/audio/food/individual/melon-plop-2.flac";
import snd_melonPlop3 from "../../../resources/audio/food/individual/melon-plop-3.flac";
import snd_melonPlop4 from "../../../resources/audio/food/individual/melon-plop-4.flac";
import snd_melonPlop5 from "../../../resources/audio/food/individual/melon-plop-5.flac";
import snd_melonPlop6 from "../../../resources/audio/food/individual/melon-plop-6.flac";
import bloodDrop from "../../../resources/images/bloodsplats/blood-drop.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { darken } from "../../core/util/ColorUtils";
import { polarToVec } from "../../core/util/MathUtil";
import { choose, rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { ShuffleRing } from "../utils/ShuffleRing";
import BloodSplat, { BLOOD_SPLAT_URLS } from "./BloodSplat";

const FRICTION = 5.0;

export const FLESH_SPLAT_SOUNDS = [
  snd_melonPlop1,
  snd_melonPlop2,
  snd_melonPlop3,
  snd_melonPlop4,
  snd_melonPlop5,
  snd_melonPlop6,
];

const splatSoundRing = new ShuffleRing(FLESH_SPLAT_SOUNDS);

export default class FleshImpact extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;
  particles: Particle[] = [];

  constructor(
    position: V2d,
    amount: number = 3,
    direction?: V2d,
    height: number = 1.0
  ) {
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
        z: rUniform(height * 0.3, height * 1.5),
        zVelocity: rUniform(-5, 3),
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
        particle.z = Math.max(particle.z, 0);

        if (particle.z <= 0) {
          this.particleToSplat(particle);
        }
      }
    }

    if (this.particles.every((p) => p.z <= 0)) {
      this.destroy();
    }
  }

  particleToSplat(particle: Particle) {
    const splatPos = particle.position.add([this.sprite.x, this.sprite.y]);
    this.game?.addEntity(new BloodSplat(splatPos, particle.radius * 2));
    this.game?.addEntity(
      new PositionalSound(splatSoundRing.getNext(), splatPos)
    );
  }

  onRender() {
    this.sprite.clear();

    for (const { position, color, radius, sprite, z } of this.particles) {
      sprite.position.set(...position);
      sprite.tint = color;
      sprite.scale.set((radius * (1.0 + z)) / 64);
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
