/**
 * Tests for things that hang and swing (`src/core/animation/Dangle.ts`):
 * left alone it hangs at rest; it trails behind as the body sets off, swings
 * on as it stops and out as it turns, and settles again; it keeps within its
 * limits; and it comes out the same whatever the frame rate. Plain node:
 * `npm run test:core`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { Dangle, DangleStyle } from "../../src/core/animation/Dangle";

const STYLE: DangleStyle = {
  frequency: 1.5,
  dampingRatio: 0.3,
  drag: 0,
  maxAngle: 1,
  minStretch: 0.5,
  maxStretch: 1.5,
};

/** Where the pivot is and which way it hangs at a time (seconds) */
type Path = (t: number) => { x: number; y: number; angle: number };

/** Runs `dangle` along `path` at `fps`, giving its angle and stretch every frame */
function run(dangle: Dangle, path: Path, from: number, to: number, fps = 60) {
  const frames: { t: number; angle: number; stretch: number }[] = [];
  const dt = 1 / fps;
  for (let t = from; t <= to + 1e-9; t += dt) {
    const { x, y, angle } = path(t);
    dangle.update(x, y, angle, dt);
    frames.push({ t, angle: dangle.angle, stretch: dangle.stretch });
  }
  return frames;
}

const still: Path = () => ({ x: 0, y: 0, angle: 0 });

test("left alone, it hangs at rest", () => {
  const dangle = new Dangle(STYLE, 0.2);
  for (const frame of run(dangle, still, 0, 3)) {
    assert.ok(Math.abs(frame.angle) < 1e-9);
    assert.ok(Math.abs(frame.stretch - 1) < 1e-9);
  }
});

test("hanging forward, it's left behind setting off and swings on stopping, then settles", () => {
  // Off along +x at 3 m/s for a second, then stopped dead
  const path: Path = (t) => ({ x: Math.min(t, 1) * 3, y: 0, angle: 0 });
  const dangle = new Dangle(STYLE, 0.2);
  const frames = run(dangle, path, 0, 5);
  const settingOff = frames.filter((f) => f.t < 0.3);
  const stopping = frames.filter((f) => f.t > 1 && f.t < 1.4);
  assert.ok(Math.min(...settingOff.map((f) => f.stretch)) < 0.95);
  assert.ok(Math.max(...stopping.map((f) => f.stretch)) > 1.05);
  const last = frames[frames.length - 1];
  assert.ok(Math.abs(last.stretch - 1) < 0.01, `settled at ${last.stretch}`);
});

test("at a steady speed with no drag, it hangs as if still; with drag, it trails", () => {
  const path: Path = (t) => ({ x: t * 2, y: 0, angle: 0 });
  const steady = new Dangle(STYLE, 0.2);
  const frames = run(steady, path, 0, 6);
  assert.ok(Math.abs(frames[frames.length - 1].stretch - 1) < 0.01);

  const dragged = new Dangle({ ...STYLE, drag: 1 }, 0.2);
  const trailing = run(dragged, path, 0, 6);
  assert.ok(trailing[trailing.length - 1].stretch < 0.95);
});

test("turning, it swings out the other way, and back", () => {
  // Turning a quarter left in a fifth of a second
  const path: Path = (t) => ({ x: 0, y: 0, angle: Math.min(t / 0.2, 1) * 1.5 });
  const dangle = new Dangle(STYLE, 0.2);
  const frames = run(dangle, path, 0, 5);
  const turning = frames.filter((f) => f.t < 0.2);
  assert.ok(Math.min(...turning.map((f) => f.angle)) < -0.1);
  assert.ok(Math.abs(frames[frames.length - 1].angle) < 0.01);
});

test("it keeps within its limits", () => {
  const style = { ...STYLE, maxAngle: 0.3, minStretch: 0.9, maxStretch: 1.1 };
  const dangle = new Dangle(style, 0.2);
  // Shaken about hard
  const path: Path = (t) => ({
    x: Math.sin(t * 20) * 0.3,
    y: Math.cos(t * 13) * 0.3,
    angle: Math.sin(t * 7) * 2,
  });
  for (const frame of run(dangle, path, 0, 3)) {
    assert.ok(Math.abs(frame.angle) <= 0.3 + 1e-9);
    assert.ok(frame.stretch >= 0.9 - 1e-9 && frame.stretch <= 1.1 + 1e-9);
  }
});

test("it swings the same at 60 and 144 frames a second", () => {
  const path: Path = (t) => ({
    x: Math.min(t, 1) * 3,
    y: 0,
    angle: Math.min(t, 0.5),
  });
  const at = (fps: number, time: number) => {
    const frames = run(new Dangle(STYLE, 0.2), path, 0, 2, fps);
    return frames.reduce((best, f) =>
      Math.abs(f.t - time) < Math.abs(best.t - time) ? f : best,
    );
  };
  for (const time of [0.3, 1.2, 1.6]) {
    const a = at(60, time);
    const b = at(144, time);
    assert.ok(Math.abs(a.angle - b.angle) < 0.05, `angle at ${time}`);
    assert.ok(Math.abs(a.stretch - b.stretch) < 0.05, `stretch at ${time}`);
  }
});

test("after a long gap or a teleport, it's back at rest", () => {
  const dangle = new Dangle(STYLE, 0.2);
  dangle.reset(0, 0, 0);
  dangle.push(5, 5);
  dangle.update(0, 0, 0, 1 / 60);
  assert.ok(dangle.angle !== 0);
  dangle.update(0, 0, 0, 2);
  assert.equal(dangle.angle, 0);
  dangle.push(5, 5);
  dangle.update(10, 0, 0, 1 / 60);
  assert.equal(dangle.angle, 0);
  assert.equal(dangle.stretch, 1);
});
