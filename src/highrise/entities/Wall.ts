import { Body, Box } from "p2";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { Graphics, Point } from "pixi.js";
import { CollisionGroups } from "../Collision";

export default class Wall extends BaseEntity implements Entity {
  sprite: GameSprite;

  constructor(x1: number, y1: number, x2: number, y2: number) {
    super();

    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);
    const corners = [
      new Point(x1, y1),
      new Point(x1, y2),
      new Point(x2, y2),
      new Point(x2, y1),
    ];

    const graphics = new Graphics();
    graphics.position.set(0, 0);
    graphics.beginFill(0xff0000);
    graphics.drawPolygon(corners);
    graphics.endFill();

    this.sprite = graphics;

    this.body = new Body({
      mass: 0,
      // material: new Material(2),
      position: [Math.min(x1, x2) + w / 2, Math.min(y1, y2) + h / 2],
    });

    const shape = new Box({ width: w, height: h });
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape, [0, 0], 0);
  }
}
