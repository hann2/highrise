import { Body, Circle } from "p2";
import { Graphics, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { normalizeAngle, radToDeg } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import Damageable from "./Damageable";
import Gun from "./guns/Gun";
import { CollisionGroups } from "../Collision";
import { getSprites } from "../../core/resources/images";
import manBlueGun from "../../../resources/images/Man Blue/manBlue_gun.png";

export const HUMAN_RADIUS = 0.5; // meters
const SPEED = 4;
const FRICTION = 0.4;
const NUM_BULLETS = 8;
const CONE_ANGLE = Math.PI / 24;

// should eventually come from a gun
const FIRE_RATE = 1.5; // shots per second

export default class Human extends BaseEntity implements Entity, Damageable {
  body: Body;
  sprite: Sprite;
  tags = ["human"];
  hp: number = 100;
  gun?: Gun;

  constructor(position: V2d) {
    super();

    this.body = new Body({
      mass: 1,
      position: position.clone(),
      fixedRotation: true,
    });

    const shape = new Circle({ radius: HUMAN_RADIUS });
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape);

    this.sprite = Sprite.from(manBlueGun);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.scale.set(1.0 / this.sprite.width);
  }

  onTick(dt: number) {
    const friction = V(this.body.velocity).mul(-FRICTION);
    this.body.applyImpulse(friction);
  }

  onRender() {
    [this.sprite.x, this.sprite.y] = this.body.position;
    this.sprite.angle = radToDeg(this.body.angle);
  }

  // Move the human along a specified vector
  walk(direction: V2d) {
    this.body.applyImpulse(direction.mul(SPEED));
  }

  // Have the human face a specific angle
  setDirection(angle: number) {
    this.body.angle = normalizeAngle(angle);
  }

  getDirection(): number {
    return this.body.angle;
  }

  pullTrigger() {
    this.gun?.pullTrigger(this);
  }

  // Inflict damage on the human
  damage(amount: number) {
    this.hp -= amount;

    if (this.hp <= 0) {
      console.log("You dead");
    }
  }
}
