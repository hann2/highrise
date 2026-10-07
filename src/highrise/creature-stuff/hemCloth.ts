/**
 * Cloth hanging from round the waist, seen from above: a skirt, a coat's
 * tails. What shows from above is the hem, out past the hips, so that's
 * what moves: a ring of weights on springs round the waist, each pulled
 * toward where it hangs at rest, left behind as the body sets off, flung on
 * as it stops, flaring out as it spins, and pushed out by the legs where
 * they come through the hem as they stride.
 *
 * It's drawn as a ring of triangles over a straight picture of the cloth
 * hanging at rest (from the waist out to the hem, in the body's frame,
 * facing +x): the waist's points stay where they are on the hips, and the
 * hem's go where the weights are, so the picture is stretched out where
 * the hem's swung out and bunched where it's pushed in.
 *
 * Lengths are in whatever units the shape is in (meters in the game,
 * millimeters in the SVG stills).
 */

/** An egg round the middle: how far it comes in front, behind, and to each side */
export interface Oval {
  front: number;
  back: number;
  side: number;
}

export interface HemShape {
  /** Where the cloth hangs from */
  waist: Oval;
  /** Where its hem is, hanging at rest, seen from above */
  hem: Oval;
  /** How much further out than the hem the drawn picture goes (antialiasing) */
  margin: number;
  /**
   * How far inside the hem its own detail starts (a scalloped edge, a band
   * round it): the triangles from there out are kept thin, so the hem's
   * edge bends smoothly between them
   */
  band: number;
  /** How long the cloth is from the waist to the hem: how far out it can swing */
  cloth: number;
  /** How far down the legs the hem is, from the hips (0) to the ankles (1) */
  drop: number;
  /** Half the gap at the front, in radians: 0 is all the way round (a skirt) */
  opening: number;
  /**
   * A slit up the back from the hem to the waist, if it's open at the
   * front: how far past the back the flap on the right reaches under the
   * one on the left (radians), so they overlap and no gap shows at rest
   */
  vent?: number;
}

/** How it swings, as a `Dangle` does */
export interface HemFeel {
  /** Swings a second, left to itself */
  frequency: number;
  /** How soon a swing dies down: 0 never, 1 not even one overshoot */
  dampingRatio: number;
  /** Air drag (per second): how much it trails going along */
  drag: number;
  /** The most it swings out, as a fraction of the cloth's length */
  maxSwing: number;
  /**
   * How much each point's pulled along with its neighbors, as a multiple of
   * the pull toward rest: how much a piece of it moves as one, so a flap
   * swings whole when a leg pushes it
   */
  bend?: number;
}

/** A leg where it comes through the hem: its middle, and half its thickness */
export interface LegAtHem {
  x: number;
  y: number;
  radius: number;
}

/**
 * How many points round a hem (two more with a vent, `hemPointCount`).
 * Each has 3 vertices (`RINGS`), and a mesh of up to 100 vertices is
 * batched with the sprites
 */
export const HEM_POINTS = 30;

/** Vertices for each point round the hem: its waist, inside the hem's band, and the picture's outside */
export const RINGS = 3;

/** How far out round the waist the cloth always stays, next to the waist */
const WAIST_CLEARANCE = 1.05;

/** How much clear of a leg the hem stays, as a fraction of its thickness */
const LEG_CLEARANCE = 0.12;

/** Points round each leg, for the outline the hem's pushed out to */
const LEG_POINTS = 8;

/** Updates longer than this (seconds) hang it at rest instead: it's been out of view, or paused */
const MAX_DT = 0.25;
/** The middle moving further than this between updates has teleported */
const TELEPORT_DISTANCE = 1;
/** The longest step it's moved on in (seconds), so the springs stay stable */
const MAX_STEP = 1 / 120;

export function isClosed(shape: HemShape): boolean {
  return shape.opening <= 0;
}

/** Whether it's split up the back into two flaps */
export function isVented(shape: HemShape): boolean {
  return !isClosed(shape) && shape.vent !== undefined;
}

/** How many points round its hem: a vent has a point either side of the slit, and one where the flap under reaches to */
export function hemPointCount(shape: HemShape): number {
  return isVented(shape) ? HEM_POINTS + 2 : HEM_POINTS;
}

/**
 * The runs of points round the hem that are joined up, by index: all of
 * them (coming round to the first again if it's closed), or each flap
 * either side of a vent, the right then the left, which is drawn over it
 */
export function hemStrips(
  shape: HemShape,
  count = hemPointCount(shape),
): { from: number; to: number }[] {
  if (!isVented(shape)) {
    return [{ from: 0, to: count }];
  }
  const half = Math.floor(count / 2);
  return [
    { from: 0, to: half },
    { from: half, to: count },
  ];
}

/**
 * Which way each point round the hem is from the middle (0 is in front),
 * strip by strip (`hemStrips`). With a vent, the right flap runs from the
 * front round to the back, with one more point reaching past it under the
 * left, which runs from the back round to the front.
 */
export function hemAngles(
  shape: HemShape,
  count = hemPointCount(shape),
): Float64Array {
  const angles = new Float64Array(count);
  if (isClosed(shape)) {
    for (let i = 0; i < count; i++) {
      angles[i] = (i / count) * Math.PI * 2;
    }
    return angles;
  }
  const end = Math.PI * 2 - shape.opening;
  if (!isVented(shape)) {
    for (let i = 0; i < count; i++) {
      angles[i] = shape.opening + (i / (count - 1)) * (end - shape.opening);
    }
    return angles;
  }
  const [right, left] = hemStrips(shape, count);
  const rightPoints = right.to - right.from - 1;
  for (let i = 0; i < rightPoints; i++) {
    angles[i] =
      shape.opening + (i / (rightPoints - 1)) * (Math.PI - shape.opening);
  }
  angles[rightPoints] = Math.PI + shape.vent!;
  const leftPoints = left.to - left.from;
  for (let i = 0; i < leftPoints; i++) {
    angles[left.from + i] = Math.PI + (i / (leftPoints - 1)) * (end - Math.PI);
  }
  return angles;
}

/**
 * Where on the picture each point round the hem is drawn from: where it
 * hangs, but where the flap under a vent reaches past the back, the cloth
 * on its own side of it, mirrored, so it never shows the left flap's edge
 */
export function hemPictureAngles(
  shape: HemShape,
  angles: Float64Array,
): Float64Array {
  if (!isVented(shape)) {
    return angles;
  }
  const [right] = hemStrips(shape, angles.length);
  return angles.map((angle, i) =>
    i < right.to && angle > Math.PI ? Math.PI * 2 - angle : angle,
  );
}

/** The point on `oval` at `angle` from the middle */
export function ovalAt(oval: Oval, angle: number): [number, number] {
  const cos = Math.cos(angle);
  return [
    cos * (cos >= 0 ? oval.front : oval.back),
    Math.sin(angle) * oval.side,
  ];
}

/**
 * Which way from the middle point `angle` round the hem hangs: on an oval,
 * not quite `angle`
 */
export function hemDirection(shape: HemShape, angle: number): number {
  const [x, y] = ovalAt(shape.hem, angle);
  return Math.atan2(y, x);
}

/** The oval pushed out by `by` all round */
function grown(oval: Oval, by: number): Oval {
  return {
    front: oval.front + by,
    back: oval.back + by,
    side: oval.side + by,
  };
}

/**
 * The triangles, for vertices in the order `hemRest` gives them (`RINGS` a
 * point round the hem, then the middle if it's closed): the middle's fan
 * first, then each strip (`hemStrips`) round each ring from the waist out
 */
export function hemIndices(
  shape: HemShape,
  count = hemPointCount(shape),
): Uint32Array {
  const closed = isClosed(shape);
  const strips = hemStrips(shape, count);
  const quads = strips.reduce(
    (sum, { from, to }) => sum + (closed ? count : to - from - 1),
    0,
  );
  const indices = new Uint32Array(
    (quads * 2 * (RINGS - 1) + (closed ? count : 0)) * 3,
  );
  let k = 0;
  if (closed) {
    const middle = count * RINGS;
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      indices.set([middle, i * RINGS, j * RINGS], k);
      k += 3;
    }
  }
  for (const { from, to } of strips) {
    for (let r = 0; r < RINGS - 1; r++) {
      for (let i = from; i < (closed ? to : to - 1); i++) {
        const a = i * RINGS + r;
        const b = (i + 1 === to ? from : i + 1) * RINGS + r;
        indices.set([a, a + 1, b, b, a + 1, b + 1], k);
        k += 6;
      }
    }
  }
  return indices;
}

/**
 * Where the vertices are hanging at rest, as `hemIndices` orders them: for
 * each point, the waist, where the hem's band starts and the outside of the
 * picture (the hem plus its margin); then the middle, if it's closed
 */
export function hemRest(shape: HemShape, angles: Float64Array): Float64Array {
  const count = angles.length;
  const out = new Float64Array((count * RINGS + (isClosed(shape) ? 1 : 0)) * 2);
  const outside = grown(shape.hem, shape.margin);
  for (let i = 0; i < count; i++) {
    const [wx, wy] = ovalAt(shape.waist, angles[i]);
    const [hx, hy] = ovalAt(shape.hem, angles[i]);
    // The band's inside: in from the hem, but never inside the waist
    const length = Math.hypot(hx - wx, hy - wy);
    const k = length > 1e-9 ? Math.max(0.2, 1 - shape.band / length) : 1;
    const v = i * RINGS * 2;
    out.set([wx, wy], v);
    out.set([wx + (hx - wx) * k, wy + (hy - wy) * k], v + 2);
    out.set(ovalAt(outside, angles[i]), v + 4);
  }
  return out;
}

/** Texture coordinates for vertices `at` on a picture spanning `from` to `to` */
export function hemUvs(
  at: Float64Array,
  from: [number, number],
  to: [number, number],
): Float32Array {
  const uvs = new Float32Array(at.length);
  for (let v = 0; v < at.length; v += 2) {
    uvs[v] = (at[v] - from[0]) / (to[0] - from[0]);
    uvs[v + 1] = (at[v + 1] - from[1]) / (to[1] - from[1]);
  }
  return uvs;
}

/**
 * How far out from the middle the hem has to be at each of `angles`, in the
 * hips' frame, to go round `legs`: the cloth's drawn taut over a leg pushed
 * out through it and back to the waist either side, as it hangs between
 * them (the outline round the waist and the legs). Split by a vent, each
 * flap only goes round the legs on its own side. Into `out`.
 */
export function legClearance(
  shape: HemShape,
  angles: Float64Array,
  legs: readonly LegAtHem[],
  out: Float64Array,
): Float64Array {
  return new LegClearance(shape, angles).compute(legs, out);
}

/** Points round the waist, for the outline the hem's pushed out to */
const WAIST_POINTS = 16;

/** Each of `LEG_POINTS` round a circle */
const LEG_COS = Array.from({ length: LEG_POINTS }, (_, i) =>
  Math.cos((i / LEG_POINTS) * Math.PI * 2),
);
const LEG_SIN = Array.from({ length: LEG_POINTS }, (_, i) =>
  Math.sin((i / LEG_POINTS) * Math.PI * 2),
);

/**
 * `legClearance` for one hem, over and over, without making anything new:
 * the outline round the waist and the legs is a convex hull of points round
 * each, and each point round the hem is as far out along its own way as
 * the hull's edge
 */
export class LegClearance {
  /** Which way each point round the hem hangs from the middle */
  private ux: Float64Array;
  private uy: Float64Array;
  /** How far out each has to be with no legs: round the waist */
  private waistOnly?: Float64Array;
  private waistX: Float64Array;
  private waistY: Float64Array;
  /** The points round the waist and the legs, and the hull's, by index */
  private xs: Float64Array;
  private ys: Float64Array;
  private order: Int32Array;
  private hull: Int32Array;
  /**
   * The runs of points that go round the legs together, and which side of
   * the middle the legs they go round are on (0 for both)
   */
  private strips: { from: number; to: number; side: number }[];

  constructor(
    shape: HemShape,
    angles: Float64Array,
    /** The most legs it's given */
    maxLegs = 2,
  ) {
    const count = angles.length;
    this.ux = new Float64Array(count);
    this.uy = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      const direction = hemDirection(shape, angles[i]);
      this.ux[i] = Math.cos(direction);
      this.uy[i] = Math.sin(direction);
    }
    this.waistX = new Float64Array(WAIST_POINTS);
    this.waistY = new Float64Array(WAIST_POINTS);
    for (let i = 0; i < WAIST_POINTS; i++) {
      const [x, y] = ovalAt(shape.waist, (i / WAIST_POINTS) * Math.PI * 2);
      this.waistX[i] = x * WAIST_CLEARANCE;
      this.waistY[i] = y * WAIST_CLEARANCE;
    }
    const capacity = WAIST_POINTS + maxLegs * LEG_POINTS;
    this.xs = new Float64Array(capacity);
    this.ys = new Float64Array(capacity);
    this.order = new Int32Array(capacity);
    this.hull = new Int32Array(capacity + 1);
    // Either side of a vent, the right flap (+y), then the left
    this.strips = isVented(shape)
      ? hemStrips(shape, count).map((strip, i) => ({
          ...strip,
          side: i === 0 ? 1 : -1,
        }))
      : [{ from: 0, to: count, side: 0 }];
    this.waistOnly = this.compute([], new Float64Array(count));
  }

  /** How far out each point round the hem has to be for `legs` (in the hips' frame), into `out` */
  compute(legs: readonly LegAtHem[], out: Float64Array): Float64Array {
    for (const { from, to, side } of this.strips) {
      this.computeStrip(legs, side, from, to, out);
    }
    return out;
  }

  /** `compute` for points `from` to `to`, going round the legs on `side` (0 for all) */
  private computeStrip(
    legs: readonly LegAtHem[],
    side: number,
    from: number,
    to: number,
    out: Float64Array,
  ) {
    const { xs, ys } = this;
    let n = 0;
    for (let i = 0; i < WAIST_POINTS; i++) {
      xs[n] = this.waistX[i];
      ys[n] = this.waistY[i];
      n++;
    }
    for (let l = 0; l < legs.length && n < xs.length; l++) {
      const leg = legs[l];
      if (side !== 0 && (side > 0 ? leg.y < 0 : leg.y >= 0)) {
        continue;
      }
      const r = leg.radius * (1 + LEG_CLEARANCE);
      for (let i = 0; i < LEG_POINTS; i++) {
        xs[n] = leg.x + LEG_COS[i] * r;
        ys[n] = leg.y + LEG_SIN[i] * r;
        n++;
      }
    }
    if (n === WAIST_POINTS && this.waistOnly) {
      out.set(this.waistOnly.subarray(from, to), from);
      return;
    }
    const size = this.convexHull(n);
    const { hull } = this;
    // How far along each way the hull's edge is: the middle's always inside
    for (let i = from; i < to; i++) {
      const ux = this.ux[i];
      const uy = this.uy[i];
      let far = 0;
      for (let e = 0; e < size; e++) {
        const ax = xs[hull[e]];
        const ay = ys[hull[e]];
        const ex = xs[hull[e + 1]] - ax;
        const ey = ys[hull[e + 1]] - ay;
        // Where the ray from the middle crosses this edge, if it does
        const denominator = ux * ey - uy * ex;
        if (denominator > -1e-12 && denominator < 1e-12) {
          continue;
        }
        const t = (ax * ey - ay * ex) / denominator;
        if (t <= far) {
          continue;
        }
        const s = (ax * uy - ay * ux) / denominator;
        if (s >= -1e-9 && s <= 1 + 1e-9) {
          far = t;
        }
      }
      out[i] = far;
    }
  }

  /** The convex hull of the first `n` points, anticlockwise, into `hull`; gives its size (monotone chain) */
  private convexHull(n: number): number {
    const { xs, ys, order, hull } = this;
    // Sorted by x, then y (a handful of points: insertion sort)
    for (let i = 0; i < n; i++) {
      let j = i;
      while (
        j > 0 &&
        (xs[order[j - 1]] > xs[i] ||
          (xs[order[j - 1]] === xs[i] && ys[order[j - 1]] > ys[i]))
      ) {
        order[j] = order[j - 1];
        j--;
      }
      order[j] = i;
    }
    const cross = (o: number, a: number, b: number) =>
      (xs[a] - xs[o]) * (ys[b] - ys[o]) - (ys[a] - ys[o]) * (xs[b] - xs[o]);
    let size = 0;
    // The lower half, then the upper
    for (let i = 0; i < n; i++) {
      const p = order[i];
      while (size >= 2 && cross(hull[size - 2], hull[size - 1], p) <= 0) {
        size--;
      }
      hull[size++] = p;
    }
    const lower = size + 1;
    for (let i = n - 2; i >= 0; i--) {
      const p = order[i];
      while (size >= lower && cross(hull[size - 2], hull[size - 1], p) <= 0) {
        size--;
      }
      hull[size++] = p;
    }
    // The last is the first again, which closes it
    return size - 1;
  }
}

/**
 * The hem hanging still with the legs where they are (in the hips' frame):
 * where it is at rest, pushed out where a leg's in the way. As `hemRest`
 * orders the vertices, for the SVG stills.
 */
export function hemStill(
  shape: HemShape,
  angles: Float64Array,
  legs: readonly LegAtHem[],
): Float64Array {
  const posed = hemRest(shape, angles);
  const clear = legClearance(
    shape,
    angles,
    legs,
    new Float64Array(angles.length),
  );
  const offsets = ringOffsets(shape, angles, posed);
  for (let i = 0; i < angles.length; i++) {
    const [hx, hy] = ovalAt(shape.hem, angles[i]);
    const direction = Math.atan2(hy, hx);
    const ux = Math.cos(direction);
    const uy = Math.sin(direction);
    const push = Math.max(0, clear[i] - (hx * ux + hy * uy));
    placeRings(
      posed,
      i,
      hx + ux * push,
      hy + uy * push,
      offsets,
      posed[i * RINGS * 2],
      posed[i * RINGS * 2 + 1],
    );
  }
  return posed;
}

/**
 * For each point round the hem, how much further from the waist than its
 * hem each ring is at rest (`RINGS` a point: the waist's is unused): the
 * hem's band keeps its width however far the hem swings, and only the
 * cloth between it and the waist stretches, so its edge isn't smeared
 */
function ringOffsets(
  shape: HemShape,
  angles: Float64Array,
  rest: Float64Array,
): Float64Array {
  const offsets = new Float64Array(angles.length * RINGS);
  for (let i = 0; i < angles.length; i++) {
    const [hx, hy] = ovalAt(shape.hem, angles[i]);
    const wx = rest[i * RINGS * 2];
    const wy = rest[i * RINGS * 2 + 1];
    const hem = Math.hypot(hx - wx, hy - wy);
    for (let r = 1; r < RINGS; r++) {
      const v = (i * RINGS + r) * 2;
      offsets[i * RINGS + r] = Math.hypot(rest[v] - wx, rest[v + 1] - wy) - hem;
    }
  }
  return offsets;
}

/** The least a ring comes out from the waist, as a fraction of how far the hem does */
const MIN_RING = 0.2;

/**
 * Puts point `i`'s rings into `out` (2 numbers a vertex), its waist at
 * `wx`, `wy` and its hem at `px`, `py`, each ring as much further from the
 * waist along the way to the hem as `offsets` has it
 */
function placeRings(
  out: Float64Array | Float32Array,
  i: number,
  px: number,
  py: number,
  offsets: Float64Array,
  wx: number,
  wy: number,
) {
  const v = i * RINGS * 2;
  out[v] = wx;
  out[v + 1] = wy;
  const dx = px - wx;
  const dy = py - wy;
  // (Not `Math.hypot`, which is slow: this is every vertex every frame)
  const length = Math.sqrt(dx * dx + dy * dy);
  for (let r = 1; r < RINGS; r++) {
    const k =
      length > 1e-9
        ? Math.max(MIN_RING, (length + offsets[i * RINGS + r]) / length)
        : 1;
    out[v + r * 2] = wx + dx * k;
    out[v + r * 2 + 1] = wy + dy * k;
  }
}

/**
 * The hem's weights, moving in the world. Each `update` takes where the
 * middle of the hips is, which way they face, and where the legs come
 * through the hem, all in the world; `pose` gives the vertices in the
 * body's own frame.
 */
export class HemCloth {
  readonly angles: Float64Array;
  /** Where each vertex is hanging at rest, in the hips' frame */
  readonly rest: Float64Array;
  /** Each point's hem at rest, in the hips' frame */
  private hem: Float64Array;
  /** Which way each point hangs from the middle, at rest, in the hips' frame */
  private dirX: Float64Array;
  private dirY: Float64Array;
  /** How much further from the waist each ring is than each point's hem (`ringOffsets`) */
  private offsets: Float64Array;
  /** The furthest out each point can swing, from the middle */
  private reach: Float64Array;
  /** Where each weight is in the world, and how fast it's going */
  private x: Float64Array;
  private y: Float64Array;
  private vx: Float64Array;
  private vy: Float64Array;
  /** How far out each point has to be for the legs (`legClearance`) */
  private clear: Float64Array;
  private clearance: LegClearance;
  /** Each point's neighbors in its strip, or -1 at a strip's end */
  private prev: Int32Array;
  private next: Int32Array;
  /** How far each weight is from where it hangs at rest, reused each step */
  private offX: Float64Array;
  private offY: Float64Array;
  private local: LegAtHem[] = [];
  private middleX = 0;
  private middleY = 0;
  private angle = 0;
  private started = false;

  constructor(
    readonly shape: HemShape,
    readonly feel: HemFeel,
    count = hemPointCount(shape),
  ) {
    this.angles = hemAngles(shape, count);
    this.rest = hemRest(shape, this.angles);
    this.hem = new Float64Array(count * 2);
    this.offsets = ringOffsets(shape, this.angles, this.rest);
    this.reach = new Float64Array(count);
    this.dirX = new Float64Array(count);
    this.dirY = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      const direction = hemDirection(shape, this.angles[i]);
      this.dirX[i] = Math.cos(direction);
      this.dirY[i] = Math.sin(direction);
      const [hx, hy] = ovalAt(shape.hem, this.angles[i]);
      this.hem[i * 2] = hx;
      this.hem[i * 2 + 1] = hy;
      this.reach[i] = Math.hypot(hx, hy) + shape.cloth * feel.maxSwing;
    }
    this.x = new Float64Array(count);
    this.y = new Float64Array(count);
    this.vx = new Float64Array(count);
    this.vy = new Float64Array(count);
    this.clear = new Float64Array(count);
    this.clearance = new LegClearance(shape, this.angles);
    this.prev = new Int32Array(count).fill(-1);
    this.next = new Int32Array(count).fill(-1);
    for (const { from, to } of hemStrips(shape, count)) {
      for (let i = from; i < to; i++) {
        if (i > from) {
          this.prev[i] = i - 1;
        } else if (isClosed(shape)) {
          this.prev[i] = to - 1;
        }
        if (i < to - 1) {
          this.next[i] = i + 1;
        } else if (isClosed(shape)) {
          this.next[i] = from;
        }
      }
    }
    this.offX = new Float64Array(count);
    this.offY = new Float64Array(count);
  }

  get count() {
    return this.angles.length;
  }

  /** Hangs it at rest, still */
  reset(x: number, y: number, angle: number) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (let i = 0; i < this.count; i++) {
      const hx = this.hem[i * 2];
      const hy = this.hem[i * 2 + 1];
      this.x[i] = x + hx * cos - hy * sin;
      this.y[i] = y + hx * sin + hy * cos;
      this.vx[i] = 0;
      this.vy[i] = 0;
    }
    this.middleX = x;
    this.middleY = y;
    this.angle = angle;
    this.started = true;
  }

  /** Shoves every weight (units per second, in the world) */
  push(vx: number, vy: number) {
    for (let i = 0; i < this.count; i++) {
      this.vx[i] += vx;
      this.vy[i] += vy;
    }
  }

  /**
   * Moves it on by `dt` seconds, the middle of the hips having moved to
   * `x`, `y` and turned to `angle` since the last update, at a steady
   * speed, with the legs where they come through the hem at `legs` (in the
   * world)
   */
  update(
    x: number,
    y: number,
    angle: number,
    legs: readonly LegAtHem[],
    dt: number,
  ) {
    const moved = Math.hypot(x - this.middleX, y - this.middleY);
    if (!this.started || dt > MAX_DT || moved > TELEPORT_DISTANCE) {
      this.reset(x, y, angle);
    }
    // The legs in the hips' frame, as they are now
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    while (this.local.length < legs.length) {
      this.local.push({ x: 0, y: 0, radius: 0 });
    }
    this.local.length = legs.length;
    for (let i = 0; i < legs.length; i++) {
      const dx = legs[i].x - x;
      const dy = legs[i].y - y;
      const local = this.local[i];
      local.x = dx * cos + dy * sin;
      local.y = -dx * sin + dy * cos;
      local.radius = legs[i].radius;
    }
    this.clearance.compute(this.local, this.clear);
    if (dt <= 0) {
      this.constrain(x, y, angle, 0, 0);
      return;
    }

    const { feel } = this;
    const omega = feel.frequency * Math.PI * 2;
    const stiffness = omega * omega;
    const damping = 2 * feel.dampingRatio * omega;
    const bend = (feel.bend ?? 0) * stiffness;
    const { offX, offY, prev, next } = this;
    const fromX = this.middleX;
    const fromY = this.middleY;
    const fromAngle = this.angle;
    let turn = angle - fromAngle;
    turn -= Math.round(turn / (Math.PI * 2)) * Math.PI * 2;
    const middleVX = (x - fromX) / dt;
    const middleVY = (y - fromY) / dt;
    const spin = turn / dt;

    const steps = Math.ceil(dt / MAX_STEP);
    const h = dt / steps;
    for (let step = 1; step <= steps; step++) {
      // Pulled toward where each hangs at rest at the start of the step,
      // going as fast as that point is (the hips', and turning about them)
      const t0 = (step - 1) / steps;
      const a0 = fromAngle + turn * t0;
      const c0 = Math.cos(a0);
      const s0 = Math.sin(a0);
      const mx = fromX + (x - fromX) * t0;
      const my = fromY + (y - fromY) * t0;
      for (let i = 0; i < this.count; i++) {
        const hx = this.hem[i * 2];
        const hy = this.hem[i * 2 + 1];
        offX[i] = this.x[i] - (mx + hx * c0 - hy * s0);
        offY[i] = this.y[i] - (my + hx * s0 + hy * c0);
      }
      for (let i = 0; i < this.count; i++) {
        const hx = this.hem[i * 2];
        const hy = this.hem[i * 2 + 1];
        const ox = hx * c0 - hy * s0;
        const oy = hx * s0 + hy * c0;
        const restVX = middleVX - oy * spin;
        const restVY = middleVY + ox * spin;
        // Pulled toward rest, and along with its neighbors in the strip
        let pullX = -offX[i] * stiffness;
        let pullY = -offY[i] * stiffness;
        if (bend > 0) {
          const p = prev[i];
          const q = next[i];
          if (p >= 0) {
            pullX += (offX[p] - offX[i]) * bend;
            pullY += (offY[p] - offY[i]) * bend;
          }
          if (q >= 0) {
            pullX += (offX[q] - offX[i]) * bend;
            pullY += (offY[q] - offY[i]) * bend;
          }
        }
        const ax =
          pullX - damping * (this.vx[i] - restVX) - feel.drag * this.vx[i];
        const ay =
          pullY - damping * (this.vy[i] - restVY) - feel.drag * this.vy[i];
        this.vx[i] += ax * h;
        this.vy[i] += ay * h;
        this.x[i] += this.vx[i] * h;
        this.y[i] += this.vy[i] * h;
      }
      const t = step / steps;
      this.constrain(
        fromX + (x - fromX) * t,
        fromY + (y - fromY) * t,
        fromAngle + turn * t,
        middleVX,
        middleVY,
      );
    }
    this.middleX = x;
    this.middleY = y;
    this.angle = angle;
  }

  /**
   * Keeps each weight out round the waist and the legs, and no further out
   * than the cloth reaches, stopping it going any further the way it was
   * held back
   */
  private constrain(
    x: number,
    y: number,
    angle: number,
    middleVX: number,
    middleVY: number,
  ) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (let i = 0; i < this.count; i++) {
      const ux = this.dirX[i] * cos - this.dirY[i] * sin;
      const uy = this.dirX[i] * sin + this.dirY[i] * cos;
      let dx = this.x[i] - x;
      let dy = this.y[i] - y;
      // Out along its own way from the middle
      const out = dx * ux + dy * uy;
      if (out < this.clear[i]) {
        const by = this.clear[i] - out;
        dx += ux * by;
        dy += uy * by;
        const inward =
          (this.vx[i] - middleVX) * ux + (this.vy[i] - middleVY) * uy;
        if (inward < 0) {
          this.vx[i] -= ux * inward;
          this.vy[i] -= uy * inward;
        }
      }
      // As far as the cloth reaches, or as far as a leg's pushed it
      const distance = Math.sqrt(dx * dx + dy * dy);
      const reach = Math.max(this.reach[i], this.clear[i]);
      if (distance > reach) {
        const k = reach / distance;
        const rx = dx / distance;
        const ry = dy / distance;
        dx *= k;
        dy *= k;
        const outward =
          (this.vx[i] - middleVX) * rx + (this.vy[i] - middleVY) * ry;
        if (outward > 0) {
          this.vx[i] -= rx * outward;
          this.vy[i] -= ry * outward;
        }
      }
      this.x[i] = x + dx;
      this.y[i] = y + dy;
    }
  }

  /**
   * Where the vertices are (as `hemRest` orders them) in the frame of a
   * body at `x`, `y` facing `facing`, into `out`: the waist round the hips
   * as they're turned, the outside of the picture out past each weight
   */
  pose(x: number, y: number, facing: number, out: Float32Array) {
    const hips = this.angle - facing;
    const hc = Math.cos(hips);
    const hs = Math.sin(hips);
    const fc = Math.cos(-facing);
    const fs = Math.sin(-facing);
    // Where the middle of the hips is next to the body's
    const mdx = this.middleX - x;
    const mdy = this.middleY - y;
    const mx = mdx * fc - mdy * fs;
    const my = mdx * fs + mdy * fc;
    for (let i = 0; i < this.count; i++) {
      const rx = this.rest[i * RINGS * 2];
      const ry = this.rest[i * RINGS * 2 + 1];
      const dx = this.x[i] - x;
      const dy = this.y[i] - y;
      placeRings(
        out,
        i,
        dx * fc - dy * fs,
        dx * fs + dy * fc,
        this.offsets,
        mx + rx * hc - ry * hs,
        my + rx * hs + ry * hc,
      );
    }
    if (isClosed(this.shape)) {
      out[this.count * RINGS * 2] = mx;
      out[this.count * RINGS * 2 + 1] = my;
    }
    return out;
  }
}
