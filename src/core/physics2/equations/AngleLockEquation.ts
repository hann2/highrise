import type { Body } from "../body/Body";
import { AngularEquation2D } from "./AngularEquation2D";

export interface AngleLockEquationOptions {
  angle?: number;
  ratio?: number;
}

/**
 * Locks the relative angle between two bodies with an optional gear ratio:
 *   `ratio · angle_A − angle_B + angle = 0`
 *
 * Pure 2D angular with asymmetric Jacobian (body A contributes `ratio`,
 * body B contributes `−1`), which is why this fits {@link AngularEquation2D}
 * rather than the symmetric {@link AngularEquation3D}.
 */
export class AngleLockEquation extends AngularEquation2D {
  angle: number;

  /** The gear ratio. */
  ratio: number;

  constructor(
    bodyA: Body,
    bodyB: Body,
    options: AngleLockEquationOptions = {},
  ) {
    super(bodyA, bodyB, -Number.MAX_VALUE, Number.MAX_VALUE);
    this.angle = options.angle || 0;
    this.ratio = typeof options.ratio === "number" ? options.ratio : 1;
    this.setRatio(this.ratio);
  }

  override computeGq(): number {
    return this.ratio * this.bodyA.angle - this.bodyB.angle + this.angle;
  }

  /** Set the gear ratio. */
  setRatio(ratio: number): void {
    this.ratio = ratio;
    this.angAz = ratio;
    this.angBz = -1;
  }

  /** Set the max force (torque) for this constraint. */
  setMaxTorque(torque: number): void {
    this.maxForce = torque;
    this.minForce = -torque;
  }
}
