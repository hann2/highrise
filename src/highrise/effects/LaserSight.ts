import { BLEND_MODES, Graphics, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { polarToVec } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";

// Lasers stop at the same things that bullets do
const LASER_COLLISION_MASK =
  CollisionGroups.All ^ CollisionGroups.Humans ^ CollisionGroups.Furniture;

export class LaserSight extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite = new Graphics();
  private startDot: Sprite;
  private endDot: Sprite;

  constructor(
    private getEmitterPosition: () => V2d,
    private getAngle: () => number,
    public maxDistance = 10,
    public color: number = 0xff0000,
  ) {
    super();

    this.sprite.layerName = Layer.EMISSIVES;
    this.sprite.blendMode = "add";

    this.startDot = Sprite.from("impactParticle");
    this.endDot = Sprite.from("impactParticle");

    for (const dot of [this.startDot, this.endDot]) {
      this.sprite.addChild(dot);
      dot.width = dot.height = 0.2;
      dot.blendMode = "add";
      dot.tint = this.color;
      dot.alpha = 0.7;
      dot.anchor.set(0.5);
    }
  }

  onRender() {
    this.sprite.clear();

    const from = this.getEmitterPosition();
    const to = from.add(polarToVec(this.getAngle(), this.maxDistance));

    this.startDot.position.set(from[0], from[1]);

    const hit = this.game?.world.raycast(from, to, {
      collisionMask: LASER_COLLISION_MASK,
      filter: (body, shape) =>
        (shape.collisionMask & CollisionGroups.Projectiles) !== 0,
    });

    const end = hit?.point ?? to;
    this.endDot.visible = hit != null;
    if (hit) {
      this.endDot.position.set(end[0], end[1]);
    }

    this.sprite
      .moveTo(from[0], from[1])
      .lineTo(end[0], end[1])
      .stroke({ width: 0.01, color: this.color, alpha: 0.2 });
  }
}
