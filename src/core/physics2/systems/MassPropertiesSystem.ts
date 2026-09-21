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

  const hasRotation = body.shape === "rigid2d" || body.shape === "rigid3d";
  if (hasRotation) {
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

  if (body.shape === "rigid3d") {
    recomputeWorldInertia(body);
  } else {
    // 2D yaw-only world inertia: only element [8] is non-zero.
    const iI = body.invWorldInertia;
    iI[0] = 0;
    iI[1] = 0;
    iI[2] = 0;
    iI[3] = 0;
    iI[4] = 0;
    iI[5] = 0;
    iI[6] = 0;
    iI[7] = 0;
    iI[8] = body.invInertia;
  }
}

/**
 * Recompute the world-frame inverse inertia tensor for a rigid3d body from
 * its orientation matrix: invI_world = R * diag(1/Ix, 1/Iy, 1/Iz) * R^T.
 * No-op on other shapes.
 */
export function recomputeWorldInertia(body: Body): void {
  if (body.shape !== "rigid3d" || body.motion !== "dynamic") {
    return;
  }
  const R = body.orientation;
  const iI = body.invWorldInertia;
  const invIx = body.invRollInertia;
  const invIy = body.invPitchInertia;
  const invIz = body.invInertia;

  for (let i = 0; i < 3; i++) {
    for (let j = i; j < 3; j++) {
      const val =
        R[i * 3] * invIx * R[j * 3] +
        R[i * 3 + 1] * invIy * R[j * 3 + 1] +
        R[i * 3 + 2] * invIz * R[j * 3 + 2];
      iI[i * 3 + j] = val;
      iI[j * 3 + i] = val;
    }
  }
}
