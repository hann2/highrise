import { ContactMaterial } from "../material/ContactMaterial";
import { Material } from "../material/Material";
import { TupleMap } from "../utils/TupleMap";

/** Manages contact materials with O(1) lookup by material pair. */
export class ContactMaterialManager implements Iterable<ContactMaterial> {
  readonly defaultMaterial: Material;
  readonly defaultContactMaterial: ContactMaterial;
  private byMaterialPair = new TupleMap<ContactMaterial>();

  constructor(defaultMaterial: Material = new Material()) {
    this.defaultMaterial = defaultMaterial;
    this.defaultContactMaterial = new ContactMaterial(
      defaultMaterial,
      defaultMaterial,
    );
  }

  /** Add a contact material to the world. */
  add(cm: ContactMaterial): void {
    this.byMaterialPair.set(cm.materialA.id, cm.materialB.id, cm);
  }

  /** Remove a contact material from the world. */
  remove(cm: ContactMaterial): void {
    this.byMaterialPair.delete(cm.materialA.id, cm.materialB.id);
  }

  /** Get a contact material for the given material pair. */
  get(
    materialA: Material = this.defaultMaterial,
    materialB: Material = this.defaultMaterial,
  ): ContactMaterial {
    return (
      this.byMaterialPair.get(materialA.id, materialB.id) ??
      this.defaultContactMaterial
    );
  }

  /** Number of contact materials in the collection. */
  get length(): number {
    return this.byMaterialPair.length;
  }

  [Symbol.iterator](): Iterator<ContactMaterial> {
    return this.byMaterialPair[Symbol.iterator]();
  }
}
