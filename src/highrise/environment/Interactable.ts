import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import Human from "../human/Human";

/** Shown when an interactable is the nearest one (see `hud/InteractPrompt`) */
export interface InteractPromptContent {
  /** What it is, like a name: "AR-15", "Rifle ammo" */
  title: string;
  /** A short note after the title: "45", "replaces Glock" */
  detail?: string;
  /**
   * What interacting does, shown after the interact button: one capitalized
   * verb, like "Select" or "Read"
   */
  action?: string;
  /**
   * Shown instead of the interact button when interacting won't do anything
   * useful: "needs a keycard"
   */
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
  /**
   * Only says what it is (the exit stairs): the interact button never uses
   * it, and it only counts as the nearest when nothing usable is in range
   */
  passive = false;
  /** What to tell `human` when this is the nearest thing they can interact with */
  prompt?: (human: Human) => InteractPromptContent;
  /** How big a ring marks it while it's what the interact button would use */
  highlightRadius = 0.4;

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
