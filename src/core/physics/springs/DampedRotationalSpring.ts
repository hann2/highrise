import { clamp } from "../../util/MathUtil";
import type { Body } from "../body/Body";
import type { RotationalSpringOptions } from "./RotationalSpring";
import { RotationalSpring } from "./RotationalSpring";

/** Options for creating a DampedRotationalSpring. */
export interface DampedRotationalSpringOptions extends RotationalSpringOptions {
  /** Maximum torque the spring can apply. Default Infinity. */
  maxTorque?: number;
}

/** A rotational spring with velocity-based damping and optional torque clamping. */
export class DampedRotationalSpring extends RotationalSpring {
  /** Maximum torque magnitude this spring can apply. */
  maxTorque: number;

  constructor(
    bodyA: Body,
    bodyB: Body,
    options: DampedRotationalSpringOptions = {},
  ) {
    const { maxTorque, ...baseOptions } = options;
    super(bodyA, bodyB, baseOptions);
    this.maxTorque = maxTorque ?? Infinity;
  }

  applyForce(): this {
    const k = this.stiffness;
    const d = this.damping;
    const l = this.restAngle;
    const bodyA = this.bodyA;
    const bodyB = this.bodyB;
    const x = bodyB.angle - bodyA.angle;
    const u = bodyB.angularVelocity - bodyA.angularVelocity;

    const torque = clamp(-k * (x - l) - d * u, -this.maxTorque, this.maxTorque);
    // const torque = -k * (x - l) - d * u;

    bodyA.angularForce -= torque;
    bodyB.angularForce += torque;
    return this;
  }
}
