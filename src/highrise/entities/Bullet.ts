import { Body, Circle } from "p2";
import { Graphics, graphicsUtils, Point } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import CCDBody from "../../core/physics/CCDBody";
import { polarToVec } from "../../core/util/MathUtil";
import { V2d } from "../../core/Vector";
import { CollisionGroups } from "../Collision";
import { Layers } from "../layers";
import Light from "../lighting/Light";
import { PointLight } from "../lighting/PointLight";
import { isHittable } from "./Hittable";

export const BULLET_RADIUS = 0.05; // meters

export default class Bullet extends BaseEntity implements Entity {
  body: Body;
  sprite: Graphics & GameSprite;
  light: Light;
  lightGraphics: Graphics;

  constructor(
    position: V2d,
    direction: number,
    speed: number = 50,
    public damage: number = 40
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
    this.sprite.layerName = Layers.WEAPONS;

    this.lightGraphics = new Graphics();
    this.light = this.addChild(new Light());
    this.light.lightSprite.addChild(this.lightGraphics);
  }

  onBeginContact(other: Entity, _: unknown, __: unknown) {
    if (isHittable(other)) {
      // TODO: Get actual collision position
      other.onBulletHit(this, this.getPosition());
    }
    this.destroy();
  }

  onRender() {
    const velocity = this.body.velocity;
    const dt = this.game!.renderTimestep;

    this.sprite.clear();
    this.sprite.lineStyle(0.01, 0x000000, 0.1);
    this.sprite.moveTo(0, 0);
    this.sprite.lineTo(-velocity[0] * dt, -velocity[1] * dt);

    this.lightGraphics.clear();
    for (const t of [0.01, 0.02, 0.04]) {
      this.lightGraphics.lineStyle(t, 0xffdd33, 0.01);
      this.lightGraphics.moveTo(0, 0);
      this.lightGraphics.lineTo(-velocity[0] * dt, -velocity[1] * dt);
    }

    [this.sprite.x, this.sprite.y] = this.body.position;
    [this.light.lightSprite.x, this.light.lightSprite.y] = this.body.position;
    this.sprite.angle = this.body.angle;
  }
}
