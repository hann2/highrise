import { Body, Box, RevoluteConstraint } from "p2";
import { Sprite } from "pixi.js";
import wallHit1 from "../../../resources/audio/impacts/wall-hit-1.flac";
import wallHit2 from "../../../resources/audio/impacts/wall-hit-2.flac";
import door1 from "../../../resources/images/environment/door-1.png";
import door2 from "../../../resources/images/environment/door-2.png";
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

export const DOOR_SPRITES = [door1, door2];

export default class Door extends BaseEntity implements Entity, Hittable {
  tags = ["casts_shadow"];

  sprite: Sprite & GameSprite;
  body: Body;

  constructor(
    private hingePoint: V2d,
    length: number,
    private restingAngle: number,
    private minAngle: number,
    private maxAngle: number
  ) {
    super();
    this.hingePoint = hingePoint;

    this.sprite = Sprite.from(choose(...DOOR_SPRITES));
    this.sprite.scale.set(length / this.sprite.width);
    this.sprite.anchor.set(0, 0.5); // door sprites are horizontal
    this.sprite.position.set(...hingePoint);
    this.sprite.layerName = Layers.WORLD_FRONT;

    this.body = new Body({
      mass: 1.5,
      position: hingePoint,
    });

    const shape = new Box({ width: DOOR_THICKNESS, height: length });
    shape.collisionGroup = CollisionGroups.World | CollisionGroups.CastsShadow;
    shape.collisionMask =
      CollisionGroups.All ^
      (CollisionGroups.World | CollisionGroups.CastsShadow);
    this.body.addShape(shape, [length / 2, 0], Math.PI / 2);
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
