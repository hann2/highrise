import type { Body } from "../body/Body";

/**
 * Recompute mass/inertia from the body's shape list. No-op for static /
 * kinematic bodies.
 */
export function updateMassProperties(body: Body): void {
  if (body.motion !== "dynamic") {
    return;
  }

  const shapes = body.shapes;
  const N = shapes.length;
  const m = body.mass / (N || 1);

  if (body.shape === "rigid2d") {
    let I = 0;
    for (let i = 0; i < N; i++) {
      const shape = shapes[i];
      const r2 = shape.position.squaredMagnitude;
      const Icm = shape.computeMomentOfInertia(m);
      I += Icm + m * r2;
    }
    body.inertia = I;
    body.invInertia = I > 0 ? 1 / I : 0;
  } else {
    body.inertia = Number.MAX_VALUE;
    body.invInertia = 0;
  }

  body.invMass = body.mass > 0 ? 1 / body.mass : 0;
}
