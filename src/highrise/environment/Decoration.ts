import { Body, Box } from "p2";
import { Sprite } from "pixi.js";
import snd_wallHit4 from "../../../resources/audio/impacts/wall-hit-4.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Layer } from "../config/layers";
import WallImpact from "../effects/WallImpact";
import Bullet from "../projectiles/Bullet";
import SwingingWeapon from "../weapons/melee/SwingingWeapon";
import {
  DecorationInfo,
  getDecorationTexture,
} from "./decorations/DecorationInfo";

export const DEFAULT_HIT_SOUNDS = [snd_wallHit4];

export default class Decoration extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  constructor(
    position: V2d,
    private decorationInfo: DecorationInfo,
    angle: number = 0,
    layerName?: Layer,
    flipX: boolean = false,
    flipY: boolean = false
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

    if (flipX) {
      this.sprite.scale.x *= -1;
    }
    if (flipY) {
      this.sprite.scale.y *= -1;
    }

    if (decorationInfo.isSolid) {
      this.body = new Body({
        mass: 0,
        position,
        angle: angle,
      });

      const [widthInset, heightInset] = decorationInfo.bodyInset ?? [0, 0];
      const width = this.sprite.width - widthInset;
      const height = this.sprite.height - heightInset;

      if (decorationInfo.corners) {
        const points = decorationInfo.corners.map((point): [number, number] => [
          point[0] * width * 0.5 * (flipX ? -1 : 1),
          point[1] * height * 0.5 * (flipY ? -1 : 1),
        ]);
        if (flipX != flipX) {
          // one axis is flipped but not both
          points.reverse();
        }
        console.log(points);
        this.body.fromPolygon(points, {
          optimalDecomp: true,
          removeCollinearPoints: false,
          skipSimpleCheck: false,
        });
      } else {
        const shape = new Box({ width, height });

        this.body.addShape(shape, [0, 0], 0);
      }

      for (const shape of this.body.shapes) {
        shape.collisionGroup = CollisionGroups.Furniture;
        shape.collisionMask = CollisionGroups.All;

        if (decorationInfo.isHittable) {
          shape.collisionGroup |= CollisionGroups.Walls;
        }
      }
    }
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void {
    if (this.decorationInfo.isHittable) {
      const sounds = this.decorationInfo.hitSounds ?? DEFAULT_HIT_SOUNDS;
      this.game?.addEntity(new PositionalSound(choose(...sounds), position));
    }
  }

  onBulletHit(bullet: Bullet, position: V2d, normal: V2d) {
    if (this.decorationInfo.isHittable) {
      const sounds = this.decorationInfo.hitSounds ?? DEFAULT_HIT_SOUNDS;
      this.game!.addEntity(new PositionalSound(choose(...sounds), position));
      this.game!.addEntity(new WallImpact(position, normal));

      return true;
    }
    return false;
  }
}
