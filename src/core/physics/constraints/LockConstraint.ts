import { CompatibleVector, V, V2d } from "../../Vector";
import type { Body } from "../body/Body";
import { Equation } from "../equations/Equation";
import { ConstraintOptions } from "./Constraint";
import { Constraint } from "./Constraint";

/** Options for creating a LockConstraint. */
export interface LockConstraintOptions extends ConstraintOptions {
  /** Offset of bodyB relative to bodyA in A's local frame. Auto-computed if not set. */
  localOffsetB?: CompatibleVector;
  /** Angle of bodyB relative to bodyA. Auto-computed if not set. */
  localAngleB?: number;
  /** Maximum force the constraint can apply. Default MAX_VALUE. */
  maxForce?: number;
}

/** Locks the relative position and rotation between two bodies. */
export class LockConstraint extends Constraint {
  /** The offset of bodyB in bodyA's frame. */
  localOffsetB: V2d;

  /** The offset angle of bodyB in bodyA's frame. */
  localAngleB: number;

  constructor(bodyA: Body, bodyB: Body, options: LockConstraintOptions = {}) {
    super(bodyA, bodyB, options);

    const maxForce =
      typeof options.maxForce === "undefined"
        ? Number.MAX_VALUE
        : options.maxForce;

    // Equations
    const x = new Equation(bodyA, bodyB, -maxForce, maxForce);
    const y = new Equation(bodyA, bodyB, -maxForce, maxForce);
    const rot = new Equation(bodyA, bodyB, -maxForce, maxForce);

    const lLocal = V();
    const gLocal = V();
    const that = this;

    x.computeGq = function () {
      lLocal.set(that.localOffsetB).irotate(bodyA.angle);
      gLocal.set(bodyB.position).isub(bodyA.position).isub(lLocal);
      return gLocal[0];
    };

    y.computeGq = function () {
      lLocal.set(that.localOffsetB).irotate(bodyA.angle);
      gLocal.set(bodyB.position).isub(bodyA.position).isub(lLocal);
      return gLocal[1];
    };

    const rLocal = V();
    const tLocal = V();
    rot.computeGq = function () {
      rLocal
        .set(that.localOffsetB)
        .irotate(bodyB.angle - that.localAngleB)
        .imul(-1);
      gLocal.set(bodyA.position).isub(bodyB.position).iadd(rLocal);
      tLocal
        .set(rLocal)
        .irotate(-Math.PI / 2)
        .inormalize();
      return gLocal.dot(tLocal);
    };

    this.localOffsetB = V();
    if (options.localOffsetB) {
      this.localOffsetB.set(options.localOffsetB);
    } else {
      // Construct from current positions
      this.localOffsetB
        .set(bodyB.position)
        .isub(bodyA.position)
        .irotate(-bodyA.angle);
    }

    this.localAngleB = 0;
    if (typeof options.localAngleB === "number") {
      this.localAngleB = options.localAngleB;
    } else {
      // Construct
      this.localAngleB = bodyB.angle - bodyA.angle;
    }

    this.equations.push(x, y, rot);
    this.setMaxForce(maxForce);
  }

  /** Set the maximum force to be applied. */
  setMaxForce(force: number): void {
    const eqs = this.equations;
    for (let i = 0; i < this.equations.length; i++) {
      eqs[i].maxForce = force;
      eqs[i].minForce = -force;
    }
  }

  /** Get the max force. */
  getMaxForce(): number {
    return this.equations[0].maxForce;
  }

  update(): this {
    const x = this.equations[0];
    const y = this.equations[1];
    const rot = this.equations[2];
    const bodyA = this.bodyA;
    const bodyB = this.bodyB;

    const l = this.localOffsetB.rotate(bodyA.angle);
    const r = this.localOffsetB.rotate(bodyB.angle - this.localAngleB).mul(-1);

    const t = r.rotate(Math.PI / 2).normalize();

    const xAxis = V(1, 0);
    const yAxis = V(0, 1);

    x.G[0] = -1;
    x.G[1] = 0;
    x.G[2] = -l.crossLength(xAxis);
    x.G[3] = 1;

    y.G[0] = 0;
    y.G[1] = -1;
    y.G[2] = -l.crossLength(yAxis);
    y.G[4] = 1;

    rot.G[0] = -t[0];
    rot.G[1] = -t[1];
    rot.G[3] = t[0];
    rot.G[4] = t[1];
    rot.G[5] = r.crossLength(t);
    return this;
  }
}
