import { clamp, lerp } from "../util/MathUtil";
import { V, V2d } from "../Vector";
import { ease, Easing } from "./easing";

/** A value at a time in an animation */
export interface Keyframe<T> {
  /** Seconds from the start of the animation */
  readonly t: number;
  /** The value then */
  readonly v: T;
  /** How the value gets here from the keyframe before: `smooth` if not given */
  readonly ease?: Easing;
}

/**
 * How one value changes over an animation: keyframes in order of time. Before
 * the first keyframe it has the first one's value, after the last the last's.
 */
export type Track<T> = ReadonlyArray<Keyframe<T>>;

/** Where `time` is in a track: between `from` and `to`, `u` of the way (eased) */
export interface Segment<T> {
  readonly from: T;
  readonly to: T;
  readonly u: number;
}

/**
 * The keyframes either side of `time` and how far it is from one to the
 * other, eased. For values that aren't simply numbers, which the caller
 * interpolates itself (`sampleNumber` and `sampleVec` are for those that are).
 */
export function segmentAt<T>(track: Track<T>, time: number): Segment<T> {
  if (track.length === 0) {
    throw new Error("Empty animation track");
  }
  const first = track[0];
  if (time <= first.t) {
    return { from: first.v, to: first.v, u: 0 };
  }
  for (let i = 1; i < track.length; i++) {
    const next = track[i];
    if (time < next.t) {
      const prev = track[i - 1];
      const t = clamp((time - prev.t) / (next.t - prev.t));
      return { from: prev.v, to: next.v, u: ease(next.ease ?? "smooth", t) };
    }
  }
  const last = track[track.length - 1];
  return { from: last.v, to: last.v, u: 0 };
}

export function sampleNumber(track: Track<number>, time: number): number {
  const { from, to, u } = segmentAt(track, time);
  return lerp(from, to, u);
}

export function sampleVec(
  track: Track<readonly [number, number]>,
  time: number,
): V2d {
  const { from, to, u } = segmentAt(track, time);
  return V(lerp(from[0], to[0], u), lerp(from[1], to[1], u));
}

/** The value of the last keyframe at or before `time`: for values that jump, like what's visible */
export function sampleStep<T>(track: Track<T>, time: number): T {
  let value = track[0].v;
  for (const keyframe of track) {
    if (keyframe.t > time) {
      break;
    }
    value = keyframe.v;
  }
  return value;
}
