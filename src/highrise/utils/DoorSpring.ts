import type { Body } from "../../core/physics/body/Body";
import { RotationalSpring } from "../../core/physics/springs/RotationalSpring";

export default class DoorSpring extends RotationalSpring {
  constructor(
    bodyA: Body,
    bodyB: Body,
    private minRotation: number,
    private maxRotation: number,
  ) {
    super(bodyA, bodyB, {
      damping: 5,
      stiffness: 300,
    });
  }

  applyForce(): this {
    const bodyA = this.bodyA;
    const bodyB = this.bodyB;
    const relativeBodyAngle = bodyB.angle - bodyA.angle;

    let angleDisplacement = 0;
    if (relativeBodyAngle < this.minRotation) {
      angleDisplacement = relativeBodyAngle - this.minRotation;
    } else if (relativeBodyAngle > this.maxRotation) {
      angleDisplacement = relativeBodyAngle - this.maxRotation;
    }

    const relativeVelocity = bodyB.angularVelocity - bodyA.angularVelocity;

    const springyPart = -this.stiffness * angleDisplacement;
    const dampyPart =
      -this.damping * relativeVelocity * (angleDisplacement == 0 ? 1 : 10);
    const torque = springyPart + dampyPart;

    bodyA.angularForce -= torque;
    bodyB.angularForce += torque;
    return this;
  }
}
