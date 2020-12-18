import { Body, RotationalSpring } from "p2";
import { angleDelta, normalizeAngle } from "../../core/util/MathUtil";

export default class AimSpring extends RotationalSpring {
  constructor(
    bodyA: Body,
    bodyB: Body,
    private minRotation: number,
    private maxRotation: number
  ) {
    super(bodyA, bodyB, {
      damping: 1,
      stiffness: 10,
    });
  }
  applyForce() {
    const bodyA = this.bodyA;
    const bodyB = this.bodyB;
    const relativeBodyAngle = normalizeAngle(bodyB.angle - bodyA.angle);
    const angleDisplacement = angleDelta(this.restAngle, relativeBodyAngle);
    const relativeVelocity = bodyB.angularVelocity - bodyA.angularVelocity;

    var torque =
      -this.stiffness * angleDisplacement - this.damping * relativeVelocity;

    bodyA.angularForce -= torque;
    bodyB.angularForce += torque;
  }
}
