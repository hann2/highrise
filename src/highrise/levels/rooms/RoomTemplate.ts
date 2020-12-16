import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import { DecorationInfo } from "../../environment/decorations/DecorationInfo";
import { WallID } from "../level-generation/levelGeneration";
import {
  AngleTransformer,
  CellTransformer,
  WallTransformer,
} from "./ElementTransformer";

export default class RoomTemplate {
  dimensions: V2d;
  doors: WallID[];
  floor?: DecorationInfo;

  constructor(dimensions: V2d, doors: WallID[], floor?: DecorationInfo) {
    this.dimensions = dimensions;
    this.doors = doors;
    this.floor = floor;
  }

  generateWalls(transformWall: WallTransformer): WallID[] {
    return [];
  }

  generateEntities(
    transformCell: CellTransformer,
    transformAngle: AngleTransformer
  ): Entity[] {
    return [];
  }
}
