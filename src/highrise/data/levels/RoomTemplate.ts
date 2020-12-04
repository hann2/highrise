import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import { DecorationSprite } from "../../view/DecorationSprite";
import {
  AngleTransformer,
  CellTransformer,
  WallTransformer,
} from "./ElementTransformer";
import { WallID } from "./levelGeneration";

export default class RoomTemplate {
  dimensions: V2d;
  doors: WallID[];
  floor?: DecorationSprite;

  constructor(dimensions: V2d, doors: WallID[], floor?: DecorationSprite) {
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
