import { Matrix } from "pixi.js";
import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import { WallID } from "../level-generation/levelGeneration";
import ElementTransformer, {
  AngleTransformer,
  CellTransformer,
  WallTransformer,
} from "./ElementTransformer";
import RoomTemplate from "./RoomTemplate";

// List of all possible reflections/rotations
export const POSSIBLE_ORIENTATIONS: Matrix[] = [
  new Matrix(1, 0, 0, 1),
  new Matrix(1, 0, 0, -1),
  new Matrix(-1, 0, 0, 1),
  new Matrix(-1, 0, 0, -1),
  new Matrix(0, 1, 1, 0),
  new Matrix(0, 1, -1, 0),
  new Matrix(0, -1, 1, 0),
  new Matrix(0, -1, -1, 0),
];

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
