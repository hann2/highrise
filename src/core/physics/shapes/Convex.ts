import { CompatibleVector, V, V2d } from "../../Vector";
import { AABB } from "../collision/AABB";
import type { ShapeRaycastHit } from "../collision/raycast/RaycastHit";
import { ShapeOptions, Shape } from "./Shape";

/** Options for creating a Convex polygon. */
export interface ConvexOptions extends ShapeOptions {
  /** Polygon vertices in counter-clockwise order. */
  vertices?: CompatibleVector[];
  /** Face normals. Auto-computed from vertices if not provided. */
  axes?: CompatibleVector[];
}

/** A convex polygon collision shape. Vertices must be in counter-clockwise order. */
export class Convex extends Shape {
  /** Polygon vertices in local coordinates. */
  vertices: V2d[];
  /** Face normal vectors. */
  axes: V2d[];
  /** Computed center of mass. */
  centerOfMass: V2d;
  /** Triangulation for area/inertia calculation. */
  triangles: number[][];

  constructor(options: ConvexOptions = {}) {
    super(options);

    this.vertices = [];

    // Copy the verts
    const vertices = options.vertices ?? [];
    for (let i = 0; i < vertices.length; i++) {
      const v = V();
      v.set(vertices[i]);
      this.vertices.push(v);
    }

    this.axes = [];

    if (options.axes) {
      // Copy the axes
      for (let i = 0; i < options.axes.length; i++) {
        const axis = V();
        axis.set(options.axes[i]);
        this.axes.push(axis);
      }
    } else {
      // Construct axes from the vertex data
      for (let i = 0; i < this.vertices.length; i++) {
        const worldPoint0 = this.vertices[i];
        const worldPoint1 = this.vertices[(i + 1) % this.vertices.length];

        const normal = V();
        normal.set(worldPoint1).isub(worldPoint0);

        // Get normal - just rotate 90 degrees since vertices are given in CCW
        normal.irotate90cw();
        normal.inormalize();

        this.axes.push(normal);
      }
    }

    this.centerOfMass = V();
    this.triangles = [];

    if (this.vertices.length) {
      this.updateTriangles();
      this.updateCenterOfMass();
    }

    this.boundingRadius = 0;
    this.updateBoundingRadius();
    this.updateArea();

    if (this.area < 0) {
      throw new Error(
        "Convex vertices must be given in counter-clockwise winding.",
      );
    }
  }

  projectOntoLocalAxis(localAxis: V2d): V2d {
    let max: number | null = null;
    let min: number | null = null;
    const axis = V(localAxis);

    for (let i = 0; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      const value = v.dot(axis);
      if (max === null || value > max) {
        max = value;
      }
      if (min === null || value < min) {
        min = value;
      }
    }

    if (min! > max!) {
      const t = min;
      min = max;
      max = t;
    }

    return V(min!, max!);
  }

  projectOntoWorldAxis(
    localAxis: V2d,
    shapeOffset: V2d,
    shapeAngle: number,
  ): V2d {
    const result = this.projectOntoLocalAxis(localAxis);

    // Project the position of the body onto the axis
    const worldAxis =
      shapeAngle !== 0 ? V(localAxis).rotate(shapeAngle) : V(localAxis);
    const offset = shapeOffset.dot(worldAxis);

    return V(result[0] + offset, result[1] + offset);
  }

  updateTriangles(): void {
    this.triangles.length = 0;

    // Triangulate the polygon using ear clipping
    const triangleIndices = Convex.triangulate(this.vertices);

    // Convert flat array of indices to triangle arrays
    for (let i = 0; i < triangleIndices.length; i += 3) {
      const id1 = triangleIndices[i];
      const id2 = triangleIndices[i + 1];
      const id3 = triangleIndices[i + 2];
      this.triangles.push([id1, id2, id3]);
    }
  }

  updateCenterOfMass(): void {
    const triangles = this.triangles;
    const verts = this.vertices;
    const cm = this.centerOfMass;

    cm.set(0, 0);
    let totalArea = 0;

    for (let i = 0; i !== triangles.length; i++) {
      const t = triangles[i];
      const a = verts[t[0]];
      const b = verts[t[1]];
      const c = verts[t[2]];

      const centroid = V2d.centroid(a, b, c);

      const m = Convex.triangleArea(a, b, c);
      totalArea += m;

      const centroid_times_mass = V(centroid).mul(m);
      cm.iadd(centroid_times_mass);
    }

    cm.imul(1 / totalArea);
  }

  computeMomentOfInertia(mass: number): number {
    let denom = 0.0;
    let numer = 0.0;
    const N = this.vertices.length;

    for (let j = N - 1, i = 0; i < N; j = i, i++) {
      const p0 = this.vertices[j];
      const p1 = this.vertices[i];
      const a = Math.abs(p0.crossLength(p1));
      const b = p1.dot(p1) + p1.dot(p0) + p0.dot(p0);
      denom += a * b;
      numer += a;
    }

    return (mass / 6.0) * (denom / numer);
  }

  updateBoundingRadius(): void {
    const verts = this.vertices;
    let r2 = 0;

    for (let i = 0; i !== verts.length; i++) {
      const l2 = verts[i].squaredMagnitude;
      if (l2 > r2) {
        r2 = l2;
      }
    }

    this.boundingRadius = Math.sqrt(r2);
  }

  static triangleArea(a: V2d, b: V2d, c: V2d): number {
    return (
      ((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) * 0.5
    );
  }

  updateArea(): void {
    this.updateTriangles();
    this.area = 0;

    const triangles = this.triangles;
    const verts = this.vertices;

    for (let i = 0; i !== triangles.length; i++) {
      const t = triangles[i];
      const a = verts[t[0]];
      const b = verts[t[1]];
      const c = verts[t[2]];

      const m = Convex.triangleArea(a, b, c);
      this.area += m;
    }
  }

  computeAABB(position: V2d, angle: number): AABB {
    const out = new AABB();
    out.setFromPoints(this.vertices, position, angle, 0);
    return out;
  }

  raycast(
    from: V2d,
    to: V2d,
    position: V2d,
    angle: number,
    _skipBackfaces: boolean,
  ): ShapeRaycastHit | null {
    const vertices = this.vertices;

    // Transform ray to local shape space
    const rayStart = V(from).toLocalFrame(position, angle);
    const rayEnd = V(to).toLocalFrame(position, angle);

    const n = vertices.length;
    let closestFraction = Infinity;
    let closestHit: ShapeRaycastHit | null = null;
    const rayLength = from.distanceTo(to);

    for (let i = 0; i < n; i++) {
      const q1 = vertices[i];
      const q2 = vertices[(i + 1) % n];
      const fraction = V2d.lineSegmentsIntersectionFraction(
        rayStart,
        rayEnd,
        q1,
        q2,
      );

      if (fraction >= 0 && fraction < closestFraction) {
        closestFraction = fraction;
        // Compute normal perpendicular to edge, rotated to world space
        const normal = V(q2).sub(q1);
        normal.irotate(-Math.PI / 2 + angle);
        normal.inormalize();
        const point = V(from).ilerp(to, fraction);
        closestHit = {
          point,
          normal,
          distance: rayLength * fraction,
          fraction,
        };
      }
    }

    return closestHit;
  }

  /**
   * Triangulate a polygon using ear clipping algorithm.
   * @param vertices Array of polygon vertices in counter-clockwise order
   * @returns Array of triangle vertex indices [i0, i1, i2, i3, i4, i5, ...]
   */
  private static triangulate(vertices: V2d[]): number[] {
    const n = vertices.length;
    if (n < 3) return [];

    const triangles: number[] = [];
    const available: number[] = [];
    for (let i = 0; i < n; i++) available.push(i);

    let i = 0;
    let al = n;
    while (al > 3) {
      const i0 = available[(i + 0) % al];
      const i1 = available[(i + 1) % al];
      const i2 = available[(i + 2) % al];

      const a = vertices[i0];
      const b = vertices[i1];
      const c = vertices[i2];

      let earFound = false;
      if (Convex.isConvexAngle(a, b, c)) {
        earFound = true;
        // Check if any other vertex is inside this triangle
        for (let j = 0; j < al; j++) {
          const vi = available[j];
          if (vi === i0 || vi === i1 || vi === i2) continue;
          if (Convex.isPointInTriangle(vertices[vi], a, b, c)) {
            earFound = false;
            break;
          }
        }
      }

      if (earFound) {
        triangles.push(i0, i1, i2);
        available.splice((i + 1) % al, 1);
        al--;
        i = 0;
      } else if (i++ > 3 * al) {
        // No convex angles found - degenerate polygon
        break;
      }
    }

    // Add final triangle
    triangles.push(available[0], available[1], available[2]);
    return triangles;
  }

  /**
   * Check if point p is inside triangle abc.
   */
  private static isPointInTriangle(p: V2d, a: V2d, b: V2d, c: V2d): boolean {
    const v0x = c.x - a.x;
    const v0y = c.y - a.y;
    const v1x = b.x - a.x;
    const v1y = b.y - a.y;
    const v2x = p.x - a.x;
    const v2y = p.y - a.y;

    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;

    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return u >= 0 && v >= 0 && u + v < 1;
  }

  /**
   * Check if three points form a convex angle (for counter-clockwise winding).
   */
  private static isConvexAngle(a: V2d, b: V2d, c: V2d): boolean {
    return (a.y - b.y) * (c.x - b.x) + (b.x - a.x) * (c.y - b.y) >= 0;
  }
}
