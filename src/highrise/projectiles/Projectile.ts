import { Ray } from "p2";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { polarToVec } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";

export class Projectile extends BaseEntity implements Entity {
  ray: Ray;

  constructor(public position: V2d, public velocity: V2d) {
    super();

    this.ray = new Ray({
      from: position.clone(), // to be set later
      to: V(0, 0),
      mode: Ray.ALL,
      collisionGroup: CollisionGroups.Projectiles,
      collisionMask:
        CollisionGroups.All ^
        CollisionGroups.Humans ^
        CollisionGroups.Furniture,
      checkCollisionResponse: true,
    });
  }
}
