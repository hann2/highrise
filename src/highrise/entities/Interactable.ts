import Entity from "../../core/entity/Entity";

export default interface Interactable extends Entity {
  interact(): void;
}

export const isInteractable = (x: any): x is Interactable =>
  typeof x?.interact === "function";
