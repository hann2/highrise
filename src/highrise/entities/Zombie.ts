import { Body, Circle } from "p2";
import { Sprite } from "pixi.js";
import * as Pixi from "pixi.js";
import zoimbie1Hold from "../../../resources/images/Zombie 1/zoimbie1_hold.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { radToDeg } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../Collision";
import { testLineOfSight } from "../utils/visionUtils";
import Damageable from "./Damageable";
import Human from "./Human";

const RADIUS = 0.5; // meters
const SPEED = 1.2;
const FRICTION = 0.2;
const ZOMBIE_ATTACK_RANGE = 2;
const ZOMBIE_ATTACK_DAMAGE = 40;
const ZOMBIE_ATTACK_COOLDOWN = 2;

export default class Zombie extends BaseEntity implements Entity, Damageable {
  body: Body;
  sprite: Sprite;
  hp: number = 100;
  positionOfLastTarget?: V2d;
  tags = ["zombie"];
  attackCooldown = 0;

  constructor(position: V2d) {
    super();

    this.body = new Body({ mass: 1, position: position.clone() });

    const shape = new Circle({ radius: RADIUS });
    shape.collisionMask = CollisionGroups.All;
    this.body.addShape(shape);

    this.sprite = Sprite.from(zoimbie1Hold);
    this.sprite.anchor.set(0.5, 0.5); // make it rotate about the middle
    this.sprite.scale.set((2 * RADIUS) / this.sprite.width);
  }

  onTick(dt: number) {
    this.attackCooldown -= dt;

    const humans = this.game!.entities.getTagged("human") as Human[];

    let nearestVisibleHuman: Human | undefined;
    let nearestDistance: number = Infinity;

    for (const human of humans) {
      // should you be able to sneak up on zombie???
      const isVisible = testLineOfSight(this, human);
      const distance = human.getPosition().isub(this.getPosition()).magnitude;
      if (isVisible && distance < nearestDistance) {
        nearestDistance = distance;
        nearestVisibleHuman = human;
      }
    }

    if (nearestVisibleHuman || this.positionOfLastTarget) {
      const targetPosition = nearestVisibleHuman
        ? nearestVisibleHuman.getPosition()
        : this.positionOfLastTarget;
      this.positionOfLastTarget = targetPosition;
      const direction = targetPosition!.sub(this.getPosition()).inormalize();
      this.walk(direction);
      this.face(direction.angle);
    }

    if (
      nearestVisibleHuman &&
      nearestDistance < ZOMBIE_ATTACK_RANGE &&
      this.attackCooldown < 0
    ) {
      nearestVisibleHuman.damage(ZOMBIE_ATTACK_DAMAGE);

      this.attackCooldown = ZOMBIE_ATTACK_COOLDOWN;
    }

    const friction = V(this.body.velocity).mul(-FRICTION);
    this.body.applyImpulse(friction);
  }

  onRender() {
    [this.sprite.x, this.sprite.y] = this.body.position;
    this.sprite.angle = radToDeg(this.body.angle);
  }

  walk(direction: V2d) {
    this.body.applyImpulse(direction.mul(SPEED));
  }

  face(angle: number) {
    this.body.angle = angle;
  }

  damage(amount: number) {
    this.hp -= amount;

    if (this.hp <= 0) {
      this.destroy();
    }
  }
}
