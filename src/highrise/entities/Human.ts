import { Body, Circle } from "p2";
import { Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d, V } from "../../core/Vector";
import Bullet from "./Bullet";
import Damageable from "./Damageable"

const RADIUS = 0.5; // meters
const SPEED = 10;
const FRICTION = 0.4;

// should eventually come from a gun
const FIRE_RATE = 10; // shots per second

export default class Human extends BaseEntity implements Entity, Damageable {
  body: Body;
  sprite: Graphics;
  tags = ["human"];
  hp: number = 100;
  firing: boolean = false;
  direction?: V2d;
  fireCooldown: number = 0;

  constructor(position: V2d) {
    super();

    this.body = new Body({ mass: 1, position: position.clone() });

    const shape = new Circle({ radius: RADIUS });
    this.body.addShape(shape);

    this.sprite = new Graphics();
    this.sprite.beginFill(0x0000ff);
    this.sprite.drawCircle(0, 0, RADIUS);
    this.sprite.endFill();
  }

  onTick(dt: number) {
    const friction = V(this.body.velocity).mul(-FRICTION);
    this.body.applyImpulse(friction);

    this.fireCooldown -= dt;
    if (this.firing && this.fireCooldown < 0 && this.direction) {
      // direction
      const start = V(this.getPosition());
      this.addChild(new Bullet(start.add(this.direction.mul(RADIUS + 0.15)), this.direction));

      this.fireCooldown = 1 / FIRE_RATE;
    }
  }

  onRender() {
    [this.sprite.x, this.sprite.y] = this.body.position;
    this.sprite.angle = this.body.angle;
  }

  walk(direction: V2d) {
    this.body.applyImpulse(direction.mul(SPEED));
  }

  face(angle: number) {
    this.body.angle = angle;
  }

  damage(amount: number) {
    this.hp -= amount;

    if (this.hp <= 0) {
      console.log("You dead");
    }
  }
}
