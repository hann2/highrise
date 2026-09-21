import { V } from "../../Vector";
import type { Body } from "../body/Body";
import { AngularEquation2D } from "./AngularEquation2D";

export interface RotationalLockEquationOptions {
  angle?: number;
}

/**
 * Locks the relative angle between two bodies. The constraint tries to keep
 * the dot product between two vectors, local in each body, to zero.
 *
 * Pure 2D angular — linear Jacobian is zero, angular Z contribution is
 * `+1` on body A and `−1` on body B (this is a hard-lock, no gear ratio).
 * Uses the {@link AngularEquation2D} shape so the solver's specialized
 * angular batch iterator handles it.
 */
export class RotationalLockEquation extends AngularEquation2D {
  angle: number;

  constructor(
    bodyA: Body,
    bodyB: Body,
    options: RotationalLockEquationOptions = {},
  ) {
    super(bodyA, bodyB, -Number.MAX_VALUE, Number.MAX_VALUE);

    this.angle = options.angle || 0;
    this.angAz = 1;
    this.angBz = -1;
  }

  override computeGq(): number {
    const worldVectorA = V(1, 0).irotate(this.bodyA.angle + this.angle);
    const worldVectorB = V(0, 1).irotate(this.bodyB.angle);
    return worldVectorA.dot(worldVectorB);
  }
}
