import Entity from "../../core/entity/Entity";

export interface Level {
  readonly entities: readonly Entity[];
  /** Size of the level in meters. It spans from (0, 0) to (width, height). */
  readonly width: number;
  readonly height: number;
}
