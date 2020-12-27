import { Body, Box, vec2 } from "p2";
import { BLEND_MODES, Sprite } from "pixi.js";
import snd_wallHit3 from "../../../resources/audio/impacts/wall-hit-3.flac";
import img_wall1 from "../../../resources/images/environment/wall-1.png";
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

export default class Wall extends BaseEntity implements Entity, Hittable {
  tags: string[] = [];

  constructor(
    [x1, y1]: [number, number],
    [x2, y2]: [number, number],
    width: number = 0.15,
    private color: number = 0x999999,
    blocksVision: boolean = true,
    imageName: string = img_wall1,
    private collisionSoundName?: string
  ) {
    super();

    const length = vec2.dist([x1, y1], [x2, y2]);
    const x = (x1 + x2) / 2;
    const y = (y1 + y2) / 2;

    const angle = V(x2 - x1, y2 - y1).angle + Math.PI / 2;

    const drawWidth = width * (blocksVision ? 5 : 1); // Make the wall wider so we can see it in the shadows
    const drawHeight = length + width; // add in width to make things line up nicely

    // TODO: AO Breaks on outside corners
    const aoSprite = Sprite.from(img_wallAo1);
    (aoSprite as GameSprite).layerName = Layer.FLOOR_AO;
    aoSprite.blendMode = BLEND_MODES.MULTIPLY;
    aoSprite.anchor.set(0.5, 0.5);
    aoSprite.width = drawHeight;
    aoSprite.height = drawWidth;
    aoSprite.position.set(x, y);
    aoSprite.rotation = angle + Math.PI / 2;

    // TODO: Tile wall sprite rather than just stretch it
    const wallSprite = Sprite.from(imageName);
    (wallSprite as GameSprite).layerName = Layer.WALLS;
    wallSprite.anchor.set(0.5, 0.5);
    wallSprite.width = drawHeight;
    wallSprite.height = drawWidth;
    wallSprite.position.set(x, y);
    wallSprite.rotation = angle + Math.PI / 2;
    wallSprite.tint = color;

    this.sprites = [wallSprite, aoSprite];

    this.body = new Body({
      mass: 0,
      position: [x, y],
      angle,
    });

    const shape = new Box({ width: width, height: length });
    shape.collisionGroup = CollisionGroups.Walls;
    shape.collisionMask = CollisionGroups.All;
    shape.material = P2Materials.wall;
    this.body.addShape(shape);

    if (blocksVision) {
      shape.collisionGroup |= CollisionGroups.CastsShadow;
      this.tags.push("cast_shadow");
    } else {
      shape.collisionMask ^= CollisionGroups.Projectiles;
    }
  }

  onMeleeHit(swingingWeapon: SwingingWeapon, position: V2d): void {}

  onBulletHit(bullet: Bullet, position: V2d, normal: V2d) {
    this.game!.addEntities([
      new PositionalSound(choose(snd_wallHit3), position, {
        speed: rNormal(1, 0.08),
      }),
      new WallImpact(position, normal, this.color),
    ]);

    return true;
  }

  onBeginContact() {
    if (this.collisionSoundName) {
      this.addChild(
        new PositionalSound(this.collisionSoundName, this.getPosition())
      );
    }
  }
}
