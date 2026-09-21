/**
 * 3D point-lock constraint between a particle-like body and a rigid body
 * with a local anchor. Holds the particle coincident with the anchor in all
 * three world-space position axes, so both radial and tangential motion are
 * resisted (unlike {@link DistanceConstraint3D}, which only
 * constrains radial separation).
 *
 * Owns three {@link PointToRigidEquation3D}s with fixed world-axis normals
 * (1,0,0), (0,1,0), (0,0,1). Each axis equation tracks its own per-axis
 * position error and the corresponding `rj × n` lever-arm term on the rigid.
 *
 * The particle must be `bodyA` per `PointToRigidEquation3D`'s convention.
 */
import { CompatibleVector3, V3, V3d } from "../../Vector3";
import type { Body } from "../body/Body";
import { PointToRigidEquation3D } from "../equations/PointToRigidEquation3D";
import { Constraint, ConstraintOptions } from "./Constraint";

const SCRATCH_ANCHOR_B = new V3d(0, 0, 0);

export interface PointToRigidLockConstraint3DOptions extends ConstraintOptions {
  /** Local anchor on the rigid body (bodyB). Default [0, 0, 0]. */
  localAnchorB?: CompatibleVector3;
  /** Maximum force the constraint can apply per axis. Default MAX_VALUE. */
  maxForce?: number;
}

export class PointToRigidLockConstraint3D extends Constraint {
  /** Hull-local anchor point. The particle is pinned to this in B's frame. */
  localAnchorB: V3d;

  /** Max force per axis. */
  maxForce: number;

  /** When true, update() disables the equations and short-circuits. */
  disabled: boolean = false;

  readonly equationX: PointToRigidEquation3D;
  readonly equationY: PointToRigidEquation3D;
  readonly equationZ: PointToRigidEquation3D;

  constructor(
    particle: Body,
    rigid: Body,
    options: PointToRigidLockConstraint3DOptions = {},
  ) {
    super(particle, rigid, options);

    this.localAnchorB = options.localAnchorB
      ? V3(options.localAnchorB)
      : new V3d(0, 0, 0);
    this.maxForce = options.maxForce ?? Number.MAX_VALUE;

    this.equationX = new PointToRigidEquation3D(
      particle,
      rigid,
      -this.maxForce,
      this.maxForce,
    );
    this.equationY = new PointToRigidEquation3D(
      particle,
      rigid,
      -this.maxForce,
      this.maxForce,
    );
    this.equationZ = new PointToRigidEquation3D(
      particle,
      rigid,
      -this.maxForce,
      this.maxForce,
    );

    // Fixed world-axis normals — never change during update().
    this.equationX.nx = 1;
    this.equationY.ny = 1;
    this.equationZ.nz = 1;

    this.equations = [this.equationX, this.equationY, this.equationZ];
  }

  update(): this {
    const eqX = this.equationX;
    const eqY = this.equationY;
    const eqZ = this.equationZ;

    if (this.disabled) {
      eqX.enabled = false;
      eqY.enabled = false;
      eqZ.enabled = false;
      return this;
    }

    const particle = this.bodyA;
    const rigid = this.bodyB;

    const worldB = rigid.toWorldFrame3D(this.localAnchorB, SCRATCH_ANCHOR_B);
    const bx = worldB[0];
    const by = worldB[1];
    const bz = worldB[2];

    // Lever arm from rigid CoM to anchor.
    const rjX = bx - rigid.position[0];
    const rjY = by - rigid.position[1];
    const rjZ = bz - rigid.z;

    // Per-axis signed gap, sign matched to the distance-constraint convention
    // (n points from particle toward anchor, offset positive when anchor is
    // on the +axis side of the particle).
    eqX.enabled = true;
    eqX.offset = bx - particle.position[0];
    // n = (1,0,0) → rj × n = (0, rjZ, -rjY)
    eqX.rjXnX = 0;
    eqX.rjXnY = rjZ;
    eqX.rjXnZ = -rjY;

    eqY.enabled = true;
    eqY.offset = by - particle.position[1];
    // n = (0,1,0) → rj × n = (-rjZ, 0, rjX)
    eqY.rjXnX = -rjZ;
    eqY.rjXnY = 0;
    eqY.rjXnZ = rjX;

    eqZ.enabled = true;
    eqZ.offset = bz - particle.z;
    // n = (0,0,1) → rj × n = (rjY, -rjX, 0)
    eqZ.rjXnX = rjY;
    eqZ.rjXnY = -rjX;
    eqZ.rjXnZ = 0;

    return this;
  }

  setMaxForce(maxForce: number): void {
    this.maxForce = maxForce;
    this.equationX.minForce = -maxForce;
    this.equationX.maxForce = maxForce;
    this.equationY.minForce = -maxForce;
    this.equationY.maxForce = maxForce;
    this.equationZ.minForce = -maxForce;
    this.equationZ.maxForce = maxForce;
  }
}
