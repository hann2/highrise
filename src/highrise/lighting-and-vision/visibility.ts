/**
 * Visibility from a point, computed additively: rays are cast from the eye
 * and what they hit is recorded, instead of shadows being subtracted from a
 * lit disc. Pure geometry, no Pixi or physics, so it runs in node tests.
 *
 * The result is a list of samples sorted by angle. Each sample is a ray with
 * the surfaces it crosses, nearest first, and how much light gets past each
 * one. With only opaque occluders every sample has exactly one crossing and
 * the crossings' points form the visibility polygon. Translucent occluders
 * (tinted glass, fences) add crossings, so the region between the first and
 * second crossing is seen dimly, and so on.
 *
 * One ray is cast per occluder corner, plus evenly spaced rays so the range
 * limit stays round. At a silhouette corner, where the occluder continues on
 * one angular side of the ray only, the visible distance jumps: on one side
 * the ray stops at the corner, on the other it carries on to whatever is
 * behind. Both are recorded, as a sample just before the corner's angle and
 * one just after, so no rays need to be nudged by an epsilon to find the far
 * point; it lies on the same ray.
 *
 * https://www.redblobgames.com/articles/visibility/
 */

export type Point = [number, number];

export interface Occluder {
  /** Corners of a convex polygon in world coordinates, in either winding */
  corners: readonly Point[];
  /** Fraction of light that passes through: 0 blocks completely, 1 is invisible */
  transmission: number;
}

export interface Crossing {
  /** Distance from the eye along the ray */
  distance: number;
  /** Fraction of light that remains beyond this crossing */
  transmission: number;
}

export interface VisibilitySample {
  /** Direction of the ray, in [0, 2π) */
  angle: number;
  /** Unit direction of the ray */
  dx: number;
  dy: number;
  /**
   * Surfaces crossed, nearest first. Never empty, and the last one always
   * has transmission 0: an opaque surface or the range limit.
   */
  crossings: Crossing[];
}

export interface VisibilityOptions {
  /** Angle between the evenly spaced rays that round off the range limit, in radians */
  arcStep?: number;
}

interface Corner {
  x: number;
  y: number;
  angle: number;
  distance: number;
  /** The edges facing the eye that meet at this corner */
  edges: Edge[];
}

interface Edge {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  transmission: number;
  a: Corner;
  b: Corner;
}

interface Hit {
  distance: number;
  transmission: number;
}

const TWO_PI = Math.PI * 2;
const DEFAULT_ARC_STEP = (5 * Math.PI) / 180;
/** Number of angular buckets edges are sorted into, so each ray tests only nearby edges */
const BIN_COUNT = 64;
const BIN_SIZE = TWO_PI / BIN_COUNT;
const EPSILON = 1e-9;

/** Wraps an angle into [0, 2π) */
function normalizeAngle(angle: number): number {
  angle %= TWO_PI;
  return angle < 0 ? angle + TWO_PI : angle;
}

/** Everything that can be seen from `eye` out to `radius`, as angle-sorted samples */
export function computeVisibility(
  eye: Point,
  radius: number,
  occluders: readonly Occluder[],
  { arcStep = DEFAULT_ARC_STEP }: VisibilityOptions = {},
): VisibilitySample[] {
  const [ex, ey] = eye;
  const { edges, corners } = collectEdges(eye, radius, occluders);
  const bins = binEdges(eye, edges);

  // Samples that share an angle keep their order: a sample from just before a
  // corner (side -1) sorts before the sample from just after it (side 1).
  const samples: { sample: VisibilitySample; side: number }[] = [];
  const hits: Hit[] = [];

  const castRay = (angle: number, corner: Corner | undefined) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    hits.length = 0;
    for (const edge of bins[Math.floor(angle / BIN_SIZE) % BIN_COUNT]) {
      if (corner && (edge.a === corner || edge.b === corner)) {
        continue; // handled below, by which side of the ray it is on
      }
      const rx = edge.ax - ex;
      const ry = edge.ay - ey;
      const sx = edge.bx - edge.ax;
      const sy = edge.by - edge.ay;
      const denominator = dx * sy - dy * sx;
      if (Math.abs(denominator) < EPSILON) {
        continue; // parallel to the ray
      }
      const t = (rx * sy - ry * sx) / denominator;
      const s = (rx * dy - ry * dx) / denominator;
      if (t <= EPSILON || t > radius || s < -EPSILON || s > 1 + EPSILON) {
        continue;
      }
      hits.push({ distance: t, transmission: edge.transmission });
    }

    if (!corner) {
      samples.push({
        sample: makeSample(angle, dx, dy, hits, radius),
        side: 0,
      });
      return;
    }

    // The corner's own edges only block the side of the ray they lie on
    let lower: number | undefined;
    let upper: number | undefined;
    for (const edge of corner.edges) {
      const other = edge.a === corner ? edge.b : edge.a;
      const side = dx * (other.y - corner.y) - dy * (other.x - corner.x);
      if (side > EPSILON) {
        upper = Math.min(upper ?? 1, edge.transmission);
      } else if (side < -EPSILON) {
        lower = Math.min(lower ?? 1, edge.transmission);
      }
    }
    const cornerHit = (transmission: number): Hit => ({
      distance: corner.distance,
      transmission,
    });
    if (lower !== undefined && upper !== undefined) {
      hits.push(cornerHit(Math.min(lower, upper)));
      samples.push({
        sample: makeSample(angle, dx, dy, hits, radius),
        side: 0,
      });
    } else if (lower !== undefined || upper !== undefined) {
      // A silhouette corner: the visible distance jumps here
      const open = makeSample(angle, dx, dy, hits, radius);
      hits.push(cornerHit(lower ?? upper!));
      const blocked = makeSample(angle, dx, dy, hits, radius);
      const [before, after] =
        lower !== undefined ? [blocked, open] : [open, blocked];
      if (sameCrossings(before, after)) {
        samples.push({ sample: before, side: 0 }); // something nearer hides the corner
      } else {
        samples.push({ sample: before, side: -1 }, { sample: after, side: 1 });
      }
    } else {
      samples.push({
        sample: makeSample(angle, dx, dy, hits, radius),
        side: 0,
      });
    }
  };

  for (const corner of corners) {
    if (corner.distance <= radius) {
      castRay(corner.angle, corner);
    }
  }
  const arcRays = Math.max(3, Math.round(TWO_PI / arcStep));
  for (let i = 0; i < arcRays; i++) {
    castRay((i * TWO_PI) / arcRays, undefined);
  }

  samples.sort((p, q) => p.sample.angle - q.sample.angle || p.side - q.side);
  return samples.map(({ sample }) => sample);
}

/** Turns the hits along a ray into crossings, stopping once no light is left */
function makeSample(
  angle: number,
  dx: number,
  dy: number,
  hits: Hit[],
  radius: number,
): VisibilitySample {
  hits.sort((p, q) => p.distance - q.distance);
  const crossings: Crossing[] = [];
  let transmission = 1;
  for (const hit of hits) {
    transmission *= hit.transmission;
    crossings.push({ distance: hit.distance, transmission });
    if (transmission <= 0) {
      break;
    }
  }
  if (transmission > 0) {
    crossings.push({ distance: radius, transmission: 0 });
  }
  return { angle, dx, dy, crossings };
}

function sameCrossings(p: VisibilitySample, q: VisibilitySample): boolean {
  if (p.crossings.length !== q.crossings.length) {
    return false;
  }
  return p.crossings.every(
    (crossing, i) =>
      crossing.distance === q.crossings[i].distance &&
      crossing.transmission === q.crossings[i].transmission,
  );
}

/** The edges of the occluders that face the eye and reach into range, and their corners */
function collectEdges(
  eye: Point,
  radius: number,
  occluders: readonly Occluder[],
): { edges: Edge[]; corners: Corner[] } {
  const [ex, ey] = eye;
  const edges: Edge[] = [];
  const corners: Corner[] = [];

  for (const { corners: points, transmission } of occluders) {
    const n = points.length;
    if (n < 2 || transmission >= 1) {
      continue;
    }
    // Which way the polygon winds decides which side of each edge is outside
    let area = 0;
    for (let i = 0; i < n; i++) {
      const [ax, ay] = points[i];
      const [bx, by] = points[(i + 1) % n];
      area += ax * by - bx * ay;
    }
    const winding = area >= 0 ? 1 : -1;

    const cornerObjects: (Corner | undefined)[] = new Array(n);
    const getCorner = (i: number): Corner => {
      let corner = cornerObjects[i];
      if (!corner) {
        const [x, y] = points[i];
        corner = {
          x,
          y,
          angle: normalizeAngle(Math.atan2(y - ey, x - ex)),
          distance: Math.hypot(x - ex, y - ey),
          edges: [],
        };
        cornerObjects[i] = corner;
        corners.push(corner);
      }
      return corner;
    };

    for (let i = 0; i < n; i++) {
      const [ax, ay] = points[i];
      const [bx, by] = points[(i + 1) % n];
      const normalX = (by - ay) * winding;
      const normalY = -(bx - ax) * winding;
      const facing = (ex - ax) * normalX + (ey - ay) * normalY > EPSILON;
      if (!facing || segmentDistance(ex, ey, ax, ay, bx, by) > radius) {
        continue;
      }
      const a = getCorner(i);
      const b = getCorner((i + 1) % n);
      const edge: Edge = { ax, ay, bx, by, transmission, a, b };
      edges.push(edge);
      a.edges.push(edge);
      b.edges.push(edge);
    }
  }

  return { edges, corners };
}

/** Distance from a point to a segment */
function segmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const sx = bx - ax;
  const sy = by - ay;
  const lengthSquared = sx * sx + sy * sy;
  let t = 0;
  if (lengthSquared > 0) {
    t = ((px - ax) * sx + (py - ay) * sy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
  }
  return Math.hypot(px - (ax + sx * t), py - (ay + sy * t));
}

/** Sorts the edges into angular buckets by the range of angles they cover */
function binEdges(eye: Point, edges: Edge[]): Edge[][] {
  const [ex, ey] = eye;
  const bins: Edge[][] = [];
  for (let i = 0; i < BIN_COUNT; i++) {
    bins.push([]);
  }
  for (const edge of edges) {
    const angleA = normalizeAngle(Math.atan2(edge.ay - ey, edge.ax - ex));
    const angleB = normalizeAngle(Math.atan2(edge.by - ey, edge.bx - ex));
    let delta = angleB - angleA;
    if (delta > Math.PI) {
      delta -= TWO_PI;
    } else if (delta < -Math.PI) {
      delta += TWO_PI;
    }
    const start = delta >= 0 ? angleA : angleB;
    const span = Math.abs(delta);
    if (span > Math.PI - 1e-6) {
      // The eye is on the edge itself; every direction may hit it
      for (const bin of bins) {
        bin.push(edge);
      }
      continue;
    }
    const firstBin = Math.floor(start / BIN_SIZE);
    const lastBin = Math.floor((start + span) / BIN_SIZE);
    for (let bin = firstBin; bin <= lastBin; bin++) {
      bins[bin % BIN_COUNT].push(edge);
    }
  }
  return bins;
}

export interface OutlineVertex {
  point: Point;
  /** Direction from the eye, in [0, 2π) */
  angle: number;
  /** Distance from the eye */
  distance: number;
}

/**
 * The boundary of what is fully visible, as a polygon sorted by angle around
 * the eye. Consecutive duplicate points are removed. Two consecutive
 * vertices at the same angle are the ends of a shadow edge, which runs
 * straight away from the eye.
 */
export function visibilityOutline(
  eye: Point,
  samples: readonly VisibilitySample[],
): OutlineVertex[] {
  const [ex, ey] = eye;
  const outline: OutlineVertex[] = [];
  for (const { angle, dx, dy, crossings } of samples) {
    const { distance } = crossings[0];
    const point: Point = [ex + dx * distance, ey + dy * distance];
    const last = outline[outline.length - 1];
    if (!last || !closeEnough(last.point, point)) {
      outline.push({ point, angle, distance });
    }
  }
  if (
    outline.length > 1 &&
    closeEnough(outline[0].point, outline[outline.length - 1].point)
  ) {
    outline.pop();
  }
  return outline;
}

function closeEnough(p: Point, q: Point): boolean {
  return Math.abs(p[0] - q[0]) < 1e-6 && Math.abs(p[1] - q[1]) < 1e-6;
}

/**
 * How much of the light from the eye reaches `point`: 1 in the open, 0
 * behind an opaque occluder or out of range, in between behind glass.
 */
export function visibilityAt(
  eye: Point,
  samples: readonly VisibilitySample[],
  point: Point,
): number {
  if (samples.length < 2) {
    return 0;
  }
  const [ex, ey] = eye;
  const px = point[0] - ex;
  const py = point[1] - ey;
  const distance = Math.hypot(px, py);
  if (distance < EPSILON) {
    return 1;
  }
  const angle = normalizeAngle(Math.atan2(py, px));

  // The samples on either side of the point's angle, wrapping around
  let low = 0;
  let high = samples.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (samples[mid].angle <= angle) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  const after = samples[low % samples.length];
  const before = samples[(low + samples.length - 1) % samples.length];

  // Walk the crossings of both samples in step. Between two samples the
  // boundary of each layer is the segment joining their crossing points, so
  // the point is past a layer if it is beyond that segment along its ray.
  let transmission = 1;
  const layers = Math.min(before.crossings.length, after.crossings.length);
  for (let i = 0; i < layers; i++) {
    const p = before.crossings[i];
    const q = after.crossings[i];
    const boundary = raySegmentDistance(
      px / distance,
      py / distance,
      before.dx * p.distance,
      before.dy * p.distance,
      after.dx * q.distance,
      after.dy * q.distance,
    );
    if (boundary === undefined || distance <= boundary) {
      return transmission;
    }
    transmission = Math.min(p.transmission, q.transmission);
    if (transmission <= 0) {
      return 0;
    }
  }
  return transmission;
}

/** Distance along a ray from the origin to a segment, or undefined if it misses */
function raySegmentDistance(
  dx: number,
  dy: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number | undefined {
  const sx = bx - ax;
  const sy = by - ay;
  const denominator = dx * sy - dy * sx;
  if (Math.abs(denominator) < EPSILON) {
    // Both points are along the ray; the nearer one is the boundary
    return Math.min(Math.hypot(ax, ay), Math.hypot(bx, by));
  }
  const t = (ax * sy - ay * sx) / denominator;
  return t >= 0 ? t : undefined;
}
