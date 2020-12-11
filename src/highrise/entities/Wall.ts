import { Body, Box } from "p2";
import { Graphics, Point } from "pixi.js";
import wallHit1 from "../../../resources/audio/impacts/wall-hit-1.flac";
import wallHit2 from "../../../resources/audio/impacts/wall-hit-2.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import WallImpact from "../effects/WallImpact";
import { Layers } from "../layers";
import { CollisionGroups } from "../physics/CollisionGroups";
import SwingingWeapon from "../weapons/SwingingWeapon";
import Bullet from "./Bullet";
import Hittable from "./Hittable";

export default class Wall extends BaseEntity implements Entity, Hittable {
  sprite: GameSprite;
  tags = ["cast_shadow"];

  constructor(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: number = 0x666666
  ) {
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
    graphics.beginFill(color);
    graphics.drawPolygon(corners);
    graphics.endFill();

    this.sprite = graphics;
    this.sprite.layerName = Layers.WORLD_FRONT;

    this.body = new Body({
      mass: 0,
      // material: new Material(2),
      position: [Math.min(x1, x2) + w / 2, Math.min(y1, y2) + h / 2],
    });

    const shape = new Box({ width: w, height: h });
    shape.collisionGroup = CollisionGroups.World | CollisionGroups.CastsShadow;
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape, [0, 0], 0);
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void {}

  onBulletHit(bullet: Bullet, position: V2d, normal: V2d) {
    this.game!.addEntities([
      new PositionalSound(choose(wallHit1, wallHit2), position),
      new WallImpact(position, normal),
    ]);
  }
}
