import { shuffle } from "../../core/util/Random";

/**
 * For when you want to get a random element out of a set, but you wanna make
 * sure you're not getting the same one twice in a row.
 *
 * Shuffles lazily, so that rings created at module load time don't consume
 * randomness before the RNG has been seeded.
 */
export class ShuffleRing<T> {
  private values: T[];
  private index = -1;

  constructor(values: readonly T[]) {
    this.values = [...values];
  }

  getNext(): T {
    this.index += 1;
    // Shuffle before the first pass too, not just between passes
    if (this.index === 0 || this.index >= this.values.length) {
      this.index = 0;
      shuffle(this.values);
    }
    return this.values[this.index];
  }
}
