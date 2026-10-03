/**
 * Tests for the walk cycle (`src/core/animation/Gait.ts`): feet stay put on
 * the ground, the cycle stops with the body, and the hips face the right
 * way. Plain node: `npm run test:core`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_GAIT, Gait } from "../../src/core/animation/Gait";
import { angleDelta } from "../../src/core/util/MathUtil";
import { V } from "../../src/core/Vector";

const DT = 1 / 120;

/** Walks `gait` at `velocity` for `seconds`, facing `facing`, from `start`; returns where it got to */
function walk(
  gait: Gait,
  velocity: [number, number],
  seconds: number,
  facing = 0,
  start = V(0, 0),
) {
  const position = start.clone();
  for (let t = 0; t < seconds; t += DT) {
    position.iadd(V(velocity).imul(DT));
    gait.update(position, facing, DT);
  }
  return position;
}

test("a foot on the ground stays put while the body walks", () => {
  for (const speed of [1.5, 5, 8]) {
    const gait = new Gait();
    let position = walk(gait, [speed, 0], 3);
    // Wait for the left foot to land, then watch it until it lifts
    while (gait.foot(0).lift > 0 || gait.foot(0).along < gait.reach * 0.9) {
      position = walk(gait, [speed, 0], DT, 0, position);
    }
    const landed = position.x + gait.foot(0).along;
    let ticks = 0;
    while (gait.foot(0).lift === 0 && ticks < 1000) {
      const where = position.x + gait.foot(0).along;
      assert.ok(
        Math.abs(where - landed) < 1e-6,
        `at ${speed} m/s the foot slid from ${landed} to ${where}`,
      );
      position = walk(gait, [speed, 0], DT, 0, position);
      ticks++;
    }
    assert.ok(
      ticks > 5,
      `at ${speed} m/s the foot was down for ${ticks} ticks`,
    );
  }
});

test("steps get longer with speed, up to the most it reaches", () => {
  const reachAt = (speed: number) => {
    const gait = new Gait();
    walk(gait, [speed, 0], 2);
    return gait.reach;
  };
  assert.ok(reachAt(2) < reachAt(4));
  assert.ok(Math.abs(reachAt(20) - DEFAULT_GAIT.maxReach) < 1e-6);
});

test("the feet are half a cycle apart, and one is always down walking", () => {
  const gait = new Gait();
  walk(gait, [2, 0], 2);
  for (let i = 0; i < 200; i++) {
    gait.phase = i / 200;
    assert.ok(gait.foot(0).lift === 0 || gait.foot(1).lift === 0);
  }
});

test("standing still stops the cycle and draws the feet in", () => {
  const gait = new Gait();
  const position = walk(gait, [4, 0], 2);
  walk(gait, [0, 0], 0.05, 0, position);
  const phase = gait.phase;
  walk(gait, [0, 0], 1, 0, position);
  assert.equal(gait.phase, phase);
  assert.ok(gait.reach < 0.001);
});

test("walking backward or sideways keeps the hips toward facing", () => {
  const backward = new Gait();
  walk(backward, [-4, 0], 2, 0);
  assert.ok(Math.abs(angleDelta(0, backward.hipAngle)) < 0.01);
  assert.ok(Math.abs(angleDelta(Math.PI, backward.travelAngle)) < 0.01);

  const diagonal = new Gait();
  walk(diagonal, [-3, -3], 2, 0);
  // Back and to the left: the line of travel, the forward way, is 45° right of facing
  assert.ok(Math.abs(angleDelta(Math.PI / 4, diagonal.hipAngle)) < 0.01);

  // Straight sideways, the hips turn only so far, and the steps are shorter
  const sideways = new Gait();
  walk(sideways, [0, 4], 2, 0);
  assert.ok(Math.abs(Math.abs(sideways.hipAngle) - Math.PI / 3) < 0.01);
  const forward = new Gait();
  walk(forward, [4, 0], 2, 0);
  assert.ok(sideways.reach < forward.reach * 0.8);
});

test("a teleport isn't a step", () => {
  const gait = new Gait();
  gait.update(V(0, 0), 0, DT);
  gait.update(V(50, 0), 0, DT);
  assert.equal(gait.speed, 0);
  assert.equal(gait.phase, 0);
});
