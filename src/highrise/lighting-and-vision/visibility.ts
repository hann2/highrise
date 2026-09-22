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
 * An eye with a radius sees around silhouette corners a little: the shadow
 * behind a corner has a penumbra between the ray from one side of the eye
 * and the ray from the other. The samples at such a corner record both
 * directions so the outline can follow the umbra side and a wedge can be
 * drawn between them.
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

/** A segment of an occluder's boundary, in world coordinates */
export interface Surface {
  readonly ax: number;
  readonly ay: number;
  readonly bx: number;
  readonly by: number;
}

export interface Crossing {
  /** Distance from the eye along the ray */
  distance: number;
  /** Fraction of light that remains beyond this crossing */
  transmission: number;
  /** What was crossed, or undefined at the range limit */
  surface?: Surface;
}

/** The two samples on either side of a silhouette corner share one of these */
export interface Silhouette {
  corner: Point;
  /** Unit direction of the edge of full shadow, from the corner outward */
  umbraDirection: Point;
  /** Unit direction of the edge of full light, from the corner outward */
  litDirection: Point;
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
  /** Set on both samples of a silhouette corner. The one whose first crossing is the corner is the blocked side. */
  silhouette?: Silhouette;
}

export interface VisibilityOptions {
  /** Angle between the evenly spaced rays that round off the range limit, in radians */
  arcStep?: number;
  /** Radius of the eye, in meters. 0 gives hard shadows. */
  sourceRadius?: number;
}

interface Corner {
  x: number;
  y: number;
  angle: number;
  distance: number;
  /** The edges facing the eye that meet at this corner */
  edges: Edge[];
}

interface Edge extends Surface {
  transmission: number;
  a: Corner;
  b: Corner;
}

interface Hit {
  distance: number;
  transmission: number;
  surface?: Surface;
}

const TWO_PI = Math.PI * 2;
const DEFAULT_ARC_STEP = (5 * Math.PI) / 180;
/** Number of angular buckets edges are sorted into, so each ray tests only nearby edges */
const BIN_COUNT = 64;
const BIN_SIZE = TWO_PI / BIN_COUNT;
const EPSILON = 1e-9;
/**
 * The eye never looks more than this fraction of the corner distance wide,
 * so a corner right next to the eye doesn't get a penumbra spanning the
 * whole screen.
 */
const MAX_SOURCE_RADIUS_FRACTION = 0.25;

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
  { arcStep = DEFAULT_ARC_STEP, sourceRadius = 0 }: VisibilityOptions = {},
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
      hits.push({
        distance: t,
        transmission: edge.transmission,
        surface: edge,
      });
    }

    if (!corner) {
      samples.push({
        sample: makeSample(angle, dx, dy, hits, radius),
        side: 0,
      });
      return;
    }

    // The corner's own edges only block the side of the ray they lie on
    let lower: Edge | undefined;
    let upper: Edge | undefined;
    for (const edge of corner.edges) {
      const other = edge.a === corner ? edge.b : edge.a;
      const side = dx * (other.y - corner.y) - dy * (other.x - corner.x);
      if (side > EPSILON) {
        upper = pickDarker(upper, edge);
      } else if (side < -EPSILON) {
        lower = pickDarker(lower, edge);
      }
    }
    const cornerHit = (edge: Edge): Hit => ({
      distance: corner.distance,
      transmission: edge.transmission,
      surface: edge,
    });
    if (lower && upper) {
      hits.push(cornerHit(pickDarker(lower, upper)!));
      samples.push({
        sample: makeSample(angle, dx, dy, hits, radius),
        side: 0,
      });
    } else if (lower || upper) {
      // A silhouette corner: the visible distance jumps here
      const open = makeSample(angle, dx, dy, hits, radius);
      hits.push(cornerHit((lower ?? upper)!));
      const blocked = makeSample(angle, dx, dy, hits, radius);
      if (sameCrossings(open, blocked)) {
        samples.push({ sample: blocked, side: 0 }); // something nearer hides the corner
        return;
      }
      // The occluder is on the lower side, so the open side is the upper
      // one (+90° from the ray), or the other way round
      const openSign = lower ? 1 : -1;
      const silhouette = makeSilhouette(
        eye,
        corner,
        dx,
        dy,
        openSign,
        sourceRadius,
      );
      open.silhouette = silhouette;
      blocked.silhouette = silhouette;
      const [before, after] = lower ? [blocked, open] : [open, blocked];
      samples.push({ sample: before, side: -1 }, { sample: after, side: 1 });
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

function pickDarker(current: Edge | undefined, edge: Edge): Edge {
  return current && current.transmission <= edge.transmission ? current : edge;
}

/**
 * The edges of the penumbra behind a silhouette corner: the ray through the
 * corner from the side of the eye away from the occluder is where full
 * shadow starts, the ray from the other side is where full light starts.
 */
function makeSilhouette(
  eye: Point,
  corner: Corner,
  dx: number,
  dy: number,
  openSign: number,
  sourceRadius: number,
): Silhouette {
  const offset = Math.min(
    sourceRadius,
    corner.distance * MAX_SOURCE_RADIUS_FRACTION,
  );
  // Perpendicular to the ray, toward the open side
  const px = -dy * openSign * offset;
  const py = dx * openSign * offset;
  const direction = (fromX: number, fromY: number): Point => {
    const x = corner.x - fromX;
    const y = corner.y - fromY;
    const length = Math.hypot(x, y) || 1;
    return [x / length, y / length];
  };
  return {
    corner: [corner.x, corner.y],
    umbraDirection: direction(eye[0] + px, eye[1] + py),
    litDirection: direction(eye[0] - px, eye[1] - py),
  };
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
    crossings.push({
      distance: hit.distance,
      transmission,
      surface: hit.surface,
    });
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
  /** Distance from the eye */
  distance: number;
  /**
   * Unit direction in which the darkness behind this vertex extends: away
   * from the eye, except at the ends of a shadow edge, where it is the
   * umbra direction.
   */
  farDirection: Point;
  /** Whether the edge from this vertex to the next is a shadow edge rather than a surface */
  shadowEdgeNext: boolean;
}

export interface Outline {
  /** The polygon, sorted by angle around the eye */
  vertices: OutlineVertex[];
  /** One per silhouette corner, for drawing penumbrae */
  silhouettes: Silhouette[];
}

/**
 * The boundary of what is fully visible, as a polygon sorted by angle
 * around the eye.
 *
 * Where two consecutive samples hit different surfaces that meet between
 * them, the meeting point is added, so corners that aren't corners of any
 * occluder (walls overlapping at a room corner) come out sharp instead of
 * being cut off by a chord that moves with the samples.
 *
 * At a silhouette corner the shadow edge follows the umbra direction, so
 * the region behind it is fully dark and the penumbra wedge can be drawn on
 * top of what's left.
 */
export function visibilityOutline(
  eye: Point,
  samples: readonly VisibilitySample[],
): Outline {
  const [ex, ey] = eye;
  const vertices: OutlineVertex[] = [];
  const silhouettes: Silhouette[] = [];
  const n = samples.length;
  if (n === 0) {
    return { vertices, silhouettes };
  }

  const push = (point: Point, farDirection: Point, shadowEdgeNext: boolean) => {
    const last = vertices[vertices.length - 1];
    if (last && closeEnough(last.point, point)) {
      return;
    }
    vertices.push({
      point,
      distance: Math.hypot(point[0] - ex, point[1] - ey),
      farDirection,
      shadowEdgeNext,
    });
  };

  const pointOf = ({ dx, dy, crossings }: VisibilitySample): Point => [
    ex + dx * crossings[0].distance,
    ey + dy * crossings[0].distance,
  ];

  // Adds the corner where the last vertex's surface meets this one's, if
  // there is one between them
  const joinSurfaces = (
    previous: Surface | undefined,
    next: Surface,
    point: Point,
  ) => {
    const last = vertices[vertices.length - 1];
    if (last && previous && previous !== next) {
      const meeting = surfacesMeetBetween(
        eye,
        previous,
        next,
        last.point,
        point,
      );
      if (meeting) {
        push(meeting, direction(eye, meeting), false);
      }
    }
  };

  let lastSurface: Surface | undefined;
  // One extra step wraps around so the last and first samples get joined too
  for (let i = 0; i <= n; i++) {
    const sample = samples[i % n];
    const { silhouette } = sample;
    const surface = sample.crossings[0].surface;
    const point = pointOf(sample);

    if (silhouette && samples[(i + 1) % n].silhouette === silhouette) {
      // A silhouette pair: the corner, and the far end of its umbra edge
      const partner = samples[(i + 1) % n];
      const corner = silhouette.corner;
      const open = closeEnough(point, corner) ? partner : sample;
      const far = umbraFarPoint(
        eye,
        silhouette,
        open.crossings[0],
        pointOf(open),
      );
      const [first, second] = open === sample ? [far, corner] : [corner, far];
      const openSurface = open.crossings[0].surface;
      const [firstSurface, secondSurface] =
        open === sample ? [openSurface, surface] : [surface, openSurface];
      if (firstSurface) {
        joinSurfaces(lastSurface, firstSurface, first);
      }
      if (closeEnough(first, second)) {
        push(first, direction(eye, first), false);
      } else {
        push(first, silhouette.umbraDirection, true);
        push(second, silhouette.umbraDirection, false);
        if (i < n) {
          silhouettes.push(silhouette);
        }
      }
      lastSurface = secondSurface;
      i++;
      continue;
    }

    if (surface) {
      joinSurfaces(lastSurface, surface, point);
    }
    push(point, [sample.dx, sample.dy], false);
    lastSurface = surface;
  }

  // The wrap-around step re-added the first vertex; drop it
  while (
    vertices.length > 1 &&
    closeEnough(vertices[0].point, vertices[vertices.length - 1].point)
  ) {
    vertices.pop();
  }
  return { vertices, silhouettes };
}

function direction(from: Point, to: Point): Point {
  const x = to[0] - from[0];
  const y = to[1] - from[1];
  const length = Math.hypot(x, y) || 1;
  return [x / length, y / length];
}

/**
 * Where the umbra edge from a silhouette corner reaches the surface the
 * open sample hit, clamped to that surface; the range limit if it hit
 * nothing; or the open sample's own point if the umbra edge misses.
 */
function umbraFarPoint(
  eye: Point,
  { corner, umbraDirection: [ux, uy] }: Silhouette,
  crossing: Crossing,
  fallback: Point,
): Point {
  const [cx, cy] = corner;
  const surface = crossing.surface;
  if (surface) {
    const sx = surface.bx - surface.ax;
    const sy = surface.by - surface.ay;
    const denominator = ux * sy - uy * sx;
    if (Math.abs(denominator) > EPSILON) {
      const rx = surface.ax - cx;
      const ry = surface.ay - cy;
      const t = (rx * sy - ry * sx) / denominator;
      const s = Math.max(0, Math.min(1, (rx * uy - ry * ux) / denominator));
      if (t > 0) {
        return [surface.ax + sx * s, surface.ay + sy * s];
      }
    }
    return fallback;
  }
  // Out to the range limit along the umbra direction
  const radius = crossing.distance;
  const px = cx - eye[0];
  const py = cy - eye[1];
  const along = px * ux + py * uy;
  const t =
    -along +
    Math.sqrt(
      Math.max(0, along * along - (px * px + py * py) + radius * radius),
    );
  return [cx + ux * t, cy + uy * t];
}

/**
 * The point where two surfaces meet, if it lies on both of them and in the
 * angular gap between two points on them.
 */
function surfacesMeetBetween(
  eye: Point,
  p: Surface,
  q: Surface,
  before: Point,
  after: Point,
): Point | undefined {
  const px = p.bx - p.ax;
  const py = p.by - p.ay;
  const qx = q.bx - q.ax;
  const qy = q.by - q.ay;
  const denominator = px * qy - py * qx;
  if (Math.abs(denominator) < EPSILON) {
    return undefined;
  }
  const rx = q.ax - p.ax;
  const ry = q.ay - p.ay;
  const s = (rx * qy - ry * qx) / denominator;
  const t = (rx * py - ry * px) / denominator;
  const slack = 1e-6;
  if (s < -slack || s > 1 + slack || t < -slack || t > 1 + slack) {
    return undefined;
  }
  const x = p.ax + px * s;
  const y = p.ay + py * s;
  const vx = x - eye[0];
  const vy = y - eye[1];
  // Between the two: to the left of the ray to the first point and to the
  // right of the ray to the second
  const bx = before[0] - eye[0];
  const by = before[1] - eye[1];
  const ax = after[0] - eye[0];
  const ay = after[1] - eye[1];
  if (bx * vy - by * vx < -EPSILON || ax * vy - ay * vx > EPSILON) {
    return undefined;
  }
  return [x, y];
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
