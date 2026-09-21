import type { Body } from "../body/Body";
import { CompatibleVector3, V3, V3d } from "../../Vector3";
import { Spring, SpringOptions } from "./Spring";

// Module-level scratch vectors reused across all RopeSpring3D instances to
// avoid allocating two V3ds per spring per step inside applyForce().
const SCRATCH_A = new V3d(0, 0, 0);
const SCRATCH_B = new V3d(0, 0, 0);

export interface RopeSpring3DOptions extends SpringOptions {
  /** 3D anchor point on bodyA in local coordinates. Default [0,0,0]. */
  localAnchorA?: CompatibleVector3;
  /** 3D anchor point on bodyB in local coordinates. Default [0,0,0]. */
  localAnchorB?: CompatibleVector3;
  /** Natural length of the spring. Auto-computed from anchor positions if not set. */
  restLength?: number;
  /** Maximum force the rope can apply. Prevents instability with stiff ropes. Default: Infinity. */
  maxForce?: number;
}

/**
 * A 3D spring that only applies force when stretched beyond its rest length.
 * Like RopeSpring but uses toWorldFrame3D and applyForce3D for full 6DOF support.
 * Useful for ropes/cables connecting bodies that can move in Z (e.g. jib sheets).
 */
export class RopeSpring3D extends Spring {
  localAnchorA: V3d;
  localAnchorB: V3d;
  restLength: number;
  maxForce: number;

  constructor(bodyA: Body, bodyB: Body, options: RopeSpring3DOptions = {}) {
    super(bodyA, bodyB, options);

    this.localAnchorA = options.localAnchorA
      ? V3(options.localAnchorA)
      : new V3d(0, 0, 0);
    this.localAnchorB = options.localAnchorB
      ? V3(options.localAnchorB)
      : new V3d(0, 0, 0);
    this.maxForce = options.maxForce ?? Infinity;

    if (typeof options.restLength === "number") {
      this.restLength = options.restLength;
    } else {
      const [ax, ay, az] = bodyA.toWorldFrame3D(this.localAnchorA);
      const [bx, by, bz] = bodyB.toWorldFrame3D(this.localAnchorB);
      const dx = bx - ax,
        dy = by - ay,
        dz = bz - az;
      this.restLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
  }

  applyForce(): this {
    const k = this.stiffness;
    const d = this.damping;
    const l = this.restLength;
    const bodyA = this.bodyA;
    const bodyB = this.bodyB;

    // World anchor positions (3D) — zero-alloc via scratch
    const a = bodyA.toWorldFrame3D(this.localAnchorA, SCRATCH_A);
    const b = bodyB.toWorldFrame3D(this.localAnchorB, SCRATCH_B);
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const bx = b[0];
    const by = b[1];
    const bz = b[2];

    // Separation vector
    const dx = bx - ax;
    const dy = by - ay;
    const dz = bz - az;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Only apply force when stretched beyond rest length (rope is taut)
    if (dist <= l || dist < 0.0001) return this;

    const invDist = 1 / dist;
    const nx = dx * invDist;
    const ny = dy * invDist;
    const nz = dz * invDist;

    // Lever arms from body centers to world anchors
    const riX = ax - bodyA.position[0];
    const riY = ay - bodyA.position[1];
    const riZ = az - bodyA.z;
    const rjX = bx - bodyB.position[0];
    const rjY = by - bodyB.position[1];
    const rjZ = bz - bodyB.z;

    // Relative velocity of anchor points (3D)
    // v_anchorB - v_anchorA, including angular velocity contributions
    const vax = bodyA.velocity[0] + -bodyA.angularVelocity * riY;
    const vay = bodyA.velocity[1] + bodyA.angularVelocity * riX;
    const vaz = bodyA.zVelocity;
    const vbx = bodyB.velocity[0] + -bodyB.angularVelocity * rjY;
    const vby = bodyB.velocity[1] + bodyB.angularVelocity * rjX;
    const vbz = bodyB.zVelocity;

    const ux = vbx - vax;
    const uy = vby - vay;
    const uz = vbz - vaz;

    // Relative velocity along the spring direction
    const relVel = ux * nx + uy * ny + uz * nz;

    // F = -k * (dist - L) - d * relVel, along spring direction
    const fMag = -k * (dist - l) - d * relVel;

    let fx = fMag * nx;
    let fy = fMag * ny;
    let fz = fMag * nz;

    // Clamp force magnitude
    const forceMag = Math.abs(fMag);
    if (forceMag > this.maxForce) {
      const scale = this.maxForce / forceMag;
      fx *= scale;
      fy *= scale;
      fz *= scale;
    }

    // Apply 3D forces at the anchor points (includes torque from lever arms)
    bodyA.applyForce3D(
      -fx,
      -fy,
      -fz,
      this.localAnchorA[0],
      this.localAnchorA[1],
      this.localAnchorA[2],
    );

    // Every body exposes applyForce3D (no-ops z/roll/pitch for non-rigid3d).
    bodyB.applyForce3D(
      fx,
      fy,
      fz,
      this.localAnchorB[0],
      this.localAnchorB[1],
      this.localAnchorB[2],
    );

    return this;
  }
}
