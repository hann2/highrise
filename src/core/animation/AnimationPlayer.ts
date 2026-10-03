import { clamp, smoothStep } from "../util/MathUtil";

/** Something that happens at a time in an animation, like a sound */
export type TimedEvent<Event> = Event & {
  /** Seconds from the start of the animation */
  readonly t: number;
};

/**
 * Keyframed motion as data: `tracks` is whatever the thing being animated
 * takes (usually an object of `Track`s, sampled by its owner), and `events`
 * happen as time passes them.
 */
export interface Animation<Tracks, Event = never> {
  /** For telling animations apart, in tools and while debugging */
  readonly name: string;
  /** Seconds, as authored. `AnimationPlayer.play` can stretch it to another length. */
  readonly duration: number;
  readonly tracks: Tracks;
  /** In order of time */
  readonly events?: ReadonlyArray<TimedEvent<Event>>;
}

/** An animation at a time, for sampling */
export interface AnimationFrame<Tracks, Event = never> {
  readonly animation: Animation<Tracks, Event>;
  /** Seconds, in the animation's own time */
  readonly time: number;
}

/** Seconds to blend from what was showing to a new animation, unless `play` is told otherwise */
export const DEFAULT_BLEND = 0.08;

/**
 * Plays one animation at a time, blending from whatever was showing before:
 * the last animation, held where it was, or the rest pose. Doesn't know what
 * it's animating: its owner advances it (in a tick, so events happen on game
 * time whether or not anything is drawn) and samples it with `pose`.
 */
export class AnimationPlayer<Tracks, Event = never> {
  /** What's playing, and how many seconds of its own time go by per second */
  private current?: {
    animation: Animation<Tracks, Event>;
    time: number;
    rate: number;
  };
  /** What's being blended away from (undefined is the rest pose) */
  private from?: AnimationFrame<Tracks, Event>;
  /** How far the blend has gone, and how long it takes, in seconds */
  private blendTime = 0;
  private blendDuration = 0;

  constructor(
    /** Called with each event as the animation's time reaches it */
    private onEvent?: (event: TimedEvent<Event>) => void,
  ) {}

  /** The animation playing, if one is */
  get animation(): Animation<Tracks, Event> | undefined {
    return this.current?.animation;
  }

  /** Seconds into the animation playing, in its own time */
  get time(): number {
    return this.current?.time ?? 0;
  }

  /** How far through the animation playing it is, 0 to 1 */
  get progress(): number {
    return this.current
      ? this.current.time / this.current.animation.duration
      : 0;
  }

  isPlaying(animation?: Animation<Tracks, Event>): boolean {
    return animation ? this.current?.animation === animation : !!this.current;
  }

  /**
   * Starts `animation` from the beginning, stretched to take `duration`
   * seconds, blending to it over `blend` seconds from whatever was showing
   */
  play(
    animation: Animation<Tracks, Event>,
    {
      duration = animation.duration,
      blend = DEFAULT_BLEND,
    }: { duration?: number; blend?: number } = {},
  ) {
    this.blendFrom(blend);
    this.current = {
      animation,
      time: 0,
      rate: duration > 0 ? animation.duration / duration : Infinity,
    };
    this.fireEvents(-Infinity, 0);
  }

  /** Stops the animation playing and blends back to the rest pose over `blend` seconds */
  stop(blend = DEFAULT_BLEND) {
    if (this.current) {
      this.blendFrom(blend);
      this.current = undefined;
    }
  }

  /**
   * Holds the animation at `time` (its own seconds), without its events: for
   * scrubbing through one in a tool
   */
  seek(animation: Animation<Tracks, Event>, time: number) {
    this.current = { animation, time, rate: 0 };
    this.from = undefined;
    this.blendDuration = 0;
  }

  /** Moves time on by `dt` seconds, firing events it passes */
  advance(dt: number) {
    this.blendTime += dt;
    const current = this.current;
    if (!current) {
      return;
    }
    const before = current.time;
    const step = current.rate === Infinity ? Infinity : dt * current.rate;
    current.time = Math.min(current.time + step, current.animation.duration);
    this.fireEvents(before, current.time);
    // Events can play something else
    if (
      this.current === current &&
      current.time >= current.animation.duration &&
      current.rate > 0
    ) {
      this.stop();
    }
  }

  /**
   * What to show: `sample` of the animation playing (or `rest`), blended
   * from what was showing before while a blend is going on
   */
  pose<Pose>(
    sample: (frame: AnimationFrame<Tracks, Event>) => Pose,
    rest: () => Pose,
    blend: (from: Pose, to: Pose, u: number) => Pose,
  ): Pose {
    const target = this.current ? sample(this.current) : rest();
    if (this.blendTime >= this.blendDuration) {
      return target;
    }
    const from = this.from ? sample(this.from) : rest();
    return blend(from, target, smoothStep(this.blendTime / this.blendDuration));
  }

  private blendFrom(blend: number) {
    // Mid-blend, the blend so far is lost: it starts again from whichever
    // side it was mostly on
    if (this.current) {
      this.from = {
        animation: this.current.animation,
        time: this.current.time,
      };
    } else if (this.blendTime >= this.blendDuration / 2) {
      this.from = undefined;
    }
    this.blendTime = 0;
    this.blendDuration = clamp(blend, 0, Infinity);
  }

  private fireEvents(after: number, until: number) {
    const current = this.current;
    for (const event of current?.animation.events ?? []) {
      if (event.t > after && event.t <= until) {
        this.onEvent?.(event);
        // An event that plays something else ends this one's events
        if (this.current !== current) {
          return;
        }
      }
    }
  }
}
