import { Body, Box } from "p2";
import { Sprite } from "pixi.js";
import snd_wallHit1 from "../../../resources/audio/impacts/wall-hit-1.flac";
import snd_wallHit2 from "../../../resources/audio/impacts/wall-hit-2.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Layer } from "../config/layers";
import WallImpact from "../effects/WallImpact";
import Bullet from "../projectiles/Bullet";
import SwingingWeapon from "../weapons/SwingingWeapon";
import {
  DecorationInfo,
  getDecorationTexture,
} from "./decorations/DecorationInfo";
import Hittable from "./Hittable";

export default class Decoration extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  constructor(
    position: V2d,
    decorationInfo: DecorationInfo,
    angle: number = 0,
    layerName?: Layer
  ) {
    super();

    layerName ??= decorationInfo.isSolid ? Layer.FURNITURE : Layer.DECORATIONS;

    const texture = getDecorationTexture(decorationInfo);
    this.sprite = new Sprite(texture);
    this.sprite.layerName = layerName;
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.rotation = angle + (decorationInfo.rotation ?? 0);
    this.sprite.position.set(...position);
    const scale = decorationInfo.heightMeters / texture.height;
    this.sprite.scale.set(scale);

    if (decorationInfo.isSolid) {
      const { width, height } = this.sprite;
      const [widthInset, heightInset] = decorationInfo.bodyInset ?? [0, 0];
      this.addChild(
        new DecorationBody(
          position,
          angle,
          width - widthInset,
          height - heightInset
        )
      );
    }
  }
}

class DecorationBody extends BaseEntity implements Entity, Hittable {
  constructor(position: V2d, angle: number = 0, width: number, height: number) {
    super();

    this.body = new Body({
      mass: 0,
      position,
      angle: angle,
    });

    const shape = new Box({ width, height });
    shape.collisionGroup = CollisionGroups.Furniture;
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
