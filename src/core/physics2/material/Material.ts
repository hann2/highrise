/**
 * A material identifier. Used with ContactMaterial to define friction and restitution
 * between pairs of materials. Assign to shapes via shape.material.
 */
export class Material {
  /** @internal */
  static idCounter = 0;

  /** Unique identifier for this material. */
  id: number;

  /** Create a new material with an optional custom ID. */
  constructor(id?: number) {
    this.id = id ?? Material.idCounter++;
  }
}
