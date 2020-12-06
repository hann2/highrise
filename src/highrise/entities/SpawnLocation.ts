import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";

export default class SpawnLocation extends BaseEntity implements Entity {
  position: V2d;

  constructor(position: V2d) {
    super();

    this.position = position;
  }
}
