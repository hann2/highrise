import type { Body } from "../body/Body";

/** Options shared by all spring types. */
export interface SpringOptions {
  /** Spring stiffness (force per unit displacement). Default 100. */
  stiffness?: number;
  /** Damping coefficient. Default 1. */
  damping?: number;
}

/**
 * Abstract base class for springs connecting two bodies.
 * At least one body (bodyA) must be dynamic for the spring to have any effect.
 * See LinearSpring, RotationalSpring, RopeSpring for concrete implementations.
 */
export abstract class Spring {
  /** Spring stiffness (force per unit displacement). */
  stiffness: number;
  /** Damping coefficient. */
  damping: number;
  /** First body connected by the spring. Must be a Body. */
  bodyA: Body;
  /** Second body connected by the spring. */
  bodyB: Body;

  constructor(bodyA: Body, bodyB: Body, options: SpringOptions = {}) {
    this.stiffness = options?.stiffness ?? 100;
    this.damping = options?.damping ?? 1;
    this.bodyA = bodyA;
    this.bodyB = bodyB;
  }

  /** Apply the spring force to the connected bodies. */
  abstract applyForce(): this;
}
