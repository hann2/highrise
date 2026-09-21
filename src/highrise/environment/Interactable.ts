import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import Human from "../human/Human";

/** A thing on the ground that humans can interact with */
export default class Interactable extends BaseEntity implements Entity {
  tags = ["interactable"];

  constructor(
    public position: V2d,
    private handleInteract?: (human: Human, self: Interactable) => void,
    public maxDistance: number = 3,
  ) {
    super();
  }

  getPosition() {
    return this.position;
  }

  interact(human: Human) {
    this.handleInteract?.(human, this);
  }
}

export const isInteractable = (x: Entity): x is Entity & Interactable =>
  x instanceof Interactable;
