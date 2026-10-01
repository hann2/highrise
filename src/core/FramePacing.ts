/**
 * How the game loop decides when to tick and render: once per display refresh,
 * with the simulation stepped by the ideal frame time (1 / refresh rate), not
 * by however long the frame happened to take. There's no way to ask a browser
 * for the display's refresh rate, so `RefreshRateEstimator` measures it from
 * `requestAnimationFrame` timestamps, and `FramePacer` turns each callback into
 * a number of frames to simulate (usually 1). Both are plain logic with no
 * browser in them, so they're tested in node (`tests/core/`).
 */

/** Refresh rates displays really have; measured rates close to one are snapped to it */
const COMMON_RATES = [
  30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 180, 240, 360,
];
/**
 * Measured rates below this aren't a display's; they mean the game (or the
 * page, while it loads) is busy, so they're ignored
 */
const MIN_RATE = 28;
/**
 * The first estimate waits for intervals this consistent: the middle half of
 * them within this fraction of the median. The first frames, while the game
 * loads, are all over the place.
 */
const FIRST_SPREAD = 0.1;
/** How close (as a fraction) a measured rate has to be to a common one to snap to it */
const SNAP_TOLERANCE = 0.05;
/** How many frame intervals the estimate is the median of */
const SAMPLE_COUNT = 60;
/** How many frame intervals it takes to make the first estimate, which is made from only the latest ones */
const FIRST_SAMPLE_COUNT = 20;
/** Re-estimate every this many frames */
const ESTIMATE_EVERY = 10;
/** Intervals longer than this (seconds) are gaps, like a hidden tab, not frames */
const MAX_INTERVAL = 0.2;
/** Seconds a lower rate has to hold before it's believed */
const LOWER_DELAY = 0.5;
/** Seconds a higher rate has to hold before it's believed, at first */
const RAISE_DELAY = 1;
/** The longest `RAISE_DELAY` gets after raises that didn't hold */
const MAX_RAISE_DELAY = 60;
/** A raise that's followed by a drop within this many seconds didn't hold */
const FAILED_RAISE_WINDOW = 5;

/** `hz` snapped to the nearest common refresh rate, if it's close to one */
export function snapRefreshRate(hz: number): number {
  let best = COMMON_RATES[0];
  for (const rate of COMMON_RATES) {
    if (Math.abs(rate - hz) < Math.abs(best - hz)) {
      best = rate;
    }
  }
  return Math.abs(best - hz) / best <= SNAP_TOLERANCE ? best : Math.round(hz);
}

/**
 * Measures the display's refresh rate from the times of animation frame
 * callbacks, which browsers line up with the display's refreshes. The median
 * interval ignores the odd dropped frame, and a new rate has to hold for a
 * while before it's taken, so a moment's stutter doesn't change it. It keeps
 * measuring, so it notices moving to another display or a power saving mode
 * that halves the frame rate.
 *
 * A game that can't keep up looks the same as a slower display (the callbacks
 * come less often), so it's taken as one: the frame rate drops to what the
 * machine manages. Once it's easily managing that rate, the callbacks come at
 * the display's rate again and it goes back up, and if that doesn't hold, it
 * waits twice as long before trying again.
 */
export class RefreshRateEstimator {
  /** The refresh rate in Hz, snapped to a common one */
  rate: number;
  /** Seconds between refreshes, as measured (not snapped), for keeping time */
  interval: number;
  /** A known upper limit, like the display's rate as the desktop app reports it */
  maxRate: number | undefined;

  private intervals: number[] = [];
  private lastTime: number | undefined;
  private framesSinceEstimate = 0;
  private settled = false;
  private candidate: number | undefined;
  private candidateSince = 0;
  private raiseDelay = RAISE_DELAY;
  private lastRaiseAt = -Infinity;
  private now = 0;

  constructor(initialRate: number = 60, maxRate?: number) {
    this.rate = initialRate;
    this.interval = 1 / initialRate;
    this.maxRate = maxRate;
  }

  /** Call with the timestamp (seconds) of every animation frame callback */
  addFrame(time: number) {
    const last = this.lastTime;
    this.lastTime = time;
    this.now = time;
    if (last === undefined) {
      return;
    }
    const interval = time - last;
    if (interval <= 0 || interval > MAX_INTERVAL) {
      return;
    }
    this.intervals.push(interval);
    if (this.intervals.length > SAMPLE_COUNT) {
      this.intervals.shift();
    }
    this.framesSinceEstimate += 1;
    if (
      this.framesSinceEstimate >= ESTIMATE_EVERY &&
      this.intervals.length >= FIRST_SAMPLE_COUNT
    ) {
      this.framesSinceEstimate = 0;
      const measured = this.measure();
      if (measured !== undefined) {
        this.consider(measured.rate);
        if (measured.rate === this.rate) {
          this.interval = measured.interval;
        }
      }
    }
  }

  /**
   * The rate the recent intervals say, snapped, and their median, or
   * undefined if they don't say one
   */
  private measure(): { rate: number; interval: number } | undefined {
    // The first estimate only looks at the latest frames, past any loading
    const recent = this.settled
      ? this.intervals
      : this.intervals.slice(-FIRST_SAMPLE_COUNT);
    const sorted = [...recent].sort((a, b) => a - b);
    const quartile = (q: number) => sorted[Math.floor(sorted.length * q)];
    const median = quartile(0.5);
    if (
      !this.settled &&
      quartile(0.75) - quartile(0.25) > FIRST_SPREAD * median
    ) {
      return undefined;
    }
    const measured = snapRefreshRate(1 / median);
    if (measured < MIN_RATE) {
      return undefined;
    }
    const rate = this.maxRate ? Math.min(measured, this.maxRate) : measured;
    return { rate, interval: rate === measured ? median : 1 / rate };
  }

  private consider(measured: number) {
    if (!this.settled) {
      this.settled = true;
      this.rate = measured;
      return;
    }
    if (measured === this.rate) {
      this.candidate = undefined;
      return;
    }
    if (measured !== this.candidate) {
      this.candidate = measured;
      this.candidateSince = this.now;
      return;
    }
    const raising = measured > this.rate;
    const delay = raising ? this.raiseDelay : LOWER_DELAY;
    if (this.now - this.candidateSince < delay) {
      return;
    }
    if (raising) {
      this.lastRaiseAt = this.now;
    } else if (this.now - this.lastRaiseAt < FAILED_RAISE_WINDOW) {
      this.raiseDelay = Math.min(this.raiseDelay * 2, MAX_RAISE_DELAY);
    }
    this.rate = measured;
    this.candidate = undefined;
    // Fresh samples for the new rate, so the old ones don't pull it back
    this.intervals = [];
  }
}

/** The most frames one callback simulates to catch up; any more and the game slows down instead */
export const MAX_CATCH_UP_FRAMES = 3;
/** An interval within this fraction of a whole number of refreshes counts as exactly that many */
const REFRESH_SNAP = 0.25;
/**
 * How far (in refreshes) counting whole refreshes may take the game from real
 * time. Callbacks that come with a display's refreshes stay far inside it;
 * ones that don't (no vsync, in benchmarks) would otherwise gain or lose time
 * with every rounding.
 */
const MAX_SLIP = 1;

/**
 * Turns animation frame callbacks into frames to simulate. Time is counted in
 * display refreshes, so each callback on time is exactly one refresh and
 * timing jitter never adds or drops a frame. At the display's rate, that's one
 * frame per callback; with a lower target, some callbacks are skipped (neither
 * ticked nor rendered). A late callback (a dropped frame) simulates the frames
 * it missed, up to `MAX_CATCH_UP_FRAMES`; beyond that the time is let go, so
 * a game that can't keep up slows down instead of falling further behind.
 */
export class FramePacer {
  /** Frames owed, as a fraction */
  private owed = 0;
  /** Refreshes counted minus refreshes that really went by, from rounding */
  private slip = 0;

  /**
   * How many frames to simulate for a callback `elapsed` seconds after the
   * last one, running at `targetRate` on a `refreshRate` display whose
   * refreshes are `refreshInterval` seconds apart. 0 means skip this callback.
   */
  framesFor(
    elapsed: number,
    refreshInterval: number,
    refreshRate: number,
    targetRate: number,
  ): number {
    let refreshes = elapsed / refreshInterval;
    const whole = Math.round(refreshes);
    const slip = this.slip + whole - refreshes;
    if (
      whole >= 1 &&
      Math.abs(refreshes - whole) < REFRESH_SNAP &&
      Math.abs(slip) <= MAX_SLIP
    ) {
      refreshes = whole;
      this.slip = slip;
    }
    this.owed += (refreshes * Math.min(targetRate, refreshRate)) / refreshRate;
    // A little slack for rounding, like 144 Hz refreshes adding up to 60 Hz frames
    const frames = Math.floor(this.owed + 1e-6);
    if (frames <= 0) {
      return 0;
    }
    if (frames > MAX_CATCH_UP_FRAMES) {
      this.owed = 0;
      return MAX_CATCH_UP_FRAMES;
    }
    this.owed -= frames;
    return frames;
  }
}
