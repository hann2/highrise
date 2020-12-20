import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import { DoorBuilder, WallBuilder } from "../level-generation/CellGrid";
import {
  AngleTransformer,
  DimensionsTransformer,
  PositionTransformer,
  VectorTransformer,
  WallTransformer,
} from "./ElementTransformer";

export default interface RoomTemplate {
  // In room coordinates
  getOccupiedCells(): V2d[];

  // In room coordinates
  generateWalls(): WallBuilder[];

  // In room coordinates
  generateDoors(): DoorBuilder[];

  // You do not need to create entities for doors and walls returned by generateWalls/generateDoors
  generateEntities(
    roomToWorldPosition: PositionTransformer,
    roomToWorldVector: VectorTransformer,
    roomToWorldAngle: AngleTransformer,
    roomToLevelWall: WallTransformer,
    roomToWorldDimensions: DimensionsTransformer
  ): Entity[];
}
