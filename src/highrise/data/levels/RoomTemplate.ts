import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import { DecorationSprite } from "../../view/DecorationSprite";
import { AngleTransformer, CellTransformer } from "./ElementTransformer";
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

  generateEntities(
    transformCell: CellTransformer,
    transformAngle: AngleTransformer
  ): Entity[] {
    return [];
  }
}
