import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import Human from "../human/Human";

/** Shown when an interactable is the nearest one (see `lobby/LobbyPrompt`) */
export interface InteractPrompt {
  /** What it is, like a name */
  title: string;
  /** What interacting does, shown after the interact button: "to play as" */
  action?: string;
  /** Shown instead of an action when interacting won't do anything */
  hint?: string;
}

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
  /** What to tell the player when this is the nearest thing to interact with */
  prompt?: () => InteractPrompt;

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
