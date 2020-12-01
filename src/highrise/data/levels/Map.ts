import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import Party from "../../entities/Party";

export default class Map extends BaseEntity implements Entity {
  constructor(spawnLocations: V2d[], levelEntities: Entity[], party: Party) {
    super();

    party.respawn(spawnLocations);

    this.addChildren(...levelEntities, party);
  }
}
