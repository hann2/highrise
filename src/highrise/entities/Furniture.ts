import { Body, Box } from "p2";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { CollisionGroups } from "../Collision";
import { DecorationSprite } from "../view/DecorationSprite";
import Bullet from "./Bullet";
import Decoration from "./Decoration";
import Hittable from "./Hittable";
import SwingingWeapon from "./meleeWeapons/SwingingWeapon";

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
      new PositionalSound(choose("wallHit1", "wallHit2"), position)
    );
  }
}
