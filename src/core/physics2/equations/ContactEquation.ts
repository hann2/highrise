import { V, V2d } from "../../Vector";
import type { Body } from "../body/Body";
import type { Shape } from "../shapes/Shape";
import type { SolverWorkspace } from "../solver/SolverWorkspace";
import { PlanarEquation2D } from "./PlanarEquation2D";

/**
 * Non-penetration constraint equation. Tries to make `contactPointA` and
 * `contactPointB` coincide along the contact normal while keeping the
 * applied force repulsive.
 *
 * This is a 2D planar contact — both bodies live in the XY plane and
 * rotate only about Z. It extends {@link PlanarEquation2D} so the solver
 * uses the shape-specialized iteration path (half the arithmetic of the
 * fully-general 12-component loop). The contact-specific state
 * (`contactPointA/B`, `normalA`, `penetrationVec`, `restitution`,
 * `firstImpact`, `shapeA/B`) is managed here; the shape-specific fields
 * (`linX`, `linY`, `angAz`, `angBz`) are written in `computeB` each step.
 */
export class ContactEquation extends PlanarEquation2D {
  /**
   * Vector from body A center of mass to the contact point (world-oriented).
   */
  contactPointA: V2d;
  penetrationVec: V2d;

  /**
   * Vector from body B center of mass to the contact point (world-oriented).
   */
  contactPointB: V2d;

  /** Contact normal, pointing out of body A. */
  normalA: V2d;

  /** Restitution to use (0 = no bounciness, 1 = max bounciness). */
  restitution: number = 0;

  /**
   * True on the first tick of an impact (as opposed to persistent contact).
   * Used to inject restitution-based rebound velocity.
   */
  firstImpact: boolean = false;

  /** The shape on body A that triggered this contact. */
  shapeA: Shape | null = null;

  /** The shape on body B that triggered this contact. */
  shapeB: Shape | null = null;

  constructor(bodyA: Body, bodyB: Body) {
    super(bodyA, bodyB, 0, Number.MAX_VALUE);

    this.contactPointA = V();
    this.penetrationVec = V();
    this.contactPointB = V();
    this.normalA = V();
  }

  override computeB(
    a: number,
    b: number,
    h: number,
    ws: SolverWorkspace,
  ): number {
    const bi = this.bodyA;
    const bj = this.bodyB;
    const ri = this.contactPointA;
    const rj = this.contactPointB;
    const xi = bi.position;
    const xj = bj.position;

    const penetrationVec = this.penetrationVec;
    const n = this.normalA;

    // Write the planar-shape Jacobian fields. Linear is symmetric (body A
    // receives `-lin`, body B receives `+lin`). The angular Z component per
    // body comes from the lever-arm cross products ri × n and rj × n.
    this.linX = n[0];
    this.linY = n[1];
    this.angAz = -ri.crossLength(n);
    this.angBz = rj.crossLength(n);

    // q = xj + rj − (xi + ri), i.e. the penetration vector
    penetrationVec.set(xj).iadd(rj).isub(xi).isub(ri);

    let GW: number;
    let Gq: number;
    if (this.firstImpact && this.restitution !== 0) {
      Gq = 0;
      GW = (1 / b) * (1 + this.restitution) * this.computeGW();
    } else {
      Gq = n.dot(penetrationVec) + this.offset;
      GW = this.computeGW();
    }

    const GiMf = this.computeGiMf(ws);
    return -Gq * a - GW * b - h * GiMf;
  }

  /** Current relative velocity along the contact normal. */
  getVelocityAlongNormal(): number {
    const vi = this.bodyA.getVelocityAtPoint(this.contactPointA);
    const vj = this.bodyB.getVelocityAtPoint(this.contactPointB);
    const relVel = vi.isub(vj);

    return this.normalA.dot(relVel);
  }
}
