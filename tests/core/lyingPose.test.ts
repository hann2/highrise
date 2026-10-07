/**
 * Tests for how corpses lie (`src/highrise/looks/lyingPose.ts`): whatever
 * killed it, a body's hands aren't on its head or each other, its limbs
 * stay on their own sides, its feet are apart and its hands clear of its
 * legs; and how it died moves how it lies the way it should: a hard blow
 * flings the arms back more than a light one, an explosion throws them
 * out, fire draws the elbows and knees up, a light blow leaves the arms
 * where they were, a stride out in front buckles that knee, and without
 * its head it lies limp. Plain node: `npm run test:core`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { makeRandom } from "../../src/core/util/Random";
import {
  DeathContext,
  limbJoints,
  LyingBody,
  LyingPose,
  lyingPose,
  NO_DEATH,
} from "../../src/highrise/looks/lyingPose";

/** A human-sized body (mm), about as `composeBodySvg` has one */
const BODY: LyingBody = {
  shoulder: 220,
  upperArm: 250,
  forearm: 250,
  hipX: 490,
  hipY: 110,
  thigh: 305,
  shin: 305,
  headX: 150,
  headRadius: 110,
  handRadius: 56,
};

const whole = NO_DEATH.missing;

const DEATHS: Record<string, DeathContext> = {
  dropped: NO_DEATH,
  shotgun: { ...NO_DEATH, kind: "bullet", force: 0.95, side: 0.7 },
  light: { ...NO_DEATH, kind: "bullet", force: 0.15 },
  explosion: { ...NO_DEATH, kind: "explosion", force: 1 },
  burned: { ...NO_DEATH, kind: "burn", force: 0.1 },
  axe: { ...NO_DEATH, kind: "melee", force: 0.6, side: -1 },
  headless: { ...NO_DEATH, force: 0.4, missing: { ...whole, head: true } },
  armOff: {
    ...NO_DEATH,
    force: 0.5,
    side: -1,
    missing: { ...whole, leftArm: true },
  },
  halved: { ...NO_DEATH, force: 0.8, missing: { ...whole, legs: true } },
  sprinter: {
    ...NO_DEATH,
    force: 0.35,
    speed: 1,
    legs: [
      { angle: 0.25, reach: 0.55 },
      { angle: 2.9, reach: 0.4 },
    ],
  },
};

const POSES = 2000;

function poses(death: DeathContext, seed = 1): LyingPose[] {
  return Array.from({ length: POSES }, (_, i) =>
    lyingPose(makeRandom(seed * 100000 + i), BODY, death),
  );
}

/** Where each limb's joints are */
function joints(pose: LyingPose) {
  const arms = [-1, 1].map((side, i) =>
    limbJoints([0, side * BODY.shoulder], pose.arms[i], BODY.upperArm, BODY.forearm),
  );
  const legs = [-1, 1].map((side, i) =>
    limbJoints(
      [-BODY.hipX, side * BODY.hipY],
      pose.legs[i],
      BODY.thigh,
      BODY.shin,
    ),
  );
  return { arms, legs };
}

const distance = (a: [number, number], b: [number, number]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);

/** How many of `list` `check` holds for, as a share */
const share = <T>(list: T[], check: (item: T) => boolean) =>
  list.filter(check).length / list.length;

const mean = (values: number[]) =>
  values.reduce((sum, v) => sum + v, 0) / values.length;

test("however it died, its limbs keep out of each other and to their own sides", () => {
  for (const [name, death] of Object.entries(DEATHS)) {
    const all = poses(death);
    const bad = share(all, (pose) => {
      const { arms, legs } = joints(pose);
      const present = [!death.missing.leftArm, !death.missing.rightArm];
      const hands = arms.filter((_, i) => present[i]).map((arm) => arm.end);
      const onHead =
        !death.missing.head &&
        hands.some(
          (hand) =>
            distance(hand, [BODY.headX, 0]) <
            BODY.headRadius + BODY.handRadius,
        );
      const crossed =
        arms.some(
          (arm, i) => present[i] && arm.middle[1] * (i === 0 ? -1 : 1) <= 0,
        ) ||
        legs.some((leg, i) => leg.end[1] * (i === 0 ? -1 : 1) <= 0);
      const handsTogether =
        hands.length === 2 && distance(hands[0], hands[1]) < BODY.handRadius * 2;
      const feetTogether =
        distance(legs[0].end, legs[1].end) < BODY.handRadius * 2;
      const handOnFoot = hands.some((hand) =>
        legs.some((leg) => distance(hand, leg.end) < BODY.handRadius * 2),
      );
      return onHead || crossed || handsTogether || feetTogether || handOnFoot;
    });
    assert.ok(bad <= 0.01, `${name}: ${(bad * 100).toFixed(1)}% tangled`);
  }
});

test("each comes out the same from the same random numbers", () => {
  const a = lyingPose(makeRandom(7), BODY, DEATHS.shotgun);
  const b = lyingPose(makeRandom(7), BODY, DEATHS.shotgun);
  assert.deepEqual(a, b);
});

/** How far back toward the feet an arm points, 0 (past the head) to π (down past the feet) */
const armBack = (pose: LyingPose) => pose.arms.map((arm) => Math.abs(arm.angle));
/** How far out to the side an arm points: 0 along the body, 1 straight out */
const armOut = (pose: LyingPose) =>
  pose.arms.map((arm) => Math.abs(Math.sin(arm.angle)));
const bends = (limbs: { bend: number }[]) => limbs.map((l) => Math.abs(l.bend));

test("a hard blow flings the arms back more than a light one", () => {
  const hard = mean(poses(DEATHS.shotgun).flatMap(armBack));
  const light = mean(poses(DEATHS.light).flatMap(armBack));
  assert.ok(hard > light + 0.2, `hard ${hard}, light ${light}`);
});

test("an explosion throws the arms out and the legs apart", () => {
  const blown = poses(DEATHS.explosion);
  const dropped = poses(DEATHS.dropped);
  assert.ok(
    mean(blown.flatMap(armOut)) > mean(dropped.flatMap(armOut)),
    "arms out",
  );
  // How far apart the feet are
  const spread = (all: LyingPose[]) =>
    mean(
      all.map((pose) => {
        const { legs } = joints(pose);
        return legs[1].end[1] - legs[0].end[1];
      }),
    );
  assert.ok(
    spread(blown) > spread(dropped) + 20,
    `legs apart: blown ${spread(blown)}, dropped ${spread(dropped)}`,
  );
});

test("fire draws the elbows and knees up", () => {
  const burned = poses(DEATHS.burned);
  const dropped = poses(DEATHS.dropped);
  assert.ok(
    mean(burned.flatMap((p) => bends(p.arms))) >
      mean(dropped.flatMap((p) => bends(p.arms))) + 0.4,
    "elbows",
  );
  assert.ok(
    mean(burned.flatMap((p) => bends(p.legs))) >
      mean(dropped.flatMap((p) => bends(p.legs))) + 0.5,
    "knees",
  );
});

test("a light blow leaves the arms about where they were", () => {
  const reaching: DeathContext = {
    ...DEATHS.light,
    arms: [
      { angle: 0.4, reach: 0.9 },
      { angle: 0.4, reach: 0.9 },
    ],
  };
  const trailing: DeathContext = {
    ...DEATHS.light,
    arms: [
      { angle: 2.8, reach: 0.9 },
      { angle: 2.8, reach: 0.9 },
    ],
  };
  const ahead = mean(poses(reaching).flatMap(armBack));
  const behind = mean(poses(trailing).flatMap(armBack));
  assert.ok(behind > ahead + 0.8, `ahead ${ahead}, behind ${behind}`);
});

test("a foot out in front mid-stride buckles that knee", () => {
  const sprinting = poses(DEATHS.sprinter);
  const left = mean(sprinting.map((p) => Math.abs(p.legs[0].bend)));
  const right = mean(sprinting.map((p) => Math.abs(p.legs[1].bend)));
  assert.ok(left > right + 0.2, `left ${left}, right ${right}`);
});

test("without its head it lies limp", () => {
  const headless = mean(poses(DEATHS.headless).flatMap((p) => bends(p.arms)));
  const dropped = mean(poses(DEATHS.dropped).flatMap((p) => bends(p.arms)));
  assert.ok(headless < dropped - 0.1, `headless ${headless}, dropped ${dropped}`);
});
