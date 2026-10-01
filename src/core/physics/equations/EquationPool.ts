import type { Body } from "../body/Body";
import type { Equation } from "./Equation";

/**
 * Equations to reuse from one physics step to the next, rather than making
 * new ones (with their vectors and arrays) for every contact every step and
 * leaving the old ones to the garbage collector. `take` hands out the next
 * free one, reset to be as good as new; `releaseAll` frees them all for the
 * next step, after which nothing may use them.
 */
export class EquationPool<T extends Equation> {
  private items: T[] = [];
  private used = 0;

  constructor(private create: (bodyA: Body, bodyB: Body) => T) {}

  /** An equation between `bodyA` and `bodyB`, as if new */
  take(bodyA: Body, bodyB: Body): T {
    if (this.used < this.items.length) {
      const equation = this.items[this.used++];
      equation.reset(bodyA, bodyB);
      return equation;
    }
    const equation = this.create(bodyA, bodyB);
    this.items.push(equation);
    this.used++;
    return equation;
  }

  /** Frees every equation taken, for the next step */
  releaseAll(): void {
    // After a big pile-up, let most of the spares go, along with the bodies
    // they still point at
    if (this.items.length > 2 * this.used + 64) {
      this.items.length = this.used + 64;
    }
    this.used = 0;
  }

  /** How many equations are taken */
  get size(): number {
    return this.used;
  }
}
