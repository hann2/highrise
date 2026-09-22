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
import {
  buildPenumbraMesh,
  buildVisionMesh,
} from "../../src/highrise/lighting-and-vision/visionMesh";

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

function outlinePoints(eye: Point, samples: VisibilitySample[]): Point[] {
  return visibilityOutline(eye, samples).vertices.map((v) => v.point);
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

function assertClose(actual: Point, expected: Point, message?: string) {
  assert.ok(
    Math.hypot(actual[0] - expected[0], actual[1] - expected[1]) < 1e-6,
    message ?? `expected ${actual} to be ${expected}`,
  );
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
  const outline = outlinePoints(EYE, samples);
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
  assert.equal(ahead.crossings.length, 1);
  assert.equal(ahead.crossings[0].distance, 3);
  const { ax, ay, bx, by } = ahead.crossings[0].surface!;
  assert.deepEqual([ax, ay, bx, by], [3, 2, 3, -2]);

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
  assert.ok(atCorner[0].silhouette);
  assert.equal(atCorner[0].silhouette, atCorner[1].silhouette);

  assert.equal(visibilityAt(EYE, samples, [6, 0]), 0, "behind the wall");
  assert.equal(visibilityAt(EYE, samples, [2, 0]), 1, "in front of the wall");
  assert.equal(visibilityAt(EYE, samples, [6, 6]), 1, "past the wall's end");
  assert.equal(visibilityAt(EYE, samples, [0, -6]), 1, "off to the side");

  // Winding doesn't matter
  const flipped = computeVisibility(EYE, RADIUS, [reversed(wall)]);
  assert.deepEqual(outlinePoints(EYE, flipped), outlinePoints(EYE, samples));

  // The outline has two shadow edges, one per silhouette corner
  const outline = visibilityOutline(EYE, samples);
  assert.equal(outline.silhouettes.length, 2);
  assert.equal(outline.vertices.filter((v) => v.shadowEdgeNext).length, 2);
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

test("a room corner made of overlapping walls is a vertex of the outline", () => {
  // A right wall and a bottom wall whose boxes overlap at the corner, so
  // the visible corner (5.925, 5.925) is no box's corner
  const room = [box(5.925, -1, 0.15, 7.075), box(-1, 5.925, 7.075, 0.15)];
  for (const eye of [
    [3, 3],
    [3.01, 3],
    [2.5, 4.2],
    [4.9, 1.3],
  ] as Point[]) {
    const outline = visibilityOutline(
      eye,
      computeVisibility(eye, RADIUS, room),
    );
    const corner = outline.vertices.find(
      (v) => Math.hypot(v.point[0] - 5.925, v.point[1] - 5.925) < 1e-6,
    );
    assert.ok(corner, `corner missing from eye ${eye}`);
    // And nothing else cuts across it: the two neighbours are on the walls
    const i = outline.vertices.indexOf(corner!);
    const before =
      outline.vertices[
        (i + outline.vertices.length - 1) % outline.vertices.length
      ];
    const after = outline.vertices[(i + 1) % outline.vertices.length];
    assert.ok(
      Math.abs(before.point[0] - 5.925) < 1e-6,
      "previous vertex on the right wall",
    );
    assert.ok(
      Math.abs(after.point[1] - 5.925) < 1e-6,
      "next vertex on the bottom wall",
    );
  }
});

test("the polygon area only shrinks as walls are added", () => {
  const walls = [box(3, -2, 1, 4), box(-6, 1, 3, 1), box(1, -8, 4, 2)];
  let lastArea = Infinity;
  for (let i = 0; i <= walls.length; i++) {
    const samples = computeVisibility(EYE, RADIUS, walls.slice(0, i));
    const area = polygonArea(outlinePoints(EYE, samples));
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
  assert.deepEqual(
    ahead.crossings.map(({ distance, transmission }) => ({
      distance,
      transmission,
    })),
    [
      { distance: 2, transmission: 0.5 },
      { distance: 5, transmission: 0 },
    ],
  );
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

test("an eye with a radius gets penumbra edges around a corner", () => {
  // A pillar in front of a far wall
  const pillar = box(3, -0.5, 0.2, 1);
  const farWall = box(8, -6, 1, 12);
  const sourceRadius = 0.2;
  const samples = computeVisibility(EYE, RADIUS, [pillar, farWall], {
    sourceRadius,
  });
  const outline = visibilityOutline(EYE, samples);
  assert.equal(outline.silhouettes.length, 2);

  const top = outline.silhouettes.find((s) => s.corner[1] > 0)!;
  assertClose(top.corner, [3, 0.5]);
  // The umbra edge of the top corner tilts toward the pillar (down), the lit edge away (up)
  const centerSlope = 0.5 / 3;
  const umbraSlope = top.umbraDirection[1] / top.umbraDirection[0];
  const litSlope = top.litDirection[1] / top.litDirection[0];
  assert.ok(umbraSlope < centerSlope, "umbra edge tilts toward the occluder");
  assert.ok(litSlope > centerSlope, "lit edge tilts away from the occluder");
  // Exactly: through the corner from the eye offset by the source radius
  const offset = sourceRadius;
  const expectedUmbra = Math.atan2(
    0.5 - offset * (3 / Math.hypot(3, 0.5)),
    3 + offset * (0.5 / Math.hypot(3, 0.5)),
  );
  assert.ok(
    Math.abs(
      Math.atan2(top.umbraDirection[1], top.umbraDirection[0]) - expectedUmbra,
    ) < 1e-9,
  );

  // The shadow edge in the outline runs from the corner along the umbra
  // direction to the far wall
  const cornerIndex = outline.vertices.findIndex(
    (v) => Math.hypot(v.point[0] - 3, v.point[1] - 0.5) < 1e-6,
  );
  assert.ok(cornerIndex >= 0);
  const vertices = outline.vertices;
  const n = vertices.length;
  const corner = vertices[cornerIndex];
  const neighbour = corner.shadowEdgeNext
    ? vertices[(cornerIndex + 1) % n]
    : vertices[(cornerIndex + n - 1) % n];
  assert.ok(
    Math.abs(neighbour.point[0] - 8) < 1e-6,
    "shadow edge ends on the far wall",
  );
  const along = [neighbour.point[0] - 3, neighbour.point[1] - 0.5];
  const cross =
    along[0] * top.umbraDirection[1] - along[1] * top.umbraDirection[0];
  assert.ok(Math.abs(cross) < 1e-9, "shadow edge follows the umbra direction");
  assert.deepEqual(corner.farDirection, top.umbraDirection);
  assert.deepEqual(neighbour.farDirection, top.umbraDirection);

  // Hard shadows have no silhouettes to draw
  const hard = visibilityOutline(
    EYE,
    computeVisibility(EYE, RADIUS, [pillar, farWall]),
  );
  assert.equal(hard.silhouettes.length, 2);
  assert.deepEqual(
    hard.silhouettes[0].umbraDirection,
    hard.silhouettes[0].litDirection,
  );
});

test("the vision meshes have valid indices and the right sizes", () => {
  const samples = computeVisibility(EYE, RADIUS, [box(3, -2, 1, 4)], {
    sourceRadius: 0.2,
  });
  const outline = visibilityOutline(EYE, samples);
  const mesh = buildVisionMesh(EYE, outline, {
    outerRadius: 11,
    antialiasWidth: 0.05,
  });
  const vertices = mesh.positions.length / 2;
  assert.equal(vertices, outline.vertices.length * 7);
  assert.equal(mesh.uvs.length, mesh.positions.length);
  assert.equal(mesh.indices.length, outline.vertices.length * 21);
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
  // Far vertices sit on the outer circle
  for (let i = 0; i < outline.vertices.length; i++) {
    for (const far of [i * 7 + 4, i * 7 + 5]) {
      const distance = Math.hypot(
        mesh.positions[far * 2],
        mesh.positions[far * 2 + 1],
      );
      assert.ok(Math.abs(distance - 11) < 1e-6);
    }
  }

  const penumbra = buildPenumbraMesh(EYE, outline.silhouettes, 22);
  assert.equal(penumbra.positions.length, 12);
  assert.equal(penumbra.indices.length, 6);
});
