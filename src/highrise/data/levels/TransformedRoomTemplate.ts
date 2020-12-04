import { Matrix } from "pixi.js";
import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import ElementTransformer, {
  AngleTransformer,
  CellTransformer,
} from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";

export default class TransformedRoomTemplate extends RoomTemplate {
  base: RoomTemplate;
  transformer: ElementTransformer;
  constructor(base: RoomTemplate, transformation: Matrix) {
    const transformer = new ElementTransformer(transformation, base.dimensions);
    super(
      transformer.transformDimension(),
      base.doors.map(transformer.transformWall.bind(transformer)),
      base.floor
    );

    this.base = base;
    this.transformer = transformer;
  }

  generateEntities(
    transformCell: CellTransformer,
    transformAngle: AngleTransformer
  ): Entity[] {
    const transformer = this.transformer;
    console.log(transformer);
    return this.base.generateEntities(
      (p: V2d) => transformCell(transformer.transformCell(p)),
      (a: number) => transformAngle(transformer.transformAngle(a))
    );
  }
}
