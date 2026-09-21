import { V3d } from "../../Vector3";
import type { Body } from "../body/Body";
import { PointToRigidEquation3D } from "../equations/PointToRigidEquation3D";
import { Constraint, type ConstraintOptions } from "./Constraint";

/**
 * Unilateral 3D contact constraint that keeps a body-local point on a rigid
 * body at or above a caller-supplied floor z-height. Unlike
 * {@link DeckContactConstraint} (point-on-rigid), here the "point" is a
 * world-fixed ghost and the rigid body is the one that must stay on the +z
 * side of the floor — used to stop a boat hull or mast tip from passing
 * through the seabed.
 *
 * Convention:
 *   - bodyA is a shared **static ghost** (`invMass === 0`). Its position is
 *     irrelevant; `PointToRigidEquation3D` only uses A via inverse mass and
 *     velocity, both of which are zero for a static body.
 *   - bodyB is the rigid body whose motion the constraint governs.
 *
 * Three equations (same as `DeckContactConstraint`):
 *   - Normal (unilateral, `minForce = 0`): pushes the contact point up along
 *     world +Z whenever it dips below `getFloorZ()`.
 *   - Friction 1 & 2 (bounded bilateral): resist horizontal sliding of the
 *     contact point across the seabed. Tangents are world +X and world +Y.
 *
 * Sign convention (matching `DeckContactConstraint`):
 *   `origN` is the direction along which positive lambda pushes body B. For
 *   terrain contact that's world −Z (downward), which after the internal
 *   negation inside `setShapeJacobian` pushes body B +Z and body A −Z. The
 *   position error `offset = contactWorldZ − floorZ` is positive when the
 *   contact point is above the floor (no force) and negative when penetrating.
 */
export class TerrainContactConstraint extends Constraint {
  private localX: number;
  private localY: number;
  private localZ: number;
  private getFloorZ: () => number | null;
  frictionCoefficient: number;

  private _active: boolean = false;
  private _penetration: number = 0;

  // Scratch V3d reused across update() calls to avoid per-tick allocation.
  private _scratchContact: V3d = new V3d(0, 0, 0);

  constructor(
    groundAnchor: Body,
    hullBody: Body,
    localX: number,
    localY: number,
    localZ: number,
    getFloorZ: () => number | null,
    frictionCoefficient: number = 0.5,
    options?: ConstraintOptions,
  ) {
    super(groundAnchor, hullBody, options);

    this.localX = localX;
    this.localY = localY;
    this.localZ = localZ;
    this.getFloorZ = getFloorZ;
    this.frictionCoefficient = frictionCoefficient;

    const normal = new PointToRigidEquation3D(
      groundAnchor,
      hullBody,
      0,
      Number.MAX_VALUE,
    );
    const friction1 = new PointToRigidEquation3D(groundAnchor, hullBody, 0, 0);
    const friction2 = new PointToRigidEquation3D(groundAnchor, hullBody, 0, 0);

    this.equations = [normal, friction1, friction2];
  }

  update(): this {
    const hull = this.bodyB;
    const normal = this.equations[0] as PointToRigidEquation3D;
    const friction1 = this.equations[1] as PointToRigidEquation3D;
    const friction2 = this.equations[2] as PointToRigidEquation3D;

    const floorZ = this.getFloorZ();
    if (floorZ === null) {
      this.disableAll(normal, friction1, friction2);
      return this;
    }

    // Contact point in world frame (water-relative z, matching hull.body.z).
    const contact = hull.toWorldFrame3D(
      this.localX,
      this.localY,
      this.localZ,
      this._scratchContact,
    );
    const wx = contact[0];
    const wy = contact[1];
    const wz = contact[2];

    // Signed elevation above the floor. Positive = separated (no force),
    // negative = penetrating (constraint pushes up). Disable when well above.
    const signedDistance = wz - floorZ;
    if (signedDistance > 0.5) {
      this.disableAll(normal, friction1, friction2);
      return this;
    }

    this._active = true;
    this._penetration = Math.max(0, -signedDistance);

    // Lever arm from hull body origin to the contact point, in world frame.
    const rjX = wx - hull.position[0];
    const rjY = wy - hull.position[1];
    const rjZ = wz - hull.z;

    // Normal: origN = -Z (downward). setShapeJacobian stores -origN, so
    // positive lambda pushes body B (+Z) and body A (-Z). See class docs.
    normal.enabled = true;
    this.setShapeJacobian(normal, 0, 0, -1, rjX, rjY, rjZ);
    normal.offset = signedDistance;

    // Friction bounds scale with the most recent normal impulse. Same pattern
    // as DeckContactConstraint.setFriction.
    const normalForce = Math.abs(normal.multiplier);
    const slipForce = this.frictionCoefficient * normalForce;
    if (slipForce > 0) {
      friction1.enabled = true;
      friction1.minForce = -slipForce;
      friction1.maxForce = slipForce;
      friction2.enabled = true;
      friction2.minForce = -slipForce;
      friction2.maxForce = slipForce;
    } else {
      friction1.enabled = false;
      friction2.enabled = false;
    }

    // Tangents: world +X and world +Y. Pure velocity constraints (offset = 0).
    this.setShapeJacobian(friction1, 1, 0, 0, rjX, rjY, rjZ);
    friction1.offset = 0;
    this.setShapeJacobian(friction2, 0, 1, 0, rjX, rjY, rjZ);
    friction2.offset = 0;

    return this;
  }

  /**
   * Write a point-to-rigid constraint direction to the shape fields. Same
   * math as `DeckContactConstraint.setShapeJacobian`: the equation stores a
   * direction `n` where body A linearly receives `-n` and body B `+n`, so we
   * negate the incoming direction when assigning, and the angular block is
   * `rj × (-origN) = rj × n` via the cross product expanded below.
   */
  private setShapeJacobian(
    eq: PointToRigidEquation3D,
    origNx: number,
    origNy: number,
    origNz: number,
    rjX: number,
    rjY: number,
    rjZ: number,
  ): void {
    eq.nx = -origNx;
    eq.ny = -origNy;
    eq.nz = -origNz;
    eq.rjXnX = -(rjY * origNz - rjZ * origNy);
    eq.rjXnY = -(rjZ * origNx - rjX * origNz);
    eq.rjXnZ = -(rjX * origNy - rjY * origNx);
  }

  private disableAll(
    normal: PointToRigidEquation3D,
    friction1: PointToRigidEquation3D,
    friction2: PointToRigidEquation3D,
  ): void {
    normal.enabled = false;
    friction1.enabled = false;
    friction2.enabled = false;
    this._active = false;
    this._penetration = 0;
  }

  /** Whether the constraint is currently engaged (contact point on/below the floor). */
  isActive(): boolean {
    return this._active;
  }

  /** How far the contact point has penetrated the floor this tick (ft, ≥0). */
  getPenetration(): number {
    return this._penetration;
  }
}
