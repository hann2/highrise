import { Material } from "./Material";
import { Equation } from "../equations/Equation";

/** Options for creating a ContactMaterial. */
export interface ContactMaterialOptions {
  /** Friction coefficient (0 = frictionless, 1 = high friction). Default 0.3. */
  friction?: number;
  /** Restitution/bounciness (0 = no bounce, 1 = perfect bounce). Default 0. */
  restitution?: number;
  /** Contact stiffness for constraint solving. */
  stiffness?: number;
  /** Contact relaxation for constraint solving. */
  relaxation?: number;
  /** Friction stiffness for constraint solving. */
  frictionStiffness?: number;
  /** Friction relaxation for constraint solving. */
  frictionRelaxation?: number;
  /** Relative surface velocity (for conveyor belts). Default 0. */
  surfaceVelocity?: number;
}

/**
 * Defines collision properties between two materials (friction, restitution, etc.).
 * Add to world.contactMaterials to configure how material pairs interact.
 */
export class ContactMaterial {
  /** @internal */
  static idCounter = 0;

  /** Unique identifier. */
  id: number;
  /** First material. */
  materialA: Material;
  /** Second material. */
  materialB: Material;
  /** Friction coefficient. */
  friction: number;
  /** Restitution (bounciness). */
  restitution: number;
  /** Contact constraint stiffness. */
  stiffness: number;
  /** Contact constraint relaxation. */
  relaxation: number;
  /** Friction constraint stiffness. */
  frictionStiffness: number;
  /** Friction constraint relaxation. */
  frictionRelaxation: number;
  /** Relative surface velocity (for conveyor belts). */
  surfaceVelocity: number;
  /** Small skin around shapes for stable contacts. */
  contactSkinSize: number;

  constructor(
    materialA: Material,
    materialB: Material,
    options: ContactMaterialOptions = {},
  ) {
    if (!(materialA instanceof Material) || !(materialB instanceof Material)) {
      throw new Error("First two arguments must be Material instances.");
    }

    this.id = ContactMaterial.idCounter++;
    this.materialA = materialA;
    this.materialB = materialB;

    this.friction =
      options.friction !== undefined ? Number(options.friction) : 0.3;

    this.restitution =
      options.restitution !== undefined ? Number(options.restitution) : 0;

    this.stiffness =
      options.stiffness !== undefined
        ? Number(options.stiffness)
        : Equation.DEFAULT_STIFFNESS;

    this.relaxation =
      options.relaxation !== undefined
        ? Number(options.relaxation)
        : Equation.DEFAULT_RELAXATION;

    this.frictionStiffness =
      options.frictionStiffness !== undefined
        ? Number(options.frictionStiffness)
        : Equation.DEFAULT_STIFFNESS;

    this.frictionRelaxation =
      options.frictionRelaxation !== undefined
        ? Number(options.frictionRelaxation)
        : Equation.DEFAULT_RELAXATION;

    this.surfaceVelocity =
      options.surfaceVelocity !== undefined
        ? Number(options.surfaceVelocity)
        : 0;

    this.contactSkinSize = 0.005;
  }
}
