import { Body, Box, Capsule, Circle, Convex, Line, Shape, vec2 } from "p2";
import { PI_2 } from "pixi.js";
import { polarToVec } from "../../core/util/MathUtil";
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
      const capsule = shape as Capsule;
      return []; // TODO: this one seems a bit tricky, could probably approximate
    case Shape.CIRCLE: {
      // TODO: We really wanna add the points that are tangent to the center I think
      const points = [];
      const n = 8;
      for (let i = 0; i < n; i++) {
        const circle = shape as Circle;
        points.push(
          polarToVec((i * 2 * Math.PI) / n, circle.radius).iadd(circle.position)
        );
      }
      return [];
    }
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
