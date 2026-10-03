import { smootherStep, smoothStep } from "../util/MathUtil";

/**
 * How a value gets from one keyframe to the next: `t` (0 to 1, the time
 * between them) to how far the value has gone.
 *
 * - `linear`: at a constant speed
 * - `smooth`: speeds up and slows down (smoothstep)
 * - `smoother`: the same, with gentler ends (smootherstep)
 * - `in`: starts slow, arrives fast, like something dropped
 * - `out`: starts fast, arrives slow, like something thrown up to a stop
 * - `overshoot`: goes a little past and settles back, like a slap
 * - `step`: stays put, then jumps on arrival
 */
export type Easing =
  "linear" | "smooth" | "smoother" | "in" | "out" | "overshoot" | "step";

/** How far past `overshoot` goes: about 10% */
const OVERSHOOT = 1.70158;

export function ease(easing: Easing, t: number): number {
  switch (easing) {
    case "linear":
      return t;
    case "smooth":
      return smoothStep(t);
    case "smoother":
      return smootherStep(t);
    case "in":
      return t * t;
    case "out":
      return 1 - (1 - t) * (1 - t);
    case "overshoot": {
      const s = t - 1;
      return 1 + (OVERSHOOT + 1) * s * s * s + OVERSHOOT * s * s;
    }
    case "step":
      return t < 1 ? 0 : 1;
  }
}
