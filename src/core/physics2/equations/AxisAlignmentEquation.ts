import type { Body } from "../body/Body";
import { AngularEquation3D } from "./AngularEquation3D";

/**
 * Locks a relative orientation DOF between two bodies by constraining a
 * body-local reference direction on bodyA to stay perpendicular to a
 * body-local hinge axis on bodyB.
 *
 * Used as one of two scalar equations in a 3D revolute joint (hinge) to
 * pin the hinge axes of the two bodies together, leaving only rotation
 * around the shared axis free.
 *
 * The constraint is `(RA · dirA) · (RB · hingeB) = 0`, i.e., the two
 * world-frame unit vectors are perpendicular. For a hinge with both axes
 * being the bodies' local z-axis, pick `dirA ∈ {localX, localY}` to produce
 * two independent alignment equations.
 *
 * Jacobian derivation (velocity-level):
 *   d/dt((RA·dirA) · (RB·hingeB))
 *     = (ω_A × u) · u' + u · (ω_B × u')
 *     = (u × u') · (ω_A − ω_B)
 *
 * This fits the {@link AngularEquation3D} shape: `G_angA = (u × u')`,
 * `G_angB = -(u × u')`, no linear contribution. The base shape class
 * already handles the antisymmetric 3D angular math in the solver; this
 * subclass just computes `(cx, cy, cz) = u × u'` each update.
 */
export class AxisAlignmentEquation extends AngularEquation3D {
  /** bodyA-local reference direction (unit vector, perpendicular to hinge axis). */
  private readonly dirA: [number, number, number];
  /** bodyB-local hinge axis (unit vector). */
  private readonly hingeB: [number, number, number];

  constructor(
    bodyA: Body,
    bodyB: Body,
    dirA: [number, number, number],
    hingeB: [number, number, number],
  ) {
    super(bodyA, bodyB, -Number.MAX_VALUE, Number.MAX_VALUE);
    this.dirA = dirA;
    this.hingeB = hingeB;
  }

  /**
   * Recompute the world-frame axis vectors and write `u × u'` into the
   * angular shape fields `(cx, cy, cz)`. Called each step by the owning
   * constraint's `update()`.
   */
  refreshJacobian(): void {
    const RA = this.bodyA.orientation;
    const RB = this.bodyB.orientation;
    const dA = this.dirA;
    const hB = this.hingeB;

    // u = RA · dirA  (bodyA reference direction in world frame)
    const ux = RA[0] * dA[0] + RA[1] * dA[1] + RA[2] * dA[2];
    const uy = RA[3] * dA[0] + RA[4] * dA[1] + RA[5] * dA[2];
    const uz = RA[6] * dA[0] + RA[7] * dA[1] + RA[8] * dA[2];

    // u' = RB · hingeB  (bodyB hinge axis in world frame)
    const vx = RB[0] * hB[0] + RB[1] * hB[1] + RB[2] * hB[2];
    const vy = RB[3] * hB[0] + RB[4] * hB[1] + RB[5] * hB[2];
    const vz = RB[6] * hB[0] + RB[7] * hB[1] + RB[8] * hB[2];

    // c = u × u'
    this.cx = uy * vz - uz * vy;
    this.cy = uz * vx - ux * vz;
    this.cz = ux * vy - uy * vx;

    // Position error: u · u' (zero at rest, non-zero when the axes tilt).
    this.offset = ux * vx + uy * vy + uz * vz;
  }

  /**
   * The owning constraint should call `refreshJacobian()` each update
   * instead of relying on the default computeGq, but this is kept as a
   * fallback for compatibility with code paths that call it directly.
   */
  override computeGq(): number {
    const RA = this.bodyA.orientation;
    const RB = this.bodyB.orientation;
    const dA = this.dirA;
    const hB = this.hingeB;

    const ux = RA[0] * dA[0] + RA[1] * dA[1] + RA[2] * dA[2];
    const uy = RA[3] * dA[0] + RA[4] * dA[1] + RA[5] * dA[2];
    const uz = RA[6] * dA[0] + RA[7] * dA[1] + RA[8] * dA[2];

    const vx = RB[0] * hB[0] + RB[1] * hB[1] + RB[2] * hB[2];
    const vy = RB[3] * hB[0] + RB[4] * hB[1] + RB[5] * hB[2];
    const vz = RB[6] * hB[0] + RB[7] * hB[1] + RB[8] * hB[2];

    return ux * vx + uy * vy + uz * vz;
  }
}
