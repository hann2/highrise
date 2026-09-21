import { Ray, RaycastResult } from "p2";
import { BLEND_MODES, Graphics, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { polarToVec } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";

export class LaserSight extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite = new Graphics();
  private ray: Ray;
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

    this.ray = new Ray({
      from: V(0, 0),
      to: V(0, 0),
      mode: Ray.CLOSEST,
      collisionGroup: CollisionGroups.Projectiles,
      collisionMask:
        CollisionGroups.All ^
        CollisionGroups.Humans ^
        CollisionGroups.Furniture,
      checkCollisionResponse: true,
    });
  }

  onRender() {
    this.sprite.clear();

    const from = this.getEmitterPosition();
    const to = from.add(polarToVec(this.getAngle(), this.maxDistance));

    this.ray.from = from;
    this.ray.to = to;
    this.ray.update();

    this.startDot.position.set(from[0], from[1]);

    const result = new RaycastResult();
    this.game?.world.raycast(result, this.ray);

    const end: [number, number] = [0, 0];
    if (result.hasHit()) {
      result.getHitPoint(end, this.ray);
      this.endDot.visible = true;
      this.endDot.position.set(end[0], end[1]);
    } else {
      this.endDot.visible = false;
      end[0] = to[0];
      end[1] = to[1];
    }

    this.sprite
      .moveTo(from[0], from[1])
      .lineTo(end[0], end[1])
      .stroke({ width: 0.01, color: this.color, alpha: 0.2 });
  }
}
