import { Body, Box } from "p2";
import { Graphics, Point, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { clamp } from "../../core/util/MathUtil";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { CollisionGroups } from "../Collision";
import { Layers } from "../layers";
import Bullet from "./Bullet";
import Hittable from "./Hittable";
import Human from "./Human";
import Interactable from "./Interactable";
import SwingingWeapon from "./meleeWeapons/SwingingWeapon";

export const DOOR_THICKNESS = 0.25;
export const DOOR_SPEED = Math.PI; // Radians per second

export default class Door extends BaseEntity implements Entity, Hittable {
  sprite: Sprite;
  hingePoint: V2d;
  length: number;
  restingAngle: number;
  currentAngle: number;
  opening: boolean = false;
  minAngle: number;
  maxAngle: number;
  body: Body;

  constructor(hingePoint: V2d, length: number, restingAngle: number) {
    super();
    this.hingePoint = hingePoint;
    this.length = length;
    this.restingAngle = restingAngle;
    this.currentAngle = restingAngle;
    this.minAngle = restingAngle - Math.PI / 2;
    this.maxAngle = restingAngle + Math.PI / 2;

    const [x1, y1] = [-DOOR_THICKNESS / 2, 0];
    const [w, h] = [DOOR_THICKNESS, length];
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
    this.body.addShape(shape, [0, length / 2], 0);
  }

  onTick(dt: number) {
    this.body.angle = this.currentAngle;

    if (this.opening) {
      this.currentAngle = this.currentAngle + dt * DOOR_SPEED;
      if (
        this.currentAngle >= this.maxAngle ||
        this.currentAngle <= this.minAngle
      ) {
        this.opening = false;
      }
    }

    this.currentAngle = clamp(this.currentAngle, this.minAngle, this.maxAngle);
  }

  onInteract(human: Human) {
    this.opening = true;
  }

  onRender() {
    this.sprite.rotation = this.currentAngle;
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void {}

  onBulletHit(bullet: Bullet, position: V2d) {
    this.game!.addEntity(
      new PositionalSound(choose("wallHit1", "wallHit2"), position)
    );
  }
}
