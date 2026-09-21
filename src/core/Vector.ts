import { lerp } from "./util/MathUtil";

type CompatibleVector = V2d | [number, number] | Float32Array;

export function V(x?: number | CompatibleVector, y?: number) {
  if (x instanceof V2d) {
    return x.clone();
  } else if (x instanceof Array || x instanceof Float32Array) {
    return new V2d(x[0], x[1]);
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
export class V2d extends Array implements NumberTuple {
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

  /**
   * Alias for [0].
   */
  get x(): number {
    return this[0];
  }

  set x(value: number) {
    this[0] = value;
  }

  /**
   * Alias for [1]
   */
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
}
