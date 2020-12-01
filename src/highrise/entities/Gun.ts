import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";

export default interface Gun extends Entity {
  firing: boolean;
  direction?: V2d;
}
