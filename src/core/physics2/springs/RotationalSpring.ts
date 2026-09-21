import type { Body } from "../body/Body";
import { SpringOptions, Spring } from "./Spring";

/** Options for creating a RotationalSpring. */
export interface RotationalSpringOptions extends SpringOptions {
  /** Target angle between bodies. Auto-computed from current angles if not set. */
  restAngle?: number;
}

/** A spring that applies torque to maintain a target angle between two bodies. */
export class RotationalSpring extends Spring {
  /** Target angle between the two bodies (no torque applied at this angle). */
  restAngle: number;

  constructor(bodyA: Body, bodyB: Body, options: RotationalSpringOptions = {}) {
    super(bodyA, bodyB, options);

    this.restAngle =
      typeof options.restAngle === "number"
        ? options.restAngle
        : bodyB.angle - bodyA.angle;
  }

  applyForce(): this {
    const k = this.stiffness;
    const d = this.damping;
    const l = this.restAngle;
    const bodyA = this.bodyA;
    const bodyB = this.bodyB;
    const x = bodyB.angle - bodyA.angle;
    const u = bodyB.angularVelocity - bodyA.angularVelocity;

    const torque = -k * (x - l) - d * u;

    bodyA.angularForce -= torque;
    bodyB.angularForce += torque;
    return this;
  }
}
