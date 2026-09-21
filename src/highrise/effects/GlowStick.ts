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
import { hslToHex } from "../../core/util/ColorUtils";
import { clamp } from "../../core/util/MathUtil";
import { choose, rDirection, rNormal, rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { PointLight } from "../lighting-and-vision/PointLight";

const GLOWSTICK_TEXTURES: ImageName[] = [
  "glowStick1",
  "glowStick2",
  "glowStick3",
];

const DROP_SOUNDS: SoundName[] = ["glowStickDrop1", "glowStickDrop2"];

const SIZE = [0.3, 0.08];
const SPRITE_LENGTH = 0.45;

const MIN_BOUNCE_SPEED = 1.0; // meters / second
const BOUNCE_RESTITUTION = 0.3; // percent of engergy retained in bounce

export default class GlowStick extends BaseEntity implements Entity {
  body: Body;
  light: PointLight;
  sprite: Sprite & GameSprite;
  z: number;
  zVelocity: number;

  constructor(position: V2d, velocity: V2d) {
    super();

    this.z = 1;
    this.zVelocity = rNormal(1, 0.4);

    this.body = createRigid2D({
      motion: "dynamic",
      mass: 0.1,
      position,
      velocity,
      damping: 1,
      angularDamping: 1,
      angularVelocity: rUniform(5, 40),
      angle: rDirection(),
    });
    this.body.addShape(
      new Capsule({
        radius: SIZE[1] / 2,
        length: SIZE[0],
        collisionGroup: CollisionGroups.Particle,
        collisionMask: CollisionGroups.Walls | CollisionGroups.Enemies,
        material: PhysicsMaterials.glowstick,
      }),
    );

    const color = hslToHex({
      h: rUniform(0, 1),
      s: 1,
      l: 0.8,
    });
    this.light = this.addChild(new PointLight({ radius: 3, color }));

    this.sprite = Sprite.from(choose(...GLOWSTICK_TEXTURES));
    this.sprite.tint = color;
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(SPRITE_LENGTH / this.sprite.texture.width);
    this.sprite.layerName = Layer.EMISSIVES;
  }

  onTick(dt: number) {
    if (this.z < 0) {
      this.z = 0;
      if (Math.abs(this.zVelocity) > MIN_BOUNCE_SPEED) {
        // bounce
        const gain = clamp(Math.abs(this.zVelocity) / 15) * 2;
        const sound = choose(...DROP_SOUNDS);
        const position = this.getPosition();
        this.game?.addEntity(new PositionalSound(sound, position, { gain }));

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

  onImpact() {
    const gain = clamp(this.body.velocity.magnitude / 5);
    const sound = choose(...DROP_SOUNDS);
    const position = this.getPosition();
    this.game?.addEntity(new PositionalSound(sound, position, { gain }));
  }

  onAfterPhysics() {
    this.light.setPosition(this.body.position);
    this.sprite.position.copyFrom(this.body.position);
    this.sprite.rotation = this.body.angle;
  }

  onRender() {
    const scale = 1 + this.z * 0.8;
    this.sprite.scale.set((SPRITE_LENGTH / this.sprite.texture.width) * scale);
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

    this.game?.addEntity(new StaticGlowstick(sprite, this.light));

    this.destroy();
  }
}

// A cheaper, non-moving effect
class StaticGlowstick extends BaseEntity {
  constructor(
    public sprite: Sprite & GameSprite,
    public light: PointLight,
  ) {
    super();

    this.addChild(light, true); // steal it from the original
    this.sprite.layerName = Layer.FLOOR_STUFF;
  }

  async onAdd() {
    await this.wait(120);
    await this.wait(10, (dt, t) => {
      this.sprite.alpha = 1 - t;
      this.light.setIntensity(1 - t);
    });
    this.destroy();
  }
}
