import { Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { degToRad, polarToVec } from "../../core/util/MathUtil";
import { rNormal, rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Layers } from "../layers";

const LINEAR_FRICTION = 0.75;
const ANGULAR_FRICTION = 0.75;
const SIZE = 0.05; // meters

const SPEED = 7; // meters
const SPIN = 7; // meters

export default class ShellCasing extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;
  velocity: V2d;
  spin: number;
  z: number = 1.0;
  zVelocity: number = 2;

  constructor(
    private position: V2d,
    direction: number,
    private rotation: number,
    texture: string
  ) {
    super();

    this.sprite = Sprite.from(texture);
    this.sprite.layerName = Layers.WORLD_BACK;
    this.sprite.scale.set(SIZE / this.sprite.texture.width);
    this.sprite.anchor.set(0.5, 0.5);

    this.velocity = polarToVec(
      rNormal(direction, degToRad(20)),
      SPEED * rNormal(1, 0.3)
    );

    this.spin = rUniform(0, Math.PI * 12);
  }

  async onAdd() {
    await this.wait(5);
    await this.wait(3, (_, t) => (this.sprite.alpha = 1.0 - t));
    this.destroy();
  }

  onTick(dt: number) {
    this.velocity.imul((1.0 - LINEAR_FRICTION) ** dt);
    this.position.iadd(this.velocity.mul(dt));

    this.rotation += this.spin * dt;
    this.spin *= (1.0 - ANGULAR_FRICTION) ** dt;
  }

  onRender() {
    this.sprite.position.set(...this.position);
    this.sprite.rotation = this.rotation;
  }
}
