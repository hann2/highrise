import { lerp } from "./util/MathUtil";

type CompatibleTuple = [number, number] | Float32Array | Float64Array;
export type CompatibleVector = CompatibleTuple | ReadonlyV2d;

/** Immutable interface for V2d that exposes only read-only properties and non-mutating methods. */
export interface ReadonlyV2d {
  readonly 0: number;
  readonly 1: number;
  readonly x: number;
  readonly y: number;
  readonly magnitude: number;
  readonly angle: number;
  readonly squaredMagnitude: number;
  [Symbol.iterator](): IterableIterator<number>;

  add(other: CompatibleTuple): V2d;
  addScaled(other: CompatibleTuple, scale: number): V2d;
  sub(other: CompatibleTuple): V2d;
  mul(scalar: number): V2d;
  div(scalar: number): V2d;
  mulComponent(other: CompatibleTuple): V2d;
  normalize(length?: number): V2d;
  limit(max: number): V2d;
  rotate(angle: number): V2d;
  rotate90cw(): V2d;
  rotate90ccw(): V2d;
  lerp(other: CompatibleTuple, t?: number): V2d;
  reflect(normal: CompatibleTuple): V2d;
  negate(): V2d;
  crossVZ(zcomp: number): V2d;
  crossZV(zcomp: number): V2d;
  toLocalFrame(framePosition: CompatibleTuple, frameAngle: number): V2d;
  toGlobalFrame(framePosition: CompatibleTuple, frameAngle: number): V2d;
  clone(): V2d;

  dot(other: CompatibleTuple): number;
  crossLength(other: CompatibleTuple): number;
  distanceTo(other: CompatibleTuple): number;
  squaredDistanceTo(other: CompatibleTuple): number;
  equals(other: CompatibleTuple): boolean;
}

export function V(
  x?: number | CompatibleVector | { x: number; y: number },
  y?: number,
) {
  if (x instanceof V2d) {
    return x.clone();
  } else if (
    x instanceof Array ||
    x instanceof Float32Array ||
    x instanceof Float64Array
  ) {
    return new V2d(x[0], x[1]);
  } else if (typeof x === "object") {
    // object with x, y properties
    return new V2d(x.x, x.y);
  }
  return new V2d(x ?? 0, y ?? x ?? 0);
}

type NumberTuple = [number, number];

/**
 * A 2D vector class extending Array that provides comprehensive vector mathematics operations.
 * Supports both in-place and non-mutating operations for performance optimization.
 * Can be used as a tuple [x, y] or accessed via .x and .y properties.
 *
 * @example
 * const v = new V2d(3, 4);
 * console.log(v.magnitude); // 5
 * const normalized = v.normalize();
 */
export class V2d extends Array implements NumberTuple, ReadonlyV2d {
  0: number;
  1: number;
  length: 2 = 2;

  constructor(x: number, y: number) {
    super();
    if (isNaN(x) || isNaN(y)) {
      throw new Error(`Can't make a V2d with NaN ${x},${y}`);
    }
    this[0] = x;
    this[1] = y;
  }

  static fromPolar(radius: number, theta: number) {
    return new V2d(radius * Math.cos(theta), radius * Math.sin(theta));
  }

  get v() {
    return this;
  }

  /** Return the result of adding this vector to another. */
  add(other: CompatibleVector) {
    return this.clone().iadd(other);
  }

  /** (In Place) Return the result of adding this vector to another. */
  iadd(other: CompatibleVector) {
    this[0] += other[0];
    this[1] += other[1];
    return this;
  }

  /** Return the result of multiplying a scalar by another vector and adding it to this. */
  addScaled(other: CompatibleVector, scale: number) {
    return this.clone().iaddScaled(other, scale);
  }

  /** (In Place) Return the result of multiplying a scalar by another vector and adding it to this. */
  iaddScaled(other: CompatibleVector, scale = 1) {
    this[0] += other[0] * scale;
    this[1] += other[1] * scale;
    return this;
  }

  /** Return the result of subtracting a vector from this one. */
  sub(other: CompatibleVector) {
    return this.clone().isub(other);
  }

  /** (In Place) Return the result of subtracting a vector from this one. */
  isub(other: CompatibleVector) {
    this[0] -= other[0];
    this[1] -= other[1];
    return this;
  }

  /** Return the result of multiplying this vector by a scalar. */
  mul(scalar: number) {
    return this.clone().imul(scalar);
  }

  /** (In Place) Return the result of multiplying this vector by a scalar. */
  imul(scalar: number) {
    this[0] *= scalar;
    this[1] *= scalar;
    return this;
  }

  /** Return the result of multiplying this vector by another vector componentwise. */
  mulComponent(other: CompatibleVector) {
    return this.clone().imulComponent(other);
  }

  /** (In Place) Return the result of multiplying this vector by another vector componentwise. */
  imulComponent(other: CompatibleVector) {
    this[0] *= other[0];
    this[1] *= other[1];
    return this;
  }

  /** Returns the result of rotating this vector 90 decgrees clockwise */
  rotate90cw() {
    return new V2d(this[1], -this[0]);
  }

  /** (In Place) Returns the result of rotating this vector 90 decgrees clockwise */
  irotate90cw() {
    [this[0], this[1]] = [this[1], -this[0]];
    return this;
  }

  /** Returns the result of rotating this vector 90 decgrees counter-clockwise */
  rotate90ccw() {
    return new V2d(-this[1], this[0]);
  }

  /** (In Place) Returns the result of rotating this vector 90 decgrees counter-clockwise */
  irotate90ccw() {
    [this[0], this[1]] = [-this[1], this[0]];
    return this;
  }

  /** Return the result of rotating this angle by `angle` radians ccw. */
  rotate(angle: number) {
    return this.clone().irotate(angle);
  }

  /** (In Place) Return the result of rotating this angle by `angle` radians ccw. */
  irotate(angle: number) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this[0];
    const y = this[1];
    this[0] = cos * x - sin * y;
    this[1] = sin * x + cos * y;
    return this;
  }

  /** Return the dot product of this and another vector */
  dot(other: CompatibleVector) {
    return this[0] * other[0] + this[1] * other[1];
  }

  /** Set the components of this vector */
  set(x: CompatibleVector): this;
  set(x: number, y: number): this;
  set(x: number | CompatibleVector, y: number | void): this {
    if (typeof x === "number") {
      this[0] = x;
      this[1] = y!;
    } else {
      this[0] = x[0];
      this[1] = x[1];
    }
    return this;
  }

  /** Return a normalized version of this vector */
  normalize(length: number = 1) {
    return this.clone().inormalize(length);
  }

  /** (In Place) Return a normalized version of this vector */
  inormalize(length: number = 1) {
    if (!(this[0] === 0 && this[1] === 0)) {
      this.magnitude = length;
    }
    return this;
  }

  /**
   * Returns a new vector with magnitude limited to the specified maximum.
   * If current magnitude is less than max, returns unchanged vector.
   * @param max - Maximum allowed magnitude
   * @returns New vector with limited magnitude
   */
  limit(max: number) {
    return this.clone().ilimit(max);
  }

  /**
   * (In-place) Limits this vector's magnitude to the specified maximum.
   * If current magnitude is less than max, vector remains unchanged.
   * @param max - Maximum allowed magnitude
   * @returns This vector for method chaining
   */
  ilimit(max: number) {
    if (this.magnitude > max) {
      this.magnitude = max;
    }
    return this;
  }

  /** Return a new vector with the same values as this one */
  clone() {
    return new V2d(this[0], this[1]);
  }

  /** Return a vector that is between this and other */
  lerp(other: CompatibleVector, t: number = 0) {
    return this.clone().ilerp(other, t);
  }

  /** (In place) Return a vector that is between this and other */
  ilerp(other: CompatibleVector, t: number = 0) {
    this[0] = lerp(this[0], other[0], t);
    this[1] = lerp(this[1], other[1], t);
    return this;
  }

  equals(other: CompatibleVector) {
    return other != undefined && other[0] == this[0] && other[1] == this[1];
  }

  /** Alias for [0]. */
  get x(): number {
    return this[0];
  }

  set x(value: number) {
    this[0] = value;
  }

  /** Alias for [1] */
  get y(): number {
    return this[1];
  }
  set y(value: number) {
    this[1] = value;
  }

  /**
   * The magnitude (length) of this vector.
   * Changing it does not change the angle.
   */
  get magnitude(): number {
    return Math.sqrt(this[0] * this[0] + this[1] * this[1]) || 0;
  }
  set magnitude(value) {
    if (this[0] !== 0 || this[1] !== 0) {
      this.imul(value / this.magnitude);
    }
  }

  /**
   * The angle in radians ccw from east of this vector.
   * Changing it does not change the magnitude.
   */
  get angle(): number {
    return Math.atan2(this[1], this[0]);
  }
  set angle(value: number) {
    this.irotate(value - this.angle);
  }

  /**
   * The squared magnitude (length) of this vector.
   * Faster than magnitude when you only need to compare distances.
   */
  get squaredMagnitude(): number {
    return this[0] * this[0] + this[1] * this[1];
  }

  /**
   * Returns the z-component of the cross product of this and another 2D vector.
   * This is equivalent to the signed area of the parallelogram formed by the two vectors.
   */
  crossLength(other: CompatibleVector): number {
    return this[0] * other[1] - this[1] * other[0];
  }

  /**
   * Cross product of this vector with a z-component scalar.
   * Rotates 90 degrees clockwise and scales by zcomp.
   */
  crossVZ(zcomp: number): V2d {
    return this.clone().icrossVZ(zcomp);
  }

  /** (In Place) Cross product of this vector with a z-component scalar. */
  icrossVZ(zcomp: number): this {
    const x = this[0];
    const y = this[1];
    this[0] = y * zcomp;
    this[1] = -x * zcomp;
    return this;
  }

  /**
   * Cross product of a z-component scalar with this vector.
   * Rotates 90 degrees counter-clockwise and scales by zcomp.
   */
  crossZV(zcomp: number): V2d {
    return this.clone().icrossZV(zcomp);
  }

  /** (In Place) Cross product of a z-component scalar with this vector. */
  icrossZV(zcomp: number): this {
    const x = this[0];
    const y = this[1];
    this[0] = -y * zcomp;
    this[1] = x * zcomp;
    return this;
  }

  /** Returns the distance from this point to another point. */
  distanceTo(other: CompatibleVector): number {
    const dx = other[0] - this[0];
    const dy = other[1] - this[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** Returns the squared distance from this point to another point. Faster than distanceTo. */
  squaredDistanceTo(other: CompatibleVector): number {
    const dx = other[0] - this[0];
    const dy = other[1] - this[1];
    return dx * dx + dy * dy;
  }

  /** Returns this vector reflected across a normal. */
  reflect(normal: CompatibleVector): V2d {
    return this.clone().ireflect(normal);
  }

  /** (In Place) Reflects this vector across a normal. */
  ireflect(normal: CompatibleVector): this {
    const d = 2 * this.dot(normal);
    this[0] -= normal[0] * d;
    this[1] -= normal[1] * d;
    return this;
  }

  /** Returns the negation of this vector. */
  negate(): V2d {
    return this.clone().inegate();
  }

  /** (In Place) Negates this vector. */
  inegate(): this {
    this[0] = -this[0];
    this[1] = -this[1];
    return this;
  }

  /** Return the result of dividing this vector by a scalar. */
  div(scalar: number): V2d {
    return this.clone().idiv(scalar);
  }

  /** (In Place) Divides this vector by a scalar. */
  idiv(scalar: number): this {
    this[0] /= scalar;
    this[1] /= scalar;
    return this;
  }

  /** Transform this world point to a local frame defined by position and angle. */
  toLocalFrame(framePosition: CompatibleVector, frameAngle: number): V2d {
    return this.clone().itoLocalFrame(framePosition, frameAngle);
  }

  /** (In Place) Transform this world point to a local frame. */
  itoLocalFrame(framePosition: CompatibleVector, frameAngle: number): this {
    return this.isub(framePosition).irotate(-frameAngle);
  }

  /** Transform this local point to world frame defined by position and angle. */
  toGlobalFrame(framePosition: CompatibleVector, frameAngle: number): V2d {
    return this.clone().itoGlobalFrame(framePosition, frameAngle);
  }

  /** (In Place) Transform this local point to world frame. */
  itoGlobalFrame(framePosition: CompatibleVector, frameAngle: number): this {
    return this.irotate(frameAngle).iadd(framePosition);
  }

  // Static utility methods

  /** Returns the intersection point of two line segments, or null if they don't intersect. */
  static lineSegmentsIntersection(
    p0: CompatibleVector,
    p1: CompatibleVector,
    p2: CompatibleVector,
    p3: CompatibleVector,
  ): V2d | null {
    const t = V2d.lineSegmentsIntersectionFraction(p0, p1, p2, p3);
    if (t < 0) return null;
    return new V2d(p0[0] + t * (p1[0] - p0[0]), p0[1] + t * (p1[1] - p0[1]));
  }

  /**
   * Returns the intersection fraction (0-1) along the first line segment,
   * or -1 if the segments don't intersect.
   */
  static lineSegmentsIntersectionFraction(
    p0: CompatibleVector,
    p1: CompatibleVector,
    p2: CompatibleVector,
    p3: CompatibleVector,
  ): number {
    const s1_x = p1[0] - p0[0];
    const s1_y = p1[1] - p0[1];
    const s2_x = p3[0] - p2[0];
    const s2_y = p3[1] - p2[1];

    const denom = -s2_x * s1_y + s1_x * s2_y;
    if (denom === 0) return -1; // Parallel lines

    const s = (-s1_y * (p0[0] - p2[0]) + s1_x * (p0[1] - p2[1])) / denom;
    const t = (s2_x * (p0[1] - p2[1]) - s2_y * (p0[0] - p2[0])) / denom;

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
      return t;
    }
    return -1;
  }

  /** Returns the centroid of a triangle defined by three points. */
  static centroid(
    a: CompatibleVector,
    b: CompatibleVector,
    c: CompatibleVector,
  ): V2d {
    return new V2d((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3);
  }
}
