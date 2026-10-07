/**
 * Tests for cloth hanging from the waist (`src/highrise/creature-stuff/hemCloth.ts`):
 * its mesh covers the picture and is small enough to batch; left alone the
 * hem hangs at rest; it trails behind walking, flares out spinning, and
 * stays within the cloth's reach; a leg striding through it pushes it out;
 * it comes out the same whatever the frame rate; and a teleport hangs it at
 * rest. Plain node: `npm run test:core`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  HEM_POINTS,
  HemCloth,
  HemFeel,
  hemIndices,
  hemRest,
  HemShape,
  hemStill,
  hemAngles,
  LegAtHem,
  ovalAt,
  RINGS,
} from "../../src/highrise/creature-stuff/hemCloth";

/** A skirt's, in meters; no band or margin, so every ring past the waist is on the hem */
const SKIRT: HemShape = {
  waist: { front: 0.11, back: 0.12, side: 0.19 },
  hem: { front: 0.2, back: 0.21, side: 0.25 },
  margin: 0,
  band: 0,
  cloth: 0.36,
  drop: 0.42,
  opening: 0,
};

const FEEL: HemFeel = {
  frequency: 1.8,
  dampingRatio: 0.3,
  drag: 0.7,
  maxSwing: 0.5,
};

/** Legs straight down under the hips */
const STANDING: LegAtHem[] = [
  { x: 0, y: -0.1, radius: 0.08 },
  { x: 0, y: 0.1, radius: 0.08 },
];

/** Where each point's hem is in the body's frame, facing `angle` from `x`, `y` */
function hems(cloth: HemCloth, x = 0, y = 0, angle = 0): [number, number][] {
  const out = new Float32Array(cloth.rest.length);
  cloth.pose(x, y, angle, out);
  return Array.from({ length: cloth.count }, (_, i) => [
    out[(i * RINGS + 1) * 2],
    out[(i * RINGS + 1) * 2 + 1],
  ]);
}

/** How far each point's hem is from the middle */
const reach = (cloth: HemCloth, x = 0, y = 0, angle = 0) =>
  hems(cloth, x, y, angle).map(([hx, hy]) => Math.hypot(hx, hy));

const atRest = (i: number, angles = hemAngles(SKIRT)) =>
  Math.hypot(...ovalAt(SKIRT.hem, angles[i]));

test("the mesh covers the picture, and is small enough to batch", () => {
  const closed = hemIndices(SKIRT);
  const vertices = HEM_POINTS * RINGS + 1;
  assert.ok(vertices <= 100, `${vertices} vertices`);
  assert.equal(Math.max(...closed), vertices - 1);
  assert.equal(hemRest(SKIRT, hemAngles(SKIRT)).length, vertices * 2);
  // Open at the front: no middle, and no quad across the gap
  const coat = { ...SKIRT, opening: 0.3 };
  const open = hemIndices(coat);
  assert.equal(Math.max(...open), HEM_POINTS * RINGS - 1);
  assert.equal(open.length, (HEM_POINTS - 1) * 2 * (RINGS - 1) * 3);
  const angles = hemAngles(coat);
  assert.ok(Math.abs(angles[0] - 0.3) < 1e-9);
  assert.ok(Math.abs(angles[HEM_POINTS - 1] - (Math.PI * 2 - 0.3)) < 1e-9);
});

test("left alone, it hangs at rest", () => {
  const cloth = new HemCloth(SKIRT, FEEL);
  for (let t = 0; t < 3; t += 1 / 60) {
    cloth.update(0, 0, 0, STANDING, 1 / 60);
  }
  reach(cloth).forEach((r, i) => assert.ok(Math.abs(r - atRest(i)) < 1e-6));
});

test("hanging still, the legs under the hips don't push it", () => {
  const angles = hemAngles(SKIRT);
  const rest = hemRest(SKIRT, angles);
  const still = hemStill(SKIRT, angles, STANDING);
  still.forEach((v, i) => assert.ok(Math.abs(v - rest[i]) < 1e-9));
});

test("walking, the back trails out and the front comes in", () => {
  const cloth = new HemCloth(SKIRT, FEEL);
  const speed = 3;
  let x = 0;
  for (let t = 0; t < 3; t += 1 / 60) {
    x += speed / 60;
    cloth.update(x, 0, 0, [], 1 / 60);
  }
  const r = reach(cloth, x);
  const back = HEM_POINTS / 2;
  assert.ok(r[back] > atRest(back) + 0.01, `back ${r[back]}`);
  assert.ok(r[0] < atRest(0) - 0.01, `front ${r[0]}`);
  // but never inside the waist
  assert.ok(r[0] >= SKIRT.waist.front);
});

test("spinning, it flares out, within the cloth's reach", () => {
  const cloth = new HemCloth(SKIRT, FEEL);
  let angle = 0;
  for (let t = 0; t < 3; t += 1 / 60) {
    angle += 8 / 60;
    cloth.update(0, 0, angle, [], 1 / 60);
  }
  reach(cloth, 0, 0, angle).forEach((r, i) => {
    assert.ok(r > atRest(i) + 0.02, `${i}: ${r}`);
    assert.ok(r <= atRest(i) + SKIRT.cloth * FEEL.maxSwing + 1e-6);
  });
});

test("a leg striding forward through the hem pushes it out round the leg", () => {
  const cloth = new HemCloth(SKIRT, FEEL);
  const forward: LegAtHem = { x: 0.3, y: -0.1, radius: 0.08 };
  cloth.update(0, 0, 0, [forward, STANDING[1]], 1 / 60);
  const hem = hems(cloth);
  // Every point's clear of the leg, and the hem's out past it
  for (const [hx, hy] of hem) {
    const distance = Math.hypot(hx - forward.x, hy - forward.y);
    assert.ok(distance >= forward.radius, `${hx}, ${hy}`);
  }
  assert.ok(Math.max(...hem.map(([hx]) => hx)) >= forward.x + forward.radius);
});

test("it comes out about the same at 60 and 144 fps", () => {
  const run = (fps: number) => {
    const cloth = new HemCloth(SKIRT, FEEL);
    let x = 0;
    for (let t = 0; t < 1.5; t += 1 / fps) {
      // Sets off, then stops dead
      if (t < 1) {
        x += 3 / fps;
      }
      cloth.update(x, 0, 0, [], 1 / fps);
    }
    return reach(cloth, x);
  };
  const a = run(60);
  const b = run(144);
  a.forEach((r, i) => assert.ok(Math.abs(r - b[i]) < 0.01, `${i}`));
});

test("a teleport or a long gap hangs it at rest", () => {
  const cloth = new HemCloth(SKIRT, FEEL);
  let x = 0;
  for (let t = 0; t < 1; t += 1 / 60) {
    x += 3 / 60;
    cloth.update(x, 0, 0, [], 1 / 60);
  }
  cloth.update(x + 5, 0, 0, [], 1 / 60);
  reach(cloth, x + 5).forEach((r, i) =>
    assert.ok(Math.abs(r - atRest(i)) < 1e-6),
  );
  cloth.update(x + 5.5, 0, 0, [], 1);
  reach(cloth, x + 5.5).forEach((r, i) =>
    assert.ok(Math.abs(r - atRest(i)) < 1e-6),
  );
});
