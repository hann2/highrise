import { lerp } from "./util/MathUtil";
import { CompatibleVector, V2d } from "./Vector";

type CompatibleTuple3 = [number, number, number] | Float32Array | Float64Array;
export type CompatibleVector3 = CompatibleTuple3 | ReadonlyV3d;

/** Immutable interface for V3d that exposes only read-only properties and non-mutating methods. */
export interface ReadonlyV3d {
  readonly 0: number;
  readonly 1: number;
  readonly 2: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly magnitude: number;
  readonly squaredMagnitude: number;
  [Symbol.iterator](): IterableIterator<number>;

  add(other: CompatibleTuple3): V3d;
  addScaled(other: CompatibleTuple3, scale: number): V3d;
  sub(other: CompatibleTuple3): V3d;
  mul(scalar: number): V3d;
  div(scalar: number): V3d;
  mulComponent(other: CompatibleTuple3): V3d;
  normalize(length?: number): V3d;
  limit(max: number): V3d;
  lerp(other: CompatibleTuple3, t?: number): V3d;
  reflect(normal: CompatibleTuple3): V3d;
  negate(): V3d;
  cross(other: CompatibleTuple3): V3d;
  clone(): V3d;
  toV2d(): V2d;

  dot(other: CompatibleTuple3): number;
  distanceTo(other: CompatibleTuple3): number;
  squaredDistanceTo(other: CompatibleTuple3): number;
  equals(other: CompatibleTuple3): boolean;
}

export function V3(
  x?: number | CompatibleVector3 | { x: number; y: number; z: number },
  y?: number,
  z?: number,
) {
  if (x instanceof V3d) {
    return x.clone();
  } else if (
    x instanceof Array ||
    x instanceof Float32Array ||
    x instanceof Float64Array
  ) {
    return new V3d(x[0], x[1], x[2]);
  } else if (typeof x === "object") {
    // object with x, y, z properties
    return new V3d(x.x, x.y, x.z);
  }
  return new V3d(x ?? 0, y ?? x ?? 0, z ?? x ?? 0);
}

type NumberTuple3 = [number, number, number];

/**
 * A 3D vector class extending Array that provides comprehensive vector mathematics operations.
 * Supports both in-place and non-mutating operations for performance optimization.
 * Can be used as a tuple [x, y, z] or accessed via .x, .y, and .z properties.
 *
 * @example
 * const v = new V3d(1, 2, 2);
 * console.log(v.magnitude); // 3
 * const normalized = v.normalize();
 */
export class V3d extends Array implements NumberTuple3, ReadonlyV3d {
  0: number;
  1: number;
  2: number;
  length: 3 = 3;

  constructor(x: number, y: number, z: number) {
    super();
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      throw new Error(`Can't make a V3d with NaN ${x},${y},${z}`);
    }
    this[0] = x;
    this[1] = y;
    this[2] = z;
  }

  static fromPolar(radius: number, theta: number, z: number = 0) {
    return new V3d(radius * Math.cos(theta), radius * Math.sin(theta), z);
  }

  /** Create a V3d from a 2D vector and a z component. */
  static fromV2d(v: CompatibleVector, z: number = 0) {
    return new V3d(v[0], v[1], z);
  }

  get v() {
    return this;
  }

  /** Return the result of adding this vector to another. */
  add(other: CompatibleVector3) {
    return this.clone().iadd(other);
  }

  /** (In Place) Return the result of adding this vector to another. */
  iadd(other: CompatibleVector3) {
    this[0] += other[0];
    this[1] += other[1];
    this[2] += other[2];
    return this;
  }

  /** Return the result of multiplying a scalar by another vector and adding it to this. */
  addScaled(other: CompatibleVector3, scale: number) {
    return this.clone().iaddScaled(other, scale);
  }

  /** (In Place) Return the result of multiplying a scalar by another vector and adding it to this. */
  iaddScaled(other: CompatibleVector3, scale = 1) {
    this[0] += other[0] * scale;
    this[1] += other[1] * scale;
    this[2] += other[2] * scale;
    return this;
  }

  /** Return the result of subtracting a vector from this one. */
  sub(other: CompatibleVector3) {
    return this.clone().isub(other);
  }

  /** (In Place) Return the result of subtracting a vector from this one. */
  isub(other: CompatibleVector3) {
    this[0] -= other[0];
    this[1] -= other[1];
    this[2] -= other[2];
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
    this[2] *= scalar;
    return this;
  }

  /** Return the result of multiplying this vector by another vector componentwise. */
  mulComponent(other: CompatibleVector3) {
    return this.clone().imulComponent(other);
  }

  /** (In Place) Return the result of multiplying this vector by another vector componentwise. */
  imulComponent(other: CompatibleVector3) {
    this[0] *= other[0];
    this[1] *= other[1];
    this[2] *= other[2];
    return this;
  }

  /** Return the dot product of this and another vector */
  dot(other: CompatibleVector3) {
    return this[0] * other[0] + this[1] * other[1] + this[2] * other[2];
  }

  /** Set the components of this vector */
  set(x: CompatibleVector3): this;
  set(x: number, y: number, z: number): this;
  set(x: number | CompatibleVector3, y: number | void, z: number | void): this {
    if (typeof x === "number") {
      this[0] = x;
      this[1] = y!;
      this[2] = z!;
    } else {
      this[0] = x[0];
      this[1] = x[1];
      this[2] = x[2];
    }
    return this;
  }

  /** Return a normalized version of this vector */
  normalize(length: number = 1) {
    return this.clone().inormalize(length);
  }

  /** (In Place) Return a normalized version of this vector */
  inormalize(length: number = 1) {
    if (!(this[0] === 0 && this[1] === 0 && this[2] === 0)) {
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
    return new V3d(this[0], this[1], this[2]);
  }

  /** Return a vector that is between this and other */
  lerp(other: CompatibleVector3, t: number = 0) {
    return this.clone().ilerp(other, t);
  }

  /** (In place) Return a vector that is between this and other */
  ilerp(other: CompatibleVector3, t: number = 0) {
    this[0] = lerp(this[0], other[0], t);
    this[1] = lerp(this[1], other[1], t);
    this[2] = lerp(this[2], other[2], t);
    return this;
  }

  equals(other: CompatibleVector3) {
    return (
      other != undefined &&
      other[0] == this[0] &&
      other[1] == this[1] &&
      other[2] == this[2]
    );
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

  /** Alias for [2] */
  get z(): number {
    return this[2];
  }
  set z(value: number) {
    this[2] = value;
  }

  /**
   * The magnitude (length) of this vector.
   * Changing it does not change the direction.
   */
  get magnitude(): number {
    return (
      Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2]) || 0
    );
  }
  set magnitude(value) {
    if (this[0] !== 0 || this[1] !== 0 || this[2] !== 0) {
      this.imul(value / this.magnitude);
    }
  }

  /**
   * The squared magnitude (length) of this vector.
   * Faster than magnitude when you only need to compare distances.
   */
  get squaredMagnitude(): number {
    return this[0] * this[0] + this[1] * this[1] + this[2] * this[2];
  }

  /**
   * Returns the cross product of this and another 3D vector.
   */
  cross(other: CompatibleVector3): V3d {
    return this.clone().icross(other);
  }

  /** (In Place) Cross product of this vector with another 3D vector. */
  icross(other: CompatibleVector3): this {
    const x = this[0];
    const y = this[1];
    const z = this[2];
    this[0] = y * other[2] - z * other[1];
    this[1] = z * other[0] - x * other[2];
    this[2] = x * other[1] - y * other[0];
    return this;
  }

  /** Returns the distance from this point to another point. */
  distanceTo(other: CompatibleVector3): number {
    const dx = other[0] - this[0];
    const dy = other[1] - this[1];
    const dz = other[2] - this[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /** Returns the squared distance from this point to another point. Faster than distanceTo. */
  squaredDistanceTo(other: CompatibleVector3): number {
    const dx = other[0] - this[0];
    const dy = other[1] - this[1];
    const dz = other[2] - this[2];
    return dx * dx + dy * dy + dz * dz;
  }

  /** Returns this vector reflected across a normal. */
  reflect(normal: CompatibleVector3): V3d {
    return this.clone().ireflect(normal);
  }

  /** (In Place) Reflects this vector across a normal. */
  ireflect(normal: CompatibleVector3): this {
    const d = 2 * this.dot(normal);
    this[0] -= normal[0] * d;
    this[1] -= normal[1] * d;
    this[2] -= normal[2] * d;
    return this;
  }

  /** Returns the negation of this vector. */
  negate(): V3d {
    return this.clone().inegate();
  }

  /** (In Place) Negates this vector. */
  inegate(): this {
    this[0] = -this[0];
    this[1] = -this[1];
    this[2] = -this[2];
    return this;
  }

  /** Return the result of dividing this vector by a scalar. */
  div(scalar: number): V3d {
    return this.clone().idiv(scalar);
  }

  /** (In Place) Divides this vector by a scalar. */
  idiv(scalar: number): this {
    this[0] /= scalar;
    this[1] /= scalar;
    this[2] /= scalar;
    return this;
  }

  /** Returns a new V2d containing the x and y components of this vector, dropping z. */
  toV2d(): V2d {
    return new V2d(this[0], this[1]);
  }
}
