import { ImageName } from "../../resources/resources";
import { LayerName } from "../config/layers";

export interface SpriteDef {
  image: ImageName;
  anchor: [number, number];
  size: [number, number];
  layer: LayerName;
}

export interface LineDef {
  readonly type: "line";
  readonly start: [number, number];
  readonly end: [number, number];
}

export interface CircleDef {
  readonly type: "circle";
  readonly center: [number, number];
  readonly radius: number;
}

export interface BoxDef {
  readonly type: "box";
  readonly center: [number, number];
  readonly size: [number, number];
  readonly angle: number;
}

export interface ConvexDef {
  readonly type: "convex";
  readonly vertices: ReadonlyArray<[number, number]>;
}

interface ShapeDefBase {
  collisionGroup: number;
  collisionMask: number;
}

export type ShapeDef = ShapeDefBase &
  (LineDef | CircleDef | BoxDef | ConvexDef);

export interface BodyDef {
  readonly mass: number;
  readonly shapes: ReadonlyArray<ShapeDef>;
}

export interface EntityDef {
  readonly sprites: ReadonlyArray<SpriteDef>;
  readonly body?: BodyDef;
}
