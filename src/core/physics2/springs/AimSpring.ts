import { angleDelta } from "../../util/MathUtil";
import type { Body } from "../body/Body";
import { RotationalSpring } from "./RotationalSpring";

/**
 * A rotational spring that applies corrective torque to maintain a target angle.
 * Useful for stabilizing physics bodies or creating aiming/orientation behaviors
 * with damping to prevent oscillation.
 */
export class AimSpring extends RotationalSpring {
  constructor(bodyA: Body) {
    super(bodyA, null as any, {
      damping: 1,
      stiffness: 10,
      restAngle: 0,
    });
  }

  applyForce(): this {
    const body = this.bodyA;
    const displacement = angleDelta(this.restAngle, body.angle);

    const torque =
      -this.stiffness * displacement - this.damping * body.angularVelocity;

    body.angularForce += torque;
    return this;
  }
}
