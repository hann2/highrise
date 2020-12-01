import { Body, Circle, ContactEquation } from "p2";
import { Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import CCDBody from "../../core/physics/CCDBody";
import { polarToVec } from "../../core/util/MathUtil";
import { V2d } from "../../core/Vector";
import { CollisionGroups } from "../Collision";
import { isDamageable } from "./Damageable";

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

    const velocity = polarToVec(direction, speed);

    this.body = new CCDBody({
      mass: 1,
      position: position.clone(),
      velocity,
    });

    const shape = new Circle({ radius: BULLET_RADIUS });
    shape.collisionGroup = CollisionGroups.Bullets;
    shape.collisionMask = CollisionGroups.All ^ CollisionGroups.Bullets;
    this.body.addShape(shape);

    this.sprite = new Graphics();
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
    const velocity = this.body.velocity;
    const dt = this.game!.renderTimestep;
    this.sprite.clear();
    this.sprite.lineStyle(0.02, 0xffff00, 0.5);
    this.sprite.moveTo(0, 0);
    this.sprite.lineTo(-velocity[0] * dt, -velocity[1] * dt);

    [this.sprite.x, this.sprite.y] = this.body.position;
    this.sprite.angle = this.body.angle;
  }
}
