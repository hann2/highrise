import type { Outline, Point, Silhouette } from "./visibility";

export interface VisionMeshOptions {
  /** How far the darkness outside the outline extends from the eye, in meters */
  outerRadius: number;
  /** Width of the soft edge along surfaces, in meters. Just enough to hide aliasing. */
  antialiasWidth: number;
}

export interface MeshData {
  /** Vertex positions relative to the eye */
  positions: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

/** Vertices and indices per outline vertex; see buildVisionMesh */
const VERTICES_PER_POINT = 7;
const INDICES_PER_POINT = 21;

/**
 * Builds the mesh that darkens everything outside a visibility outline.
 * Each surface edge of the outline gets a thin antialiasing skirt centered
 * on it, fading from clear inside to dark outside (texture v from 0 to 1),
 * and a solid band from the skirt out to `outerRadius`. Beyond that a
 * static shape with a round hole takes over.
 *
 * The bands extend along each vertex's `farDirection`: away from the eye
 * for a normal vertex, along the umbra edge at the ends of a shadow edge.
 * The shadow edge itself gets no skirt and no band, so the wedge between
 * the umbra and lit edges is left to the penumbra mesh, and behind the
 * umbra edge the bands of the two surfaces meet along the same line.
 *
 * Neighbouring skirts don't share vertices, so the corners between them
 * are filled with small caps.
 */
export function buildVisionMesh(
  eye: Point,
  { vertices: outline }: Outline,
  { outerRadius, antialiasWidth }: VisionMeshOptions,
): MeshData {
  const n = outline.length;
  if (n < 3) {
    return empty();
  }
  const positions = new Float32Array(n * VERTICES_PER_POINT * 2);
  const uvs = new Float32Array(n * VERTICES_PER_POINT * 2);
  const indices = new Uint32Array(n * INDICES_PER_POINT);
  const [ex, ey] = eye;

  const setVertex = (index: number, x: number, y: number, v: number) => {
    positions[index * 2] = x;
    positions[index * 2 + 1] = y;
    uvs[index * 2] = 0.5;
    uvs[index * 2 + 1] = v;
  };

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = outline[i];
    const b = outline[j];
    const ax = a.point[0] - ex;
    const ay = a.point[1] - ey;
    const bx = b.point[0] - ex;
    const by = b.point[1] - ey;
    const dx = bx - ax;
    const dy = by - ay;
    const length = Math.hypot(dx, dy) || 1;
    // Inward normal: the outline is sorted by angle around the eye, so its
    // interior is always to the left of each edge
    const nx = -dy / length;
    const ny = dx / length;
    const half = a.shadowEdgeNext ? 0 : antialiasWidth / 2;

    // Vertices of this edge: inner and outer skirt corners at each end, the
    // two ends carried out to the outer radius, and the point itself for
    // the corner caps
    const base = i * VERTICES_PER_POINT;
    const aIn = base;
    const aOut = base + 1;
    const bIn = base + 2;
    const bOut = base + 3;
    const aFar = base + 4;
    const bFar = base + 5;
    const aPoint = base + 6;
    setVertex(aIn, ax + nx * half, ay + ny * half, 0);
    setVertex(aOut, ax - nx * half, ay - ny * half, 1);
    setVertex(bIn, bx + nx * half, by + ny * half, 0);
    setVertex(bOut, bx - nx * half, by - ny * half, 1);
    const [afx, afy] = farPoint(ax, ay, a.farDirection, outerRadius);
    const [bfx, bfy] = farPoint(bx, by, b.farDirection, outerRadius);
    setVertex(aFar, afx, afy, 1);
    setVertex(bFar, bfx, bfy, 1);
    setVertex(aPoint, ax, ay, 0.5);

    // The caps at the start of this edge join it to the previous edge's end
    const previous = ((i + n - 1) % n) * VERTICES_PER_POINT;
    const previousIn = previous + 2;
    const previousOut = previous + 3;
    const previousFar = previous + 5;

    const t = i * INDICES_PER_POINT;
    if (!a.shadowEdgeNext) {
      // Skirt
      indices[t] = aIn;
      indices[t + 1] = bIn;
      indices[t + 2] = bOut;
      indices[t + 3] = aIn;
      indices[t + 4] = bOut;
      indices[t + 5] = aOut;
      // Solid band
      indices[t + 6] = aOut;
      indices[t + 7] = bOut;
      indices[t + 8] = bFar;
      indices[t + 9] = aOut;
      indices[t + 10] = bFar;
      indices[t + 11] = aFar;
    }
    // Caps: inner and outer halves of the skirt gap, then the solid gap.
    // (Unused index slots stay 0, a degenerate triangle on vertex 0.)
    indices[t + 12] = aPoint;
    indices[t + 13] = previousIn;
    indices[t + 14] = aIn;
    indices[t + 15] = aPoint;
    indices[t + 16] = previousOut;
    indices[t + 17] = aOut;
    indices[t + 18] = previousOut;
    indices[t + 19] = aOut;
    indices[t + 20] = previousFar;
  }

  return { positions, uvs, indices };
}

/** Where a ray from (x, y) in `direction` crosses the circle of `radius` around the origin */
function farPoint(
  x: number,
  y: number,
  [dx, dy]: Point,
  radius: number,
): Point {
  const along = x * dx + y * dy;
  const t =
    -along +
    Math.sqrt(Math.max(0, along * along - (x * x + y * y) + radius * radius));
  return [x + dx * t, y + dy * t];
}

/**
 * Builds the penumbra wedges, one triangle per silhouette corner from the
 * corner out along its umbra and lit edges, for the angular gradient
 * texture of `getPenumbraTexture`: (0, 0) at the corner, (1, 0) at the far
 * end of the umbra edge, (1, 1) at the far end of the lit edge.
 */
export function buildPenumbraMesh(
  eye: Point,
  silhouettes: readonly Silhouette[],
  length: number,
): MeshData {
  const n = silhouettes.length;
  if (n === 0) {
    return empty();
  }
  const positions = new Float32Array(n * 6);
  const uvs = new Float32Array(n * 6);
  const indices = new Uint32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const { corner, umbraDirection, litDirection } = silhouettes[i];
    const cx = corner[0] - eye[0];
    const cy = corner[1] - eye[1];
    const p = i * 6;
    positions[p] = cx;
    positions[p + 1] = cy;
    positions[p + 2] = cx + umbraDirection[0] * length;
    positions[p + 3] = cy + umbraDirection[1] * length;
    positions[p + 4] = cx + litDirection[0] * length;
    positions[p + 5] = cy + litDirection[1] * length;
    uvs[p] = 0;
    uvs[p + 1] = 0;
    uvs[p + 2] = 1;
    uvs[p + 3] = 0;
    uvs[p + 4] = 1;
    uvs[p + 5] = 1;
    indices[i * 3] = i * 3;
    indices[i * 3 + 1] = i * 3 + 1;
    indices[i * 3 + 2] = i * 3 + 2;
  }
  return { positions, uvs, indices };
}

function empty(): MeshData {
  return {
    positions: new Float32Array(0),
    uvs: new Float32Array(0),
    indices: new Uint32Array(0),
  };
}
