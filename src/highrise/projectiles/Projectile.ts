import { CollisionGroups } from "../../config/CollisionGroups";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { V2d } from "../../core/Vector";

const MAX_LIFESPAN = 3.0; // seconds

export type HitResult = { hit: Entity; hitNormal: V2d; hitPosition: V2d };

export class Projectile extends BaseEntity implements Entity {
  hitPosition?: V2d;
  renderPosition: V2d;

  constructor(
    public position: V2d,
    public velocity: V2d,
  ) {
    super();

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

    if (hitResult && this.handleHit(hitResult)) {
      this.hitPosition = hitResult.hitPosition;
      this.destroy();
    } else {
      this.position.iaddScaled(this.velocity, dt);
    }
  }

  handleHit(hitResult: HitResult): boolean {
    return true;
  }

  checkForCollision(dt: number): HitResult | undefined {
    return projectileRaycast(
      this.game!,
      this.position,
      this.position.addScaled(this.velocity, dt),
      this.makeCollisionMask(),
    );
  }
}

/** Find the first thing that a projectile going from one point to another would hit. */
export function projectileRaycast(
  game: Game,
  from: V2d,
  to: V2d,
  collisionMask: number,
): HitResult | undefined {
  const hit = game.world.raycast(from, to, {
    collisionMask,
    // Some things (like fences) opt out of being hit by projectiles
    filter: (_body, shape) =>
      (shape.collisionMask & CollisionGroups.Projectiles) !== 0,
  });
  const owner = hit?.body.owner;
  if (hit && owner) {
    return { hit: owner, hitNormal: hit.normal, hitPosition: hit.point };
  }
  return undefined;
}
