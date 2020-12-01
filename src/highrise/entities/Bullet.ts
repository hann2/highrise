import { Body, Circle, ContactEquation } from "p2";
import { Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d, V } from "../../core/Vector";
import { isDamageable } from "./Damageable";
import { polarToVec } from "../../core/util/MathUtil";
import { CollisionGroups } from "../Collision";

export const BULLET_RADIUS = 0.05; // meters

export default class Bullet extends BaseEntity implements Entity {
  body: Body;
  sprite: Graphics;

  constructor(
    position: V2d,
    direction: number,
    speed: number = 50,
    private damage: number = 40
  ) {
    super();

    this.body = new Body({
      mass: 1,
      position: position.clone(),
      velocity: polarToVec(direction, speed),
    });

    const shape = new Circle({ radius: BULLET_RADIUS });
    shape.collisionGroup = CollisionGroups.Bullets;
    shape.collisionMask = CollisionGroups.All ^ CollisionGroups.Bullets;
    this.body.addShape(shape);

    // TODO: Line instead of circle
    this.sprite = new Graphics();
    this.sprite.beginFill(0xffff00);
    this.sprite.drawCircle(0, 0, BULLET_RADIUS);
    this.sprite.endFill();
  }

  onBeginContact(
    other: Entity,
    _: unknown,
    __: unknown,
    contactEquations: ContactEquation[]
  ) {
    if (isDamageable(other)) {
      other.damage(this.damage);
    }
    this.destroy();
  }

  onRender() {
    [this.sprite.x, this.sprite.y] = this.body.position;
    this.sprite.angle = this.body.angle;
  }
}
