/**
 * Tests for the game loop's frame pacing (`src/core/FramePacing.ts`): the
 * refresh rate estimate and how many frames each animation frame callback
 * runs. Plain node, no browser: `npm run test:core`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FramePacer,
  MAX_CATCH_UP_FRAMES,
  RefreshRateEstimator,
  snapRefreshRate,
} from "../../src/core/FramePacing";

/** A deterministic wobble of up to `amount` seconds, like real callback timing */
function jitter(i: number, amount: number): number {
  return Math.sin(i * 12.9898) * amount;
}

/** Feeds `seconds` of callbacks at `hz` (with a little jitter), starting at `start` */
function feed(
  estimator: RefreshRateEstimator,
  hz: number,
  seconds: number,
  start: number,
): number {
  const count = Math.round(seconds * hz);
  for (let i = 1; i <= count; i++) {
    estimator.addFrame(start + i / hz + jitter(i, 0.0003));
  }
  return start + seconds;
}

test("snaps measured rates to common ones", () => {
  assert.equal(snapRefreshRate(59.7), 60);
  assert.equal(snapRefreshRate(119.88), 120);
  assert.equal(snapRefreshRate(143), 144);
  assert.equal(snapRefreshRate(29.9), 30);
  // Nothing common nearby: rounded
  assert.equal(snapRefreshRate(110.4), 110);
});

test("measures the refresh rate", () => {
  for (const hz of [60, 75, 120, 144, 240]) {
    const estimator = new RefreshRateEstimator();
    feed(estimator, hz, 1, 0);
    assert.equal(estimator.rate, hz, `${hz} Hz`);
  }
});

test("isn't fooled by the long, uneven frames of loading", () => {
  const estimator = new RefreshRateEstimator();
  let t = 0;
  // Two seconds of frames between 50 and 150 ms, then 120 Hz
  for (let i = 0; i < 20; i++) {
    t += 0.05 + (i % 3) * 0.05;
    estimator.addFrame(t);
  }
  assert.equal(estimator.rate, 60, "still the initial guess");
  feed(estimator, 120, 0.5, t);
  assert.equal(estimator.rate, 120);
});

test("a few dropped frames don't change the estimate", () => {
  const estimator = new RefreshRateEstimator();
  let t = feed(estimator, 120, 1, 0);
  // One in five frames takes two refreshes, for five seconds
  for (let i = 0; i < 500; i++) {
    t += (i % 5 === 0 ? 2 : 1) / 120;
    estimator.addFrame(t);
  }
  assert.equal(estimator.rate, 120);
});

test("follows a drop in the refresh rate, like power saving, and back", () => {
  const estimator = new RefreshRateEstimator();
  let t = feed(estimator, 120, 1, 0);
  t = feed(estimator, 60, 0.3, t);
  assert.equal(estimator.rate, 120, "not after a moment");
  t = feed(estimator, 60, 1.5, t);
  assert.equal(estimator.rate, 60);
  t = feed(estimator, 120, 0.5, t);
  assert.equal(estimator.rate, 60, "raising takes longer");
  feed(estimator, 120, 2, t);
  assert.equal(estimator.rate, 120);
});

test("waits longer each time a raise doesn't hold", () => {
  const estimator = new RefreshRateEstimator();
  let t = feed(estimator, 120, 1, 0);
  t = feed(estimator, 60, 2, t);
  assert.equal(estimator.rate, 60);
  // Back up, then straight back down: the raise failed
  t = feed(estimator, 120, 2, t);
  assert.equal(estimator.rate, 120);
  t = feed(estimator, 60, 2, t);
  assert.equal(estimator.rate, 60);
  // A second raise now needs longer than the first one did
  t = feed(estimator, 120, 1.8, t);
  assert.equal(estimator.rate, 60);
  feed(estimator, 120, 1.5, t);
  assert.equal(estimator.rate, 120);
});

test("never goes above a known maximum", () => {
  const estimator = new RefreshRateEstimator(60, 120);
  feed(estimator, 144, 1, 0);
  assert.equal(estimator.rate, 120);
});

test("ignores long gaps, like a hidden tab", () => {
  const estimator = new RefreshRateEstimator();
  let t = feed(estimator, 144, 1, 0);
  for (let i = 0; i < 100; i++) {
    t += 1;
    estimator.addFrame(t);
  }
  assert.equal(estimator.rate, 144);
});

/** Frames run for each of `intervals`, at `refresh` Hz aiming for `target` */
function run(
  intervals: number[],
  refresh: number,
  target: number = refresh,
): number[] {
  const pacer = new FramePacer();
  return intervals.map((dt) =>
    pacer.framesFor(dt, 1 / refresh, refresh, target),
  );
}

test("one frame per callback at the display's rate, whatever the jitter", () => {
  const intervals = Array.from(
    { length: 1000 },
    (_, i) => 1 / 120 + jitter(i, 0.0015),
  );
  assert.deepEqual(run(intervals, 120), Array(1000).fill(1));
});

test("catches up the frames a late callback missed", () => {
  const frames = run([1 / 60, 2 / 60, 1 / 60, 3.1 / 60, 1 / 60], 60);
  assert.deepEqual(frames, [1, 2, 1, 3, 1]);
});

test("slows down rather than catching up too much", () => {
  const frames = run([1 / 60, 10 / 60, 1 / 60], 60);
  assert.deepEqual(frames, [1, MAX_CATCH_UP_FRAMES, 1]);
});

test("a lower target skips callbacks evenly", () => {
  assert.deepEqual(
    run(Array(8).fill(1 / 120), 120, 60),
    [0, 1, 0, 1, 0, 1, 0, 1],
  );
  // 144 Hz at 60: 5 frames every 12 refreshes, never 2 in one callback
  const frames = run(Array(144).fill(1 / 144), 144, 60);
  assert.equal(
    frames.reduce((a, b) => a + b, 0),
    60,
  );
  assert.ok(frames.every((n) => n <= 1));
});

test("keeps real time when callbacks don't line up with refreshes", () => {
  // Benchmarks run without vsync, far faster than the rate they pretend to have
  const frames = run(Array(800).fill(1 / 800), 120);
  const total = frames.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 120) <= 1, `${total} frames in a second`);
  assert.ok(frames.every((n) => n <= 1));
});

test("keeps real time when callbacks come a little faster than refreshes", () => {
  // Like a benchmark without vsync that renders in 7 ms: each interval is
  // close enough to a refresh to be rounded up to one
  const frames = run(Array(1200).fill(0.007), 120);
  const total = frames.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 1200 * 0.007 * 120) <= 2, `${total} frames`);
});

test("measures the real interval, for keeping time on a display a little off its rate", () => {
  const estimator = new RefreshRateEstimator();
  feed(estimator, 119.88, 1, 0);
  assert.equal(estimator.rate, 120);
  assert.ok(Math.abs(1 / estimator.interval - 119.88) < 0.5);
});
