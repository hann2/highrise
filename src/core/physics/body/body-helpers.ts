import { Particle } from "../shapes/Particle";
import { Body } from "./Body";

/**
 * Returns true if the body has no non-Particle shapes. Particle-vs-Particle
 * has no narrowphase handler and shapeless bodies can't collide at all, so
 * either case can skip pairwise broadphase registration with each other —
 * the broadphase only queries them against everything else.
 */
export function hasOnlyParticleShapes(body: Body): boolean {
  return body.shapes.every((s) => s instanceof Particle);
}

/** True if the body is a dynamic body that is currently awake. */
export function isAwake(body: Body): boolean {
  return body.motion === "dynamic" && !body.isSleeping();
}
