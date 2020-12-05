import { Matrix } from "pixi.js";
import { polarToVec } from "../../../../core/util/MathUtil";
import { V, V2d } from "../../../../core/Vector";
import { pointToV2d, WallID } from "../levelGeneration";

export type CellTransformer = (cell: V2d) => V2d;
export type AngleTransformer = (cell: number) => number;
export type WallTransformer = (cell: WallID) => WallID;

export default class ElementTransformer {
  transformation: Matrix;
  baseDimensions: V2d;
  constructor(transformation: Matrix, baseDimensions: V2d) {
    this.transformation = transformation;
    this.baseDimensions = baseDimensions;
  }

  transformDimension(): V2d {
    const transformedDimensions = pointToV2d(
      this.transformation.apply(this.baseDimensions)
    );
    return V(
      Math.abs(transformedDimensions.x),
      Math.abs(transformedDimensions.y)
    );
  }

  transformCell(originalCell: V2d): V2d {
    const transformedDimensions = pointToV2d(
      this.transformation.apply(this.baseDimensions)
    );
    const offset = V(
      transformedDimensions.x >= 0 ? 0 : -(transformedDimensions.x + 1),
      transformedDimensions.y >= 0 ? 0 : -(transformedDimensions.y + 1)
    );
    return pointToV2d(this.transformation.apply(originalCell)).add(offset);
  }

  transformWall(originalWall: WallID): WallID {
    const [originalCell, originalRight] = originalWall;
    const transformedCell = this.transformCell(originalCell);
    const originalWallDirection = originalRight ? V(1, 0) : V(0, 1);
    const newWallDirection = pointToV2d(
      this.transformation.apply(originalWallDirection)
    );

    if (newWallDirection.x === -1 || newWallDirection.y === -1) {
      return [transformedCell.add(newWallDirection), newWallDirection.x === -1];
    } else {
      return [transformedCell, newWallDirection.x === 1];
    }
  }

  transformAngle(originalAngle: number): number {
    const originalVector = polarToVec(originalAngle, 1);
    const transformedVector = pointToV2d(
      this.transformation.apply(originalVector)
    );
    return transformedVector.angle;
  }
}
