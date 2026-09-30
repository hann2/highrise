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
  const rebuilds = broadphase.debugData.movingRebuilds;
  for (let i = 0; i < 50; i++) {
    world.raycast([0, i % 20], [20, 20 - (i % 20)]);
    query(world, i % 20, i % 20);
  }
  assert.equal(broadphase.debugData.movingRebuilds, rebuilds + 1);
  world.step(DT);
  assert.equal(
    broadphase.debugData.movingRebuilds,
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

function run(world: World, seconds: number) {
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    world.step(DT);
  }
}
