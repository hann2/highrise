import { Matrix, Point } from "pixi.js";
import Entity from "../../../core/entity/Entity";
import { polarToVec } from "../../../core/util/MathUtil";
import { V, V2d } from "../../../core/Vector";
import { DecorationSprite } from "../../view/DecorationSprite";
import { WallID } from "./levelGeneration";

type CellTransformer = (cell: V2d) => V2d;
type AngleTransformer = (cell: number) => number;
export type EntityGenerator = (
  transformCell: CellTransformer,
  transformAngle: AngleTransformer
) => Entity[];

export default class RoomTemplate {
  dimensions: V2d;
  doors: WallID[];
  entityGenerator: EntityGenerator;
  floor?: DecorationSprite;

  constructor(
    dimensions: V2d,
    doors: WallID[],
    entityGenerator: EntityGenerator,
    floor?: DecorationSprite
  ) {
    this.dimensions = dimensions;
    this.doors = doors;
    this.entityGenerator = entityGenerator;
    this.floor = floor;
  }

  transform(orientation: Matrix): RoomTemplate {
    const transformDimension = (dimensions: V2d) => {
      const transformedDimensions = this.pointToV2d(
        orientation.apply(dimensions)
      );
      return V(
        Math.abs(transformedDimensions.x),
        Math.abs(transformedDimensions.y)
      );
    };
    const transformCell = (originalCell: V2d) => {
      const transformedDimensions = this.pointToV2d(
        orientation.apply(this.dimensions)
      );
      const offset = V(
        transformedDimensions.x >= 0 ? 0 : -(transformedDimensions.x + 1),
        transformedDimensions.y >= 0 ? 0 : -(transformedDimensions.y + 1)
      );
      return this.pointToV2d(orientation.apply(originalCell)).add(offset);
    };
    const transformWall = (originalWall: WallID): WallID => {
      const [originalCell, originalRight] = originalWall;
      const transformedCell = transformCell(originalCell);
      const originalWallDirection = originalRight ? V(1, 0) : V(0, 1);
      const newWallDirection = this.pointToV2d(
        orientation.apply(originalWallDirection)
      );

      if (newWallDirection.x === -1 || newWallDirection.y === -1) {
        return [
          transformedCell.add(newWallDirection),
          newWallDirection.x === -1,
        ];
      } else {
        return [transformedCell, newWallDirection.x === 1];
      }
    };
    const transformAngle = (originalAngle: number): number => {
      const originalVector = polarToVec(originalAngle, 1);
      const transformedVector = this.pointToV2d(
        orientation.apply(originalVector)
      );
      return transformedVector.angle;
    };

    const transformedGenerator: EntityGenerator = (
      transformCell2: CellTransformer,
      transformAngle2: AngleTransformer
    ) =>
      this.entityGenerator(
        (p: V2d) => transformCell2(transformCell(p)),
        (a: number) => transformAngle2(transformAngle(a))
      );
    const newTemplate: RoomTemplate = new RoomTemplate(
      transformDimension(this.dimensions),
      this.doors.map(transformWall),
      transformedGenerator,
      this.floor
    );

    return newTemplate;
  }

  pointToV2d(p: Point): V2d {
    return V(p.x, p.y);
  }
}
