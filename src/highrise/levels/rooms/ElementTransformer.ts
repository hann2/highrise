import { Matrix, Point } from "pixi.js";
import { polarToVec } from "../../../core/util/MathUtil";
import { V, V2d } from "../../../core/Vector";
import { WallID } from "../level-generation/CellGrid";

export type PositionTransformer = (position: V2d) => V2d;
export type VectorTransformer = (vector: V2d) => V2d;
export type DimensionsTransformer = (dimensions: V2d) => V2d;
export type AngleTransformer = (angle: number) => number;
export type WallTransformer = (wall: WallID) => WallID;

function pointToV2d(p: Point): V2d {
  return V(p.x, p.y);
}

export default class ElementTransformer {
  transformation: Matrix;
  constructor(transformation: Matrix) {
    this.transformation = transformation;
  }

  transformDimensions(dimensions: V2d): V2d {
    const transformedDimensions = this.transformVector(dimensions);
    return V(
      Math.abs(transformedDimensions.x),
      Math.abs(transformedDimensions.y)
    );
  }

  transformPosition(originalPosition: V2d): V2d {
    return this.transformVector(originalPosition);
  }

  transformWall(originalWall: WallID): WallID {
    const [originalCell, originalRight] = originalWall;
    const transformedCell = this.transformPosition(originalCell);
    const originalWallDirection = originalRight ? V(1, 0) : V(0, 1);
    const newWallDirection = this.transformVector(originalWallDirection);

    if (newWallDirection.x === -1 || newWallDirection.y === -1) {
      return [transformedCell.add(newWallDirection), newWallDirection.x === -1];
    } else {
      return [transformedCell, newWallDirection.x === 1];
    }
  }

  transformVector(originalVector: V2d): V2d {
    return pointToV2d(this.transformation.apply(originalVector));
  }

  transformAngle(originalAngle: number): number {
    const originalVector = polarToVec(originalAngle, 1);
    return this.transformVector(originalVector).angle;
  }
}
