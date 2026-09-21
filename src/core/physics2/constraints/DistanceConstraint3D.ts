import type { Body } from "../body/Body";
import { CompatibleVector3, V3, V3d } from "../../Vector3";
import { Equation } from "../equations/Equation";
import { PointToPointEquation3D } from "../equations/PointToPointEquation3D";
import { PointToRigidEquation3D } from "../equations/PointToRigidEquation3D";
import { Constraint, ConstraintOptions } from "./Constraint";

// Module-level scratch vectors reused across all DistanceConstraint3D instances
// to avoid allocating a fresh V3d on every update() call.
const SCRATCH_A = new V3d(0, 0, 0);
const SCRATCH_B = new V3d(0, 0, 0);

/** Options for creating a DistanceConstraint3D. */
export interface DistanceConstraint3DOptions extends ConstraintOptions {
  /** Target distance. If not set, uses current 3D distance between anchors. */
  distance?: number;
  /** 3D anchor point on bodyA in local coordinates. Default [0,0,0]. Ignored if A is a point mass. */
  localAnchorA?: CompatibleVector3;
  /** 3D anchor point on bodyB in local coordinates. Default [0,0,0]. Ignored if B is a point mass. */
  localAnchorB?: CompatibleVector3;
  /** Maximum force the constraint can apply. Default MAX_VALUE. */
  maxForce?: number;
}

type EquationKind = "pp" | "pr" | "rr";

/**
 * 3D distance constraint between two bodies. At construction time this class
 * inspects the shape tags of the two bodies and selects the cheapest
 * equation variant for the pair:
 *
 *   - `pm3d × pm3d`      → {@link PointToPointEquation3D} (6 non-zero G)
 *   - `pm3d × rigid3d`   → {@link PointToRigidEquation3D} (9 non-zero G)
 *   - `rigid3d × rigid3d` → general {@link Equation}       (12 non-zero G)
 *
 * If the body order is `rigid3d × pm3d`, the bodies (and their local anchors)
 * are swapped so the point mass is always bodyA — matching the
 * {@link PointToRigidEquation3D} convention.
 */
export class DistanceConstraint3D extends Constraint {
  localAnchorA: V3d;
  localAnchorB: V3d;

  /** The distance to keep. */
  distance: number;

  /** Max force to apply. */
  maxForce: number;

  upperLimitEnabled: boolean = false;
  upperLimit: number = 1;
  lowerLimitEnabled: boolean = false;
  lowerLimit: number = 0;

  /** Current 3D distance between the world anchor points (refreshed by update()). */
  position: number = 0;

  private readonly _kind: EquationKind;
  private readonly _updateFn: () => void;

  constructor(
    bodyA: Body,
    bodyB: Body,
    options: DistanceConstraint3DOptions = {},
  ) {
    // Normalize: if (rigid3d, pm3d), swap so particle is bodyA.
    let a = bodyA;
    let b = bodyB;
    let localA: CompatibleVector3 =
      options.localAnchorA ?? (new V3d(0, 0, 0) as CompatibleVector3);
    let localB: CompatibleVector3 =
      options.localAnchorB ?? (new V3d(0, 0, 0) as CompatibleVector3);
    if (a.shape === "rigid3d" && b.shape === "pm3d") {
      const tmp = a;
      a = b;
      b = tmp;
      const tmpL = localA;
      localA = localB;
      localB = tmpL;
    }

    super(a, b, options);

    this.localAnchorA = V3(localA);
    this.localAnchorB = V3(localB);

    // Initial distance if not given — 3D world-anchor separation.
    if (typeof options.distance === "number") {
      this.distance = options.distance;
    } else {
      const [ax, ay, az] = this._worldAnchorA(SCRATCH_A);
      const [bx, by, bz] = this._worldAnchorB(SCRATCH_B);
      const dx = bx - ax;
      const dy = by - ay;
      const dz = bz - az;
      this.distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    const maxForce =
      options.maxForce !== undefined ? options.maxForce : Number.MAX_VALUE;
    this.maxForce = maxForce;

    if (a.shape === "pm3d" && b.shape === "pm3d") {
      this._kind = "pp";
      this.equations = [new PointToPointEquation3D(a, b, -maxForce, maxForce)];
      this._updateFn = this._updatePointToPoint.bind(this);
    } else if (a.shape === "pm3d" && b.shape === "rigid3d") {
      this._kind = "pr";
      this.equations = [new PointToRigidEquation3D(a, b, -maxForce, maxForce)];
      this._updateFn = this._updatePointToRigid.bind(this);
    } else if (a.shape === "rigid3d" && b.shape === "rigid3d") {
      this._kind = "rr";
      const eq = new Equation(a, b, -maxForce, maxForce);
      const self = this;
      eq.computeGq = function () {
        const wa = self._worldAnchorA(SCRATCH_A);
        const wb = self._worldAnchorB(SCRATCH_B);
        const dx = wb[0] - wa[0];
        const dy = wb[1] - wa[1];
        const dz = wb[2] - wa[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz) - self.distance;
      };
      this.equations = [eq];
      this._updateFn = this._updateRigidRigid.bind(this);
    } else {
      throw new Error(
        `DistanceConstraint3D: unsupported 3D body shape combination: ${a.shape} + ${b.shape}`,
      );
    }

    this.setMaxForce(maxForce);
  }

  /** World anchor for body A, honoring the shape (point-masses have no orientation). */
  private _worldAnchorA(out: V3d): V3d {
    const a = this.bodyA;
    if (a.shape === "pm3d") {
      out[0] = a.position[0];
      out[1] = a.position[1];
      out[2] = a.z;
      return out;
    }
    return a.toWorldFrame3D(this.localAnchorA, out);
  }

  private _worldAnchorB(out: V3d): V3d {
    const b = this.bodyB;
    if (b.shape === "pm3d") {
      out[0] = b.position[0];
      out[1] = b.position[1];
      out[2] = b.z;
      return out;
    }
    return b.toWorldFrame3D(this.localAnchorB, out);
  }

  update(): this {
    this._updateFn();
    return this;
  }

  /**
   * Apply upper/lower limits to `this.position`. Returns true if the caller
   * should short-circuit (equation disabled because no limit is violated).
   */
  private _applyLimits(): boolean {
    const eq = this.equations[0];
    let violating = false;
    if (this.upperLimitEnabled && this.position > this.upperLimit) {
      eq.maxForce = 0;
      eq.minForce = -this.maxForce;
      this.distance = this.upperLimit;
      violating = true;
    }
    if (this.lowerLimitEnabled && this.position < this.lowerLimit) {
      eq.maxForce = this.maxForce;
      eq.minForce = 0;
      this.distance = this.lowerLimit;
      violating = true;
    }
    if ((this.upperLimitEnabled || this.lowerLimitEnabled) && !violating) {
      eq.enabled = false;
      return true;
    }
    eq.enabled = true;
    return false;
  }

  /** pm3d × pm3d: no anchors, no angular — read body positions directly. */
  private _updatePointToPoint(): void {
    const a = this.bodyA;
    const b = this.bodyB;
    const eq = this.equations[0] as PointToPointEquation3D;

    const dx = b.position[0] - a.position[0];
    const dy = b.position[1] - a.position[1];
    const dz = b.z - a.z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    this.position = len;

    if (this._applyLimits()) return;

    eq.offset = len - this.distance;
    if (len > 1e-4) {
      const inv = 1 / len;
      eq.nx = dx * inv;
      eq.ny = dy * inv;
      eq.nz = dz * inv;
    } else {
      eq.nx = 1;
      eq.ny = 0;
      eq.nz = 0;
    }
  }

  /** pm3d (A) × rigid3d (B): B has anchor + 3D angular contribution. */
  private _updatePointToRigid(): void {
    const a = this.bodyA;
    const b = this.bodyB;
    const eq = this.equations[0] as PointToRigidEquation3D;

    const wb = b.toWorldFrame3D(this.localAnchorB, SCRATCH_B);
    const bx = wb[0];
    const by = wb[1];
    const bz = wb[2];

    // Direction from particle (A) to rigid anchor (B).
    const dx = bx - a.position[0];
    const dy = by - a.position[1];
    const dz = bz - a.z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    this.position = len;

    if (this._applyLimits()) return;

    eq.offset = len - this.distance;
    let nx: number;
    let ny: number;
    let nz: number;
    if (len > 1e-4) {
      const inv = 1 / len;
      nx = dx * inv;
      ny = dy * inv;
      nz = dz * inv;
    } else {
      nx = 1;
      ny = 0;
      nz = 0;
    }
    eq.nx = nx;
    eq.ny = ny;
    eq.nz = nz;

    // rj = world anchor - body center
    const rjX = bx - b.position[0];
    const rjY = by - b.position[1];
    const rjZ = bz - b.z;
    eq.rjXnX = rjY * nz - rjZ * ny;
    eq.rjXnY = rjZ * nx - rjX * nz;
    eq.rjXnZ = rjX * ny - rjY * nx;
  }

  /** rigid3d × rigid3d: fall back to the general 12-component Equation. */
  private _updateRigidRigid(): void {
    const a = this.bodyA;
    const b = this.bodyB;
    const eq = this.equations[0];
    const G = eq.G;

    const wa = a.toWorldFrame3D(this.localAnchorA, SCRATCH_A);
    const ax = wa[0];
    const ay = wa[1];
    const az = wa[2];
    const wb = b.toWorldFrame3D(this.localAnchorB, SCRATCH_B);
    const bx = wb[0];
    const by = wb[1];
    const bz = wb[2];

    const dx = bx - ax;
    const dy = by - ay;
    const dz = bz - az;
    this.position = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (this._applyLimits()) return;

    let nx: number;
    let ny: number;
    let nz: number;
    if (this.position > 1e-4) {
      const inv = 1 / this.position;
      nx = dx * inv;
      ny = dy * inv;
      nz = dz * inv;
    } else {
      nx = 1;
      ny = 0;
      nz = 0;
    }

    const riX = ax - a.position[0];
    const riY = ay - a.position[1];
    const riZ = az - a.z;
    const rjX = bx - b.position[0];
    const rjY = by - b.position[1];
    const rjZ = bz - b.z;

    const rixnX = riY * nz - riZ * ny;
    const rixnY = riZ * nx - riX * nz;
    const rixnZ = riX * ny - riY * nx;
    const rjxnX = rjY * nz - rjZ * ny;
    const rjxnY = rjZ * nx - rjX * nz;
    const rjxnZ = rjX * ny - rjY * nx;

    G[0] = -nx;
    G[1] = -ny;
    G[2] = -nz;
    G[3] = -rixnX;
    G[4] = -rixnY;
    G[5] = -rixnZ;
    G[6] = nx;
    G[7] = ny;
    G[8] = nz;
    G[9] = rjxnX;
    G[10] = rjxnY;
    G[11] = rjxnZ;
  }

  /** Set the max force to be used. */
  setMaxForce(maxForce: number): void {
    this.maxForce = maxForce;
    const eq = this.equations[0];
    eq.minForce = -maxForce;
    eq.maxForce = maxForce;
  }

  /** Get the max force. */
  getMaxForce(): number {
    return this.equations[0].maxForce;
  }
}
