import { Body, Box } from "p2";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { Graphics, Point } from "pixi.js";

export default class Wall extends BaseEntity implements Entity {
  sprite: GameSprite;

  x: number;
  y: number;
  w: number;
  h: number;
  path: any[];
  corners: Point[];

  constructor(x: number, y: number) {
    super();

    this.x = x;
    this.y = y;
    this.w = 5;
    this.h = 2;
    this.path = [];
    this.corners = [
      new Point(0.5 * this.w, 0.5 * this.h),
      new Point(0.5 * this.w, -0.5 * this.h),
      new Point(-0.5 * this.w, -0.5 * this.h),
      new Point(-0.5 * this.w, 0.5 * this.h),
    ];

    const graphics = new Graphics();
    graphics.position.set(this.x, this.y);
    graphics.beginFill(0xff0000);
    graphics.drawPolygon(this.corners);
    graphics.endFill();

    this.sprite = graphics;

    this.body = new Body({
      mass: 0,
      // material: new Material(2),
      position: [x, y],
    });

    const shape = new Box({ width: this.w, height: this.h });
    this.body.addShape(shape, [0, 0], 0);
  }
}
