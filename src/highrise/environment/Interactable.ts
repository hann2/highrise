import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import Human from "../human/Human";

/** A thing on the ground that humans can interact with */
export default class Interactable extends BaseEntity implements Entity {
  tags = ["interactable"];

  /**
   * Whether a human could do anything with this right now. Ones that can't
   * are skipped, so a full ammo box doesn't swallow the E meant for the
   * door beside it.
   */
  canInteract: (human: Human) => boolean = () => true;
  /** Whether a wall or door between the human and this blocks it */
  needsLineOfSight = true;

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
