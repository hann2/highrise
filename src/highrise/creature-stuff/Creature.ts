import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";

// Base class between humans and enemies and neutral creatures

export class Creature extends BaseEntity implements Entity {
  constructor() {
    super();
  }
}
