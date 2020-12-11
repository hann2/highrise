import { Body, Box, RevoluteConstraint } from "p2";
import { Graphics, Point, Sprite } from "pixi.js";
import wallHit1 from "../../../resources/audio/impacts/wall-hit-1.flac";
import wallHit2 from "../../../resources/audio/impacts/wall-hit-2.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import WallImpact from "../effects/WallImpact";
import { Layers } from "../layers";
import { CollisionGroups } from "../physics/CollisionGroups";
import SwingingWeapon from "../weapons/SwingingWeapon";
import Bullet from "./Bullet";
import Hittable from "./Hittable";

const DOOR_THICKNESS = 0.25;

export default class Door extends BaseEntity implements Entity, Hittable {
  hingePoint: V2d;
  length: number;
  restingAngle: number;
  minAngle: number;
  maxAngle: number;

  sprite: Sprite;
  body: Body;

  constructor(
    hingePoint: V2d,
    length: number,
    restingAngle: number,
    minAngle: number,
    maxAngle: number
  ) {
    super();
    this.hingePoint = hingePoint;
    this.length = length;
    this.restingAngle = restingAngle;
    this.minAngle = minAngle;
    this.maxAngle = maxAngle;

    const [x1, y1] = [0, -DOOR_THICKNESS / 2];
    const [w, h] = [length, DOOR_THICKNESS];
    const [x2, y2] = [x1 + w, y1 + h];

    const corners = [
      new Point(x1, y1),
      new Point(x1, y2),
      new Point(x2, y2),
      new Point(x2, y1),
    ];

    const graphics = new Graphics();
    graphics.beginFill(0xff6666);
    graphics.drawPolygon(corners);
    graphics.endFill();

    this.sprite = new Sprite();
    this.sprite.position.set(...hingePoint);
    this.sprite.addChild(graphics);
    this.sprite.anchor.set(0.5, 0);
    (this.sprite as GameSprite).layerName = Layers.WORLD_FRONT;

    this.body = new Body({
      mass: 1.5,
      position: hingePoint,
    });

    const shape = new Box({ width: w, height: h });
    shape.collisionGroup = CollisionGroups.World | CollisionGroups.CastsShadow;
    shape.collisionMask =
      CollisionGroups.All ^
      (CollisionGroups.World | CollisionGroups.CastsShadow);
    this.body.addShape(shape, [length / 2, 0], 0);
    this.body.angle = restingAngle;
    this.body.angularDamping = 1.0;
  }

  onAdd(game: Game) {
    const constraint = new RevoluteConstraint(game.ground, this.body, {
      worldPivot: this.hingePoint,
    });
    constraint.setLimits(
      this.restingAngle + this.minAngle,
      this.restingAngle + this.maxAngle
    );
    this.constraints = [constraint];
  }

  onRender() {
    this.sprite.rotation = this.body.angle;
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void {}

  onBulletHit(bullet: Bullet, position: V2d, normal: V2d) {
    this.body.applyImpulse(bullet.velocity.mul(bullet.mass * 0.7), position);

    this.game!.addEntities([
      new PositionalSound(choose(wallHit1, wallHit2), position),
      new WallImpact(position, normal),
    ]);
  }
}
