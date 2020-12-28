import { Body, Box, vec2 } from "p2";
import { BLEND_MODES, Sprite } from "pixi.js";
import snd_wallHit3 from "../../../resources/audio/impacts/wall-hit-3.flac";
import img_wallAo1 from "../../../resources/images/environment/wall-ao-1.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { choose, rNormal } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Layer } from "../config/layers";
import { P2Materials } from "../config/PhysicsMaterials";
import WallImpact from "../effects/WallImpact";
import Bullet from "../projectiles/Bullet";
import SwingingWeapon from "../weapons/melee/SwingingWeapon";
import Hittable from "./Hittable";
import { SolidWall, WallType } from "./WallTypes";

export default class Wall extends BaseEntity implements Entity, Hittable {
  tags: string[] = [];

  constructor(
    [x1, y1]: [number, number],
    [x2, y2]: [number, number],
    private type: WallType = SolidWall
  ) {
    super();

    const length = vec2.dist([x1, y1], [x2, y2]);
    const x = (x1 + x2) / 2;
    const y = (y1 + y2) / 2;

    const angle = V(x2 - x1, y2 - y1).angle + Math.PI / 2;

    const drawHeight = length + type.spriteWidth / 3; // add in width to make things line up nicely

    // TODO: AO Breaks on outside corners
    const aoSprite = Sprite.from(img_wallAo1);
    (aoSprite as GameSprite).layerName = Layer.FLOOR_AO;
    aoSprite.blendMode = BLEND_MODES.MULTIPLY;
    aoSprite.anchor.set(0.5, 0.5);
    aoSprite.width = drawHeight;
    aoSprite.height = type.spriteWidth;
    aoSprite.position.set(x, y);
    aoSprite.rotation = angle + Math.PI / 2;

    // TODO: Tile wall sprite rather than just stretch it
    const wallSprite = Sprite.from(type.imageUrl);
    (wallSprite as GameSprite).layerName = Layer.WALLS;
    wallSprite.anchor.set(0.5, 0.5);
    wallSprite.width = drawHeight;
    wallSprite.height = type.spriteWidth;
    wallSprite.position.set(x, y);
    wallSprite.rotation = angle + Math.PI / 2;
    wallSprite.tint = type.color ?? 0xffffff;

    this.sprites = [wallSprite, aoSprite];

    this.body = new Body({
      mass: 0,
      position: [x, y],
      angle,
    });

    let collisionGroup = CollisionGroups.Walls;

    const shape = new Box({ width: type.collisionWidth, height: length });
    shape.collisionGroup = CollisionGroups.None;
    shape.collisionMask = CollisionGroups.All;
    shape.material = P2Materials.wall;
    this.body.addShape(shape);

    if (type.blocksMovement) {
      shape.collisionGroup |= CollisionGroups.Walls;
    }
    if (type.blocksVision || type.castsShadow) {
      shape.collisionGroup |= CollisionGroups.CastsShadow;
      this.tags.push("cast_shadow");
    }
    if (!type.blocksBullets) {
      shape.collisionMask ^= CollisionGroups.Projectiles;
    }
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void {}

  onBulletHit(bullet: Bullet, position: V2d, normal: V2d) {
    const sounds = this.type.impactSounds;
    if (sounds && sounds.length) {
      const sound = choose(...sounds);
      const speed = rNormal(1, 0.08);
      this.game!.addEntity(new PositionalSound(sound, position, { speed }));
    }

    this.game?.addEntity(new WallImpact(position, normal, this.type.color));

    return true;
  }

  onBeginContact() {
    const sounds = this.type.collisionSounds;
    if (sounds) {
      this.addChild(new PositionalSound(choose(...sounds), this.getPosition()));
    }
  }
}
