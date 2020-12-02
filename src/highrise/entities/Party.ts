import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import Human from "./Human";

export default class Party extends BaseEntity implements Entity {
  // id = "party"; // So there's always at most one, and we can always find it easily

  constructor(entities: Entity[]) {
    super();

    console.log("making party");

    this.addChildren(...entities);
  }

  respawn(spawnLocations: V2d[]): void {
    this.children
      .filter((c) => c instanceof Human)
      .forEach((c, idx) => (c as Human).setPosition(spawnLocations[idx]));
  }
}
