import { Body, Box } from "p2";
import snd_wallHit1 from "../../../../resources/audio/impacts/wall-hit-1.flac";
import snd_wallHit2 from "../../../../resources/audio/impacts/wall-hit-2.flac";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { choose } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import WallImpact from "../../effects/WallImpact";
import { CollisionGroups } from "../../physics/CollisionGroups";
import SwingingWeapon from "../../weapons/SwingingWeapon";
import Bullet from "../Bullet";
import Hittable from "../Hittable";
import Decoration from "./Decoration";
import { DecorationInfo } from "./decorations/DecorationInfo";

export default class Furniture extends BaseEntity implements Entity, Hittable {
  constructor(
    position: V2d,
    decorationInfo: DecorationInfo,
    rotation: number = 0
  ) {
    super();

    const decoration = this.addChild(
      new Decoration(position, decorationInfo, rotation)
    );

    this.body = new Body({
      mass: 0,
      position,
    });

    const shape = new Box({
      width: decoration.sprite.width,
      height: decoration.sprite.height,
    });
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape, [0, 0], 0);
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void {}

  onBulletHit(bullet: Bullet, position: V2d, normal: V2d) {
    this.game!.addEntities([
      new PositionalSound(choose(snd_wallHit1, snd_wallHit2), position),
      new WallImpact(position, normal),
    ]);
  }
}
