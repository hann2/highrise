import { RotationalSpring } from "./RotationalSpring";

/**
 * A rotational spring with non-linear force response.
 * Applies stronger torque at small displacements, tapering off at larger angles.
 */
export class RotationalSolenoidSpring extends RotationalSpring {
  applyForce(): this {
    const k = this.stiffness * 1000;
    const d = this.damping * 100;
    const l = this.restAngle;
    const bodyA = this.bodyA;
    const bodyB = this.bodyB;
    const x = bodyB.angle - bodyA.angle;
    const u = bodyB.angularVelocity - bodyA.angularVelocity;

    let torque = -k * (x - l) - d * u;

    torque = Math.sign(torque) * Math.abs(torque) ** 0.6 * 100;

    bodyA.angularForce -= torque;
    bodyB.angularForce += torque;
    return this;
  }
}
