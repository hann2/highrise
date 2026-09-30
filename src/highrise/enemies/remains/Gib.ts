import { Container } from "pixi.js";
import { CollisionGroups } from "../../../config/CollisionGroups";
import { Layer } from "../../../config/layers";
import { PhysicsMaterials } from "../../../config/PhysicsMaterials";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { GameSprite } from "../../../core/entity/GameSprite";
import { on } from "../../../core/entity/handler";
import type { Body } from "../../../core/physics/body/Body";
import { createRigid2D } from "../../../core/physics/body/bodyFactories";
import { Circle } from "../../../core/physics/shapes/Circle";
import { PositionalSound } from "../../../core/sound/PositionalSound";
import { clamp } from "../../../core/util/MathUtil";
import { rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import BloodSplat from "../../effects/BloodSplat";
import { getSplatSound } from "../../effects/Splat";
import Remains from "./Remains";

const GRAVITY = 9.8; // meters / second^2
/** Slower than this (meters / second) and a landing doesn't bounce */
const MIN_BOUNCE_SPEED = 1.5;
/** Fraction of its falling speed it keeps when it bounces */
const BOUNCE_RESTITUTION = 0.3;
/** Fraction of its speed along the floor it keeps when it lands */
const LANDING_KEEP = 0.6;
/** How fast it slows down sliding along the floor (per second) */
const SLIDE_FRICTION = 4;
/** Slower than this (meters / second) and it's come to rest */
const REST_SPEED = 0.15;
/** Meters between the smears of blood it leaves sliding */
const SMEAR_SPACING = 0.15;
/** How much it grows at a meter off the floor, to look closer to the camera */
const HEIGHT_SCALE = 0.4;

export interface GibOptions {
  /** What it looks like, centered on where it is */
  display: Container;
  position: V2d;
  angle: number;
  velocity: V2d;
  /** Meters off the floor */
  z: number;
  zVelocity: number;
  /** Radians per second */
  spin: number;
  /** Size for bouncing off walls, in meters */
  radius: number;
  /** Seconds it leaves blood behind for, as it lands and slides */
  bleedTime?: number;
  /** How big its blood is */
  bloodSize?: number;
}

/**
 * A piece of a body flying off: it arcs through the air (with a pretend
 * height, like `FleshImpact`), bounces off walls, leaves blood where it lands
 * and slides, and then stays where it stopped as `Remains`.
 */
export default class Gib extends BaseEntity implements Entity {
  sprite: Container & GameSprite;
  body: Body;
  private z: number;
  private zVelocity: number;
  private bleedTime: number;
  private bloodSize: number;
  private lastSmear?: V2d;

  constructor(options: GibOptions) {
    super();
    this.sprite = options.display;
    this.sprite.layerName = Layer.PARTICLES;
    this.z = options.z;
    this.zVelocity = options.zVelocity;
    this.bleedTime = options.bleedTime ?? 1;
    this.bloodSize = options.bloodSize ?? options.radius * 2;

    this.body = createRigid2D({
      motion: "dynamic",
      mass: 0.5,
      position: options.position,
      velocity: options.velocity,
      angle: options.angle,
      angularVelocity: options.spin,
    });
    this.body.addShape(
      new Circle({
        radius: options.radius,
        collisionGroup: CollisionGroups.Particle,
        collisionMask: CollisionGroups.Walls,
        material: PhysicsMaterials.smallObject,
      }),
    );
  }

  @on("tick")
  onTick(dt: number) {
    this.bleedTime -= dt;
    if (this.z > 0 || this.zVelocity > 0) {
      this.zVelocity -= GRAVITY * dt;
      this.z += this.zVelocity * dt;
      if (this.z <= 0) {
        this.land();
      }
      return;
    }

    // Sliding along the floor
    const slow = Math.exp(-SLIDE_FRICTION * dt);
    this.body.velocity.imul(slow);
    this.body.angularVelocity *= slow;
    const position = this.getPosition();
    if (
      this.bleedTime > 0 &&
      (!this.lastSmear || this.lastSmear.distanceTo(position) > SMEAR_SPACING)
    ) {
      this.lastSmear = position.clone();
      this.game.addEntity(
        new BloodSplat(position, this.bloodSize * rUniform(0.4, 0.7)),
      );
    }
    if (this.body.velocity.magnitude < REST_SPEED) {
      this.settle();
    }
  }

  private land() {
    this.z = 0;
    const speed = Math.abs(this.zVelocity);
    const position = this.getPosition();
    if (this.bleedTime > 0) {
      this.lastSmear = position.clone();
      this.game.addEntity(
        new BloodSplat(position, this.bloodSize * rUniform(0.8, 1.2)),
      );
    }
    this.game.addEntity(
      new PositionalSound(getSplatSound(), position, {
        gain: clamp(speed / 8) * 0.8,
        speed: rUniform(0.8, 1.1),
      }),
    );
    this.body.velocity.imul(LANDING_KEEP);
    this.body.angularVelocity *= LANDING_KEEP;
    this.zVelocity = speed > MIN_BOUNCE_SPEED ? speed * BOUNCE_RESTITUTION : 0;
  }

  /** Stops, and lies there as `Remains` */
  private settle() {
    this.onRender();
    this.sprite.scale.set(1);
    this.game.addEntity(new Remains(this.sprite));
    this.destroy();
  }

  @on("render")
  onRender() {
    this.sprite.position.copyFrom(this.body.position);
    this.sprite.rotation = this.body.angle;
    this.sprite.scale.set(1 + this.z * HEIGHT_SCALE);
  }
}
