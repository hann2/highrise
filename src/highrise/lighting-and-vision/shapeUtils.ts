import type { Body } from "../../core/physics/body/Body";
import { Capsule } from "../../core/physics/shapes/Capsule";
import { Convex } from "../../core/physics/shapes/Convex";
import { Line } from "../../core/physics/shapes/Line";
import { Shape } from "../../core/physics/shapes/Shape";
import { V, V2d } from "../../core/Vector";

/**
 * Returns the "corners" of a shape in world coordinates, for casting shadows.
 * Shapes without corners (circles, particles, planes) don't cast shadows.
 */
export function getShapeCorners(shape: Shape, body: Body): V2d[] {
  if (shape instanceof Convex) {
    // This includes boxes
    return shape.vertices.map((vertex) =>
      shapePointToWorld(vertex, shape, body),
    );
  } else if (shape instanceof Capsule) {
    const { length, radius } = shape;
    return [
      V(length / 2, -radius),
      V(length / 2, radius),
      V(-length / 2, radius),
      V(-length / 2, -radius),
    ].map((point) => shapePointToWorld(point, shape, body));
  } else if (shape instanceof Line) {
    return [V(-shape.length / 2, 0), V(shape.length / 2, 0)].map((point) =>
      shapePointToWorld(point, shape, body),
    );
  }
  return [];
}

function shapePointToWorld(point: V2d, shape: Shape, body: Body): V2d {
  return body.toWorldFrame(point.toGlobalFrame(shape.position, shape.angle));
}
