import { Body, Circle } from "p2";
import { Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import { isDamageable } from "./Damageable";

const RADIUS = 0.1; // meters
const BULLET_SPEED = 50;
const BULLET_DAMAGE = 40;

export default class Bullet extends BaseEntity implements Entity {
  body: Body;
  sprite: Graphics;

  constructor(position: V2d, direction: V2d) {
    super();

    this.body = new Body({ mass: 1, position: position.clone(), velocity: direction.mul(BULLET_SPEED).clone() });

    const shape = new Circle({ radius: RADIUS });
    this.body.addShape(shape);

    this.sprite = new Graphics();
    this.sprite.beginFill(0xffff00);
    this.sprite.drawCircle(0, 0, RADIUS);
    this.sprite.endFill();
  }

  onBeginContact(other: Entity) {
    if (isDamageable(other)) {
      other.damage(BULLET_DAMAGE);
    }
    this.destroy();
  }

  onRender() {
    [this.sprite.x, this.sprite.y] = this.body.position;
    this.sprite.angle = this.body.angle;
  }
}
