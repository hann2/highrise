import Entity from "../../core/entity/Entity";
import Human from "./Human";
import BaseEntity from "../../core/entity/BaseEntity";
import { V2d } from "../../core/Vector";

/** A thing on the ground that humans can interact with */
export default class Interactable extends BaseEntity implements Entity {
  constructor(
    public position: V2d,
    private onInteract?: (human: Human, self: Interactable) => void
  ) {
    super();

    // TODO: Sprite?
  }

  getPosition() {
    return this.position;
  }

  interact(human: Human) {
    this.onInteract?.(human, this);
    this.destroy();
  }
}

export const isInteractable = (x: any): x is Interactable =>
  x instanceof Interactable;
