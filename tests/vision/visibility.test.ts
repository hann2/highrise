/**
 * Tests for the additive visibility computation. Plain node, no browser:
 * `npm run test:vision`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  computeVisibility,
  Occluder,
  Point,
  visibilityAt,
  visibilityOutline,
  VisibilitySample,
} from "../../src/highrise/lighting-and-vision/visibility";
import { buildVisionMesh } from "../../src/highrise/lighting-and-vision/visionMesh";

function box(
  x: number,
  y: number,
  width: number,
  height: number,
  transmission = 0,
): Occluder {
  return {
    corners: [
      [x, y],
      [x + width, y],
      [x + width, y + height],
      [x, y + height],
    ],
    transmission,
  };
}

/** Same box, wound the other way */
function reversed(occluder: Occluder): Occluder {
  return { ...occluder, corners: [...occluder.corners].reverse() };
}

function polygonArea(points: readonly Point[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[(i + 1) % points.length];
    area += ax * by - bx * ay;
  }
  return Math.abs(area) / 2;
}

function assertSorted(samples: VisibilitySample[]) {
  for (let i = 1; i < samples.length; i++) {
    assert.ok(
      samples[i].angle >= samples[i - 1].angle,
      `samples out of order at ${i}`,
    );
  }
  for (const sample of samples) {
    assert.ok(sample.crossings.length > 0);
    assert.equal(sample.crossings[sample.crossings.length - 1].transmission, 0);
    for (let i = 1; i < sample.crossings.length; i++) {
      assert.ok(
        sample.crossings[i].distance >= sample.crossings[i - 1].distance,
        "crossings not sorted by distance",
      );
    }
  }
}

const EYE: Point = [0, 0];
const RADIUS = 10;

test("nothing around: a circle of the vision radius", () => {
  const samples = computeVisibility(EYE, RADIUS, []);
  assertSorted(samples);
  assert.equal(samples.length, 72);
  for (const sample of samples) {
    assert.deepEqual(sample.crossings, [{ distance: RADIUS, transmission: 0 }]);
  }
  const outline = visibilityOutline(EYE, samples).map((v) => v.point);
  const circle = Math.PI * RADIUS * RADIUS;
  assert.ok(polygonArea(outline) > circle * 0.99);
  assert.ok(polygonArea(outline) < circle);
  assert.equal(visibilityAt(EYE, samples, [3, 4]), 1);
  assert.equal(visibilityAt(EYE, samples, [30, 40]), 0);
});

test("a wall blocks what is behind it and has silhouette jumps", () => {
  const wall = box(3, -2, 1, 4);
  const samples = computeVisibility(EYE, RADIUS, [wall]);
  assertSorted(samples);

  // Straight ahead stops at the wall's near face
  const ahead = samples.find((s) => Math.abs(s.angle) < 1e-9)!;
  assert.deepEqual(ahead.crossings, [{ distance: 3, transmission: 0 }]);

  // At the wall's top corner there is a sample stopping at the corner and one carrying on
  const cornerAngle = Math.atan2(2, 3);
  const atCorner = samples.filter(
    (s) => Math.abs(s.angle - cornerAngle) < 1e-9,
  );
  assert.equal(atCorner.length, 2);
  const distances = atCorner
    .map((s) => s.crossings[0].distance)
    .sort((p, q) => p - q);
  assert.ok(Math.abs(distances[0] - Math.hypot(3, 2)) < 1e-9);
  assert.equal(distances[1], RADIUS);

  assert.equal(visibilityAt(EYE, samples, [6, 0]), 0, "behind the wall");
  assert.equal(visibilityAt(EYE, samples, [2, 0]), 1, "in front of the wall");
  assert.equal(visibilityAt(EYE, samples, [6, 6]), 1, "past the wall's end");
  assert.equal(visibilityAt(EYE, samples, [0, -6]), 1, "off to the side");

  // Winding doesn't matter
  const flipped = computeVisibility(EYE, RADIUS, [reversed(wall)]);
  assert.deepEqual(
    visibilityOutline(EYE, flipped).map((v) => v.point),
    visibilityOutline(EYE, samples).map((v) => v.point),
  );
});

test("the eye on a corner's line sees the far corner", () => {
  // Both corners of the wall's near face line up with the eye's row
  const samples = computeVisibility([0, 0], RADIUS, [box(2, 0, 1, 3)]);
  assertSorted(samples);
  assert.equal(visibilityAt([0, 0], samples, [5, 1]), 0);
  assert.equal(visibilityAt([0, 0], samples, [5, -1]), 1);
});

test("overlapping walls at a seam leak nothing", () => {
  const walls = [box(3, -5, 1, 5.5), box(3, 0, 1, 5.5), box(2.5, 5, 6, 1)];
  const samples = computeVisibility(EYE, RADIUS, walls);
  assertSorted(samples);
  for (let y = -4; y <= 6; y += 0.25) {
    assert.equal(visibilityAt(EYE, samples, [5, y]), 0, `leak at y=${y}`);
  }
  assert.equal(visibilityAt(EYE, samples, [4, -8]), 1);
});

test("the polygon area only shrinks as walls are added", () => {
  const walls = [box(3, -2, 1, 4), box(-6, 1, 3, 1), box(1, -8, 4, 2)];
  let lastArea = Infinity;
  for (let i = 0; i <= walls.length; i++) {
    const samples = computeVisibility(EYE, RADIUS, walls.slice(0, i));
    const area = polygonArea(
      visibilityOutline(EYE, samples).map((v) => v.point),
    );
    assert.ok(area <= lastArea + 1e-9);
    lastArea = area;
  }
});

test("glass lets some light through to the wall behind", () => {
  const glass = box(2, -3, 0.2, 6, 0.5);
  const wall = box(5, -3, 1, 6);
  const samples = computeVisibility(EYE, RADIUS, [glass, wall]);
  assertSorted(samples);
  const ahead = samples.find((s) => Math.abs(s.angle) < 1e-9)!;
  assert.deepEqual(ahead.crossings, [
    { distance: 2, transmission: 0.5 },
    { distance: 5, transmission: 0 },
  ]);
  assert.equal(visibilityAt(EYE, samples, [1, 0]), 1);
  assert.equal(visibilityAt(EYE, samples, [3.5, 0]), 0.5);
  assert.equal(visibilityAt(EYE, samples, [7, 0]), 0);

  // Two panes multiply
  const two = computeVisibility(EYE, RADIUS, [glass, box(3, -3, 0.2, 6, 0.5)]);
  assert.equal(visibilityAt(EYE, two, [4, 0]), 0.25);
  assert.equal(visibilityAt(EYE, two, [9.5, 0]), 0.25);
  assert.equal(visibilityAt(EYE, two, [11, 0]), 0);
});

test("occluders out of range are ignored", () => {
  const samples = computeVisibility(EYE, RADIUS, [box(12, -1, 1, 2)]);
  assert.equal(samples.length, 72);
});

test("the vision mesh has valid indices and the right size", () => {
  const samples = computeVisibility(EYE, RADIUS, [box(3, -2, 1, 4)]);
  const outline = visibilityOutline(EYE, samples);
  const mesh = buildVisionMesh(EYE, outline, {
    outerRadius: 11,
    antialiasWidth: 0.05,
    sourceRadius: 0.2,
    maxPenumbraWidth: 3,
  });
  const vertices = mesh.positions.length / 2;
  assert.equal(vertices, outline.length * 7);
  assert.equal(mesh.uvs.length, mesh.positions.length);
  assert.equal(mesh.indices.length, outline.length * 21);
  for (const index of mesh.indices) {
    assert.ok(index < vertices);
  }
  for (let i = 0; i < vertices; i++) {
    const distance = Math.hypot(
      mesh.positions[i * 2],
      mesh.positions[i * 2 + 1],
    );
    assert.ok(distance <= 11 + 1e-6, `vertex ${i} is past the outer radius`);
  }
  // Both ends of the wall's shadow edge get vertices at the far end that are
  // spread wider than at the corner
  const shadowEdges = outline.filter(
    (v, i) =>
      Math.abs(v.angle - outline[(i + 1) % outline.length].angle) < 1e-9,
  );
  assert.equal(shadowEdges.length, 2);
});
