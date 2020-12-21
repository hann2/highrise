import { Body, Box, RevoluteConstraint } from "p2";
import { Graphics, Sprite } from "pixi.js";
import snd_takeshiTaunt1 from "../../../resources/audio/characters/takeshi/takeshi-taunt-1.flac";
import snd_wallHit1 from "../../../resources/audio/impacts/wall-hit-1.flac";
import snd_wallHit2 from "../../../resources/audio/impacts/wall-hit-2.flac";
import img_door1 from "../../../resources/images/environment/doors/door-1.png";
import img_door2 from "../../../resources/images/environment/doors/door-2.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { polarToVec } from "../../core/util/MathUtil";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Layer } from "../config/layers";
import WallImpact from "../effects/WallImpact";
import Bullet from "../projectiles/Bullet";
import DoorSpring from "../utils/DoorSpring";
import SwingingWeapon from "../weapons/melee/SwingingWeapon";
import { DoorFrame } from "./DoorFrame";
import Hittable from "./Hittable";

const DOOR_THICKNESS = 0.25;

export const DEFAULT_DOOR_SPRITES = [img_door1, img_door2];

export default class Door extends BaseEntity implements Entity, Hittable {
  tags: string[];
  sprite: Sprite & GameSprite;
  body: Body;

  constructor(
    private hingePoint: V2d,
    length: number,
    private restingAngle: number,
    private minAngle: number,
    private maxAngle: number,
    blocksVision: boolean = true,
    imageName: string = choose(...DEFAULT_DOOR_SPRITES)
  ) {
    super();
    this.hingePoint = hingePoint;

    this.sprite = Sprite.from(imageName);
    this.sprite.scale.set(length / this.sprite.width);
    this.sprite.anchor.set(0, 0.5); // door sprites are horizontal
    this.sprite.position.set(...hingePoint);
    this.sprite.layerName = Layer.WORLD_FRONT;

    this.body = new Body({
      mass: 1.0,
      position: hingePoint,
    });

    const shape = new Box({ width: DOOR_THICKNESS / 2, height: length });
    shape.collisionGroup = CollisionGroups.Walls;
    shape.collisionMask =
      CollisionGroups.All ^
      CollisionGroups.Walls ^
      CollisionGroups.Furniture ^
      CollisionGroups.CastsShadow;
    if (blocksVision) {
      shape.collisionGroup |= CollisionGroups.CastsShadow;
      this.tags = ["cast_shadow"];
    } else {
      this.tags = [];
    }
    this.body.addShape(shape, [length / 2, 0], Math.PI / 2);
    this.body.angle = restingAngle;

    this.addChild(new DoorFrame(hingePoint, restingAngle, length));
  }

  onAdd(game: Game) {
    const constraint = new RevoluteConstraint(game.ground, this.body, {
      worldPivot: this.hingePoint,
    });
    this.constraints = [constraint];
    this.springs = [
      new DoorSpring(
        game.ground,
        this.body,
        this.restingAngle + this.minAngle,
        this.restingAngle + this.maxAngle
      ),
    ];
  }

  onRender() {
    this.sprite.rotation = this.body.angle;
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void {}

  onBulletHit(bullet: Bullet, position: V2d, normal: V2d) {
    this.body.applyImpulse(
      bullet.velocity.mul(bullet.stats.mass * 0.5),
      position.sub(this.body.position)
    );

    this.game!.addEntities([
      new PositionalSound(choose(snd_wallHit1, snd_wallHit2), position),
      new WallImpact(position, normal),
    ]);
  }
}
