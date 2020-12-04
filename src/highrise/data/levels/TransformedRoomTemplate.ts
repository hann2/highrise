import { Matrix } from "pixi.js";
import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import ElementTransformer, {
  AngleTransformer,
  CellTransformer,
  WallTransformer,
} from "./ElementTransformer";
import { WallID } from "./levelGeneration";
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

  generateWalls(transformWall: WallTransformer): WallID[] {
    const transformer = this.transformer;
    return this.base.generateWalls((w: WallID) =>
      transformWall(transformer.transformWall(w))
    );
  }

  generateEntities(
    transformCell: CellTransformer,
    transformAngle: AngleTransformer
  ): Entity[] {
    const transformer = this.transformer;
    return this.base.generateEntities(
      (p: V2d) => transformCell(transformer.transformCell(p)),
      (a: number) => transformAngle(transformer.transformAngle(a))
    );
  }
}
