import { Body, Capsule } from "p2";
import { Sprite } from "pixi.js";
import img_glowStick1 from "../../../resources/images/effects/glow-stick-1.png";
import img_glowStick2 from "../../../resources/images/effects/glow-stick-2.png";
import img_glowStick3 from "../../../resources/images/effects/glow-stick-3.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { colorLerp } from "../../core/util/ColorUtils";
import { choose, rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Layers } from "../layers";
import { PointLight } from "../lighting/PointLight";
import { CollisionGroups } from "../physics/CollisionGroups";
import { P2Materials } from "../physics/PhysicsMaterials";

export const GLOWSTICK_URLS = [img_glowStick1, img_glowStick2, img_glowStick3];

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
    this.zVelocity = 1;

    this.body = new Body({
      mass: 0.1,
      position,
      velocity,
    });

    this.body.angularDamping = 1;
    this.body.damping = 1;
    this.body.angularVelocity = rUniform(5, 40);
    this.body.angle = rUniform(0, Math.PI * 2);

    const shape = new Capsule({ radius: SIZE[1] / 2, length: SIZE[0] });
    shape.collisionGroup = CollisionGroups.GlowStick;
    shape.collisionMask = CollisionGroups.World | CollisionGroups.Zombies;
    shape.material = P2Materials.glowstick;
    this.body.addShape(shape);

    const color = colorLerp(0x44ff00, 0x33ffff, Math.random());

    this.light = this.addChild(new PointLight({ radius: 3, color: color }));

    this.sprite = Sprite.from(choose(...GLOWSTICK_URLS));
    this.sprite.tint = color;
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(SPRITE_LENGTH / this.sprite.texture.width);
    this.sprite.layerName = Layers.EMISSIVES;

    console.log("new glowstick");
  }

  onTick(dt: number) {
    if (this.z < 0) {
      this.z = 0;
      if (Math.abs(this.zVelocity) > MIN_BOUNCE_SPEED) {
        // bounce

        // TODO: Bounce sound

        this.zVelocity *= -BOUNCE_RESTITUTION;
        this.body.angularVelocity *= 0.5;
        this.body.velocity[0] *= 0.5;
        this.body.velocity[1] *= 0.5;
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

  afterPhysics() {
    this.light.setPosition(this.body.position);
    this.sprite.position.set(...this.body.position);
    this.sprite.rotation = this.body.angle;
  }

  onRender() {
    const scale = 1 + this.z * 0.8;
    this.sprite.scale.set((SPRITE_LENGTH / this.sprite.texture.width) * scale);
  }

  turnToStatic() {
    const sprite = new Sprite();
    sprite.texture = this.sprite.texture;
    sprite.scale.copyFrom(this.sprite.scale);
    sprite.anchor.copyFrom(this.sprite.anchor);
    sprite.tint = this.sprite.tint;
    sprite.position.copyFrom(this.sprite.position);
    sprite.rotation = this.sprite.rotation;
    (sprite as GameSprite).layerName = this.sprite.layerName;

    this.game?.addEntity(new StaticGlowstick(sprite, this.light));

    this.destroy();
  }
}

class StaticGlowstick extends BaseEntity {
  constructor(public sprite: Sprite & GameSprite, public light: PointLight) {
    super();

    this.addChild(light, true); // steal it from the original
  }

  async onAdd() {
    await this.wait(120);
    await this.wait(10, (dt, t) => {
      this.sprite.alpha = 1 - t;
      this.light.setIntensity(1 - t);
    });
    this.destroy();
  }

  // TODO: Eventually destroy
}
