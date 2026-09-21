import type { Body } from "../body/Body";
import { LinearSpring, LinearSpringOptions } from "./LinearSpring";
import { V, V2d } from "../../Vector";

// Module-level temp vectors for zero-allocation physics calculations
const _r = V();
const _rUnit = V();
const _u = V();
const _f = V();
const _worldAnchorA = V();
const _worldAnchorB = V();
const _ri = V();
const _rj = V();
const _tmp = V();

export interface RopeSpringOptions extends LinearSpringOptions {
  /** Maximum force the rope can apply. Prevents instability with stiff ropes. Default: Infinity (no limit). */
  maxForce?: number;
}

/**
 * A spring that only applies force when stretched, not when compressed.
 * Useful for rope/cable physics where slack is allowed.
 */
export class RopeSpring extends LinearSpring {
  /** Maximum force magnitude. */
  maxForce: number;

  constructor(bodyA: Body, bodyB: Body, options: RopeSpringOptions = {}) {
    super(bodyA, bodyB, options);
    this.maxForce = options.maxForce ?? Infinity;
  }

  applyForce(): this {
    const k = this.stiffness;
    const d = this.damping;
    const l = this.restLength;
    const bodyA = this.bodyA;
    const bodyB = this.bodyB;

    // Get world anchors
    _worldAnchorA.set(this.getWorldAnchorA());
    _worldAnchorB.set(this.getWorldAnchorB());

    // Get offset points
    _ri.set(_worldAnchorA).isub(bodyA.position);
    _rj.set(_worldAnchorB).isub(bodyB.position);

    // Compute distance vector between world anchor points
    _r.set(_worldAnchorB).isub(_worldAnchorA);
    const rlen = _r.magnitude;

    // Only apply force if we're beyond the length
    if (rlen > l) {
      _rUnit.set(_r).inormalize();

      // Compute relative velocity of the anchor points, u
      _u.set(bodyB.velocity).isub(bodyA.velocity);
      _tmp.set(_rj).icrossZV(bodyB.angularVelocity);
      _u.iadd(_tmp);
      _tmp.set(_ri).icrossZV(bodyA.angularVelocity);
      _u.isub(_tmp);

      // F = - k * ( x - L ) - D * ( u )
      _f.set(_rUnit).imul(-k * (rlen - l) - d * _u.dot(_rUnit));

      // Clamp force magnitude to prevent instability. Guard forceMag > 0
      // so the degenerate case (stretched rope but zero computed force —
      // possible when -k*(rlen-l) cancels the damping term exactly) doesn't
      // produce a 0/0 = NaN force.
      const forceMag = _f.magnitude;
      if (forceMag > this.maxForce && forceMag > 0) {
        _f.imul(this.maxForce / forceMag);
      }

      // Add forces to bodies
      bodyA.force.isub(_f);
      bodyB.force.iadd(_f);

      // Angular force
      const riCrossF = _ri.crossLength(_f);
      const rjCrossF = _rj.crossLength(_f);
      bodyA.angularForce -= riCrossF;
      bodyB.angularForce += rjCrossF;
    }
    return this;
  }
}
