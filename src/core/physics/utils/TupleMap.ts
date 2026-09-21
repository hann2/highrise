import { objectKeys } from "../../util/ObjectUtils";

/**
 * Stores data keyed by integer pairs.
 */
export class TupleMap<T> implements Iterable<T> {
  data: Record<number, T> = {};
  m = new Map();

  *[Symbol.iterator](): Iterator<T> {
    for (const key of this.keys) {
      yield this.data[key];
    }
  }

  get keys(): readonly number[] {
    return objectKeys(this.data);
  }

  get length(): number {
    return this.keys.length;
  }

  /**
   * Generate a key given two integers.
   * Ids MUST be less than 2^16.
   */
  makeKey(id1: number, id2: number): number {
    if (id1 === id2) {
      return -1;
    }
    return id1 > id2
      ? (id1 << 16) | (id2 & 0xffff)
      : (id2 << 16) | (id1 & 0xffff);
  }

  getByKey(key: number): T | undefined {
    return this.data[key];
  }

  get(i: number, j: number): T | undefined {
    return this.data[this.makeKey(i, j)];
  }

  set(i: number, j: number, value: T): void {
    this.data[this.makeKey(i, j)] = value;
  }

  reset(): void {
    this.data = {};
  }

  copy(other: TupleMap<T>): void {
    this.reset();
    for (const key of other.keys) {
      this.data[key] = other.data[key];
    }
  }

  /** Delete data for the given pair. */
  delete(i: number, j: number): void {
    const key = this.makeKey(i, j);
    delete this.data[key];
  }
}
