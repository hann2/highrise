import { Body, Box } from "p2";
import { Graphics, Point, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { clamp, normalizeAngle } from "../../core/util/MathUtil";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { CollisionGroups } from "../Collision";
import { Layers } from "../layers";
import Bullet from "./Bullet";
import Hittable from "./Hittable";
import Human from "./Human";
import Interactable from "./Interactable";
import SwingingWeapon from "./meleeWeapons/SwingingWeapon";

const DOOR_THICKNESS = 0.25;
const DOOR_SPEED = 3 * Math.PI; // Radians per second
const MIN_ANGLE = -Math.PI / 2;
const MAX_ANGLE = Math.PI / 2;

export default class Door extends BaseEntity implements Entity, Hittable {
  sprite: Sprite;
  hingePoint: V2d;
  length: number;
  restingAngle: number;
  currentOffset: number;
  angularVelocity: number = 0;
  body: Body;
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

    this.addChild(new Interactable(hingePoint, this.onInteract.bind(this)));

    this.sprite = new Sprite();
    this.sprite.position.set(...hingePoint);
    this.sprite.addChild(graphics);
    this.sprite.anchor.set(0.5, 0);
    (this.sprite as GameSprite).layerName = Layers.WORLD_FRONT;

    this.body = new Body({
      mass: 0,
      position: hingePoint,
    });

    const shape = new Box({ width: w, height: h });
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape, [length / 2, 0], 0);
  }

  onTick(dt: number) {
    this.body.angle = this.currentOffset + this.restingAngle;

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

  onInteract(human: Human) {
    if (this.currentOffset === MIN_ANGLE) {
      this.angularVelocity = DOOR_SPEED;
      this.closing = true;
    } else if (this.currentOffset === MAX_ANGLE) {
      this.angularVelocity = -DOOR_SPEED;
      this.closing = true;
    } else if (this.currentOffset === 0) {
      const humanAngle = human.getPosition().sub(this.hingePoint).angle;
      const humanOffset = normalizeAngle(this.restingAngle - humanAngle);
      this.angularVelocity = Math.sign(humanOffset) * DOOR_SPEED;
    }
  }

  onRender() {
    this.sprite.rotation = this.currentOffset + this.restingAngle;
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void {}

  onBulletHit(bullet: Bullet, position: V2d) {
    this.game!.addEntity(
      new PositionalSound(choose("wallHit1", "wallHit2"), position)
    );
  }
}
