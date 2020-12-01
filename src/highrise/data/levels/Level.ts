import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import Party from "../../entities/Party";

export default class Level extends BaseEntity implements Entity {
  constructor() {
    super();
  }

  beginLevel(party: Party) {
    throw Error("Implement this");
  }

  start(spawnLocations: V2d[], levelEntities: Entity[], party: Party) {
    party.respawn(spawnLocations);

    this.addChildren(...levelEntities);
  }
}
