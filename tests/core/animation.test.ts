/**
 * Tests for keyframe animation (`src/core/animation/`): sampling tracks,
 * playing, stretching, events and blending. Plain node: `npm run test:core`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  Animation,
  AnimationPlayer,
} from "../../src/core/animation/AnimationPlayer";
import { ease } from "../../src/core/animation/easing";
import {
  sampleNumber,
  sampleStep,
  sampleVec,
  Track,
} from "../../src/core/animation/Track";

const close = (actual: number, expected: number, message?: string) =>
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `${message ?? ""} expected ${expected}, got ${actual}`,
  );

test("easings start at 0 and end at 1", () => {
  for (const easing of [
    "linear",
    "smooth",
    "smoother",
    "in",
    "out",
    "overshoot",
  ] as const) {
    close(ease(easing, 0), 0, easing);
    close(ease(easing, 1), 1, easing);
  }
  assert.equal(ease("step", 0.99), 0);
  assert.ok(ease("overshoot", 0.8) > 1, "overshoot goes past");
});

test("tracks hold their ends and interpolate between keyframes", () => {
  const track: Track<number> = [
    { t: 1, v: 10 },
    { t: 2, v: 20, ease: "linear" },
    { t: 4, v: 0, ease: "step" },
  ];
  close(sampleNumber(track, 0), 10, "before the first");
  close(sampleNumber(track, 1.5), 15, "linear");
  close(sampleNumber(track, 3.9), 20, "step holds");
  close(sampleNumber(track, 4), 0, "step arrives");
  close(sampleNumber(track, 9), 0, "after the last");

  const vec: Track<[number, number]> = [
    { t: 0, v: [0, 0] },
    { t: 1, v: [2, -2], ease: "linear" },
  ];
  assert.deepEqual([...sampleVec(vec, 0.25)], [0.5, -0.5]);

  const step: Track<string> = [
    { t: 0, v: "a" },
    { t: 1, v: "b" },
  ];
  assert.equal(sampleStep(step, 0.99), "a");
  assert.equal(sampleStep(step, 1), "b");
});

type Tracks = { x: Track<number> };
type Event = { name: string };

const slide: Animation<Tracks, Event> = {
  name: "slide",
  duration: 2,
  tracks: {
    x: [
      { t: 0, v: 0 },
      { t: 2, v: 10, ease: "linear" },
    ],
  },
  events: [
    { t: 0, name: "start" },
    { t: 1, name: "middle" },
    { t: 2, name: "end" },
  ],
};

/** What a player shows, with rest at x = -1 */
function x(player: AnimationPlayer<Tracks, Event>): number {
  return player.pose(
    ({ animation, time }) => sampleNumber(animation.tracks.x, time),
    () => -1,
    (from, to, u) => from + (to - from) * u,
  );
}

test("playing fires events once each as time passes them, then stops", () => {
  const fired: string[] = [];
  const player = new AnimationPlayer<Tracks, Event>((e) => fired.push(e.name));
  player.play(slide, { blend: 0 });
  assert.deepEqual(fired, ["start"], "events at 0 fire right away");
  player.advance(0.5);
  close(x(player), 2.5);
  player.advance(0.5);
  assert.deepEqual(fired, ["start", "middle"]);
  player.advance(5);
  assert.deepEqual(fired, ["start", "middle", "end"]);
  assert.equal(player.isPlaying(), false);
});

test("play stretches an animation to a duration", () => {
  const fired: string[] = [];
  const player = new AnimationPlayer<Tracks, Event>((e) => fired.push(e.name));
  player.play(slide, { duration: 1, blend: 0 });
  player.advance(0.5);
  close(x(player), 5, "half way in half the time");
  assert.deepEqual(fired, ["start", "middle"]);
  player.advance(0.5);
  assert.equal(player.isPlaying(), false);
});

test("blends from the rest pose, and back to it when stopped", () => {
  const player = new AnimationPlayer<Tracks, Event>();
  player.play(slide, { blend: 1 });
  close(x(player), -1, "starts at rest");
  player.advance(0.5);
  // Halfway through the blend (smoothstep: 0.5) from rest (-1) to x = 2.5
  close(x(player), 0.75);
  player.advance(1.5);
  close(x(player), 10);
  player.stop(1);
  close(x(player), 10, "holds where it was");
  player.advance(1);
  close(x(player), -1, "and gets back to rest");
});

test("playing another animation blends from the last, held where it was", () => {
  const player = new AnimationPlayer<Tracks, Event>();
  player.play(slide, { blend: 0 });
  player.advance(1);
  const back: Animation<Tracks, Event> = {
    name: "back",
    duration: 1,
    tracks: { x: [{ t: 0, v: 0 }] },
  };
  player.play(back, { blend: 1 });
  close(x(player), 5, "from where the slide was");
  player.advance(0.5);
  close(x(player), 2.5);
});

test("seek holds an animation at a time without firing events", () => {
  const fired: string[] = [];
  const player = new AnimationPlayer<Tracks, Event>((e) => fired.push(e.name));
  player.seek(slide, 1.5);
  player.advance(10);
  close(x(player), 7.5);
  assert.deepEqual(fired, []);
  assert.equal(player.isPlaying(), true);
});
