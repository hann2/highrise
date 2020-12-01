import { Body, Circle } from "p2";
import { Graphics } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d, V } from "../../core/Vector";
import Bullet, { BULLET_RADIUS } from "./Bullet";
import { HUMAN_RADIUS } from "./Human";
import Gun from "./Gun";

const NUM_BULLETS = 8;
const CONE_ANGLE = Math.PI / 24;
const FIRE_RATE = 1.5; // shots per second

export default class Pistol extends BaseEntity implements Entity, Gun {
  firing: boolean = false;
  direction?: V2d;
  fireCooldown: number = 0;

  constructor(body: Body) {
    super();

    this.body = body;
  }

  onTick(dt: number) {
    this.fireCooldown -= dt;
    if (this.firing && this.fireCooldown < 0 && this.direction) {
      for (let i = 0; i < NUM_BULLETS; i++) {
        const angleOffset = Math.random() * CONE_ANGLE - CONE_ANGLE / 2;
        const direction = this.direction.rotate(angleOffset);
        const start = V(this.getPosition()).add(
          direction.mul(HUMAN_RADIUS + BULLET_RADIUS + 0.05)
        );
        this.addChild(new Bullet(start, direction));
      }

      this.fireCooldown = 1 / FIRE_RATE;
    }
  }
}
