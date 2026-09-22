import type { OutlineVertex, Point } from "./visibility";

export interface VisionMeshOptions {
  /** How far the darkness outside the outline extends from the eye, in meters */
  outerRadius: number;
  /** Width of the soft edge along walls and the range limit, in meters. Just enough to hide aliasing. */
  antialiasWidth: number;
  /** Radius of the eye, in meters. Shadow edges get a penumbra as wide as it would cast. */
  sourceRadius: number;
  /** Widest a penumbra may get, in meters */
  maxPenumbraWidth: number;
}

export interface VisionMeshData {
  /** Vertex positions relative to the eye */
  positions: Float32Array;
  /** Texture coordinates: v is 0 where the edge is clear and 1 where it is fully dark */
  uvs: Float32Array;
  indices: Uint32Array;
}

/** Vertices and indices per outline vertex; see buildVisionMesh */
const VERTICES_PER_POINT = 7;
const INDICES_PER_POINT = 21;

/**
 * Builds the mesh that darkens everything outside a visibility outline. Each
 * edge of the outline gets a soft skirt centered on it, fading from clear on
 * the inside to dark on the outside, and a solid band from the skirt out to
 * `outerRadius`. Beyond that a static shape with a round hole takes over.
 *
 * Along a wall the skirt is only as wide as it takes to hide aliasing. Along
 * a shadow edge, which runs straight away from the eye from an occluder's
 * corner, it widens with distance from the corner the way the penumbra of
 * an eye with `sourceRadius` would: the wider the eye and the nearer the
 * corner, the softer the shadow. Because it is geometry, it costs no blur
 * filter and needs no render texture.
 *
 * Skirts of neighbouring edges have different widths, so each edge gets its
 * own vertices and the corners between them are filled with small caps.
 */
export function buildVisionMesh(
  eye: Point,
  outline: readonly OutlineVertex[],
  {
    outerRadius,
    antialiasWidth,
    sourceRadius,
    maxPenumbraWidth,
  }: VisionMeshOptions,
): VisionMeshData {
  const n = outline.length;
  if (n < 3) {
    return {
      positions: new Float32Array(0),
      uvs: new Float32Array(0),
      indices: new Uint32Array(0),
    };
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

    // Half widths of the skirt at each end of this edge
    let halfA = antialiasWidth / 2;
    let halfB = antialiasWidth / 2;
    if (Math.abs(a.angle - b.angle) < 1e-9) {
      // A shadow edge. The penumbra starts at the nearer end, the corner
      const near = Math.min(a.distance, b.distance) || 1;
      const penumbra = Math.min(
        maxPenumbraWidth,
        antialiasWidth + (2 * sourceRadius * length) / near,
      );
      if (a.distance < b.distance) {
        halfB = penumbra / 2;
      } else {
        halfA = penumbra / 2;
      }
    }

    // Vertices of this edge: inner and outer skirt corners at each end, and
    // the two ends projected out to the outer radius, plus the point itself
    // for the corner caps
    const base = i * VERTICES_PER_POINT;
    const aIn = base;
    const aOut = base + 1;
    const bIn = base + 2;
    const bOut = base + 3;
    const aFar = base + 4;
    const bFar = base + 5;
    const aPoint = base + 6;
    setVertex(aIn, ax + nx * halfA, ay + ny * halfA, 0);
    setVertex(aOut, ax - nx * halfA, ay - ny * halfA, 1);
    setVertex(bIn, bx + nx * halfB, by + ny * halfB, 0);
    setVertex(bOut, bx - nx * halfB, by - ny * halfB, 1);
    const aScale = outerRadius / (a.distance || 1);
    const bScale = outerRadius / (b.distance || 1);
    setVertex(aFar, ax * aScale, ay * aScale, 1);
    setVertex(bFar, bx * bScale, by * bScale, 1);
    setVertex(aPoint, ax, ay, 0.5);

    // The caps at the start of this edge join it to the previous edge's end
    const previous = ((i + n - 1) % n) * VERTICES_PER_POINT;
    const previousIn = previous + 2;
    const previousOut = previous + 3;
    const previousFar = previous + 5;

    const t = i * INDICES_PER_POINT;
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
    // Caps: inner and outer halves of the skirt gap, then the solid gap
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
