import { Body, Box, Capsule, Circle, Convex, Line, Shape, vec2 } from "p2";
import { PI_2 } from "pixi.js";
import { polarToVec } from "../../core/util/MathUtil";

// Returns the "corners" of a shape in world coordinates
export function getShapeCorners(
  shape: Shape,
  body: Body,
  center: [number, number]
): [number, number][] {
  switch (shape.type) {
    case Shape.BOX:
    case Shape.CONVEX: {
      const convex = shape as Box | Convex;
      const points = [];
      for (const vertex of convex.vertices) {
        const out: [number, number] = [0, 0];
        shapePointToWorld(out, vertex, shape, body);
        points.push(out);
      }
      return points;
    }
    case Shape.CAPSULE: {
      const capsule = shape as Capsule;
      const { length, radius } = capsule;
      const points: [number, number][] = [
        [length / 2, -radius],
        [length / 2, radius],
        [-length / 2, radius],
        [-length / 2, -radius],
      ];
      for (const point of points) {
        shapePointToWorld(point, point, shape, body);
      }
      return points;
    }
    case Shape.CIRCLE: {
      const points = [];
      const n = 8;
      for (let i = 0; i < n; i++) {
        const circle = shape as Circle;
        points.push(
          polarToVec((i * 2 * Math.PI) / n, circle.radius).iadd(circle.position)
        );
      }
      for (const point of points) {
        shapePointToWorld(point, point, shape, body);
      }
      return [];
    }
    case Shape.LINE:
      const line = shape as Line;
      const start: [number, number] = [-line.length / PI_2, 0];
      const end: [number, number] = [line.length / 2, 0];
      shapePointToWorld(start, start, shape, body);
      shapePointToWorld(end, end, shape, body);
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

function shapePointToWorld(
  out: [number, number],
  point: [number, number],
  shape: Shape,
  body: Body
): void {
  shape;
  vec2.toGlobalFrame(out, point, shape.position, shape.angle);
  body.toWorldFrame(out, out);
}
