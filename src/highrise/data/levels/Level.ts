import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import Human from "../../entities/Human";

export default class Level extends BaseEntity implements Entity {
  index: number;

  constructor(index: number) {
    super();

    this.index = index;
  }

  placeEntities(party: readonly Human[]) {
    throw Error("Implement this");
  }

  placeParty(
    spawnLocations: V2d[],
    levelEntities: Entity[],
    party: readonly Human[]
  ) {
    party.forEach((c, idx) => (c as Human).setPosition(spawnLocations[idx]));
    this.addChildren(...levelEntities);
  }
}
