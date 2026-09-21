import { Sprite } from "pixi.js";
import { ImageName, SoundName } from "../../../resources/resources";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import { PhysicsMaterials } from "../../config/PhysicsMaterials";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import type { Body } from "../../core/physics/body/Body";
import { createRigid2D } from "../../core/physics/body/bodyFactories";
import { Capsule } from "../../core/physics/shapes/Capsule";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { clamp } from "../../core/util/MathUtil";
import { rNormal, rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { ShuffleRing } from "../utils/ShuffleRing";

const SIZE = 0.03; // meters wide
const MAX_SPIN = Math.PI * 20;

const MIN_BOUNCE_SPEED = 1.0; // meters / second
const BOUNCE_RESTITUTION = 0.3; // percent of engergy retained in bounce

const PORT_HEIGHT = 1.0; // meters off the ground

// TODO: Different sound depending on floor

export default class ShellCasing extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;
  body: Body;
  z: number;
  zVelocity: number;
  bounceSounds: ShuffleRing<SoundName>;

  constructor(
    position: V2d,
    velocity: V2d,
    rotation: number,
    texture: ImageName,
    sounds: SoundName[],
  ) {
    super();

    this.z = PORT_HEIGHT;
    this.zVelocity = rUniform(0, velocity.magnitude * 0.3);

    this.sprite = Sprite.from(texture);
    this.sprite.layerName = Layer.FLOOR_STUFF;
    this.sprite.scale.set(SIZE / this.sprite.texture.width);
    this.sprite.anchor.set(0.5, 0.5);

    this.body = createRigid2D({
      motion: "dynamic",
      mass: 0.1,
      position,
      velocity,
      damping: 1,
      angularDamping: 1,
      angularVelocity: rUniform(MAX_SPIN / 10, MAX_SPIN),
    });

    const shape = new Capsule({
      radius: this.sprite.width / 2,
      length: this.sprite.height,
      collisionGroup: CollisionGroups.Particle,
      collisionMask: CollisionGroups.Walls | CollisionGroups.Enemies,
      material: PhysicsMaterials.glowstick,
    });
    this.body.addShape(shape, undefined, Math.PI / 2);

    this.bounceSounds = new ShuffleRing(sounds);
  }

  onTick(dt: number) {
    if (this.z < 0) {
      this.z = 0;
      if (Math.abs(this.zVelocity) > MIN_BOUNCE_SPEED) {
        // bounce
        const sound = this.bounceSounds.getNext();
        const gain = clamp(Math.abs(this.zVelocity) / 15) * 0.5;
        const speed = rNormal(1, 0.05);
        const position = this.getPosition();
        this.game?.addEntity(
          new PositionalSound(sound, position, { gain, speed }),
        );

        this.zVelocity *= -BOUNCE_RESTITUTION;
        this.body.angularVelocity *= 0.5;
        this.body.velocity.imul(0.5);
      } else {
        // on ground
        this.zVelocity = 0;
        this.turnToStatic();
      }
    } else {
      this.z += this.zVelocity * dt;
      this.zVelocity -= 9.8 * dt; // gravity
    }
  }

  onRender() {
    this.sprite.position.copyFrom(this.body.position);
    this.sprite.rotation = this.body.angle;

    const scale = 1 + this.z * 0.8;
    this.sprite.scale.set((SIZE / this.sprite.texture.width) * scale);
  }

  onImpact() {
    const gain = clamp(this.body.velocity.magnitude / 10) * 0.5;
    const sound = this.bounceSounds.getNext();
    const position = this.getPosition();
    this.game?.addEntity(new PositionalSound(sound, position, { gain }));
  }

  // Turn this into a static thing so we don't have any more on ticks or on renders or physics or whatnot
  turnToStatic() {
    const sprite: Sprite & GameSprite = new Sprite(this.sprite.texture);
    sprite.scale.copyFrom(this.sprite.scale);
    sprite.anchor.copyFrom(this.sprite.anchor);
    sprite.tint = this.sprite.tint;
    sprite.position.copyFrom(this.sprite.position);
    sprite.rotation = this.sprite.rotation;
    sprite.layerName = this.sprite.layerName;

    this.game?.addEntity(new StaticShellCasing(sprite));

    this.destroy();
  }
}

// A cheaper non-moving effect
class StaticShellCasing extends BaseEntity {
  constructor(public sprite: Sprite & GameSprite) {
    super();
    sprite.layerName = Layer.FLOOR_STUFF;
  }

  async onAdd() {
    await this.wait(120);
    await this.wait(10, (dt, t) => {
      this.sprite.alpha = 1 - t;
    });
    this.destroy();
  }
}
