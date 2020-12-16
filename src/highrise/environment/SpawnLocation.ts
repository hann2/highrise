import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";

export default class SpawnLocation extends BaseEntity implements Entity {
  tags = ["spawn_location"];

  constructor(public position: V2d) {
    super();
  }
}
