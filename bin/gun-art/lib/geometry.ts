/**
 * Geometry for drawing guns as SVG path data: points, rounded shapes, circular arcs, smooth curves through
 * points, and lines along a slanted axis (a grip's lean). Everything returns path data as strings, with absolute
 * M/L/C/Z commands only, so `toMillimeters` can convert a drawing by its number pairs.
 */

export type Point = readonly [number, number];

/**
 * A number with `digits` decimals, rounded as Python's format() rounds: to the nearest, and exact ties to the
 * even digit (JavaScript's toFixed rounds exact ties up). The generators were first written in Python, and this
 * keeps their output the same.
 */
export function fixed(value: number, digits: number): string {
  const scale = 10 ** digits;
  const scaled = Math.abs(value) * scale;
  if (Number.isInteger(scaled * 2) && !Number.isInteger(scaled)) {
    const floor = Math.floor(scaled);
    const even = floor % 2 === 0 ? floor : floor + 1;
    const sign = value < 0 ? "-" : "";
    return sign + (even / scale).toFixed(digits);
  }
  return value.toFixed(digits);
}

/** A point as "x,y", to a tenth */
export function fmt(p: Point): string {
  return `${fixed(p[0], 1)},${fixed(p[1], 1)}`;
}

export function add(a: Point, b: Point, scale = 1): Point {
  return [a[0] + b[0] * scale, a[1] + b[1] * scale];
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

export function unit(v: Point): Point {
  const length = Math.hypot(v[0], v[1]);
  return [v[0] / length, v[1] / length];
}

/** The point `d` along from `a` toward `b` */
export function toward(a: Point, b: Point, d: number): Point {
  const length = distance(a, b);
  return [
    a[0] + ((b[0] - a[0]) / length) * d,
    a[1] + ((b[1] - a[1]) / length) * d,
  ];
}

/** A closed path through `corners`, each rounded by its radius (0 for a sharp corner) */
export function rounded(
  corners: readonly Point[],
  radii: readonly number[],
): string {
  const n = corners.length;
  const parts: string[] = [];
  const k = 0.45;
  corners.forEach((c, i) => {
    const r = radii[i];
    const prev = corners[(i - 1 + n) % n];
    const next = corners[(i + 1) % n];
    if (r === 0) {
      parts.push((parts.length ? "L" : "M") + fmt(c));
      return;
    }
    const a = toward(c, prev, r);
    const b = toward(c, next, r);
    parts.push((parts.length ? "L" : "M") + fmt(a));
    parts.push(
      `C${fmt([a[0] + (c[0] - a[0]) * (1 - k), a[1] + (c[1] - a[1]) * (1 - k)])} ` +
        `${fmt([b[0] + (c[0] - b[0]) * (1 - k), b[1] + (c[1] - b[1]) * (1 - k)])} ${fmt(b)}`,
    );
  });
  return parts.join(" ") + " Z";
}

/** A closed path straight through `points` */
export function polygon(points: readonly Point[]): string {
  return "M" + points.map(fmt).join(" L") + " Z";
}

/** Degrees to radians, multiplied as Python's math.radians does, so its rounding is the same */
export function radians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** Radians to degrees, as Python's math.degrees */
export function degrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/** The point at `angle` degrees (clockwise on screen, 0 along +x) round a circle */
export function on(center: Point, r: number, angle: number): Point {
  const a = radians(angle);
  return [center[0] + r * Math.cos(a), center[1] + r * Math.sin(a)];
}

/**
 * Béziers along a circle from angle `start` to `end` (degrees, clockwise on screen), in pieces of at most a
 * quarter turn, from wherever the path is (which should be the start: `on(center, r, start)`). For anything
 * that's really round: openings, a trigger's curve, screw heads.
 */
export function arc(
  center: Point,
  r: number,
  start: number,
  end: number,
): string {
  const pieces = Math.max(1, Math.ceil(Math.abs(end - start) / 90 - 1e-9));
  const step = radians(end - start) / pieces;
  const k = (4 / 3) * Math.tan(step / 4) * r;
  const parts: string[] = [];
  let a = radians(start);
  for (let i = 0; i < pieces; i++) {
    const b = a + step;
    const p0: Point = [
      center[0] + r * Math.cos(a),
      center[1] + r * Math.sin(a),
    ];
    const p3: Point = [
      center[0] + r * Math.cos(b),
      center[1] + r * Math.sin(b),
    ];
    const c1: Point = [p0[0] - k * Math.sin(a), p0[1] + k * Math.cos(a)];
    const c2: Point = [p3[0] + k * Math.sin(b), p3[1] - k * Math.cos(b)];
    parts.push(`C${fmt(c1)} ${fmt(c2)} ${fmt(p3)}`);
    a = b;
  }
  return parts.join(" ");
}

/**
 * Cubic Béziers through `points`, curving smoothly through every one: a clamped cubic spline, so even the
 * curvature has no jumps where the pieces meet, leaving the first point along `startDir` and arriving at the
 * last along `endDir`. Continues the path from the first point. For any long edge: hand-placed Béziers show
 * their joints.
 */
export function smoothCurve(
  points: readonly Point[],
  startDir: Point,
  endDir: Point,
): string {
  const n = points.length - 1;
  // The pieces' lengths, as differences of the running total (as the first generator worked them out)
  const t = [0];
  for (let i = 0; i < n; i++) {
    t.push(t[i] + distance(points[i], points[i + 1]));
  }
  const h = t.slice(1).map((total, i) => total - t[i]);
  const slopes: number[][] = [];
  for (const axis of [0, 1] as const) {
    const y = points.map((p) => p[axis]);
    const m0 = unit(startDir)[axis];
    const mn = unit(endDir)[axis];
    // The slopes at the inner points: a tridiagonal system, solved by elimination
    const size = n - 1;
    const lower = new Array<number>(size).fill(0);
    const diag = new Array<number>(size).fill(0);
    const upper = new Array<number>(size).fill(0);
    const rhs = new Array<number>(size).fill(0);
    for (let k = 0; k < size; k++) {
      const i = k + 1;
      lower[k] = h[i];
      diag[k] = 2 * (h[i - 1] + h[i]);
      upper[k] = h[i - 1];
      rhs[k] =
        3 *
        ((h[i] * (y[i] - y[i - 1])) / h[i - 1] +
          (h[i - 1] * (y[i + 1] - y[i])) / h[i]);
    }
    if (size > 0) {
      rhs[0] -= lower[0] * m0;
      rhs[size - 1] -= upper[size - 1] * mn;
    }
    for (let k = 1; k < size; k++) {
      const f = lower[k] / diag[k - 1];
      diag[k] -= f * upper[k - 1];
      rhs[k] -= f * rhs[k - 1];
    }
    const inner = new Array<number>(size).fill(0);
    for (let k = size - 1; k >= 0; k--) {
      inner[k] =
        (rhs[k] - (k + 1 < size ? upper[k] * inner[k + 1] : 0)) / diag[k];
    }
    slopes.push([m0, ...inner, mn]);
  }
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[i + 1];
    const c1: Point = [
      a[0] + (slopes[0][i] * h[i]) / 3,
      a[1] + (slopes[1][i] * h[i]) / 3,
    ];
    const c2: Point = [
      b[0] - (slopes[0][i + 1] * h[i]) / 3,
      b[1] - (slopes[1][i + 1] * h[i]) / 3,
    ];
    parts.push(`C${fmt(c1)} ${fmt(c2)} ${fmt(b)}`);
  }
  return parts.join(" ");
}

/**
 * Lines along a slanted axis, like a grip that leans back: `lean` is x per y down it (negative leans back, to
 * the left), `fall` is y per x across it (how its base and the tops of its parts slope). Distances across it
 * are measured forward from `back`, its back edge at the height `atY`.
 */
export class SlantedAxis {
  /** Down the axis, a unit vector */
  readonly down: Point;
  /** Forward across it, square to `down` */
  readonly forward: Point;

  constructor(
    readonly back: number,
    readonly atY: number,
    readonly lean: number,
    readonly fall: number,
  ) {
    const length = Math.hypot(lean, 1);
    this.down = [lean / length, 1 / length];
    this.forward = [this.down[1], -this.down[0]];
  }

  /** The back edge's x at height y */
  backAt(y: number): number {
    return this.back + this.lean * (y - this.atY);
  }

  /** The point `offset` forward of the back edge, at height y */
  at(offset: number, y: number): Point {
    return [this.backAt(y) + offset, y];
  }

  /** Where the line `offset` forward of the back edge meets the line across the axis through `point` */
  cross(offset: number, point: Point): Point {
    const [x0, y0] = point;
    const y =
      (y0 + this.fall * (this.back + offset - this.atY * this.lean - x0)) /
      (1 - this.fall * this.lean);
    return [this.back + offset + this.lean * (y - this.atY), y];
  }
}
