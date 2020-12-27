import { Matrix } from "pixi.js";
import Entity from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import { DoorBuilder, WallBuilder, WallID } from "../level-generation/CellGrid";
import ElementTransformer, { RoomTransformer } from "./ElementTransformer";
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

// Orientations that are rotated but not reflected
export const ROTATED_ORIENTATIONS: Matrix[] = [
  new Matrix(1, 0, 0, 1),
  new Matrix(-1, 0, 0, -1),
  new Matrix(0, 1, -1, 0),
  new Matrix(0, -1, 1, 0),
];

// Orientations that are reflected and also possibly rotated
export const FLIPPED_ORIENTATIONS: Matrix[] = [
  new Matrix(-1, 0, 0, 1),
  new Matrix(0, -1, -1, 0),
  new Matrix(0, 1, 1, 0),
  new Matrix(1, 0, 0, -1),
];

export default class TransformedRoomTemplate implements RoomTemplate {
  base: RoomTemplate;
  transformer: ElementTransformer;
  constructor(base: RoomTemplate, transformation: Matrix) {
    const transformer = new ElementTransformer(transformation);

    this.base = base;
    this.transformer = transformer;
  }

  getOccupiedCells(): V2d[] {
    return this.base
      .getOccupiedCells()
      .map(this.transformer.transformPosition.bind(this.transformer));
  }

  generateWalls(): WallBuilder[] {
    const transformer = this.transformer;
    return this.base.generateWalls().map((w) => {
      return {
        ...w,
        id: transformer.transformWall(w.id),
      };
    });
  }

  generateDoors(): DoorBuilder[] {
    const transformer = this.transformer;
    return this.base.generateDoors().map((d) => {
      return {
        ...d,
        wallID: transformer.transformWall(d.wallID),
        hingePoint: transformer.transformPosition(d.hingePoint),
        restingDirection: transformer.transformVector(d.restingDirection),
      };
    });
  }

  generateEntities({
    roomToWorldPosition,
    roomToWorldVector,
    roomToWorldAngle,
    roomToLevelWall,
    roomToWorldDimensions,
  }: RoomTransformer): Entity[] {
    const transformer = this.transformer;
    return this.base.generateEntities({
      roomToWorldPosition: (p: V2d) =>
        roomToWorldPosition(transformer.transformPosition(p)),
      roomToWorldVector: (v: V2d) =>
        roomToWorldVector(transformer.transformVector(v)),
      roomToWorldAngle: (a: number) =>
        roomToWorldAngle(transformer.transformAngle(a)),
      roomToLevelWall: (w: WallID) =>
        roomToLevelWall(transformer.transformWall(w)),
      roomToWorldDimensions: (d: V2d) =>
        roomToWorldDimensions(transformer.transformDimensions(d)),
    });
  }
}
