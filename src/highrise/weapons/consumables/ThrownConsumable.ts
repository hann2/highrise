import { Graphics } from "pixi.js";
import { CollisionGroups } from "../../../config/CollisionGroups";
import { Layer } from "../../../config/layers";
import { PhysicsMaterials } from "../../../config/PhysicsMaterials";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { GameSprite } from "../../../core/entity/GameSprite";
import { on } from "../../../core/entity/handler";
import type { Body } from "../../../core/physics/body/Body";
import { createRigid2D } from "../../../core/physics/body/bodyFactories";
import { Capsule } from "../../../core/physics/shapes/Capsule";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { clamp } from "../../../core/util/MathUtil";
import {
  choose,
  rDirection,
  rNormal,
  rUniform,
} from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import Detonation from "../../effects/Detonation";
import type Human from "../../human/Human";
import { ConsumableStats } from "./ConsumableStats";

const MIN_BOUNCE_SPEED = 1.0; // meters / second
const BOUNCE_RESTITUTION = 0.3; // fraction of vertical speed kept in a bounce
const GRAVITY = 9.8; // meters / second²
/** How quickly it stops sliding once it's on the floor, per second */
const FLOOR_FRICTION = 3;

/** A grenade (or similar) in flight or lying on the floor with its fuse burning */
export default class ThrownConsumable extends BaseEntity implements Entity {
  body: Body;
  sprite: Graphics & GameSprite;
  /** Height above the floor, meters. Only for looks and bounces. */
  private z = 1;
  private zVelocity: number;
  private onFloor = false;

  constructor(
    public stats: ConsumableStats,
    position: V2d,
    velocity: V2d,
    private thrower?: Human,
  ) {
    super();

    this.zVelocity = rNormal(1.5, 0.3);

    const [length, width] = stats.size;
    this.body = createRigid2D({
      motion: "dynamic",
      mass: 0.2,
      position,
      velocity,
      angularVelocity: rUniform(5, 20),
      angle: rDirection(),
    });
    this.body.addShape(
      new Capsule({
        radius: width / 2,
        length: Math.max(0.01, length - width),
        collisionGroup: CollisionGroups.Particle,
        collisionMask: CollisionGroups.Walls | CollisionGroups.Enemies,
        material: PhysicsMaterials.smallObject,
      }),
    );

    this.sprite = drawConsumable(stats);
    this.sprite.layerName = Layer.ITEMS;
    this.sprite.position.copyFrom(position);
  }

  @on("add")
  async onAdd() {
    await this.wait(this.stats.fuseTime);
    this.game.addEntity(
      new Detonation(
        this.stats,
        this.getPosition().clone(),
        this.thrower?.isDestroyed ? undefined : this.thrower,
      ),
    );
    this.destroy();
  }

  @on("tick")
  onTick(dt: number) {
    if (this.onFloor) {
      const friction = Math.exp(-FLOOR_FRICTION * dt);
      this.body.velocity.imul(friction);
      this.body.angularVelocity *= friction;
    } else if (this.z < 0) {
      this.z = 0;
      if (Math.abs(this.zVelocity) > MIN_BOUNCE_SPEED) {
        this.playBounceSound(clamp(Math.abs(this.zVelocity) / 10) * 2);
        this.zVelocity *= -BOUNCE_RESTITUTION;
        this.body.angularVelocity *= 0.5;
        this.body.velocity.imul(0.6);
      } else {
        this.zVelocity = 0;
        this.onFloor = true;
      }
    } else {
      this.z += this.zVelocity * dt;
      this.zVelocity -= GRAVITY * dt;
    }
  }

  @on("impact")
  onImpact() {
    this.playBounceSound(clamp(this.body.velocity.magnitude / 5));
  }

  private playBounceSound(gain: number) {
    const sound = choose(...this.stats.sounds.bounce);
    this.game.addEntity(
      new PositionalSound(sound, this.getPosition(), { gain, speed: 0.6 }),
    );
  }

  @on("render")
  onRender() {
    this.sprite.position.copyFrom(this.body.position);
    this.sprite.rotation = this.body.angle;
    this.sprite.scale.set(1 + this.z * 0.6);
  }
}

/** A consumable as seen from above: a body with a cap on one end */
export function drawConsumable(stats: ConsumableStats): Graphics & GameSprite {
  const [length, width] = stats.size;
  const graphics = new Graphics();
  graphics
    .roundRect(-length / 2, -width / 2, length, width, width / 2)
    .fill(stats.color)
    .stroke({ width: 0.01, color: 0x000000, alpha: 0.6 })
    .rect(length / 2 - width * 0.35, -width * 0.3, width * 0.35, width * 0.6)
    .fill(stats.accentColor)
    // The pin ring
    .circle(length / 2 + width * 0.1, width * 0.35, width * 0.18)
    .stroke({ width: 0.012, color: stats.accentColor });
  return graphics;
}
