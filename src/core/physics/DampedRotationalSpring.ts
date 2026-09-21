import { Body, RotationalSpring, RotationalSpringOptions } from "p2";
import { clamp } from "../util/MathUtil";

interface DampedRotationalSpringOptions extends RotationalSpringOptions {
  maxTorque?: number;
}

export default class DampedRotationalSpring extends RotationalSpring {
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

  applyForce() {
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
  }
}
