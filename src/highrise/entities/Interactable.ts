import Entity from "../../core/entity/Entity";
import Human from "./human/Human";
import BaseEntity from "../../core/entity/BaseEntity";
import { V2d } from "../../core/Vector";

/** A thing on the ground that humans can interact with */
export default class Interactable extends BaseEntity implements Entity {
  tags = ["interactable"];

  constructor(
    public position: V2d,
    private onInteract?: (human: Human, self: Interactable) => void,
    public maxDistance: number = 3
  ) {
    super();
  }

  getPosition() {
    return this.position;
  }

  interact(human: Human) {
    this.onInteract?.(human, this);
  }
}

export const isInteractable = (x: Entity): x is Entity & Interactable =>
  x instanceof Interactable;
