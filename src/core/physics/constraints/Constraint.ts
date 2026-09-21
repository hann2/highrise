import type { Body } from "../body/Body";
import type { Equation } from "../equations/Equation";

/** Options shared by all constraint types. */
export interface ConstraintOptions {
  /** Whether connected bodies should collide with each other. Default true. */
  collideConnected?: boolean;
  /** Whether to wake up sleeping bodies when constraint is created. Default true. */
  wakeUpBodies?: boolean;
}

/**
 * Abstract base class for constraints. Constraints maintain geometric relationships
 * between bodies using iterative solving. See DistanceConstraint, RevoluteConstraint, LockConstraint.
 */
export abstract class Constraint {
  /** Equations to be solved in this constraint */
  equations: Equation[] = [];

  /** First body participating in the constraint. */
  bodyA: Body;

  /** Second body participating in the constraint. */
  bodyB: Body;

  /** Whether the connected bodies should be able to collide with each other. */
  readonly collideConnected: boolean;

  constructor(bodyA: Body, bodyB: Body, options: ConstraintOptions = {}) {
    this.collideConnected = options?.collideConnected ?? true;
    const wakeUpBodies = options?.wakeUpBodies ?? true;

    this.bodyA = bodyA;
    this.bodyB = bodyB;

    // Wake up dynamic bodies when connected
    if (wakeUpBodies) {
      if (bodyA.motion === "dynamic") {
        bodyA.wakeUp();
      }
      if (bodyB.motion === "dynamic") {
        bodyB.wakeUp();
      }
    }
  }

  /** Updates the internal constraint parameters before solve. */
  abstract update(): this;

  /** Set stiffness for this constraint. */
  setStiffness(stiffness: number): this {
    const eqs = this.equations;
    for (let i = 0; i !== eqs.length; i++) {
      const eq = eqs[i];
      eq.stiffness = stiffness;
      eq.needsUpdate = true;
    }
    return this;
  }

  /** Set relaxation for this constraint. */
  setRelaxation(relaxation: number): this {
    const eqs = this.equations;
    for (let i = 0; i !== eqs.length; i++) {
      const eq = eqs[i];
      eq.relaxation = relaxation;
      eq.needsUpdate = true;
    }
    return this;
  }
}
