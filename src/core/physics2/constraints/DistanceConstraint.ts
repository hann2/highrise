import { CompatibleVector, V, V2d } from "../../Vector";
import type { Body } from "../body/Body";
import { PlanarEquation2D } from "../equations/PlanarEquation2D";
import { PointToPointEquation2D } from "../equations/PointToPointEquation2D";
import { PointToRigidEquation2D } from "../equations/PointToRigidEquation2D";
import { Constraint, ConstraintOptions } from "./Constraint";

// Module-level scratch vectors reused across all DistanceConstraint instances
// to avoid allocating a fresh V2d on every update() call.
const SCRATCH_RI = V();
const SCRATCH_RJ = V();
const SCRATCH_N = V();

/** Options for creating a DistanceConstraint. */
export interface DistanceConstraintOptions extends ConstraintOptions {
  /** Target distance. If not set, uses current distance between anchors. */
  distance?: number;
  /** Anchor point on bodyA in local coordinates. Default [0,0]. Ignored if A is a point mass. */
  localAnchorA?: CompatibleVector;
  /** Anchor point on bodyB in local coordinates. Default [0,0]. Ignored if B is a point mass. */
  localAnchorB?: CompatibleVector;
  /** Maximum force the constraint can apply. Default MAX_VALUE. */
  maxForce?: number;
}

type EquationKind = "pp" | "pr" | "rr";

/**
 * 2D distance constraint between two bodies. At construction time this class
 * inspects the shape tags of the two bodies and selects the cheapest
 * equation variant for the pair:
 *
 *   - `pm2d × pm2d`    → {@link PointToPointEquation2D} (4 non-zero G)
 *   - `pm2d × rigid2d` → {@link PointToRigidEquation2D} (5 non-zero G)
 *   - `rigid2d × rigid2d` → {@link PlanarEquation2D}    (6 non-zero G)
 *
 * If the body order is `rigid2d × pm2d`, the bodies (and their local anchors)
 * are swapped so the point mass is always bodyA — matching the
 * {@link PointToRigidEquation2D} convention.
 */
export class DistanceConstraint extends Constraint {
  /** Local anchor in body A (ignored if A is a point mass). */
  localAnchorA: V2d;

  /** Local anchor in body B (ignored if B is a point mass). */
  localAnchorB: V2d;

  /** The distance to keep. */
  distance: number;

  /** Max force to apply. */
  maxForce: number;

  /** If the upper limit is enabled or not. */
  upperLimitEnabled: boolean = false;

  /** The upper constraint limit. */
  upperLimit: number = 1;

  /** If the lower limit is enabled or not. */
  lowerLimitEnabled: boolean = false;

  /** The lower constraint limit. */
  lowerLimit: number = 0;

  /** Current distance between the world anchor points (refreshed by update()). */
  position: number = 0;

  private readonly _kind: EquationKind;
  private readonly _updateFn: () => void;

  constructor(
    bodyA: Body,
    bodyB: Body,
    options: DistanceConstraintOptions = {},
  ) {
    // Normalize: if we have (rigid2d, pm2d), swap to (pm2d, rigid2d) so the
    // particle is always bodyA (matches PointToRigidEquation2D convention).
    let a = bodyA;
    let b = bodyB;
    let localA = options?.localAnchorA ?? [0, 0];
    let localB = options?.localAnchorB ?? [0, 0];
    if (a.shape === "rigid2d" && b.shape === "pm2d") {
      const tmp = a;
      a = b;
      b = tmp;
      const tmpL = localA;
      localA = localB;
      localB = tmpL;
    }

    super(a, b, options);

    this.localAnchorA = V(localA[0], localA[1]);
    this.localAnchorB = V(localB[0], localB[1]);

    // Compute initial distance if not given — world anchor separation.
    if (typeof options.distance === "number") {
      this.distance = options.distance;
    } else {
      const ri =
        a.shape === "pm2d"
          ? SCRATCH_RI.set([0, 0])
          : SCRATCH_RI.set(this.localAnchorA).irotate(a.angle);
      const rj =
        b.shape === "pm2d"
          ? SCRATCH_RJ.set([0, 0])
          : SCRATCH_RJ.set(this.localAnchorB).irotate(b.angle);
      const n = SCRATCH_N.set(b.position).iadd(rj).isub(ri).isub(a.position);
      this.distance = n.magnitude;
    }

    const maxForce =
      typeof options.maxForce === "undefined"
        ? Number.MAX_VALUE
        : options.maxForce;
    this.maxForce = maxForce;

    // Pick the equation shape based on body shape tags.
    if (a.shape === "pm2d" && b.shape === "pm2d") {
      this._kind = "pp";
      this.equations = [new PointToPointEquation2D(a, b, -maxForce, maxForce)];
      this._updateFn = this._updatePointToPoint.bind(this);
    } else if (a.shape === "pm2d" && b.shape === "rigid2d") {
      this._kind = "pr";
      this.equations = [new PointToRigidEquation2D(a, b, -maxForce, maxForce)];
      this._updateFn = this._updatePointToRigid.bind(this);
    } else if (a.shape === "rigid2d" && b.shape === "rigid2d") {
      this._kind = "rr";
      this.equations = [new PlanarEquation2D(a, b, -maxForce, maxForce)];
      this._updateFn = this._updateRigidRigid.bind(this);
    } else {
      throw new Error(
        `DistanceConstraint: unsupported 2D body shape combination: ${a.shape} + ${b.shape}`,
      );
    }

    this.setMaxForce(maxForce);
  }

  /** Update the constraint equations. Should be called before solving. */
  update(): this {
    this._updateFn();
    return this;
  }

  /**
   * Check upper/lower limits against `this.position` and adjust the
   * equation's force clamps + `enabled` flag accordingly. Returns true if
   * the caller should short-circuit (constraint disabled by a slack limit).
   */
  private _applyLimits(): boolean {
    const eq = this.equations[0];
    let violating = false;
    if (this.upperLimitEnabled) {
      if (this.position > this.upperLimit) {
        eq.maxForce = 0;
        eq.minForce = -this.maxForce;
        this.distance = this.upperLimit;
        violating = true;
      }
    }
    if (this.lowerLimitEnabled) {
      if (this.position < this.lowerLimit) {
        eq.maxForce = this.maxForce;
        eq.minForce = 0;
        this.distance = this.lowerLimit;
        violating = true;
      }
    }
    if ((this.lowerLimitEnabled || this.upperLimitEnabled) && !violating) {
      eq.enabled = false;
      return true;
    }
    eq.enabled = true;
    return false;
  }

  /** pm2d × pm2d: no anchors, no angular. */
  private _updatePointToPoint(): void {
    const a = this.bodyA;
    const b = this.bodyB;
    const eq = this.equations[0] as PointToPointEquation2D;

    const dx = b.position[0] - a.position[0];
    const dy = b.position[1] - a.position[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    this.position = len;

    if (this._applyLimits()) return;

    eq.offset = len - this.distance;
    if (len > 1e-6) {
      const inv = 1 / len;
      eq.nx = dx * inv;
      eq.ny = dy * inv;
    } else {
      eq.nx = 1;
      eq.ny = 0;
    }
  }

  /** pm2d (A) × rigid2d (B): only B has an anchor + angular contribution. */
  private _updatePointToRigid(): void {
    const a = this.bodyA;
    const b = this.bodyB;
    const eq = this.equations[0] as PointToRigidEquation2D;

    // rj = localAnchorB rotated by bodyB.angle
    const rj = SCRATCH_RJ.set(this.localAnchorB).irotate(b.angle);
    const dx = b.position[0] + rj[0] - a.position[0];
    const dy = b.position[1] + rj[1] - a.position[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    this.position = len;

    if (this._applyLimits()) return;

    eq.offset = len - this.distance;
    let nx: number;
    let ny: number;
    if (len > 1e-6) {
      const inv = 1 / len;
      nx = dx * inv;
      ny = dy * inv;
    } else {
      nx = 1;
      ny = 0;
    }
    eq.nx = nx;
    eq.ny = ny;
    // rj × n projected to Z: rj.x * n.y - rj.y * n.x
    eq.rjCrossN = rj[0] * ny - rj[1] * nx;
  }

  /** rigid2d × rigid2d: both have anchors + angular contributions. */
  private _updateRigidRigid(): void {
    const a = this.bodyA;
    const b = this.bodyB;
    const eq = this.equations[0] as PlanarEquation2D;

    const ri = SCRATCH_RI.set(this.localAnchorA).irotate(a.angle);
    const rj = SCRATCH_RJ.set(this.localAnchorB).irotate(b.angle);
    const dx = b.position[0] + rj[0] - (a.position[0] + ri[0]);
    const dy = b.position[1] + rj[1] - (a.position[1] + ri[1]);
    const len = Math.sqrt(dx * dx + dy * dy);
    this.position = len;

    if (this._applyLimits()) return;

    eq.offset = len - this.distance;
    let nx: number;
    let ny: number;
    if (len > 1e-6) {
      const inv = 1 / len;
      nx = dx * inv;
      ny = dy * inv;
    } else {
      nx = 1;
      ny = 0;
    }
    eq.linX = nx;
    eq.linY = ny;
    // Body A angular Z: -(ri × n)
    eq.angAz = -(ri[0] * ny - ri[1] * nx);
    // Body B angular Z: +(rj × n)
    eq.angBz = rj[0] * ny - rj[1] * nx;
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
