/**
 * Tests for the walk cycle (`src/core/animation/Gait.ts`): a foot on the
 * ground never moves, however the body moves; the feet take turns and keep
 * up; standing still or turning on the spot steps them back under the hips;
 * and the hips face the right way. Plain node: `npm run test:core`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_GAIT, FootLanding, Gait } from "../../src/core/animation/Gait";
import { angleDelta } from "../../src/core/util/MathUtil";
import { V, V2d } from "../../src/core/Vector";

const DT = 1 / 120;

/** Where the body is and which way it faces at a time (seconds) */
type Path = (t: number) => { position: V2d; facing: number };

/**
 * Runs `gait` along `path` from `from` to `to` seconds, checking every tick
 * that no foot that was down and is still down has moved, and that no foot
 * strays further than `maxStray` meters from its hip. Returns the landings.
 */
function run(
  gait: Gait,
  path: Path,
  from: number,
  to: number,
  maxStray = DEFAULT_GAIT.maxReach * 2.6,
): FootLanding[] {
  const landings: FootLanding[] = [];
  gait.onLand = (landing) => landings.push(landing);
  let t = from;
  const start = path(t);
  gait.update(start.position, start.facing, DT);
  while (t < to) {
    t += DT;
    const before = gait.feet.map((foot) => ({ ...foot }));
    const { position, facing } = path(t);
    gait.update(position, facing, DT);
    for (const side of [0, 1] as const) {
      const was = before[side];
      const foot = gait.feet[side];
      if (was.planted && foot.planted) {
        assert.ok(
          foot.x === was.x && foot.y === was.y && foot.angle === was.angle,
          `at ${t.toFixed(3)} s a planted foot moved from ${was.x},${was.y} to ${foot.x},${foot.y}`,
        );
      }
      const stray = Math.hypot(
        foot.x - gait.hipX(side),
        foot.y - gait.hipY(side),
      );
      assert.ok(
        stray < maxStray,
        `at ${t.toFixed(3)} s a foot was ${stray.toFixed(2)} m from its hip`,
      );
    }
  }
  return landings;
}

/** Walking along x at `speed` from 0, facing `facing` */
const straight =
  (speed: number, facing = 0): Path =>
  (t) => ({ position: V(speed * t, 0), facing });

test("a foot on the ground stays put walking at any speed", () => {
  for (const speed of [1, 3, 5, 8]) {
    const landings = run(new Gait(), straight(speed), 0, 3);
    assert.ok(landings.length > 4, `${landings.length} steps at ${speed} m/s`);
  }
});

test("a foot on the ground stays put speeding up, slowing down and turning", () => {
  // Off from standing up to 6 m/s and back down while curving round, then
  // straight off the other way, facing the way it's going
  const position = V(0, 0);
  let last = 0;
  const path: Path = (t) => {
    const speed = t < 3 ? 6 * Math.sin((Math.PI * t) / 3) : 4;
    const angle = t < 3 ? t * 0.8 : 2.4 + Math.PI;
    position.iadd(V(Math.cos(angle), Math.sin(angle)).imul(speed * (t - last)));
    last = t;
    return { position: position.clone(), facing: angle };
  };
  run(new Gait(), path, 0, 5);
});

test("the feet take turns, about twice a cycle", () => {
  const gait = new Gait();
  run(gait, straight(4), 0, 1);
  const landings = run(gait, straight(4), 1, 4);
  const strides = landings.filter((landing) => !landing.settling);
  assert.equal(strides.length, landings.length, "no catch-up steps");
  for (let i = 1; i < strides.length; i++) {
    assert.notEqual(strides[i].side, strides[i - 1].side);
  }
  // Each step lands its reach ahead of the hip, and the body goes twice that in a step's time on the ground
  const cycleLength = (2 * gait.reach) / gait.duty;
  const expected = (3 * 4) / (cycleLength / 2);
  assert.ok(
    Math.abs(strides.length - expected) <= 2,
    `${strides.length} steps, expected about ${expected.toFixed(1)}`,
  );
});

test("walking, one foot is always down", () => {
  const gait = new Gait();
  const path = straight(1.5);
  let t = 0;
  gait.update(path(t).position, 0, DT);
  while (t < 3) {
    t += DT;
    gait.update(path(t).position, 0, DT);
    assert.ok(gait.feet[0].planted || gait.feet[1].planted);
  }
});

test("stopping steps the feet back under the hips", () => {
  const gait = new Gait();
  run(gait, straight(4), 0, 2);
  const stopped = V(8, 0);
  const landings = run(gait, () => ({ position: stopped, facing: 0 }), 2, 3);
  assert.ok(gait.underBody, "both feet under the body");
  assert.ok(landings.some((landing) => landing.settling));
  assert.ok(gait.reach < 0.001);
});

test("turning on the spot shuffles the feet round", () => {
  const gait = new Gait();
  const here = V(0, 0);
  run(gait, () => ({ position: here, facing: 0 }), 0, 0.5);
  const landings = run(
    gait,
    (t) => ({ position: here, facing: Math.min(t - 0.5, 1) * (Math.PI / 2) }),
    0.5,
    3,
  );
  assert.ok(landings.length >= 2, `${landings.length} steps`);
  assert.ok(landings.every((landing) => landing.settling));
  for (const foot of gait.feet) {
    assert.ok(Math.abs(angleDelta(foot.angle, Math.PI / 2)) < 0.15);
  }
  assert.ok(gait.underBody);
});

test("walking backward or sideways keeps the hips toward facing", () => {
  const backward = new Gait();
  run(backward, straight(-4), 0, 2);
  assert.ok(Math.abs(angleDelta(0, backward.hipAngle)) < 0.01);
  assert.ok(Math.abs(angleDelta(Math.PI, backward.travelAngle)) < 0.01);

  const diagonal = new Gait();
  run(diagonal, (t) => ({ position: V(-3 * t, -3 * t), facing: 0 }), 0, 2);
  // Back and to the left: the line of travel, the forward way, is 45° right of facing
  assert.ok(Math.abs(angleDelta(Math.PI / 4, diagonal.hipAngle)) < 0.01);

  // Straight sideways, the hips turn only so far, and the steps are shorter
  const sideways = new Gait();
  run(sideways, (t) => ({ position: V(0, 4 * t), facing: 0 }), 0, 2);
  assert.ok(Math.abs(Math.abs(sideways.hipAngle) - Math.PI / 3) < 0.01);
  const forward = new Gait();
  run(forward, straight(4), 0, 2);
  assert.ok(sideways.reach < forward.reach * 0.8);
});

test("a teleport isn't a step: the feet are under the body where it lands", () => {
  const gait = new Gait();
  run(gait, straight(4), 0, 1);
  const landings: FootLanding[] = [];
  gait.onLand = (landing) => landings.push(landing);
  gait.update(V(50, 0), 0, DT);
  assert.equal(landings.length, 0);
  assert.ok(gait.underBody);
});
