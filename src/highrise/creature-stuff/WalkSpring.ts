import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import type { Body } from "../../core/physics/body/Body";
import { polarToVec } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";

export class WalkSpring extends BaseEntity implements Entity {
  targetVelocity: V2d = V(0, 0);
  enabled: boolean = true;

  constructor(
    public creatureBody: Body,
    public speed: number = 4, // meters / sec
    public acceleration: number = 10, // meters / sec^2
  ) {
    super();
  }

  walkTowards(angle: number, speedPercent: number) {
    this.targetVelocity.set(polarToVec(angle, speedPercent * this.speed));
  }

  stop() {
    this.targetVelocity.set(0, 0);
  }

  onTick() {
    if (this.enabled) {
      const force = this.targetVelocity
        .sub(this.creatureBody.velocity)
        .imul(this.acceleration * this.creatureBody.mass);

      this.creatureBody.applyForce(force);
    }
  }
}
