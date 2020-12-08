import { Body, Box, Convex, Line, Shape } from "p2";
import { PI_2 } from "pixi.js";
import { V, V2d } from "../../core/Vector";

// Returns the "corners" of a shape in world coordinates
export function getShapeCorners(shape: Shape, body: Body, center: V2d): V2d[] {
  switch (shape.type) {
    case Shape.BOX:
    case Shape.CONVEX: {
      const convex = shape as Box | Convex;
      const points = [];
      for (const vertex of convex.vertices) {
        const point = V(0, 0);
        body.toWorldFrame(point, vertex);
        points.push(point);
      }
      return points;
    }
    case Shape.CAPSULE:
      return []; // TODO this one seems a bit tricky, could probably approximate
    case Shape.CIRCLE:
      return []; // TODO: Just a few points on the edge? Really I suppose we want to draw the curve in the shadow, but that's a whole nother level of complexity
    case Shape.LINE:
      const line = shape as Line;
      const start = V(-line.length / PI_2, 0);
      const end = V(line.length / 2, 0);
      body.toWorldFrame(start, start);
      body.toWorldFrame(end, end);
      return [start, end];
    case Shape.HEIGHTFIELD:
      return []; // I don't think we really need these
    case Shape.PARTICLE:
      return []; // Particles don't cast shadows
    case Shape.PLANE:
      return []; // Let's just not use planes
    default:
      return []; // In case I missed one
  }
}
