import { Box } from "../shapes/Box";
import { Circle } from "../shapes/Circle";
import { Convex } from "../shapes/Convex";
import { Line } from "../shapes/Line";
import { Shape } from "../shapes/Shape";
import { ShapeDef } from "../../EntityDef";
import { V, V2d } from "../../Vector";

/**
 * Creates a p2.js Line physics shape from two points.
 * Calculates position, angle, and length automatically.
 */
export function lineFromPoints(p1: V2d, p2: V2d): Line {
  const vector = p2.sub(p1);
  const midpoint = p1.lerp(p2, 0.5);

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
    case "circle":
      return new Circle({
        radius: shapeDef.radius,
        position: V(shapeDef.center),
        angle: 0,
      });
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

/**
 * Calculate polygon area.
 * Uses shoelace formula
 */
export function polygonArea(vertices: V2d[]): number {
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area) / 2;
}
