import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";

export interface Level {
  readonly entities: readonly Entity[];
  readonly spawnLocations: readonly V2d[];
}
