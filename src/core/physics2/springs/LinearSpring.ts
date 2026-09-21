import { CompatibleVector, V, V2d } from "../../Vector";
import type { Body } from "../body/Body";
import { SpringOptions, Spring } from "./Spring";

/** Options for creating a LinearSpring. */
export interface LinearSpringOptions extends SpringOptions {
  /** Natural length of the spring. Auto-computed from anchor positions if not set. */
  restLength?: number;
  /** Anchor point on bodyA in local coordinates. */
  localAnchorA?: CompatibleVector;
  /** Anchor point on bodyB in local coordinates. */
  localAnchorB?: CompatibleVector;
  /** Anchor point on bodyA in world coordinates (converted to local). */
  worldAnchorA?: CompatibleVector;
  /** Anchor point on bodyB in world coordinates (converted to local). */
  worldAnchorB?: CompatibleVector;
}

/** A spring connecting two points on two bodies. Applies force based on distance from rest length. */
export class LinearSpring extends Spring {
  /** Anchor point on bodyA in local coordinates. */
  localAnchorA: V2d;
  /** Anchor point on bodyB in local coordinates. */
  localAnchorB: V2d;
  /** Natural length of the spring (no force applied at this length). */
  restLength: number;

  constructor(bodyA: Body, bodyB: Body, options: LinearSpringOptions = {}) {
    super(bodyA, bodyB, options);

    this.localAnchorA = V();
    this.localAnchorB = V();

    if (options.localAnchorA) {
      this.localAnchorA.set(options.localAnchorA);
    }
    if (options.localAnchorB) {
      this.localAnchorB.set(options.localAnchorB);
    }
    if (options.worldAnchorA) {
      this.setWorldAnchorA(options.worldAnchorA);
    }
    if (options.worldAnchorB) {
      this.setWorldAnchorB(options.worldAnchorB);
    }

    const worldAnchorA = this.getWorldAnchorA();
    const worldAnchorB = this.getWorldAnchorB();
    const worldDistance = worldAnchorA.distanceTo(worldAnchorB);

    this.restLength =
      typeof options.restLength === "number"
        ? options.restLength
        : worldDistance;
  }

  setWorldAnchorA(worldAnchorA: CompatibleVector): void {
    const anchor = V(worldAnchorA[0], worldAnchorA[1]);
    this.localAnchorA.set(this.bodyA.toLocalFrame(anchor));
  }

  setWorldAnchorB(worldAnchorB: CompatibleVector): void {
    const anchor = V(worldAnchorB[0], worldAnchorB[1]);
    this.localAnchorB.set(this.bodyB.toLocalFrame(anchor));
  }

  getWorldAnchorA(): V2d {
    return this.bodyA.toWorldFrame(this.localAnchorA);
  }

  getWorldAnchorB(): V2d {
    return this.bodyB.toWorldFrame(this.localAnchorB);
  }

  applyForce(): this {
    const k = this.stiffness;
    const d = this.damping;
    const l = this.restLength;
    const bodyA = this.bodyA;
    const bodyB = this.bodyB;

    // Get world anchors
    const worldAnchorA = this.getWorldAnchorA();
    const worldAnchorB = this.getWorldAnchorB();

    // Get offset points
    const ri = worldAnchorA.sub(bodyA.position);
    const rj = worldAnchorB.sub(bodyB.position);

    // Compute distance vector between world anchor points
    const r = worldAnchorB.sub(worldAnchorA);
    const rlen = r.magnitude;
    const r_unit = r.normalize();

    // Compute relative velocity of the anchor points, u
    const u = bodyB.velocity
      .sub(bodyA.velocity)
      .add(rj.crossZV(bodyB.angularVelocity))
      .sub(ri.crossZV(bodyA.angularVelocity));

    // F = - k * ( x - L ) - D * ( u )
    const f = r_unit.mul(-k * (rlen - l) - d * u.dot(r_unit));

    // Add forces to bodies
    bodyA.force.isub(f);
    bodyB.force.iadd(f);

    // Angular force
    const ri_x_f = ri.crossLength(f);
    const rj_x_f = rj.crossLength(f);
    bodyA.angularForce -= ri_x_f;
    bodyB.angularForce += rj_x_f;
    return this;
  }
}
