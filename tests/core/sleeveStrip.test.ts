/**
 * Tests for a sleeve bent over an arm (`src/highrise/creature-stuff/sleeveStrip.ts`):
 * a straight arm gives a straight strip as long as the picture, a
 * foreshortened arm a shorter one, and round a bent elbow the outside stays
 * nearly as wide as the sleeve, however sharp the bend. Plain node: `npm run test:core`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ArmPose,
  SLEEVE_COLUMNS,
  SleevePicture,
  sleeveColumnCount,
  sleeveColumns,
  sleeveIndices,
  sleeveStrip,
  sleeveUvs,
} from "../../src/highrise/creature-stuff/sleeveStrip";

const PICTURE: SleevePicture = {
  from: -0.05,
  to: 0.5,
  top: -0.06,
  bottom: 0.06,
};

function strip(pose: Partial<ArmPose>) {
  const full: ArmPose = {
    shoulder: [0, 0],
    elbow: [0.25, 0],
    hand: [0.52, 0],
    upperArm: 0.25,
    forearm: 0.27,
    bend: 0.05,
    ...pose,
  };
  const along = sleeveColumns(PICTURE, full.upperArm, full.bend);
  const out = sleeveStrip(
    PICTURE,
    full,
    along,
    new Float32Array(SLEEVE_COLUMNS * 4),
  );
  const columns: { top: [number, number]; bottom: [number, number] }[] = [];
  for (let i = 0; i < SLEEVE_COLUMNS; i++) {
    columns.push({
      top: [out[i * 4], out[i * 4 + 1]],
      bottom: [out[i * 4 + 2], out[i * 4 + 3]],
    });
  }
  return columns;
}

const close = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} isn't ${b}`);

test("the strip's triangles and texture coordinates cover the picture", () => {
  const along = sleeveColumns(PICTURE, 0.25, 0.05);
  const uvs = sleeveUvs(PICTURE, along);
  assert.equal(uvs.length, SLEEVE_COLUMNS * 4);
  assert.deepEqual([...uvs.slice(0, 4)], [0, 0, 0, 1]);
  assert.deepEqual([...uvs.slice(-4)], [1, 0, 1, 1]);
  const indices = sleeveIndices();
  assert.equal(indices.length, (SLEEVE_COLUMNS - 1) * 6);
  assert.equal(Math.max(...indices), SLEEVE_COLUMNS * 2 - 1);
  // Few enough vertices that Pixi batches it with the sprites
  assert.ok(SLEEVE_COLUMNS * 2 <= 100);
});

test("the columns are closer together round the elbow", () => {
  const along = sleeveColumns(PICTURE, 0.25, 0.05);
  const gaps = [...along].slice(1).map((x, i) => x - along[i]);
  assert.ok(gaps.every((gap) => gap > 0));
  const at = (x: number) => gaps[[...along].findIndex((a) => a > x) - 1];
  close(at(0.1) / at(0.25), 4, 0.2);
});

test("a sleeve that ends before the elbow is a single quad", () => {
  assert.equal(sleeveColumnCount({ ...PICTURE, to: 0.15 }, 0.25, 0.05), 2);
  assert.equal(sleeveColumnCount(PICTURE, 0.25, 0.05), SLEEVE_COLUMNS);
});

test("a straight arm gives a straight strip, as long as the picture", () => {
  const columns = strip({});
  for (const { top, bottom } of columns) {
    close(top[1], -0.06);
    close(bottom[1], 0.06);
    close(top[0], bottom[0]);
  }
  close(columns[0].top[0], -0.05);
  close(columns[SLEEVE_COLUMNS - 1].top[0], 0.5);
});

test("a foreshortened upper arm is shorter, and the forearm starts at the elbow", () => {
  // The upper arm seen end on, at half its length
  const columns = strip({ elbow: [0.125, 0], hand: [0.395, 0] });
  // The picture's start is behind the shoulder by half as much
  close(columns[0].top[0], -0.025);
  // and its end is the forearm's full length past the elbow
  close(columns[SLEEVE_COLUMNS - 1].top[0], 0.125 + 0.25);
});

test("round a bend, the outside of the elbow keeps the sleeve's width", () => {
  for (const degrees of [45, 90, 135, 170]) {
    const a = (degrees * Math.PI) / 180;
    // Bending toward +y: the outside of the bend is -y
    const elbow: [number, number] = [0.25, 0];
    const hand: [number, number] = [
      0.25 + Math.cos(a) * 0.27,
      Math.sin(a) * 0.27,
    ];
    const columns = strip({ elbow, hand });
    // The outer edge (the tops) comes round the elbow at about the
    // sleeve's half-width: never much nearer, which would show the arm
    // under it through the bend (the sleeve's a third wider than the arm)
    let nearest = Infinity;
    for (const { top } of columns) {
      nearest = Math.min(nearest, Math.hypot(top[0] - 0.25, top[1]));
    }
    assert.ok(nearest > 0.06 * 0.9, `${degrees}°: ${nearest}`);
    assert.ok(nearest < 0.06 + 1e-6, `${degrees}°: ${nearest}`);
    // and every column is the sleeve's full width
    for (const { top, bottom } of columns) {
      close(Math.hypot(top[0] - bottom[0], top[1] - bottom[1]), 0.12);
    }
  }
});

test("an arm seen end on doesn't break the strip", () => {
  const columns = strip({ elbow: [0, 0], hand: [0, 0] });
  for (const { top, bottom } of columns) {
    for (const value of [...top, ...bottom]) {
      assert.ok(Number.isFinite(value));
    }
  }
});
