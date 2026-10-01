/**
 * Tests for the spatial hashing broadphase: its collision pairs against brute
 * force, and its queries seeing bodies as they're added, removed, moved and
 * reshaped. Plain node: `npm run test:physics`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Body } from "../../src/core/physics/body/Body";
import {
  createPointMass2D,
  createRigid2D,
} from "../../src/core/physics/body/bodyFactories";
import { AABB } from "../../src/core/physics/collision/AABB";
import { SAPBroadphase } from "../../src/core/physics/collision/broadphase/SAPBroadphase";
import { SpatialHashingBroadphase } from "../../src/core/physics/collision/broadphase/SpatialHashingBroadphase";
import { bodiesCanCollide } from "../../src/core/physics/collision/CollisionHelpers";
import { Box } from "../../src/core/physics/shapes/Box";
import { Circle } from "../../src/core/physics/shapes/Circle";
import { Particle } from "../../src/core/physics/shapes/Particle";
import { World } from "../../src/core/physics/world/World";

const DT = 1 / 60;

/**
 * A world with small cells on a small grid, so bodies span several cells and
 * the grid wraps around
 */
function makeWorld() {
  const broadphase = new SpatialHashingBroadphase({
    cellSize: 1,
    width: 8,
    height: 8,
  });
  const world = new World({ broadphase });
  return { world, broadphase };
}

/** A deterministic random number generator */
function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function circle(
  world: World,
  position: [number, number],
  velocity: [number, number] = [0, 0],
  radius = 0.4,
) {
  const body = createRigid2D({
    motion: "dynamic",
    mass: 1,
    position,
    velocity,
  });
  body.addShape(new Circle({ radius }));
  world.bodies.add(body);
  return body;
}

function box(
  world: World,
  motion: "static" | "kinematic",
  position: [number, number],
  width: number,
  height: number,
): Body {
  const body: Body =
    motion === "static"
      ? createRigid2D({ motion, position })
      : createRigid2D({ motion, position });
  body.addShape(new Box({ width, height }));
  world.bodies.add(body);
  return body;
}

function particle(world: World, position: [number, number]) {
  const body = createPointMass2D({ motion: "dynamic", mass: 1, position });
  body.addShape(new Particle());
  world.bodies.add(body);
  return body;
}

function query(world: World, x: number, y: number, size = 0.2) {
  const aabb = new AABB({
    lowerBound: [x - size, y - size],
    upperBound: [x + size, y + size],
  });
  return [...world.broadphase.aabbQuery(world, aabb)];
}

const pairKey = ([a, b]: [Body, Body]) =>
  a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;

/** Every pair the broadphase should find, by checking every pair of bodies */
function bruteForcePairs(world: World, particles: Set<Body>): Set<string> {
  const bodies = [...world.bodies.all];
  const keys = new Set<string>();
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const [a, b] = [bodies[i], bodies[j]];
      if (particles.has(a) && particles.has(b)) {
        continue;
      }
      if (a.getAABB().overlaps(b.getAABB()) && bodiesCanCollide(a, b)) {
        keys.add(pairKey([a, b]));
      }
    }
  }
  return keys;
}

test("collision pairs are the same as checking every pair", () => {
  const { world, broadphase } = makeWorld();
  const rand = random(7);
  const particles = new Set<Body>();
  box(world, "static", [10, 10], 20, 0.5);
  box(world, "static", [5, 3], 0.5, 6);
  box(world, "static", [50, 50], 300, 300); // huge
  box(world, "kinematic", [12, 12], 3, 1);
  for (let i = 0; i < 80; i++) {
    const position: [number, number] = [rand() * 20, rand() * 20];
    const velocity: [number, number] = [rand() * 4 - 2, rand() * 4 - 2];
    circle(world, position, velocity, 0.2 + rand() * 0.8);
  }
  for (let i = 0; i < 15; i++) {
    particles.add(particle(world, [rand() * 20, rand() * 20]));
  }

  for (let step = 0; step < 30; step++) {
    const pairs = broadphase.getCollisionPairs(world);
    const keys = pairs.map(pairKey);
    assert.equal(new Set(keys).size, keys.length, "no pair twice");
    assert.deepEqual(
      new Set(keys),
      bruteForcePairs(world, particles),
      `step ${step}`,
    );
    world.step(DT);
  }
});

test("queries between steps see bodies added and removed", () => {
  const { world } = makeWorld();
  circle(world, [0, 0]);
  world.step(DT);

  const added = circle(world, [3.5, 3.5]);
  assert.ok(query(world, 3.5, 3.5).includes(added));
  assert.equal(world.raycast([0, 3.5], [7, 3.5])?.body, added);

  world.bodies.remove(added);
  assert.ok(!query(world, 3.5, 3.5).includes(added));
  assert.equal(world.raycast([0, 3.5], [7, 3.5]), null);
});

test("queries see bodies where the last step moved them", () => {
  const { world } = makeWorld();
  const moving = circle(world, [1, 1], [60, 0]);
  assert.ok(query(world, 1, 1).includes(moving));
  run(world, 3);
  assert.ok(!query(world, 1, 1).includes(moving));
  assert.ok(
    query(world, moving.position[0], moving.position[1]).includes(moving),
  );
});

test("queries between steps don't rebuild the moving hash", () => {
  const { world, broadphase } = makeWorld();
  for (let i = 0; i < 20; i++) {
    circle(world, [i, i], [1, 0]);
  }
  world.step(DT);
  const rebuilds = broadphase.debugData.movingUpdates;
  for (let i = 0; i < 50; i++) {
    world.raycast([0, i % 20], [20, 20 - (i % 20)]);
    query(world, i % 20, i % 20);
  }
  assert.equal(broadphase.debugData.movingUpdates, rebuilds + 1);
  world.step(DT);
  assert.equal(
    broadphase.debugData.movingUpdates,
    rebuilds + 1,
    "the step reused it",
  );
});

test("static-only queries leave out moving bodies", () => {
  const { world } = makeWorld();
  const wall = box(world, "static", [2, 2], 1, 1);
  const ball = circle(world, [2, 2]);
  const aabb = new AABB({ lowerBound: [1.5, 1.5], upperBound: [2.5, 2.5] });
  assert.deepEqual([...world.broadphase.aabbQuery(world, aabb, false)], [wall]);
  assert.deepEqual(
    new Set(world.broadphase.aabbQuery(world, aabb, true)),
    new Set([wall, ball]),
  );
});

test("a static body that changes shape is found where its new shape is", () => {
  const { world } = makeWorld();
  const wall = box(world, "static", [0, 0], 1, 1);
  const [shape] = wall.shapes;
  wall.removeShape(shape);
  wall.addShape(new Box({ width: 1, height: 1 }), [3, 3]);
  assert.ok(!query(world, 0, 0).includes(wall));
  assert.ok(query(world, 3, 3).includes(wall));
});

test("huge bodies are found everywhere they are", () => {
  const { world } = makeWorld();
  const floor = box(world, "static", [0, 0], 100, 100);
  // Kinematic, so it isn't pushed out of the floor
  const bigBox = box(world, "kinematic", [0, 0], 60, 60);
  world.step(DT);
  for (const [x, y] of [
    [0, 0],
    [20, -20],
    [-25, 10],
  ]) {
    const found = query(world, x, y);
    assert.ok(found.includes(floor));
    assert.ok(found.includes(bigBox));
  }
  world.bodies.remove(bigBox);
  assert.ok(!query(world, 0, 0).includes(bigBox));
});

/**
 * The same scene in two worlds: one with the spatial hash (small cells on a
 * grid that wraps), and one with SAP, whose ray queries are just its bounding
 * box, so the hash's walk along the ray can be checked against it
 */
function twinWorlds() {
  const worlds = [
    makeWorld().world,
    new World({ broadphase: new SAPBroadphase() }),
  ];
  const rand = random(3);
  const walls: [number, number, number, number][] = [];
  for (let i = 0; i < 25; i++) {
    walls.push([rand() * 20, rand() * 20, 0.2 + rand() * 3, 0.2 + rand() * 3]);
  }
  const balls: [number, number, number][] = [];
  for (let i = 0; i < 40; i++) {
    balls.push([rand() * 20, rand() * 20, 0.1 + rand() * 0.6]);
  }
  for (const world of worlds) {
    for (const [x, y, w, h] of walls) {
      box(world, "static", [x, y], w, h);
    }
    // A huge one, which isn't in the grid
    box(world, "static", [10, -30], 200, 2);
    for (const [x, y, r] of balls) {
      circle(world, [x, y], [0, 0], r);
    }
  }
  return worlds;
}

/** Rays that are hard to walk a grid along */
function awkwardRays(): [[number, number], [number, number]][] {
  const rand = random(11);
  const rays: [[number, number], [number, number]][] = [
    // Along grid lines, both ways
    [
      [0, 5],
      [20, 5],
    ],
    [
      [20, 5],
      [0, 5],
    ],
    [
      [5, 0],
      [5, 20],
    ],
    [
      [5, 20],
      [5, 0],
    ],
    // Through grid corners
    [
      [0, 0],
      [20, 20],
    ],
    [
      [20, 20],
      [0, 0],
    ],
    [
      [0, 20],
      [20, 0],
    ],
    // Starting and ending exactly on grid lines
    [
      [3, 3.5],
      [17, 3.5],
    ],
    [
      [2.5, 3],
      [2.5, 19],
    ],
    // Tiny, and zero length
    [
      [4.2, 4.2],
      [4.25, 4.21],
    ],
    [
      [6.5, 6.5],
      [6.5, 6.5],
    ],
    // Longer than the grid, so it wraps around more than once
    [
      [-15, 2.3],
      [35, 17.9],
    ],
    [
      [35, -10],
      [-15, 30],
    ],
    // Down to the huge body
    [
      [10.5, 10.5],
      [10.5, -40],
    ],
  ];
  for (let i = 0; i < 400; i++) {
    const from: [number, number] = [rand() * 24 - 2, rand() * 24 - 2];
    // Some rays start and end on whole numbers, which are cell boundaries
    const to: [number, number] =
      i % 4 === 0
        ? [Math.round(rand() * 20), Math.round(rand() * 20)]
        : [rand() * 24 - 2, rand() * 24 - 2];
    rays.push([from, to]);
  }
  return rays;
}

test("raycasts walking the grid find what checking the ray's bounding box does", () => {
  const [hashed, swept] = twinWorlds();
  // Ids differ between the worlds, but the bodies were added in the same order
  const index = (body: Body) => [...body.world!.bodies.all].indexOf(body);
  const describe = (hit: ReturnType<World["raycast"]>) =>
    hit && { body: index(hit.body), fraction: hit.fraction.toFixed(9) };
  const describeAll = (hits: ReturnType<World["raycastAll"]>) =>
    hits.map(describe);
  let hits = 0;
  for (const [from, to] of awkwardRays()) {
    const expected = swept.raycast(from, to);
    hits += expected ? 1 : 0;
    const label = `${from} to ${to}`;
    assert.deepEqual(
      describe(hashed.raycast(from, to)),
      describe(expected),
      label,
    );
    assert.deepEqual(
      describeAll(hashed.raycastAll(from, to)),
      describeAll(swept.raycastAll(from, to)),
      label,
    );
  }
  // The rays actually hit things
  assert.ok(hits > 200, `${hits} hits`);
});

test("a ray query takes a bounded number of steps whatever the ray", () => {
  const { world, broadphase } = makeWorld();
  circle(world, [0.5, 0.5]);
  // Rays whose ends sit on cell boundaries up to rounding error
  for (let i = 0; i < 2000; i++) {
    const a = i * 0.1;
    const found = [
      ...broadphase.rayQuery(world, [a, 0.1 * i], [0.3 * i, a + 1e-15]),
    ];
    assert.ok(found.length <= world.bodies.all.size);
  }
});

function run(world: World, seconds: number) {
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    world.step(DT);
  }
}

test("bodies that stay in the same cells aren't moved in the hash", () => {
  const { world, broadphase } = makeWorld();
  for (let i = 0; i < 20; i++) {
    circle(world, [i + 0.5, 0.5], [0, 0], 0.2);
  }
  const mover = circle(world, [0.5, 5.5], [30, 0], 0.2);
  world.step(DT);
  broadphase.getCollisionPairs(world);
  const before = broadphase.debugData.movingRehashes;
  run(world, 1);
  // Only the one moving across cells, once per cell it entered or left
  const rehashes = broadphase.debugData.movingRehashes - before;
  assert.ok(rehashes > 0 && rehashes <= 60, `${rehashes} rehashes`);
  assert.ok(query(world, mover.position[0], mover.position[1]).includes(mover));
});
