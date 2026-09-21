import type { Body } from "../body/Body";
import { PointToRigidEquation3D } from "../equations/PointToRigidEquation3D";
import {
  findLevelForZ,
  findNearestEdge,
  pointInPolygon,
} from "../utils/HullBoundaryGeometry";
import { Constraint, type ConstraintOptions } from "./Constraint";

// ── Hull boundary data ─────────────────────────────────────────────

/** Pre-computed edge geometry for a single z-level hull cross-section. */
export interface HullBoundaryLevel {
  /** Hull-local z-height of this slice. */
  z: number;
  /** Vertex X coords (hull-local). */
  vx: Float64Array;
  /** Vertex Y coords (hull-local). */
  vy: Float64Array;
  /** Outward normal X per edge. */
  edgeNx: Float64Array;
  /** Outward normal Y per edge. */
  edgeNy: Float64Array;
  /** Unit tangent X per edge (along edge direction). */
  edgeTx: Float64Array;
  /** Unit tangent Y per edge. */
  edgeTy: Float64Array;
  /** Number of vertices/edges. */
  count: number;
}

/** Hull boundary sampled at multiple z-levels, shared across all constraints on the same hull. */
export interface HullBoundaryData {
  /** Sorted ascending by z (bottom → deck). */
  levels: HullBoundaryLevel[];
  /** Gunwale z in hull-local frame (top of hull wall, "open edge"). */
  deckHeight: number;
  /** Hull bottom z = -draft. */
  draft: number;
}

/**
 * Build a HullBoundaryLevel from a CCW polygon outline.
 * The outline is an array of [x, y] tuples in hull-local coordinates.
 */
export function buildBoundaryLevel(
  outline: ReadonlyArray<readonly [number, number]>,
  z: number,
): HullBoundaryLevel | null {
  const n = outline.length;
  if (n < 3) return null;

  const vx = new Float64Array(n);
  const vy = new Float64Array(n);
  const edgeNx = new Float64Array(n);
  const edgeNy = new Float64Array(n);
  const edgeTx = new Float64Array(n);
  const edgeTy = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    vx[i] = outline[i][0];
    vy[i] = outline[i][1];
  }

  // Compute signed area to determine winding
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vx[i] * vy[j] - vx[j] * vy[i];
  }
  // area > 0 → CCW, < 0 → CW
  const sign = area >= 0 ? 1 : -1;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const ex = vx[j] - vx[i];
    const ey = vy[j] - vy[i];
    const len = Math.sqrt(ex * ex + ey * ey);
    if (len < 1e-10) {
      edgeTx[i] = 1;
      edgeTy[i] = 0;
      edgeNx[i] = 0;
      edgeNy[i] = -sign;
    } else {
      const invLen = 1 / len;
      edgeTx[i] = ex * invLen;
      edgeTy[i] = ey * invLen;
      // CCW outward normal: (ty, -tx). CW: (-ty, tx). Handled by sign.
      edgeNx[i] = sign * edgeTy[i];
      edgeNy[i] = sign * -edgeTx[i];
    }
  }

  return { z, vx, vy, edgeNx, edgeNy, edgeTx, edgeTy, count: n };
}

// ── Constraint ─────────────────────────────────────────────────────

/**
 * Stateful 3D hull contact constraint that keeps a particle either above
 * the deck (inside mode) or outside the hull walls (outside mode), with
 * Coulomb friction in both cases. Used by rope particles.
 *
 * Three equations (reused for both modes):
 * - **Normal** (unilateral): prevents penetration through deck or wall.
 * - **Friction 1 & 2** (bounded bilateral): resist tangential sliding.
 *
 * State transitions happen only at the gunwale ("open edge" at deckHeight):
 * - Inside → Outside: particle's hull-local XY exits the deck-level outline
 * - Outside → Inside: XY enters deck outline AND Z ≥ deckHeight (open top)
 *
 * For the sailor (single instance, must stay inside, needs a walk motor) use
 * {@link SailorDeckConstraint} instead.
 */
export class DeckContactConstraint extends Constraint {
  /** Callback returning deck z-height in bodyB-local coords, or null. */
  private getDeckHeight: (localX: number, localY: number) => number | null;

  /** Hull boundary data shared across constraints on the same hull. */
  private boundary: HullBoundaryData;

  /** Coulomb friction coefficient (0 = frictionless). */
  frictionCoefficient: number;

  /** Rope radius (ft). The particle center rests this far above surfaces. */
  radius: number;

  /** Whether the constraint is currently engaged (particle on or near a surface). */
  private _active: boolean = false;

  /** Persistent inside/outside state. true = particle is within the hull. */
  private inside: boolean;

  constructor(
    particle: Body,
    hullBody: Body,
    getDeckHeight: (localX: number, localY: number) => number | null,
    hullBoundary: HullBoundaryData,
    frictionCoefficient: number = 0.5,
    radius: number = 0,
    options?: ConstraintOptions,
  ) {
    super(particle, hullBody, options);

    this.getDeckHeight = getDeckHeight;
    this.boundary = hullBoundary;
    this.frictionCoefficient = frictionCoefficient;
    this.radius = radius;

    // Particle is bodyA (point-like, no angular), hull is bodyB (rigid). The
    // PointToRigidEquation3D shape encodes G = [-n, 0, +n, rj×n] so the
    // solver skips all body-A angular work. Friction equations reuse the
    // same shape — they're pure velocity constraints, so update() leaves
    // `offset = 0` on them.
    const normal = new PointToRigidEquation3D(
      particle,
      hullBody,
      0,
      Number.MAX_VALUE,
    );
    const friction1 = new PointToRigidEquation3D(particle, hullBody, 0, 0);
    const friction2 = new PointToRigidEquation3D(particle, hullBody, 0, 0);

    this.equations = [normal, friction1, friction2];

    // Determine initial inside/outside state from current particle position
    const deckLevel = hullBoundary.levels[hullBoundary.levels.length - 1];
    if (deckLevel) {
      const [lx, ly] = hullBody.toLocalFrame3D(
        particle.position[0],
        particle.position[1],
        particle.z,
      );
      this.inside = pointInPolygon(deckLevel, lx, ly);
    } else {
      this.inside = true;
    }
  }

  update(): this {
    const particle = this.bodyA;
    const hull = this.bodyB;
    const normal = this.equations[0] as PointToRigidEquation3D;
    const friction1 = this.equations[1] as PointToRigidEquation3D;
    const friction2 = this.equations[2] as PointToRigidEquation3D;
    const boundary = this.boundary;

    // Convert particle world position to hull-local coordinates
    const pz = particle.z;
    if (!isFinite(pz)) {
      this.disableAll(normal, friction1, friction2);
      return this;
    }
    const [lx, ly, lz] = hull.toLocalFrame3D(
      particle.position[0],
      particle.position[1],
      pz,
    );

    // Use the topmost level (deck-level outline) for state transitions
    const deckLevel = boundary.levels[boundary.levels.length - 1];
    if (!deckLevel) {
      this.disableAll(normal, friction1, friction2);
      return this;
    }

    const insideDeckOutline = pointInPolygon(deckLevel, lx, ly);

    // ── State transitions ──────────────────────────────────────────
    if (this.inside && !insideDeckOutline) {
      // Was inside, slid over gunwale → outside
      this.inside = false;
      this.resetWarmStart();
    } else if (!this.inside && insideDeckOutline) {
      // Was outside, XY is now within deck outline
      if (lz >= boundary.deckHeight - this.radius - 0.1) {
        // Entered from above the gunwale (open edge) → allowed
        this.inside = true;
        this.resetWarmStart();
      }
      // else: below gunwale → stay outside, wall blocks re-entry
    }

    // ── Dispatch to mode ───────────────────────────────────────────
    if (this.inside) {
      this.updateInside(lx, ly, normal, friction1, friction2);
    } else {
      this.updateOutside(lx, ly, lz, normal, friction1, friction2);
    }

    return this;
  }

  // ── Inside mode: deck surface contact ────────────────────────────

  private updateInside(
    lx: number,
    ly: number,
    normal: PointToRigidEquation3D,
    friction1: PointToRigidEquation3D,
    friction2: PointToRigidEquation3D,
  ): void {
    const particle = this.bodyA;
    const hull = this.bodyB;

    // Query deck height (with fallback to gunwale height)
    const deckZ = this.getDeckHeight(lx, ly) ?? this.boundary.deckHeight;

    // Deck surface point in world space
    const [dx, dy, dz] = hull.toWorldFrame3D(lx, ly, deckZ);

    // Particle world position
    const px = particle.position[0];
    const py = particle.position[1];
    const pz = particle.z;

    // Hull orientation matrix (row-major 3x3)
    const R = hull.orientation;

    // World deck normal: hull's local Z axis
    const nx = R[2];
    const ny = R[5];
    const nz = R[8];

    // Signed distance from particle center to the effective surface
    const rawDist = nx * (px - dx) + ny * (py - dy) + nz * (pz - dz);
    const penetration = rawDist - this.radius;

    this._active = true;
    normal.enabled = true;

    // Lever arm from hull center to deck contact point (world frame)
    const rjX = dx - hull.position[0];
    const rjY = dy - hull.position[1];
    const rjZ = dz - hull.z;

    // Write the point-to-rigid shape fields: G_A = -n, G_B = +n, G_B_ang = rj×n.
    // Position error is the penetration depth (negative = penetrating).
    this.setShapeJacobian(normal, nx, ny, nz, rjX, rjY, rjZ);
    normal.offset = penetration;

    // Friction
    this.setFriction(normal, friction1, friction2, R, rjX, rjY, rjZ);
  }

  // ── Outside mode: hull wall contact ──────────────────────────────

  private updateOutside(
    lx: number,
    ly: number,
    lz: number,
    normal: PointToRigidEquation3D,
    friction1: PointToRigidEquation3D,
    friction2: PointToRigidEquation3D,
  ): void {
    const particle = this.bodyA;
    const hull = this.bodyB;
    const boundary = this.boundary;

    // Above gunwale → no wall constraint (open edge)
    if (lz > boundary.deckHeight + this.radius) {
      this.disableAll(normal, friction1, friction2);
      return;
    }

    // Find the z-appropriate hull outline level
    const zLevel = findLevelForZ(boundary, lz);
    if (!zLevel) {
      this.disableAll(normal, friction1, friction2);
      return;
    }

    // Find nearest hull edge at this z-level
    const nearest = findNearestEdge(zLevel, lx, ly);
    if (nearest.distSq > 25) {
      // > 5 ft from hull → disable
      this.disableAll(normal, friction1, friction2);
      return;
    }

    // Below hull bottom → bottom contact (push downward, away from hull)
    if (lz <= -boundary.draft + this.radius) {
      this.updateBottomContact(lx, ly, normal, friction1, friction2);
      return;
    }

    // Wall contact: push particle outward from nearest hull edge

    // Wall normal: always use pre-computed edge outward normal.
    // (Using particle-to-edge direction would point inward when penetrating.)
    const localNx = zLevel.edgeNx[nearest.edgeIndex];
    const localNy = zLevel.edgeNy[nearest.edgeIndex];

    // Signed distance along outward normal from nearest edge point to particle.
    // Positive = outside hull (gap), negative = penetrating through wall.
    const signedDist =
      (lx - nearest.cx) * localNx + (ly - nearest.cy) * localNy;
    const penetration = signedDist - this.radius;

    // Transform wall normal to world frame
    const R = hull.orientation;
    const wnx = R[0] * localNx + R[1] * localNy;
    const wny = R[3] * localNx + R[4] * localNy;
    const wnz = R[6] * localNx + R[7] * localNy;

    // Contact point on the wall in world space
    const [wx, wy, wz] = hull.toWorldFrame3D(nearest.cx, nearest.cy, lz);

    this._active = true;
    normal.enabled = true;

    // Lever arm from hull center to wall contact point
    const rjX = wx - hull.position[0];
    const rjY = wy - hull.position[1];
    const rjZ = wz - hull.z;

    // Shape fields: push particle outward from wall along world normal
    this.setShapeJacobian(normal, wnx, wny, wnz, rjX, rjY, rjZ);
    normal.offset = penetration;

    // Friction tangents for wall contact
    const slipForce = this.frictionCoefficient * Math.abs(normal.multiplier);

    if (slipForce > 0) {
      friction1.enabled = true;
      friction1.minForce = -slipForce;
      friction1.maxForce = slipForce;
      friction2.enabled = true;
      friction2.minForce = -slipForce;
      friction2.maxForce = slipForce;
    } else {
      friction1.enabled = false;
      friction2.enabled = false;
    }

    // Tangent 1: along the hull edge in world space
    const t1lx = zLevel.edgeTx[nearest.edgeIndex];
    const t1ly = zLevel.edgeTy[nearest.edgeIndex];
    const t1x = R[0] * t1lx + R[1] * t1ly;
    const t1y = R[3] * t1lx + R[4] * t1ly;
    const t1z = R[6] * t1lx + R[7] * t1ly;

    // Tangent 2: hull Z axis (vertical along wall)
    const t2x = R[2];
    const t2y = R[5];
    const t2z = R[8];

    this.setShapeJacobian(friction1, t1x, t1y, t1z, rjX, rjY, rjZ);
    friction1.offset = 0;
    this.setShapeJacobian(friction2, t2x, t2y, t2z, rjX, rjY, rjZ);
    friction2.offset = 0;
  }

  // ── Bottom contact (outside, below hull) ─────────────────────────

  private updateBottomContact(
    lx: number,
    ly: number,
    normal: PointToRigidEquation3D,
    friction1: PointToRigidEquation3D,
    friction2: PointToRigidEquation3D,
  ): void {
    const hull = this.bodyB;
    const R = hull.orientation;

    // Push particle downward (hull's -Z axis in world = away from hull interior)
    const nx = -R[2];
    const ny = -R[5];
    const nz = -R[8];

    // Contact point: on the hull bottom surface
    const [bx, by, bz] = hull.toWorldFrame3D(lx, ly, -this.boundary.draft);

    const px = this.bodyA.position[0];
    const py = this.bodyA.position[1];
    const pz = this.bodyA.z;

    const rawDist = nx * (px - bx) + ny * (py - by) + nz * (pz - bz);
    const penetration = rawDist - this.radius;

    this._active = true;
    normal.enabled = true;

    const rjX = bx - hull.position[0];
    const rjY = by - hull.position[1];
    const rjZ = bz - hull.z;

    this.setShapeJacobian(normal, nx, ny, nz, rjX, rjY, rjZ);
    normal.offset = penetration;

    // Friction on hull bottom: hull X and Y axes
    this.setFriction(normal, friction1, friction2, R, rjX, rjY, rjZ);
  }

  // ── Jacobian helpers ─────────────────────────────────────────────

  /**
   * Write a point-to-rigid constraint direction to the shape fields.
   *
   * Historical convention of this constraint had body A (the particle)
   * receiving `+origN` linearly. The {@link PointToRigidEquation3D} shape
   * instead stores a direction `n` where body A gets `-n`, so we negate
   * the incoming direction when assigning. The angular contribution for
   * body B matches the original `G[9..11] = -(rj × origN)` expression —
   * which is exactly `rj × (-origN) = rj × n` — so the cross-product
   * formulas are unchanged from the original `setNormalJacobian`.
   */
  private setShapeJacobian(
    eq: PointToRigidEquation3D,
    origNx: number,
    origNy: number,
    origNz: number,
    rjX: number,
    rjY: number,
    rjZ: number,
  ): void {
    eq.nx = -origNx;
    eq.ny = -origNy;
    eq.nz = -origNz;
    eq.rjXnX = -(rjY * origNz - rjZ * origNy);
    eq.rjXnY = -(rjZ * origNx - rjX * origNz);
    eq.rjXnZ = -(rjX * origNy - rjY * origNx);
  }

  /** Set up both friction equations using hull X/Y axes as tangents. */
  private setFriction(
    normal: PointToRigidEquation3D,
    friction1: PointToRigidEquation3D,
    friction2: PointToRigidEquation3D,
    R: Float64Array,
    rjX: number,
    rjY: number,
    rjZ: number,
  ): void {
    const slipForce = this.frictionCoefficient * Math.abs(normal.multiplier);

    if (slipForce > 0) {
      friction1.enabled = true;
      friction1.minForce = -slipForce;
      friction1.maxForce = slipForce;
      friction2.enabled = true;
      friction2.minForce = -slipForce;
      friction2.maxForce = slipForce;
    } else {
      friction1.enabled = false;
      friction2.enabled = false;
    }

    // Tangent 1: hull's local X axis (forward) in world space
    this.setShapeJacobian(friction1, R[0], R[3], R[6], rjX, rjY, rjZ);
    friction1.offset = 0;
    // Tangent 2: hull's local Y axis (starboard) in world space
    this.setShapeJacobian(friction2, R[1], R[4], R[7], rjX, rjY, rjZ);
    friction2.offset = 0;
  }

  private disableAll(
    normal: PointToRigidEquation3D,
    friction1: PointToRigidEquation3D,
    friction2: PointToRigidEquation3D,
  ): void {
    normal.enabled = false;
    friction1.enabled = false;
    friction2.enabled = false;
    this._active = false;
  }

  /** Reset warm-starting impulses on state transition to prevent stale directional impulses. */
  private resetWarmStart(): void {
    for (const eq of this.equations) {
      eq.warmLambda = 0;
      eq.multiplier = 0;
    }
  }

  /** Whether the constraint is currently active (particle on/near a surface). */
  isActive(): boolean {
    return this._active;
  }

  /** Whether the particle is currently inside the hull. */
  isInside(): boolean {
    return this.inside;
  }
}
