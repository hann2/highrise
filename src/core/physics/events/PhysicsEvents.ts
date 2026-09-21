import { Body } from "../body/Body";
import type { ContactEquation } from "../equations/ContactEquation";
import type { FrictionEquation } from "../equations/FrictionEquation";
import { Shape } from "../shapes/Shape";
import type { Spring } from "../springs/Spring";

/**
 * Discriminated union type for all physics events.
 * This replaces the old mutable event object pattern with immutable typed events.
 */
export type PhysicsEvent =
  | { type: "addBody"; body: Body }
  | { type: "removeBody"; body: Body }
  | { type: "addSpring"; spring: Spring }
  | { type: "removeSpring"; spring: Spring }
  | {
      type: "impact";
      bodyA: Body;
      bodyB: Body;
      shapeA: Shape;
      shapeB: Shape;
      contactEquation: ContactEquation;
    }
  | { type: "postBroadphase"; pairs: [Body, Body][] }
  | {
      type: "beginContact";
      shapeA: Shape;
      shapeB: Shape;
      bodyA: Body;
      bodyB: Body;
      contactEquations: ContactEquation[];
    }
  | {
      type: "endContact";
      shapeA: Shape;
      shapeB: Shape;
      bodyA: Body;
      bodyB: Body;
    }
  | {
      type: "preSolve";
      contactEquations: ContactEquation[];
      frictionEquations: FrictionEquation[];
    }
  | { type: "postStep" }
  | { type: "addShape"; body: Body; shape: Shape }
  | { type: "removeShape"; body: Body; shape: Shape }
  | { type: "sleep"; body: Body }
  | { type: "wakeup"; body: Body }
  | { type: "sleepy"; body: Body };

/**
 * Map of event type names to their event payloads.
 * Used for type-safe event listener registration.
 */
export type PhysicsEventMap = {
  [E in PhysicsEvent as E["type"]]: E;
};
