import { Body, Box, RevoluteConstraint } from "p2";
import { Graphics, Point, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { clamp } from "../../core/util/MathUtil";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { CollisionGroups } from "../Collision";
import { Layers } from "../layers";
import Bullet from "./Bullet";
import Hittable from "./Hittable";
import SwingingWeapon from "./meleeWeapons/SwingingWeapon";

const DOOR_THICKNESS = 0.25;
const DOOR_SPEED = 3 * Math.PI; // Radians per second
const MIN_ANGLE = -Math.PI / 2;
const MAX_ANGLE = Math.PI / 2;

export default class Door extends BaseEntity implements Entity, Hittable {
  hingePoint: V2d;
  length: number;
  restingAngle: number;

  sprite: Sprite;
  body: Body;

  currentOffset: number;
  angularVelocity: number = 0;
  closing = false;

  constructor(hingePoint: V2d, length: number, restingAngle: number) {
    super();
    this.hingePoint = hingePoint;
    this.length = length;
    this.restingAngle = restingAngle;
    this.currentOffset = 0;

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
      mass: 20,
      position: hingePoint,
    });

    const shape = new Box({ width: w, height: h });
    shape.collisionGroup = CollisionGroups.World;
    shape.collisionMask = CollisionGroups.All ^ CollisionGroups.World;
    this.body.addShape(shape, [length / 2, 0], 0);
    this.body.angle = restingAngle;
    this.body.angularDamping = 0.9;
  }

  onAdd(game: Game) {
    const constraint = new RevoluteConstraint(game.ground, this.body, {
      worldPivot: this.hingePoint,
    });
    constraint.setLimits(
      this.restingAngle + MIN_ANGLE,
      this.restingAngle + MAX_ANGLE
    );
    this.constraints = [constraint];
  }

  onTick(dt: number) {
    if (this.angularVelocity) {
      this.currentOffset = this.currentOffset + dt * this.angularVelocity;
      if (this.currentOffset >= MAX_ANGLE || this.currentOffset <= MIN_ANGLE) {
        this.angularVelocity = 0;
      } else if (
        this.closing &&
        Math.sign(this.currentOffset) === Math.sign(this.angularVelocity)
      ) {
        this.angularVelocity = 0;
        this.currentOffset = 0;
        this.closing = false;
      }
    }

    this.currentOffset = clamp(this.currentOffset, MIN_ANGLE, MAX_ANGLE);
  }

  onRender() {
    this.sprite.rotation = this.body.angle;
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void {}

  onBulletHit(bullet: Bullet, position: V2d) {
    this.game!.addEntity(
      new PositionalSound(choose("wallHit1", "wallHit2"), position)
    );
  }
}
