import { Matrix, Point } from "pixi.js";
import { V, V2d } from "../../../core/Vector";
import { WallID } from "./levelGeneration";

export default class RoomTemplate {
  dimensions: V2d;
  doors: WallID[];
  zombiePositions: V2d[];

  constructor(dimensions: V2d, doors: WallID[], zombiePositions: V2d[]) {
    this.dimensions = dimensions;
    this.doors = doors;
    this.zombiePositions = zombiePositions;
  }

  transform(orientation: Matrix): RoomTemplate {
    const transformedDimensions = this.pointToV2d(
      orientation.apply(this.dimensions)
    );
    const offset = V(
      transformedDimensions.x >= 0 ? 0 : -(transformedDimensions.x + 1),
      transformedDimensions.y >= 0 ? 0 : -(transformedDimensions.y + 1)
    );
    const newDimensions: V2d = V(
      Math.abs(transformedDimensions.x),
      Math.abs(transformedDimensions.y)
    );
    const transformCell = (originalCell: V2d) =>
      this.pointToV2d(orientation.apply(originalCell)).add(offset);
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

    const newTemplate: RoomTemplate = new RoomTemplate(
      newDimensions,
      this.doors.map(transformWall),
      this.zombiePositions.map(transformCell)
    );

    return newTemplate;
  }

  pointToV2d(p: Point): V2d {
    return V(p.x, p.y);
  }
}
