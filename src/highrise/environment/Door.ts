import { Sprite } from "pixi.js";
import { ImageName } from "../../../resources/resources";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import type { Body } from "../../core/physics/body/Body";
import { createRigid2D } from "../../core/physics/body/bodyFactories";
import { RevoluteConstraint } from "../../core/physics/constraints/RevoluteConstraint";
import { Box } from "../../core/physics/shapes/Box";
import { PositionalSound } from "../../core/sound/PositionalSound";
import { polarToVec } from "../../core/util/MathUtil";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import WallImpact from "../effects/WallImpact";
import Bullet from "../projectiles/Bullet";
import DoorSpring from "../utils/DoorSpring";
import { DoorFrame } from "./DoorFrame";
import Hittable from "./Hittable";

const DOOR_THICKNESS = 0.25;

// The closer that swings one-way and locked doors shut (N·m per radian, N·m·s per radian)
const CLOSER_STIFFNESS = 15;
const CLOSER_DAMPING = 3;

export interface DoorOptions {
  /** The door can only swing this way from rest: 1 towards increasing angle, -1 towards decreasing */
  oneWay?: 1 | -1;
  /** Starts locked. See {@link Door.locked}. */
  locked?: boolean;
}

export const DEFAULT_DOOR_SPRITES: ImageName[] = ["door1"];

export default class Door extends BaseEntity implements Entity, Hittable {
  tags: string[];
  sprite: Sprite & GameSprite;
  body: Body;

  /**
   * A locked door can't be opened by anything: its hinge only lets it swing
   * further shut, and a closer pulls it shut. Pushes and bullets don't move it.
   */
  locked: boolean;
  /** Only swings this way from rest (see {@link DoorOptions.oneWay}), and has a closer */
  readonly oneWay?: 1 | -1;

  private hinge?: RevoluteConstraint;
  /** While locked, the range of angles (relative to rest) it can still reach. Only ever shrinks towards 0. */
  private latch: [number, number] = [-Infinity, Infinity];

  constructor(
    private hingePoint: V2d,
    private length: number,
    private restingAngle: number,
    private minAngle: number,
    private maxAngle: number,
    blocksVision: boolean = true,
    imageName: ImageName = choose(...DEFAULT_DOOR_SPRITES),
    { oneWay, locked = false }: DoorOptions = {},
  ) {
    super();

    this.oneWay = oneWay;
    this.locked = locked;

    this.sprite = Sprite.from(imageName);
    this.sprite.scale.set(length / this.sprite.width);
    this.sprite.anchor.set(0, 0.5); // door sprites are horizontal
    this.sprite.position.copyFrom(hingePoint);
    this.sprite.layerName = Layer.WORLD_FRONT;

    this.body = createRigid2D({
      motion: "dynamic",
      mass: 1.0,
      position: hingePoint,
      angle: restingAngle,
    });

    const shape = new Box({ width: DOOR_THICKNESS / 2, height: length });
    shape.collisionGroup = CollisionGroups.Walls;
    shape.collisionMask =
      CollisionGroups.All ^
      CollisionGroups.Walls ^
      CollisionGroups.Furniture ^
      CollisionGroups.CastsShadow;
    if (blocksVision) {
      shape.collisionGroup |= CollisionGroups.CastsShadow;
      this.tags = ["cast_shadow"];
    } else {
      shape.collisionMask ^= CollisionGroups.Projectiles;
      this.tags = [];
    }
    this.body.addShape(shape, [length / 2, 0], Math.PI / 2);

    this.addChild(new DoorFrame(hingePoint, restingAngle, length));
  }

  @on("add")
  onAdd({ game }: { game: Game }) {
    this.hinge = new RevoluteConstraint(game.ground, this.body, {
      worldPivot: this.hingePoint,
    });
    this.constraints = [this.hinge];
    this.springs = [
      new DoorSpring(
        game.ground,
        this.body,
        this.restingAngle + this.minAngle,
        this.restingAngle + this.maxAngle,
      ),
    ];
  }

  setLocked(locked: boolean) {
    if (locked && !this.locked) {
      this.latch = [-Infinity, Infinity];
    }
    this.locked = locked;
  }

  /** The middle of the doorway, where the middle of the door is when it's shut */
  getDoorwayCenter(): V2d {
    return this.hingePoint.add(
      polarToVec(this.restingAngle, this.length * 0.5),
    );
  }

  /** Current angle relative to the resting angle */
  getOpenAngle(): number {
    return this.body.angle - this.restingAngle;
  }

  @on("tick")
  onTick() {
    const offset = this.getOpenAngle();
    let lower = -Infinity;
    let upper = Infinity;
    if (this.oneWay === 1) {
      lower = 0;
    } else if (this.oneWay === -1) {
      upper = 0;
    }
    if (this.locked) {
      this.latch[0] = Math.max(this.latch[0], Math.min(offset, 0));
      this.latch[1] = Math.min(this.latch[1], Math.max(offset, 0));
      lower = Math.max(lower, this.latch[0]);
      upper = Math.min(upper, this.latch[1]);
    }
    this.hinge?.setLimits(
      Number.isFinite(lower) ? this.restingAngle + lower : undefined,
      Number.isFinite(upper) ? this.restingAngle + upper : undefined,
    );

    if (this.locked || this.oneWay) {
      this.body.angularForce -=
        CLOSER_STIFFNESS * offset + CLOSER_DAMPING * this.body.angularVelocity;
    }
  }

  @on("render")
  onRender() {
    this.sprite.rotation = this.body.angle;
  }

  /** Evenly spaced points along the door, from the hinge to the free end. */
  getPointsAlong(count: number): V2d[] {
    const along = polarToVec(this.body.angle, this.length);
    const points: V2d[] = [];
    for (let i = 0; i < count; i++) {
      points.push(this.body.position.addScaled(along, i / (count - 1)));
    }
    return points;
  }

  /** Shoved by a human. `impulse` is applied at `position`. */
  hitByPush(impulse: V2d, position: V2d) {
    if (!this.locked) {
      this.body.applyImpulse(impulse, position.sub(this.body.position));
    }
    this.game.addEntity(
      new PositionalSound(choose("wallHit1", "wallHit2"), position),
    );
  }

  hitByMelee() {}

  hitByBullet(bullet: Bullet, position: V2d, normal: V2d) {
    if (!this.locked) {
      this.body.applyImpulse(
        bullet.velocity.mul(bullet.stats.mass * 0.5),
        position.sub(this.body.position),
      );
    }

    this.game.addEntities(
      new PositionalSound(choose("wallHit1", "wallHit2"), position),
      new WallImpact(position, normal),
    );

    return true;
  }
}
