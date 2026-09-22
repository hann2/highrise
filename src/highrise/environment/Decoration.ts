import { Sprite } from "pixi.js";
import { SoundName } from "../../../resources/resources";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { createRigid2D } from "../../core/physics/body/bodyFactories";
import { Box } from "../../core/physics/shapes/Box";
import { convexShapesFromPolygon } from "../../core/physics/utils/polygonShapes";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import WallImpact from "../effects/WallImpact";
import Bullet from "../projectiles/Bullet";
import SwingingWeapon from "../weapons/melee/SwingingWeapon";
import {
  DecorationInfo,
  getDecorationTexture,
} from "./decorations/DecorationInfo";
import Hittable from "./Hittable";

export const DEFAULT_HIT_SOUNDS: SoundName[] = ["wallHit4"];

export default class Decoration extends BaseEntity implements Entity, Hittable {
  sprite: Sprite & GameSprite;

  constructor(
    position: V2d,
    private decorationInfo: DecorationInfo,
    angle: number = 0,
    layerName?: Layer,
    flipX: boolean = false,
    flipY: boolean = false,
  ) {
    super();

    layerName ??= decorationInfo.isSolid ? Layer.FURNITURE : Layer.DECORATIONS;

    const texture = getDecorationTexture(decorationInfo);
    this.sprite = new Sprite(texture);
    this.sprite.layerName = layerName;
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.rotation = angle + (decorationInfo.rotation ?? 0);
    this.sprite.position.copyFrom(position);
    const scale = decorationInfo.heightMeters / texture.height;
    this.sprite.scale.set(scale);

    if (flipX) {
      this.sprite.scale.x *= -1;
    }
    if (flipY) {
      this.sprite.scale.y *= -1;
    }

    if (decorationInfo.isSolid) {
      this.body = createRigid2D({ motion: "static", position, angle });

      const [widthInset, heightInset] = decorationInfo.bodyInset ?? [0, 0];
      const width = this.sprite.width - widthInset;
      const height = this.sprite.height - heightInset;

      if (decorationInfo.corners) {
        const points = decorationInfo.corners.map((point): [number, number] => [
          point[0] * width * 0.5 * (flipX ? -1 : 1),
          point[1] * height * 0.5 * (flipY ? -1 : 1),
        ]);
        for (const shape of convexShapesFromPolygon(points)) {
          this.body.addShape(shape);
        }
      } else {
        this.body.addShape(new Box({ width, height }));
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

  hitByMelee(swingingWeapon: SwingingWeapon, position: V2d): void {
    if (this.decorationInfo.isHittable) {
      const sounds = this.decorationInfo.hitSounds ?? DEFAULT_HIT_SOUNDS;
      this.game.addEntity(new PositionalSound(choose(...sounds), position));
    }
  }

  hitByBullet(bullet: Bullet, position: V2d, normal: V2d) {
    if (this.decorationInfo.isHittable) {
      const sounds = this.decorationInfo.hitSounds ?? DEFAULT_HIT_SOUNDS;
      this.game.addEntities(
        new PositionalSound(choose(...sounds), position),
        new WallImpact(position, normal),
      );

      return true;
    }
    return false;
  }
}
