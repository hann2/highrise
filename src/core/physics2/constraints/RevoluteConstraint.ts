import { CompatibleVector, V, V2d } from "../../Vector";
import type { Body } from "../body/Body";
import { Equation } from "../equations/Equation";
import { RotationalLockEquation } from "../equations/RotationalLockEquation";
import { RotationalVelocityEquation } from "../equations/RotationalVelocityEquation";
import { ConstraintOptions, Constraint } from "./Constraint";

/** Options for creating a RevoluteConstraint. */
export interface RevoluteConstraintOptions extends ConstraintOptions {
  /** Pivot point in world coordinates (converted to local pivots). */
  worldPivot?: CompatibleVector;
  /** Pivot point on bodyA in local coordinates. */
  localPivotA?: CompatibleVector;
  /** Pivot point on bodyB in local coordinates. */
  localPivotB?: CompatibleVector;
  /** Maximum force the constraint can apply. Default MAX_VALUE. */
  maxForce?: number;
}

/**
 * Connects two bodies at given offset points, letting them rotate relative
 * to each other around this point. Pure 2D: only constrains X/Y at the pivot
 * and produces yaw torques. For a 3D hinge (e.g. on a 6DOF body with tilt),
 * use RevoluteConstraint3D.
 */
export class RevoluteConstraint extends Constraint {
  pivotA: V2d;
  pivotB: V2d;
  maxForce: number;
  motorEquation: RotationalVelocityEquation;

  /**
   * Indicates whether the motor is enabled. Use .enableMotor() to enable
   * the constraint motor.
   */
  motorEnabled: boolean = false;

  /** The constraint position. */
  angle: number = 0;

  /** Set to true to enable lower limit */
  lowerLimitEnabled: boolean = false;

  /** Set to true to enable upper limit */
  upperLimitEnabled: boolean = false;

  /** The lower limit on the constraint angle. */
  lowerLimit: number = 0;

  /** The upper limit on the constraint angle. */
  upperLimit: number = 0;

  upperLimitEquation: RotationalLockEquation;
  lowerLimitEquation: RotationalLockEquation;

  /** Tracks whether upper limit equation is currently in the equations array */
  private upperLimitActive: boolean = false;
  /** Tracks whether lower limit equation is currently in the equations array */
  private lowerLimitActive: boolean = false;

  constructor(
    bodyA: Body,
    bodyB: Body,
    options: RevoluteConstraintOptions = {},
  ) {
    super(bodyA, bodyB, options);

    const maxForce =
      typeof options.maxForce !== "undefined"
        ? options.maxForce
        : Number.MAX_VALUE;
    this.maxForce = maxForce;

    this.pivotA = V();
    this.pivotB = V();

    if (options.worldPivot) {
      // Compute pivotA and pivotB
      this.pivotA.set(options.worldPivot).isub(bodyA.position);
      this.pivotB.set(options.worldPivot).isub(bodyB.position);
      // Rotate to local coordinate system
      this.pivotA.irotate(-bodyA.angle);
      this.pivotB.irotate(-bodyB.angle);
    } else if (options.localPivotA && options.localPivotB) {
      // Get pivotA and pivotB
      this.pivotA.set(options.localPivotA);
      this.pivotB.set(options.localPivotB);
    }

    // Equations to be fed to the solver
    const x = new Equation(bodyA, bodyB, -maxForce, maxForce);
    const y = new Equation(bodyA, bodyB, -maxForce, maxForce);
    const that = this;

    x.computeGq = function () {
      const worldPivotA = that.pivotA.rotate(bodyA.angle);
      const worldPivotB = that.pivotB.rotate(bodyB.angle);
      return (
        bodyB.position[0] + worldPivotB.x - bodyA.position[0] - worldPivotA.x
      );
    };

    y.computeGq = function () {
      const worldPivotA = that.pivotA.rotate(bodyA.angle);
      const worldPivotB = that.pivotB.rotate(bodyB.angle);
      return (
        bodyB.position[1] + worldPivotB.y - bodyA.position[1] - worldPivotA.y
      );
    };

    x.minForce = y.minForce = -maxForce;
    x.maxForce = y.maxForce = maxForce;

    this.equations = [x, y];

    this.motorEquation = new RotationalVelocityEquation(bodyA, bodyB);
    this.upperLimitEquation = new RotationalLockEquation(bodyA, bodyB);
    this.lowerLimitEquation = new RotationalLockEquation(bodyA, bodyB);
    this.upperLimitEquation.minForce = 0;
    this.lowerLimitEquation.maxForce = 0;
  }

  /** Set the constraint angle limits. */
  setLimits(lower: number | undefined, upper: number | undefined): void {
    if (typeof lower === "number") {
      this.lowerLimit = lower;
      this.lowerLimitEnabled = true;
    } else {
      this.lowerLimit = 0;
      this.lowerLimitEnabled = false;
    }

    if (typeof upper === "number") {
      this.upperLimit = upper;
      this.upperLimitEnabled = true;
    } else {
      this.upperLimit = 0;
      this.upperLimitEnabled = false;
    }
  }

  update(): this {
    const bodyA = this.bodyA;
    const bodyB = this.bodyB;
    const pivotA = this.pivotA;
    const pivotB = this.pivotB;
    const eqs = this.equations;
    const x = eqs[0];
    const y = eqs[1];
    const upperLimit = this.upperLimit;
    const lowerLimit = this.lowerLimit;
    const upperLimitEquation = this.upperLimitEquation;
    const lowerLimitEquation = this.lowerLimitEquation;

    const relAngle = (this.angle = bodyB.angle - bodyA.angle);

    // Use tracking flags instead of indexOf() for O(1) checks
    if (this.upperLimitEnabled && relAngle > upperLimit) {
      upperLimitEquation.angle = upperLimit;
      if (!this.upperLimitActive) {
        eqs.push(upperLimitEquation);
        this.upperLimitActive = true;
      }
    } else if (this.upperLimitActive) {
      const idx = eqs.indexOf(upperLimitEquation);
      eqs.splice(idx, 1);
      this.upperLimitActive = false;
    }

    if (this.lowerLimitEnabled && relAngle < lowerLimit) {
      lowerLimitEquation.angle = lowerLimit;
      if (!this.lowerLimitActive) {
        eqs.push(lowerLimitEquation);
        this.lowerLimitActive = true;
      }
    } else if (this.lowerLimitActive) {
      const idx = eqs.indexOf(lowerLimitEquation);
      eqs.splice(idx, 1);
      this.lowerLimitActive = false;
    }

    // Lever arms: local pivots rotated into world frame by each body's yaw.
    const cA = Math.cos(bodyA.angle);
    const sA = Math.sin(bodyA.angle);
    const rAx = cA * pivotA.x - sA * pivotA.y;
    const rAy = sA * pivotA.x + cA * pivotA.y;

    const cB = Math.cos(bodyB.angle);
    const sB = Math.sin(bodyB.angle);
    const rBx = cB * pivotB.x - sB * pivotB.y;
    const rBy = sB * pivotB.x + cB * pivotB.y;

    // X-position equation: yaw torque from rA × x̂ is +rAy, from rB × x̂ is -rBy.
    x.G[0] = -1;
    x.G[1] = 0;
    x.G[5] = rAy;
    x.G[6] = 1;
    x.G[7] = 0;
    x.G[11] = -rBy;

    // Y-position equation: yaw torque from rA × ŷ is -rAx, from rB × ŷ is +rBx.
    y.G[0] = 0;
    y.G[1] = -1;
    y.G[5] = -rAx;
    y.G[6] = 0;
    y.G[7] = 1;
    y.G[11] = rBx;
    return this;
  }

  /** Enable the rotational motor */
  enableMotor(): void {
    if (this.motorEnabled) {
      return;
    }
    this.equations.push(this.motorEquation);
    this.motorEnabled = true;
  }

  /** Disable the rotational motor */
  disableMotor(): void {
    if (!this.motorEnabled) {
      return;
    }
    const i = this.equations.indexOf(this.motorEquation);
    this.equations.splice(i, 1);
    this.motorEnabled = false;
  }

  /** Set the speed of the rotational constraint motor */
  setMotorSpeed(speed: number): void {
    if (!this.motorEnabled) {
      return;
    }
    // Direct access instead of indexOf() - we already have the reference
    this.motorEquation.relativeVelocity = speed;
  }

  /** Get the speed of the rotational constraint motor */
  getMotorSpeed(): number | false {
    if (!this.motorEnabled) {
      return false;
    }
    return this.motorEquation.relativeVelocity;
  }
}
