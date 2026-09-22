import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import { PhysicsMaterials } from "../../config/PhysicsMaterials";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { loadGameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { createRigid2D } from "../../core/physics/body/bodyFactories";
import { Box } from "../../core/physics/shapes/Box";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { choose, rNormal } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import BulletHole from "../effects/BulletHole";
import WallImpact from "../effects/WallImpact";
import Bullet from "../projectiles/Bullet";
import Hittable from "./Hittable";
import { SolidWall, WallType } from "./WallTypes";

export default class Wall extends BaseEntity implements Entity, Hittable {
  tags: string[] = [];

  constructor(
    [x1, y1]: [number, number],
    [x2, y2]: [number, number],
    private type: WallType = SolidWall,
  ) {
    super();

    const length = V(x1, y1).distanceTo([x2, y2]);
    const x = (x1 + x2) / 2;
    const y = (y1 + y2) / 2;

    const angle = V(x2 - x1, y2 - y1).angle + Math.PI / 2;

    const drawHeight = length + type.spriteWidth / 3; // add in width to make things line up nicely

    // TODO: AO Breaks on outside corners
    const aoSprite = loadGameSprite("wallAo1", Layer.FLOOR_AO);
    aoSprite.blendMode = "multiply";
    aoSprite.anchor.set(0.5, 0.5);
    aoSprite.width = drawHeight;
    aoSprite.height = type.spriteWidth;
    aoSprite.position.set(x, y);
    aoSprite.rotation = angle + Math.PI / 2;

    // TODO: Tile wall sprite rather than just stretch it
    const wallSprite = loadGameSprite(type.imageName, Layer.WALLS);
    wallSprite.anchor.set(0.5, 0.5);
    wallSprite.width = drawHeight;
    wallSprite.height = type.spriteWidth;
    wallSprite.position.set(x, y);
    wallSprite.rotation = angle + Math.PI / 2;
    wallSprite.tint = type.color ?? 0xffffff;

    this.sprites = [wallSprite, aoSprite];

    this.body = createRigid2D({ motion: "static", position: [x, y], angle });

    const shape = new Box({
      width: type.collisionWidth,
      height: length,
      collisionGroup: CollisionGroups.None,
      collisionMask: CollisionGroups.All,
      material: PhysicsMaterials.wall,
    });
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

  hitByMelee() {}

  hitByBullet(bullet: Bullet, position: V2d, normal: V2d) {
    const sounds = this.type.impactSounds;
    if (sounds?.length) {
      const sound = choose(...sounds);
      const speed = rNormal(1, 0.08);
      this.game.addEntity(new PositionalSound(sound, position, { speed }));
    }

    this.game.addEntities(
      new WallImpact(position, normal, this.type.color),
      new BulletHole(position),
    );

    return true;
  }

  @on("beginContact")
  onBeginContact() {
    const sounds = this.type.collisionSounds;
    if (sounds) {
      this.addChild(new PositionalSound(choose(...sounds), this.getPosition()));
    }
  }
}
