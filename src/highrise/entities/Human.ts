import { Body, Circle } from "p2";
import { Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";
import Damageable from "./Damageable";
import Gun from "./Gun";

export const HUMAN_RADIUS = 0.5; // meters
const SPEED = 4;
const FRICTION = 0.4;
const NUM_BULLETS = 8;
const CONE_ANGLE = Math.PI / 24;

// should eventually come from a gun
const FIRE_RATE = 1.5; // shots per second

export default class Human extends BaseEntity implements Entity, Damageable {
  body: Body;
  sprite: Graphics;
  tags = ["human"];
  hp: number = 100;
  gun?: Gun;

  constructor(position: V2d) {
    super();

    this.body = new Body({ mass: 1, position: position.clone() });

    const shape = new Circle({ radius: HUMAN_RADIUS });
    this.body.addShape(shape);

    this.sprite = new Graphics();
    this.sprite.beginFill(0x0000ff);
    this.sprite.drawCircle(0, 0, HUMAN_RADIUS);
    this.sprite.endFill();
  }

  set direction(direction: V2d) {
    if (this.gun) {
      this.gun.direction = direction;
    }
  }

  set firing(firing: boolean) {
    if (this.gun) {
      this.gun.firing = firing;
    }
  }

  onTick(dt: number) {
    const friction = V(this.body.velocity).mul(-FRICTION);
    this.body.applyImpulse(friction);
  }

  onRender() {
    [this.sprite.x, this.sprite.y] = this.body.position;
    this.sprite.angle = this.body.angle;
  }

  // Move the human along a specified vector
  walk(direction: V2d) {
    this.body.applyImpulse(direction.mul(SPEED));
  }

  // Have the human face a specific angle
  face(angle: number) {
    this.body.angle = angle;
  }

  // Inflict damage on the human
  damage(amount: number) {
    this.hp -= amount;

    if (this.hp <= 0) {
      console.log("You dead");
    }
  }
}
