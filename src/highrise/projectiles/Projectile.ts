import { Ray, RaycastResult } from "p2";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { WithOwner } from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";

const MAX_LIFESPAN = 3.0; // seconds

export type HitResult = { hit: Entity; hitNormal: V2d; hitPosition: V2d };
export class Projectile extends BaseEntity implements Entity {
  ray: Ray;
  raycastResult = new RaycastResult();
  hitPosition?: V2d;
  renderPosition: V2d;

  constructor(public position: V2d, public velocity: V2d) {
    super();

    this.ray = new Ray({
      from: position.clone(), // to be set later
      to: V(0, 0),
      mode: Ray.ALL,
      collisionGroup: CollisionGroups.Projectiles,
      collisionMask: this.makeCollisionMask(),
      checkCollisionResponse: true,
    });

    this.renderPosition = position.clone();
  }

  makeCollisionMask() {
    return (
      CollisionGroups.All ^ CollisionGroups.Humans ^ CollisionGroups.Furniture
    );
  }

  async onAdd() {
    // Make sure we don't have any infinitely living bullets around
    await this.wait(MAX_LIFESPAN, undefined, "life_timer");
    this.destroy();
  }

  getFriction() {
    return 0.0;
  }

  onTick(dt: number) {
    this.velocity.imul(Math.exp(-dt * this.getFriction()));

    // Every frame we want to render the bullet starting from where we started checking
    this.renderPosition.set(this.position);

    const hitResult = this.checkForCollision(dt);

    if (hitResult && this.onHit(hitResult)) {
      this.hitPosition = hitResult.hitPosition;
      this.destroy();
    } else {
      this.position.iaddScaled(this.velocity, dt);
    }
  }

  onHit({ hit, hitPosition, hitNormal }: HitResult): boolean {
    return true;
  }

  checkForCollision(dt: number): HitResult | undefined {
    this.raycastResult.reset();
    this.ray.to = this.position.addScaled(this.velocity, dt);
    this.ray.update();

    let hitFraction = Infinity;
    let hit: Entity | undefined;
    let hitNormal: V2d;
    this.ray.callback = ({ fraction, body, normal }) => {
      const owner = (body as WithOwner).owner;
      if (fraction < hitFraction) {
        hitFraction = fraction;
        hit = owner;
        // To keep at most one allocation
        if (hitNormal) {
          hitNormal.set(normal);
        } else {
          hitNormal = V(normal);
        }
      }
    };

    this.game!.world.raycast(this.raycastResult, this.ray);

    if (hit) {
      const hitPosition = V(this.ray.from).ilerp(this.ray.to, hitFraction);
      return { hit, hitNormal: hitNormal!, hitPosition };
    } else {
      return undefined;
    }
  }
}
