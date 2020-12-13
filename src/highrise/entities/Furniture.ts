import { Body, Box } from "p2";
import snd_wallHit1 from "../../../resources/audio/impacts/wall-hit-1.flac";
import snd_wallHit2 from "../../../resources/audio/impacts/wall-hit-2.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { CollisionGroups } from "../physics/CollisionGroups";
import { DecorationSprite } from "../view/DecorationSprite";
import Bullet from "./Bullet";
import Decoration from "./Decoration";
import Hittable from "./Hittable";
import SwingingWeapon from "../weapons/SwingingWeapon";

export default class Furniture extends BaseEntity implements Entity, Hittable {
  constructor(position: V2d, decorationSprite: DecorationSprite) {
    super();

    this.addChild(new Decoration(position, decorationSprite));

    this.body = new Body({
      mass: 0,
      position,
    });

    const aspectRatio =
      decorationSprite.dimensions.x / decorationSprite.dimensions.y;

    const shape = new Box({
      width: decorationSprite.heightMeters * aspectRatio,
      height: decorationSprite.heightMeters,
    });
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape, [0, 0], 0);
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void {}

  onBulletHit(bullet: Bullet, position: V2d) {
    this.game!.addEntity(
      new PositionalSound(choose(snd_wallHit1, snd_wallHit2), position)
    );
  }
}
