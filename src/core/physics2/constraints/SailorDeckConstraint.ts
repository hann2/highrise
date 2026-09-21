import type { Body } from "../body/Body";
import { PointToRigidEquation3D } from "../equations/PointToRigidEquation3D";
import { findNearestEdge, pointInPolygon } from "../utils/HullBoundaryGeometry";
import { Constraint, type ConstraintOptions } from "./Constraint";
import type { HullBoundaryData } from "./DeckContactConstraint";

/**
 * Deck-surface contact for the sailor character. The sailor is always "inside"
 * the hull and must stay so; this constraint uses four equations to enforce it:
 *
 * - **eq[0] deck normal** (unilateral) — keeps the sailor on the deck surface.
 * - **eq[1], eq[2] friction** (bounded bilateral) — along hull X and Y axes,
 *   driven by {@link targetVelocityX} / {@link targetVelocityY} for walking.
 * - **eq[3] edge wall** (unilateral) — vertex-aware inward push keeping the
 *   sailor inside the deck outline. Uses the direction from the nearest point
 *   on the polygon boundary to the sailor's position, so convex corners (bow,
 *   stern) don't slip through between edge normals.
 *
 * When the sailor is within `radius + edgeBuffer` of the deck outline, the
 * motor's target velocity is projected onto the along-edge tangent (its
 * outward component is zeroed), so the walk motor can slide the sailor along
 * the gunwale but can't drive through it.
 */
export class SailorDeckConstraint extends Constraint {
  private getDeckHeight: (localX: number, localY: number) => number | null;
  private boundary: HullBoundaryData;

  /** Coulomb friction coefficient; used only as a passive fallback. */
  frictionCoefficient: number;

  /** Sailor particle radius (ft). Center rests this far from surfaces. */
  radius: number;

  /**
   * Decoupled lateral grip (force units). Replaces the Coulomb bound so the
   * walk motor has consistent authority regardless of the normal force cap.
   */
  fixedFrictionForce: number = 0;

  /**
   * Target relative velocity along hull-local X axis (ft/s). The friction
   * equation drives toward this speed so the sailor walks forward/back.
   */
  targetVelocityX: number = 0;

  /** Target relative velocity along hull-local Y axis (ft/s). */
  targetVelocityY: number = 0;

  /**
   * Additional proximity margin (ft) inside the `radius` gap where the motor's
   * outward component is already being zeroed. Keeps the motor from fighting
   * the wall on the very first tick of contact.
   */
  edgeBuffer: number;

  /** When true, all equations disable (used while the sailor is welded to a station). */
  disabled: boolean = false;

  private _active: boolean = false;
  /** Tracks whether the edge wall was engaged last tick, so we can clear its
   * warm-start impulse on re-engage (the direction can have rotated while
   * disabled, and a stale impulse would push in the wrong direction). */
  private _wallEngaged: boolean = false;

  constructor(
    particle: Body,
    hullBody: Body,
    getDeckHeight: (localX: number, localY: number) => number | null,
    hullBoundary: HullBoundaryData,
    frictionCoefficient: number = 0.5,
    radius: number = 0,
    edgeBuffer: number = 0.5,
    options?: ConstraintOptions,
  ) {
    super(particle, hullBody, options);

    this.getDeckHeight = getDeckHeight;
    this.boundary = hullBoundary;
    this.frictionCoefficient = frictionCoefficient;
    this.radius = radius;
    this.edgeBuffer = edgeBuffer;

    const normal = new PointToRigidEquation3D(
      particle,
      hullBody,
      0,
      Number.MAX_VALUE,
    );
    const friction1 = new PointToRigidEquation3D(particle, hullBody, 0, 0);
    const friction2 = new PointToRigidEquation3D(particle, hullBody, 0, 0);
    const wall = new PointToRigidEquation3D(
      particle,
      hullBody,
      0,
      Number.MAX_VALUE,
    );

    this.equations = [normal, friction1, friction2, wall];
  }

  update(): this {
    const particle = this.bodyA;
    const hull = this.bodyB;
    const normal = this.equations[0] as PointToRigidEquation3D;
    const friction1 = this.equations[1] as PointToRigidEquation3D;
    const friction2 = this.equations[2] as PointToRigidEquation3D;
    const wall = this.equations[3] as PointToRigidEquation3D;
    const boundary = this.boundary;

    if (this.disabled) {
      this.disableAll();
      return this;
    }

    const pz = particle.z;
    if (!isFinite(pz)) {
      this.disableAll();
      return this;
    }

    const [lx, ly] = hull.toLocalFrame3D(
      particle.position[0],
      particle.position[1],
      pz,
    );

    const deckLevel = boundary.levels[boundary.levels.length - 1];
    if (!deckLevel) {
      this.disableAll();
      return this;
    }

    const R = hull.orientation;

    // ── Deck normal contact ───────────────────────────────────────
    const deckZ = this.getDeckHeight(lx, ly) ?? boundary.deckHeight;
    const [dx, dy, dz] = hull.toWorldFrame3D(lx, ly, deckZ);
    const px = particle.position[0];
    const py = particle.position[1];

    // Hull Z axis in world (deck normal)
    const deckNx = R[2];
    const deckNy = R[5];
    const deckNz = R[8];

    const rawDeckDist =
      deckNx * (px - dx) + deckNy * (py - dy) + deckNz * (pz - dz);
    const deckPenetration = rawDeckDist - this.radius;

    const rjDeckX = dx - hull.position[0];
    const rjDeckY = dy - hull.position[1];
    const rjDeckZ = dz - hull.z;

    normal.enabled = true;
    this.setShapeJacobian(
      normal,
      deckNx,
      deckNy,
      deckNz,
      rjDeckX,
      rjDeckY,
      rjDeckZ,
    );
    normal.offset = deckPenetration;
    this._active = true;

    // ── Edge proximity ───────────────────────────────────────────
    const nearest = findNearestEdge(deckLevel, lx, ly);
    const inside = pointInPolygon(deckLevel, lx, ly);
    const dist = Math.sqrt(nearest.distSq);
    const signedDist = inside ? dist : -dist;
    const engageRange = this.radius + this.edgeBuffer;
    const nearEdge = signedDist < engageRange;

    // Inward normal in hull-local XY: points from boundary toward sailor
    // when inside, flipped when outside. Only meaningful near the edge
    // (far from any edge the nearest-edge direction flips around and is
    // unstable), so we only compute it when nearEdge.
    let inNx = 0;
    let inNy = 0;
    if (nearEdge) {
      if (dist > 1e-6) {
        const invDist = 1 / dist;
        const sign = inside ? 1 : -1;
        inNx = sign * (lx - nearest.cx) * invDist;
        inNy = sign * (ly - nearest.cy) * invDist;
      } else {
        inNx = -deckLevel.edgeNx[nearest.edgeIndex];
        inNy = -deckLevel.edgeNy[nearest.edgeIndex];
      }
    }

    // ── Wall contact (unilateral, only when near edge) ──────────
    if (nearEdge) {
      const [wx, wy, wz] = hull.toWorldFrame3D(nearest.cx, nearest.cy, deckZ);
      const rjWallX = wx - hull.position[0];
      const rjWallY = wy - hull.position[1];
      const rjWallZ = wz - hull.z;

      // World-frame inward normal (rotate hull-local (inNx, inNy, 0) to world).
      const wnx = R[0] * inNx + R[1] * inNy;
      const wny = R[3] * inNx + R[4] * inNy;
      const wnz = R[6] * inNx + R[7] * inNy;

      if (!this._wallEngaged) {
        // Re-engaging after being disabled — drop stale warm-start so an
        // impulse cached in a different direction doesn't fire.
        wall.warmLambda = 0;
        wall.multiplier = 0;
      }
      wall.enabled = true;
      this.setShapeJacobian(wall, wnx, wny, wnz, rjWallX, rjWallY, rjWallZ);
      // Penetration: negative when sailor center is within `radius` of
      // boundary (or past it). Unilateral bound → no force when positive.
      wall.offset = signedDist - this.radius;
      this._wallEngaged = true;
    } else {
      wall.enabled = false;
      this._wallEngaged = false;
    }

    // ── Friction (walk motor on hull X/Y, with projected target near edge) ──
    const slipForce =
      this.fixedFrictionForce > 0
        ? this.fixedFrictionForce
        : this.frictionCoefficient * Math.abs(normal.multiplier);

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

    // Project the walk motor onto the along-edge tangent when near the
    // boundary, so the solver isn't asked to drive the sailor through the
    // wall.  NOTE: the friction equations' Jacobian sign convention makes a
    // positive `relativeVelocity` drive motion in the -tangent direction
    // (see PlayerBoatController.onTickWalking), so the *actual* desired
    // velocity is `-target`. Target has an inward component means actual
    // motion is outward; strip that component.
    let targetX = this.targetVelocityX;
    let targetY = this.targetVelocityY;
    if (nearEdge) {
      const c = targetX * inNx + targetY * inNy;
      if (c > 0) {
        targetX -= c * inNx;
        targetY -= c * inNy;
      }
    }

    // Tangent 1: hull's local X axis (forward) in world space
    this.setShapeJacobian(
      friction1,
      R[0],
      R[3],
      R[6],
      rjDeckX,
      rjDeckY,
      rjDeckZ,
    );
    friction1.offset = 0;
    friction1.relativeVelocity = targetX;

    // Tangent 2: hull's local Y axis (starboard) in world space
    this.setShapeJacobian(
      friction2,
      R[1],
      R[4],
      R[7],
      rjDeckX,
      rjDeckY,
      rjDeckZ,
    );
    friction2.offset = 0;
    friction2.relativeVelocity = targetY;

    return this;
  }

  /**
   * Write a point-to-rigid constraint direction to the shape fields. Mirrors
   * the helper in {@link DeckContactConstraint}: body A (point) receives `-n`,
   * body B receives `+n` linear and `rj × n` angular.
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

  private disableAll(): void {
    for (const eq of this.equations) eq.enabled = false;
    this._active = false;
    this._wallEngaged = false;
  }

  isActive(): boolean {
    return this._active;
  }
}
