import { Body, RotationalSpring } from "p2";
import { angleDelta, normalizeAngle } from "../../core/util/MathUtil";

export default class DoorSpring extends RotationalSpring {
  constructor(
    bodyA: Body,
    bodyB: Body,
    private minRotation: number,
    private maxRotation: number
  ) {
    super(bodyA, bodyB, {
      damping: 5,
      stiffness: 300,
    });

    this.minRotation = minRotation;
    this.maxRotation = maxRotation;
  }
  applyForce() {
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
    var torque = springyPart + dampyPart;

    bodyA.angularForce -= torque;
    bodyB.angularForce += torque;
  }
}
