import { Box, Circle, Convex, Line, Shape } from "p2";
import { ShapeDef } from "../EntityDef";
import { V, V2d } from "../Vector";

/**
 * Creates a p2.js Line physics shape from two points.
 * Calculates position, angle, and length automatically.
 */
export function lineFromPoints(p1: V2d, p2: V2d): Line {
  const vector = p2.sub(p1);
  const midpoint = p1.add(p2).imul(0.5);

  return new Line({
    position: midpoint,
    angle: vector.angle,
    length: vector.magnitude,
  });
}

export function shapeFromDef(shapeDef: ShapeDef): Shape {
  const shape = baseShapeFromDef(shapeDef);
  shape.collisionGroup = shapeDef.collisionGroup;
  shape.collisionMask = shapeDef.collisionMask;
  return shape;
}

function baseShapeFromDef(shapeDef: ShapeDef): Shape {
  switch (shapeDef.type) {
    case "line": {
      return lineFromPoints(V(shapeDef.start), V(shapeDef.end));
    }
    case "circle": {
      return new Circle({
        radius: shapeDef.radius,
        position: V(shapeDef.center),
        angle: 0,
      });
    }
    case "box": {
      return new Box({
        width: shapeDef.size[0],
        height: shapeDef.size[1],
        position: V(shapeDef.center),
        angle: shapeDef.angle,
      });
    }
    case "convex": {
      return new Convex({ vertices: [...shapeDef.vertices] });
    }
  }
}
