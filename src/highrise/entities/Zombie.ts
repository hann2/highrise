import { Body, Circle } from "p2";
import { Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import Human from "./Human";

const RADIUS = 0.5; // meters

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
    this.sprite.lineStyle(0xffffff);
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
  }

  onRender() {
    [this.sprite.x, this.sprite.y] = this.body.position;
    this.sprite.angle = this.body.angle;
  }

  walk(direction: V2d) {
    this.body.applyImpulse(direction);
  }

  face(angle: number) {
    this.body.angle = angle;
  }
}
