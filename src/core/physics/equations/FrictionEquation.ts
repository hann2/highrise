import { V, V2d } from "../../Vector";
import type { Body } from "../body/Body";
import type { Shape } from "../shapes/Shape";
import type { SolverWorkspace } from "../solver/SolverWorkspace";
import type { ContactEquation } from "./ContactEquation";
import { PlanarEquation2D } from "./PlanarEquation2D";

/**
 * Constrains tangential slip at a contact — enforces `G·v == 0` along a
 * tangent direction with bounded force (Coulomb friction).
 *
 * Same 2D planar shape as {@link ContactEquation}, just with a tangent
 * instead of a normal as the constraint direction. Extends
 * {@link PlanarEquation2D} for shape-specialized solver iteration.
 */
export class FrictionEquation extends PlanarEquation2D {
  /** Vector from body A center to the contact point (world-oriented). */
  contactPointA: V2d;

  /** Vector from body B center to the contact point (world-oriented). */
  contactPointB: V2d;

  /** Tangent vector the friction force acts along (world-oriented). */
  t: V2d;

  /**
   * Contact equations associated with this friction equation. The contact
   * normal forces are used to rescale the friction slip bound. If more
   * than one contact is given, the bound is averaged across them.
   */
  contactEquations: ContactEquation[] = [];

  /** Shape on body A that triggered this friction. */
  shapeA: Shape | null = null;

  /** Shape on body B that triggered this friction. */
  shapeB: Shape | null = null;

  /** Coulomb friction coefficient. */
  frictionCoefficient: number = 0.3;

  constructor(bodyA: Body, bodyB: Body, slipForce: number = 0) {
    super(bodyA, bodyB, -slipForce, slipForce);

    this.contactPointA = V();
    this.contactPointB = V();
    this.t = V();
  }

  /** Set the friction slip bound. */
  setSlipForce(slipForce: number): void {
    this.maxForce = slipForce;
    this.minForce = -slipForce;
  }

  /** Get the current friction slip bound. */
  getSlipForce(): number {
    return this.maxForce;
  }

  override computeB(
    a: number,
    b: number,
    h: number,
    ws: SolverWorkspace,
  ): number {
    const ri = this.contactPointA;
    const rj = this.contactPointB;
    const t = this.t;

    // Write the planar-shape Jacobian fields. This is a pure velocity
    // constraint (g ≡ 0), so only GW and GiMf contribute to B.
    this.linX = t[0];
    this.linY = t[1];
    this.angAz = -ri.crossLength(t);
    this.angBz = rj.crossLength(t);

    const GW = this.computeGW();
    const GiMf = this.computeGiMf(ws);

    return /* - Gq * a */ -GW * b - h * GiMf;
  }
}
