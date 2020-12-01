import Entity from "../../core/entity/Entity";
import Human from "./Human";

/**
 * Return true if the intereactable element is current interactable
 */
export default interface Interactable extends Entity {
  interact(player: Human): boolean;
}

export const isInteractable = (x: any): x is Interactable =>
  typeof x?.interact === "function";
