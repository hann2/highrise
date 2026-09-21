import type { Body } from "../body/Body";
import { CompatibleVector3, V3, V3d } from "../../Vector3";
import { AxisAlignmentEquation } from "../equations/AxisAlignmentEquation";
import { Equation } from "../equations/Equation";
import { ConstraintOptions, Constraint } from "./Constraint";

/** Options for creating a RevoluteConstraint3D. */
export interface RevoluteConstraint3DOptions extends ConstraintOptions {
  /** 3D pivot point on bodyA in local coordinates. Default [0,0,0]. */
  localPivotA?: CompatibleVector3;
  /** 3D pivot point on bodyB in local coordinates. Default [0,0,0]. */
  localPivotB?: CompatibleVector3;
  /**
   * Hinge axis in each body's local frame (unit vectors). Default is
   * each body's local z-axis, i.e. `[0, 0, 1]` — correct for a gooseneck
   * where the boom swings around the vertical mast axis.
   */
  hingeAxisA?: CompatibleVector3;
  hingeAxisB?: CompatibleVector3;
  /** Maximum force the constraint can apply. Default MAX_VALUE. */
  maxForce?: number;
}

/**
 * 3D revolute joint (hinge) between two bodies. Enforces five DOF:
 *   - 3 position equations pinning a common 3D pivot point,
 *   - 2 axis-alignment equations keeping the bodies' hinge axes parallel,
 * leaving one rotational DOF free: rotation around the hinge axis.
 *
 * Physically accurate for real hinge joints (gooseneck on a mast, rudder
 * pivoting on a pintle, etc.) where the child body's orientation should
 * track the parent's tilt except around a single axis.
 *
 * The 5-equation formulation replaces the 2-equation 2D RevoluteConstraint.
 * Best used when both bodies are 6DOF — on a 3DOF body, the solver's
 * inverse inertia for roll/pitch is 0, so axis-alignment impulses simply
 * have no effect on that body.
 */
export class RevoluteConstraint3D extends Constraint {
  pivotA: V3d;
  pivotB: V3d;
  hingeAxisA: V3d;
  hingeAxisB: V3d;
  maxForce: number;

  /** Position-level equations: x, y, z separation at the pivot. */
  private xEq: Equation;
  private yEq: Equation;
  private zEq: Equation;
  /** Two perpendicular directions on bodyA (chosen at construction, perpendicular to hingeAxisA). */
  private dirA1: V3d;
  private dirA2: V3d;
  /** Axis-alignment equations locking the hinge axes. */
  private axis1Eq: AxisAlignmentEquation;
  private axis2Eq: AxisAlignmentEquation;

  /** Lower/upper angle limits (radians). Enabled via `setLimits`. */
  lowerLimitEnabled: boolean = false;
  upperLimitEnabled: boolean = false;
  lowerLimit: number = 0;
  upperLimit: number = 0;
  private lowerLimitActive: boolean = false;
  private upperLimitActive: boolean = false;
  private lowerLimitEq: Equation;
  private upperLimitEq: Equation;

  /** Current hinge-axis rotation angle of bodyB relative to bodyA (radians). */
  angle: number = 0;

  constructor(
    bodyA: Body,
    bodyB: Body,
    options: RevoluteConstraint3DOptions = {},
  ) {
    super(bodyA, bodyB, options);

    const maxForce = options.maxForce ?? Number.MAX_VALUE;
    this.maxForce = maxForce;

    this.pivotA = options.localPivotA
      ? V3(options.localPivotA)
      : new V3d(0, 0, 0);
    this.pivotB = options.localPivotB
      ? V3(options.localPivotB)
      : new V3d(0, 0, 0);
    this.hingeAxisA = options.hingeAxisA
      ? V3(options.hingeAxisA)
      : new V3d(0, 0, 1);
    this.hingeAxisB = options.hingeAxisB
      ? V3(options.hingeAxisB)
      : new V3d(0, 0, 1);

    // Pick two directions on bodyA perpendicular to hingeAxisA to form
    // the axis-alignment constraints. For the common case hingeAxisA =
    // [0,0,1], these become the body's local x and y axes.
    [this.dirA1, this.dirA2] = perpendicularBasis(this.hingeAxisA);

    // Create position equations. Jacobians are filled in update().
    this.xEq = new Equation(bodyA, bodyB, -maxForce, maxForce);
    this.yEq = new Equation(bodyA, bodyB, -maxForce, maxForce);
    this.zEq = new Equation(bodyA, bodyB, -maxForce, maxForce);

    const that = this;
    this.xEq.computeGq = function () {
      return that.computePositionGq(0);
    };
    this.yEq.computeGq = function () {
      return that.computePositionGq(1);
    };
    this.zEq.computeGq = function () {
      return that.computePositionGq(2);
    };

    // Create axis-alignment equations.
    this.axis1Eq = new AxisAlignmentEquation(
      bodyA,
      bodyB,
      this.dirA1,
      this.hingeAxisB,
    );
    this.axis2Eq = new AxisAlignmentEquation(
      bodyA,
      bodyB,
      this.dirA2,
      this.hingeAxisB,
    );

    // Create limit equations (added/removed from equations array dynamically).
    // Jacobian convention: positive lambda increases the hinge angle, so:
    //   - Lower limit (angle too low): need positive lambda ⇒ Gq must be
    //     negative when violated ⇒ Gq = angle - lower, force bounds [0, max].
    //   - Upper limit (angle too high): need negative lambda ⇒ Gq must be
    //     positive when violated ⇒ Gq = angle - upper, force bounds [-max, 0].
    this.lowerLimitEq = new Equation(bodyA, bodyB, 0, maxForce);
    this.upperLimitEq = new Equation(bodyA, bodyB, -maxForce, 0);
    this.lowerLimitEq.computeGq = function () {
      return that.angle - that.lowerLimit;
    };
    this.upperLimitEq.computeGq = function () {
      return that.angle - that.upperLimit;
    };

    this.equations = [this.xEq, this.yEq, this.zEq, this.axis1Eq, this.axis2Eq];
  }

  /** Compute XY/Z pivot separation for the given component (0=x, 1=y, 2=z). */
  private computePositionGq(component: 0 | 1 | 2): number {
    const RA = this.bodyA.orientation;
    const RB = this.bodyB.orientation;
    const pA = this.pivotA;
    const pB = this.pivotB;

    // 3D world-frame pivot offsets (lever arms from body center to pivot).
    const row = component * 3;
    const rAc = RA[row] * pA[0] + RA[row + 1] * pA[1] + RA[row + 2] * pA[2];
    const rBc = RB[row] * pB[0] + RB[row + 1] * pB[1] + RB[row + 2] * pB[2];

    const posA =
      component === 0
        ? this.bodyA.position[0]
        : component === 1
          ? this.bodyA.position[1]
          : this.bodyA.z;
    const posB =
      component === 0
        ? this.bodyB.position[0]
        : component === 1
          ? this.bodyB.position[1]
          : this.bodyB.z;

    return posB + rBc - posA - rAc;
  }

  /** Set (or clear) the hinge angle limits. Pass `undefined` to disable. */
  setLimits(lower: number | undefined, upper: number | undefined): void {
    if (typeof lower === "number") {
      this.lowerLimit = lower;
      this.lowerLimitEnabled = true;
    } else {
      this.lowerLimitEnabled = false;
    }
    if (typeof upper === "number") {
      this.upperLimit = upper;
      this.upperLimitEnabled = true;
    } else {
      this.upperLimitEnabled = false;
    }
  }

  /**
   * True relative rotation of bodyB around bodyA's hinge axis, in radians.
   * Uses axis projection rather than the (lossy) atan2(R[3], R[0]) extraction.
   */
  getRelativeAngle(): number {
    return this.angle;
  }

  update(): this {
    const bodyA = this.bodyA;
    const bodyB = this.bodyB;
    const RA = bodyA.orientation;
    const RB = bodyB.orientation;
    const pA = this.pivotA;
    const pB = this.pivotB;

    // 3D world-frame lever arms from each body's center to the pivot.
    const rAx = RA[0] * pA[0] + RA[1] * pA[1] + RA[2] * pA[2];
    const rAy = RA[3] * pA[0] + RA[4] * pA[1] + RA[5] * pA[2];
    const rAz = RA[6] * pA[0] + RA[7] * pA[1] + RA[8] * pA[2];
    const rBx = RB[0] * pB[0] + RB[1] * pB[1] + RB[2] * pB[2];
    const rBy = RB[3] * pB[0] + RB[4] * pB[1] + RB[5] * pB[2];
    const rBz = RB[6] * pB[0] + RB[7] * pB[1] + RB[8] * pB[2];

    // X-position equation:
    //   constraint: (pB + rB) · x̂ − (pA + rA) · x̂ = 0
    //   d/dvA · x̂ = −1;   d/dvB · x̂ = 1
    //   d/dωA · (−rA × x̂) = −(0, rAz, -rAy) = (0, -rAz, rAy)
    //   d/dωB · (rB × x̂)  = (0, rBz, -rBy)
    const Gx = this.xEq.G;
    Gx[0] = -1;
    Gx[1] = 0;
    Gx[2] = 0;
    Gx[3] = 0;
    Gx[4] = -rAz;
    Gx[5] = rAy;
    Gx[6] = 1;
    Gx[7] = 0;
    Gx[8] = 0;
    Gx[9] = 0;
    Gx[10] = rBz;
    Gx[11] = -rBy;

    // Y-position equation
    const Gy = this.yEq.G;
    Gy[0] = 0;
    Gy[1] = -1;
    Gy[2] = 0;
    Gy[3] = rAz;
    Gy[4] = 0;
    Gy[5] = -rAx;
    Gy[6] = 0;
    Gy[7] = 1;
    Gy[8] = 0;
    Gy[9] = -rBz;
    Gy[10] = 0;
    Gy[11] = rBx;

    // Z-position equation
    //   d/dωA · (−rA × ẑ) = −(rAy, −rAx, 0) = (−rAy, rAx, 0)
    //   d/dωB · (rB × ẑ)  = (rBy, −rBx, 0)
    const Gz = this.zEq.G;
    Gz[0] = 0;
    Gz[1] = 0;
    Gz[2] = -1;
    Gz[3] = -rAy;
    Gz[4] = rAx;
    Gz[5] = 0;
    Gz[6] = 0;
    Gz[7] = 0;
    Gz[8] = 1;
    Gz[9] = rBy;
    Gz[10] = -rBx;
    Gz[11] = 0;

    // Refresh axis-alignment Jacobians.
    this.axis1Eq.refreshJacobian();
    this.axis2Eq.refreshJacobian();

    // Update relative hinge angle via axis projection.
    // Project bodyB's dirA1-equivalent direction onto bodyA's {dirA1, dirA2}.
    // For the hinge = z-axis case with dirA1 = [1,0,0], dirA2 = [0,1,0]:
    //   forward-dot: RB[col0] · RA[col0]
    //   lateral-dot: RB[col0] · RA[col1]
    // Generalized: pick the "reference" direction on bodyB — use dirA1 rotated
    // into bodyB's local frame. But since the hinge axes are aligned, we can
    // use bodyB's own dirA1-equivalent: any direction perpendicular to its
    // hinge axis. Simplest: use the world-frame projection of bodyB's dir
    // onto bodyA's perpendicular basis.
    const d1 = this.dirA1;
    const d2 = this.dirA2;
    // bodyB's reference direction in world: RB · dirA1 (treating dirA1
    // in bodyB's local frame works because both bodies share the same
    // body-local axis layout for the hinge's perpendicular basis).
    const bf0 = RB[0] * d1[0] + RB[1] * d1[1] + RB[2] * d1[2];
    const bf1 = RB[3] * d1[0] + RB[4] * d1[1] + RB[5] * d1[2];
    const bf2 = RB[6] * d1[0] + RB[7] * d1[1] + RB[8] * d1[2];
    // bodyA's perpendicular basis in world
    const a1x = RA[0] * d1[0] + RA[1] * d1[1] + RA[2] * d1[2];
    const a1y = RA[3] * d1[0] + RA[4] * d1[1] + RA[5] * d1[2];
    const a1z = RA[6] * d1[0] + RA[7] * d1[1] + RA[8] * d1[2];
    const a2x = RA[0] * d2[0] + RA[1] * d2[1] + RA[2] * d2[2];
    const a2y = RA[3] * d2[0] + RA[4] * d2[1] + RA[5] * d2[2];
    const a2z = RA[6] * d2[0] + RA[7] * d2[1] + RA[8] * d2[2];
    const fwdDot = bf0 * a1x + bf1 * a1y + bf2 * a1z;
    const latDot = bf0 * a2x + bf1 * a2y + bf2 * a2z;
    this.angle = Math.atan2(latDot, fwdDot);

    // Hinge-axis rotation limits: add/remove limit equations based on angle.
    const eqs = this.equations;
    const hingeAxisWorldX = a1y * a2z - a1z * a2y;
    const hingeAxisWorldY = a1z * a2x - a1x * a2z;
    const hingeAxisWorldZ = a1x * a2y - a1y * a2x;

    this.updateLimitEquation(
      this.lowerLimitEq,
      this.lowerLimitEnabled && this.angle < this.lowerLimit,
      hingeAxisWorldX,
      hingeAxisWorldY,
      hingeAxisWorldZ,
      eqs,
      true, // isLowerLimitActive tracker handled below
    );

    this.updateLimitEquation(
      this.upperLimitEq,
      this.upperLimitEnabled && this.angle > this.upperLimit,
      hingeAxisWorldX,
      hingeAxisWorldY,
      hingeAxisWorldZ,
      eqs,
      false,
    );

    return this;
  }

  private updateLimitEquation(
    eq: Equation,
    shouldBeActive: boolean,
    axisX: number,
    axisY: number,
    axisZ: number,
    eqs: Equation[],
    isLower: boolean,
  ): void {
    const currentlyActive = isLower
      ? this.lowerLimitActive
      : this.upperLimitActive;
    if (shouldBeActive) {
      // Velocity-level constraint: relative angular velocity around hinge axis.
      //   G[wA] · ωA = -(ωA · hinge)
      //   G[wB] · ωB =  (ωB · hinge)
      const G = eq.G;
      G[0] = 0;
      G[1] = 0;
      G[2] = 0;
      G[3] = -axisX;
      G[4] = -axisY;
      G[5] = -axisZ;
      G[6] = 0;
      G[7] = 0;
      G[8] = 0;
      G[9] = axisX;
      G[10] = axisY;
      G[11] = axisZ;
      if (!currentlyActive) {
        eqs.push(eq);
        if (isLower) this.lowerLimitActive = true;
        else this.upperLimitActive = true;
      }
    } else if (currentlyActive) {
      const idx = eqs.indexOf(eq);
      if (idx >= 0) eqs.splice(idx, 1);
      if (isLower) this.lowerLimitActive = false;
      else this.upperLimitActive = false;
    }
  }
}

/**
 * Pick two orthonormal vectors perpendicular to `axis` (assumed unit length).
 */
function perpendicularBasis(axis: V3d): [V3d, V3d] {
  // Find any vector not parallel to axis, then cross-product to build basis.
  const ax = Math.abs(axis[0]);
  const ay = Math.abs(axis[1]);
  const az = Math.abs(axis[2]);
  let ux: number, uy: number, uz: number;
  if (ax <= ay && ax <= az) {
    ux = 1;
    uy = 0;
    uz = 0;
  } else if (ay <= az) {
    ux = 0;
    uy = 1;
    uz = 0;
  } else {
    ux = 0;
    uy = 0;
    uz = 1;
  }
  // e1 = normalize(u × axis)
  let e1x = uy * axis[2] - uz * axis[1];
  let e1y = uz * axis[0] - ux * axis[2];
  let e1z = ux * axis[1] - uy * axis[0];
  const e1len = Math.hypot(e1x, e1y, e1z);
  e1x /= e1len;
  e1y /= e1len;
  e1z /= e1len;
  // e2 = axis × e1
  const e2x = axis[1] * e1z - axis[2] * e1y;
  const e2y = axis[2] * e1x - axis[0] * e1z;
  const e2z = axis[0] * e1y - axis[1] * e1x;
  return [new V3d(e1x, e1y, e1z), new V3d(e2x, e2y, e2z)];
}
