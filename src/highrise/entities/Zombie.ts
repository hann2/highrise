import { Body, Circle } from "p2";
import { Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d, V } from "../../core/Vector";
import Human from "./Human";
import { radToDeg } from "../../core/util/MathUtil";

const RADIUS = 0.5; // meters
const SPEED = 8;
const FRICTION = 0.8;

export default class Zombie extends BaseEntity implements Entity {
  body: Body;
  sprite: Graphics;

  constructor(position: V2d) {
    super();

    this.body = new Body({ mass: 1, position: position.clone() });

    const shape = new Circle({ radius: RADIUS });
    this.body.addShape(shape);

    this.sprite = new Graphics();
    this.sprite.beginFill(0xff0000);
    this.sprite.drawCircle(0, 0, RADIUS);
    this.sprite.endFill();
    this.sprite.lineStyle(0.1, 0xffffff);
    this.sprite.moveTo(0, 0);
    this.sprite.lineTo(RADIUS, 0);
  }

  onTick() {
    const humans = this.game!.entities.getTagged("human") as Human[];

    let nearestHuman: Human | undefined;
    let nearestDistance: number = Infinity;

    for (const human of humans) {
      const distance = human.getPosition().sub(this.getPosition()).magnitude;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestHuman = human;
      }
    }

    if (nearestHuman) {
      const direction = nearestHuman
        .getPosition()
        .sub(this.getPosition())
        .inormalize();
      this.walk(direction);
      this.face(direction.angle);
    }

    const friction = V(this.body.velocity).mul(-FRICTION);
    this.body.applyImpulse(friction);
  }

  onRender() {
    [this.sprite.x, this.sprite.y] = this.body.position;
    this.sprite.angle = radToDeg(this.body.angle);
  }

  walk(direction: V2d) {
    this.body.applyImpulse(direction.mul(SPEED));
  }

  face(angle: number) {
    this.body.angle = angle;
  }
}
