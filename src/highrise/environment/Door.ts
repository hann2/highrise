import { Body, Box, RevoluteConstraint } from "p2";
import { Sprite } from "pixi.js";
import snd_wallHit1 from "../../../resources/audio/impacts/wall-hit-1.flac";
import snd_wallHit2 from "../../../resources/audio/impacts/wall-hit-2.flac";
import img_door1 from "../../../resources/images/environment/door-1.png";
import img_door2 from "../../../resources/images/environment/door-2.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Layer } from "../config/layers";
import WallImpact from "../effects/WallImpact";
import Bullet from "../projectiles/Bullet";
import SwingingWeapon from "../weapons/SwingingWeapon";
import Hittable from "./Hittable";

const DOOR_THICKNESS = 0.25;

export const DOOR_SPRITES = [img_door1, img_door2];

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
    this.sprite.layerName = Layer.WORLD_FRONT;

    this.body = new Body({
      mass: 1.5,
      position: hingePoint,
    });

    const shape = new Box({ width: DOOR_THICKNESS, height: length });
    shape.collisionGroup = CollisionGroups.Walls | CollisionGroups.CastsShadow;
    shape.collisionMask =
      CollisionGroups.All ^
      (CollisionGroups.Walls | CollisionGroups.CastsShadow) ^
      CollisionGroups.Furniture;
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
    this.body.applyImpulse(
      bullet.velocity.mul(bullet.mass * 0.7),
      position.sub(this.body.position)
    );

    this.game!.addEntities([
      new PositionalSound(choose(snd_wallHit1, snd_wallHit2), position),
      new WallImpact(position, normal),
    ]);
  }
}
