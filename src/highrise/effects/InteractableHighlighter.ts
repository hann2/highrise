import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Human from "../entities/human/Human";

export default class InteractableHighlighter
  extends BaseEntity
  implements Entity {
  constructor(private getHuman: () => Human) {
    super();
  }
}
