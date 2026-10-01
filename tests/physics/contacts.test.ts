/**
 * Tests for contact bookkeeping: begin and end events over many steps, and
 * the keys pairs are tracked by. Plain node: `npm run test:physics`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { createRigid2D } from "../../src/core/physics/body/bodyFactories";
import { Circle } from "../../src/core/physics/shapes/Circle";
import { tupleToInt } from "../../src/core/physics/world/OverlapKeeper";
import { World } from "../../src/core/physics/world/World";
import { V } from "../../src/core/Vector";

const DT = 1 / 60;

function ball(world: World, x: number, vx: number) {
  const body = createRigid2D({
    motion: "dynamic",
    mass: 1,
    position: [x, 0],
    velocity: [vx, 0],
  });
  body.addShape(new Circle({ radius: 0.5 }));
  world.bodies.add(body);
  return body;
}

test("contacts begin and end in turn, with their equations", () => {
  const world = new World();
  // Two pairs that meet and bounce apart at different times, and a pair
  // pushed against each other the whole time
  const bodies = [
    ball(world, -3, 4),
    ball(world, -1, -4),
    ball(world, 5, 2),
    ball(world, 8, -2),
  ];
  const pushedA = ball(world, 20, 0);
  const pushedB = ball(world, 20.9, 0);
  bodies.push(pushedA, pushedB);

  // Begins minus ends, per pair: always 0 or 1
  const open = new Map<string, number>();
  const begins = new Map<string, number>();
  const pairName = (a: { id: number }, b: { id: number }) =>
    [a.id, b.id].sort((x, y) => x - y).join("-");
  world.on("beginContact", ({ bodyA, bodyB, contactEquations }) => {
    assert.ok(contactEquations.length > 0, "a solid contact has equations");
    const name = pairName(bodyA, bodyB);
    open.set(name, (open.get(name) ?? 0) + 1);
    begins.set(name, (begins.get(name) ?? 0) + 1);
    assert.equal(open.get(name), 1, `${name} began while it was going on`);
  });
  world.on("endContact", ({ bodyA, bodyB }) => {
    const name = pairName(bodyA, bodyB);
    open.set(name, (open.get(name) ?? 0) - 1);
    assert.equal(open.get(name), 0, `${name} ended while it wasn't going on`);
  });

  for (let i = 0; i < 120; i++) {
    pushedA.applyForce(V(20, 0));
    pushedB.applyForce(V(-20, 0));
    world.step(DT);
  }

  // Every pair that touched began, and is open exactly when it's touching
  assert.equal(begins.size, 3);
  for (const a of bodies) {
    for (const b of bodies) {
      if (a.id < b.id) {
        const name = pairName(a, b);
        assert.equal(
          (open.get(name) ?? 0) === 1,
          world.overlapKeeper.bodiesAreOverlapping(a, b),
          name,
        );
      }
    }
  }
  assert.ok(world.overlapKeeper.bodiesAreOverlapping(pushedA, pushedB));
});

test("pair keys ignore order and stay unique for huge ids", () => {
  assert.equal(tupleToInt(3, 7), tupleToInt(7, 3));
  assert.notEqual(tupleToInt(3, 7), tupleToInt(3, 8));
  assert.equal(typeof tupleToInt(3, 7), "number");
  // Too big to pack into a number exactly: a string
  const big = 2 ** 22;
  assert.equal(typeof tupleToInt(big, big + 1), "string");
  assert.notEqual(tupleToInt(big, big + 1), tupleToInt(big, big + 2));
});
