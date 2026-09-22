import { Container, Graphics, Sprite } from "pixi.js";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { polarToVec } from "../../core/util/MathUtil";
import { V2d } from "../../core/Vector";

// Lasers stop at the same things that bullets do
const LASER_COLLISION_MASK =
  CollisionGroups.All ^ CollisionGroups.Humans ^ CollisionGroups.Furniture;

export class LaserSight extends BaseEntity implements Entity {
  sprite: Container & GameSprite = new Container();
  private beam = new Graphics();
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

    this.beam.blendMode = "add";
    this.sprite.addChild(this.beam);

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

  @on("render")
  onRender() {
    const from = this.getEmitterPosition();
    const to = from.add(polarToVec(this.getAngle(), this.maxDistance));

    this.startDot.position.copyFrom(from);

    const hit = this.game.world.raycast(from, to, {
      collisionMask: LASER_COLLISION_MASK,
      filter: (_body, shape) =>
        (shape.collisionMask & CollisionGroups.Projectiles) !== 0,
    });

    const end = hit?.point ?? to;
    this.endDot.visible = hit != null;
    if (hit) {
      this.endDot.position.copyFrom(end);
    }

    this.beam
      .clear()
      .moveTo(from.x, from.y)
      .lineTo(end.x, end.y)
      .stroke({ width: 0.01, color: this.color, alpha: 0.2 });
  }
}
