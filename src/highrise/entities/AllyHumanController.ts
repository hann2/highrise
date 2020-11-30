import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";

// AI That controllers a human ally
export default class PlayerHumanController
  extends BaseEntity
  implements Entity {
  constructor() {
    super();
  }

  onTick() {}
}
