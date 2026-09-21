/**
 * Sanity tests for the physics engine. These run in plain node (no browser)
 * with `npm run test:physics`.
 *
 * They aren't meant to pin down exact numbers, just to catch the engine being
 * fundamentally broken: things tunneling, constraints not holding, contacts
 * not resolving, raycasts missing, events not firing.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { createRigid2D } from "../../src/core/physics2/body/bodyFactories";
import { DistanceConstraint } from "../../src/core/physics2/constraints/DistanceConstraint";
import { LockConstraint } from "../../src/core/physics2/constraints/LockConstraint";
import { RevoluteConstraint } from "../../src/core/physics2/constraints/RevoluteConstraint";
import { ContactMaterial } from "../../src/core/physics2/material/ContactMaterial";
import { Material } from "../../src/core/physics2/material/Material";
import { Box } from "../../src/core/physics2/shapes/Box";
import { Capsule } from "../../src/core/physics2/shapes/Capsule";
import { Circle } from "../../src/core/physics2/shapes/Circle";
import { Convex } from "../../src/core/physics2/shapes/Convex";
import { Line } from "../../src/core/physics2/shapes/Line";
import { LinearSpring } from "../../src/core/physics2/springs/LinearSpring";
import { RotationalSpring } from "../../src/core/physics2/springs/RotationalSpring";
import { World } from "../../src/core/physics2/world/World";
import { V } from "../../src/core/Vector";

const DT = 1 / 60;

function run(world: World, seconds: number, eachStep?: () => void) {
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) {
    eachStep?.();
    world.step(DT);
  }
}

function assertFinite(...values: number[]) {
  for (const value of values) {
    assert.ok(Number.isFinite(value), `expected a finite number, got ${value}`);
  }
}

function dynamicCircle(
  world: World,
  position: [number, number],
  velocity: [number, number] = [0, 0],
  radius = 0.5,
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

function staticBox(
  world: World,
  position: [number, number],
  width: number,
  height: number,
) {
  const body = createRigid2D({ motion: "static", position });
  body.addShape(new Box({ width, height }));
  world.bodies.add(body);
  return body;
}

test("a free body moves at constant velocity", () => {
  const world = new World();
  const body = dynamicCircle(world, [0, 0], [2, -1]);
  run(world, 1);
  assert.ok(Math.abs(body.position[0] - 2) < 0.01);
  assert.ok(Math.abs(body.position[1] + 1) < 0.01);
});

test("forces accelerate bodies and damping slows them down", () => {
  const world = new World();
  const pushed = dynamicCircle(world, [0, 0]);
  run(world, 1, () => pushed.applyForce(V(3, 0)));
  // x = 1/2 a t^2 = 1.5
  assert.ok(Math.abs(pushed.position[0] - 1.5) < 0.1, `${pushed.position[0]}`);

  const damped = createRigid2D({
    motion: "dynamic",
    mass: 1,
    position: [0, 5],
    velocity: [10, 0],
    damping: 0.9,
    angularDamping: 0.9,
  });
  damped.addShape(new Circle({ radius: 0.5 }));
  damped.angularVelocity = 10;
  world.bodies.add(damped);
  run(world, 2);
  assert.ok(damped.velocity.magnitude < 1, `${damped.velocity.magnitude}`);
  assert.ok(Math.abs(damped.angularVelocity) < 1, `${damped.angularVelocity}`);
});

test("impulses change velocity immediately, off-center ones cause spin", () => {
  const world = new World();
  const body = createRigid2D({ motion: "dynamic", mass: 2, position: [0, 0] });
  body.addShape(new Box({ width: 1, height: 1 }));
  world.bodies.add(body);
  body.applyImpulse(V(4, 0), V(0, 0.5));
  assert.ok(Math.abs(body.velocity[0] - 2) < 1e-6);
  assert.ok(Math.abs(body.angularVelocity) > 0.1);
});

test("kinematic bodies move at their velocity and push dynamic bodies", () => {
  const world = new World();
  const pusher = createRigid2D({
    motion: "kinematic",
    position: [0, 0],
    velocity: [1, 0],
  });
  pusher.addShape(new Box({ width: 1, height: 4 }));
  world.bodies.add(pusher);
  const ball = dynamicCircle(world, [1.5, 0]);
  run(world, 3);
  assert.ok(Math.abs(pusher.position[0] - 3) < 0.01);
  // The ball has to have been shoved out of the way
  assert.ok(ball.position[0] > pusher.position[0] + 0.9, `${ball.position[0]}`);
});

test("a dynamic circle is stopped by a static wall", () => {
  const world = new World();
  staticBox(world, [5, 0], 1, 10);
  const ball = dynamicCircle(world, [0, 0], [5, 0]);
  run(world, 3);
  assertFinite(ball.position[0], ball.position[1]);
  // wall's near face is at x = 4.5, so the ball's center can't pass 4.0
  assert.ok(
    ball.position[0] < 4.05,
    `ball went into the wall: ${ball.position[0]}`,
  );
});

test("restitution makes things bounce, and momentum is conserved", () => {
  const world = new World();
  const material = new Material();
  world.contactMaterials.add(
    new ContactMaterial(material, material, { restitution: 1, friction: 0 }),
  );
  const a = dynamicCircle(world, [-2, 0], [3, 0]);
  const b = dynamicCircle(world, [2, 0], [-1, 0]);
  a.shapes[0].material = material;
  b.shapes[0].material = material;
  run(world, 2);
  // Equal masses in an elastic head on collision swap velocities
  assert.ok(Math.abs(a.velocity[0] - -1) < 0.3, `a: ${a.velocity[0]}`);
  assert.ok(Math.abs(b.velocity[0] - 3) < 0.3, `b: ${b.velocity[0]}`);
  assert.ok(Math.abs(a.velocity[0] + b.velocity[0] - 2) < 0.05);
});

test("a crowd of overlapping bodies separates without exploding", () => {
  const world = new World();
  staticBox(world, [0, -3], 12, 1);
  staticBox(world, [0, 3], 12, 1);
  staticBox(world, [-6, 0], 1, 7);
  staticBox(world, [6, 0], 1, 7);
  const bodies = [];
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    bodies.push(
      dynamicCircle(
        world,
        [Math.cos(angle) * 0.4, Math.sin(angle) * 0.4],
        [0, 0],
        0.35,
      ),
    );
  }
  run(world, 4);
  for (const body of bodies) {
    assertFinite(body.position[0], body.position[1]);
    assert.ok(
      Math.abs(body.position[0]) < 5.5 && Math.abs(body.position[1]) < 2.5,
    );
    assert.ok(
      body.velocity.magnitude < 20,
      `exploded: ${body.velocity.magnitude}`,
    );
  }
  // No pair should still be deeply overlapping
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const distance = bodies[i].position.sub(bodies[j].position).magnitude;
      assert.ok(distance > 0.5, `bodies ${i} and ${j} overlap: ${distance}`);
    }
  }
});

test("all the shape types collide with a wall", () => {
  const shapes = {
    box: () => new Box({ width: 1, height: 1 }),
    capsule: () => new Capsule({ length: 1, radius: 0.25 }),
    convex: () =>
      new Convex({
        vertices: [V(-0.5, -0.5), V(0.5, -0.5), V(0.5, 0.5), V(-0.5, 0.5)],
      }),
    circle: () => new Circle({ radius: 0.5 }),
  };
  for (const [name, makeShape] of Object.entries(shapes)) {
    const world = new World();
    staticBox(world, [5, 0], 1, 10);
    const body = createRigid2D({
      motion: "dynamic",
      mass: 1,
      position: [0, 0],
      velocity: [4, 0],
    });
    body.addShape(makeShape());
    world.bodies.add(body);
    run(world, 3);
    assertFinite(body.position[0], body.position[1], body.angle);
    assert.ok(
      body.position[0] < 4.3,
      `${name} went through the wall: ${body.position[0]}`,
    );
  }
});

test("a static line blocks a circle", () => {
  const world = new World();
  const wall = createRigid2D({
    motion: "static",
    position: [5, 0],
    angle: Math.PI / 2,
  });
  wall.addShape(new Line({ length: 10 }));
  world.bodies.add(wall);
  const ball = dynamicCircle(world, [0, 0], [4, 0]);
  run(world, 3);
  assert.ok(ball.position[0] < 4.6, `${ball.position[0]}`);
});

test("collision groups and masks are respected", () => {
  const world = new World();
  const wall = staticBox(world, [5, 0], 1, 10);
  wall.shapes[0].collisionGroup = 0b01;
  wall.shapes[0].collisionMask = 0b01;
  const ghost = dynamicCircle(world, [0, 0], [5, 0]);
  ghost.shapes[0].collisionGroup = 0b10;
  ghost.shapes[0].collisionMask = 0b10;
  run(world, 2);
  assert.ok(ghost.position[0] > 9, "should have passed through the wall");
});

test("sensors report contacts but don't block", () => {
  const world = new World();
  const zone = createRigid2D({ motion: "static", position: [3, 0] });
  zone.addShape(new Circle({ radius: 1, sensor: true }));
  world.bodies.add(zone);
  const ball = dynamicCircle(world, [0, 0], [5, 0]);

  let began = 0;
  let ended = 0;
  world.on("beginContact", (e) => {
    if (e.bodyA === zone || e.bodyB === zone) began++;
  });
  world.on("endContact", (e) => {
    if (e.bodyA === zone || e.bodyB === zone) ended++;
  });
  run(world, 2);
  assert.ok(ball.position[0] > 9, "sensor should not block");
  assert.equal(began, 1);
  assert.equal(ended, 1);
});

test("beginContact, endContact and impact fire for solid bodies", () => {
  const world = new World();
  const material = new Material();
  world.contactMaterials.add(
    new ContactMaterial(material, material, { restitution: 0.8 }),
  );
  const wall = staticBox(world, [3, 0], 1, 10);
  const ball = dynamicCircle(world, [0, 0], [5, 0]);
  wall.shapes[0].material = material;
  ball.shapes[0].material = material;
  const events: string[] = [];
  world.on("beginContact", () => events.push("begin"));
  world.on("endContact", () => events.push("end"));
  world.on("impact", () => events.push("impact"));
  run(world, 2);
  assert.ok(events.includes("begin"), events.join());
  assert.ok(events.includes("impact"), events.join());
  assert.ok(events.includes("end"), events.join());
  assert.ok(ball.velocity[0] < 0, "should have bounced back");
});

test("fast bodies with CCD don't tunnel through thin walls", () => {
  const world = new World();
  staticBox(world, [10, 0], 0.1, 10);
  const bullet = createRigid2D({
    motion: "dynamic",
    mass: 0.1,
    position: [0, 0],
    velocity: [600, 0],
    ccdSpeedThreshold: 1,
    ccdIterations: 15,
  });
  bullet.addShape(new Circle({ radius: 0.05 }));
  world.bodies.add(bullet);
  run(world, 0.5);
  assert.ok(
    bullet.position[0] < 10,
    `bullet tunneled to ${bullet.position[0]}`,
  );
});

test("distance constraints hold their length", () => {
  const world = new World();
  const anchor = createRigid2D({ motion: "static", position: [0, 0] });
  world.bodies.add(anchor);
  const ball = dynamicCircle(world, [2, 0], [0, 3]);
  world.constraints.add(new DistanceConstraint(anchor, ball, { distance: 2 }));
  run(world, 3);
  const distance = ball.position.magnitude;
  assert.ok(Math.abs(distance - 2) < 0.05, `${distance}`);
  // and it should be swinging around, not stuck
  assert.ok(ball.velocity.magnitude > 1);
});

test("revolute constraints act like hinges", () => {
  const world = new World();
  const frame = createRigid2D({ motion: "static", position: [0, 0] });
  world.bodies.add(frame);
  // A door whose hinge is at the origin
  const door = createRigid2D({
    motion: "dynamic",
    mass: 1,
    position: [0.5, 0],
  });
  door.addShape(new Box({ width: 1, height: 0.1 }));
  world.bodies.add(door);
  world.constraints.add(
    new RevoluteConstraint(frame, door, { worldPivot: [0, 0] }),
  );
  // push on the far end of the door
  run(world, 1, () =>
    door.applyForce(V(0, 2), door.vectorToWorldFrame(V(0.5, 0))),
  );
  const hinge = door.toWorldFrame(V(-0.5, 0));
  assert.ok(hinge.magnitude < 0.05, `hinge drifted to ${hinge}`);
  assert.ok(Math.abs(door.angle) > 0.3, `door didn't swing: ${door.angle}`);
});

test("lock constraints keep bodies rigidly attached", () => {
  const world = new World();
  const a = dynamicCircle(world, [0, 0], [1, 0]);
  const b = dynamicCircle(world, [2, 0]);
  world.constraints.add(new LockConstraint(a, b));
  run(world, 2);
  const distance = a.position.sub(b.position).magnitude;
  assert.ok(Math.abs(distance - 2) < 0.05, `${distance}`);
  assert.ok(Math.abs(a.velocity[0] - b.velocity[0]) < 0.05);
  assert.ok(Math.abs(a.velocity[0] - 0.5) < 0.1, "momentum should be shared");
});

test("linear springs pull towards their rest length", () => {
  const world = new World();
  const anchor = createRigid2D({ motion: "static", position: [0, 0] });
  world.bodies.add(anchor);
  const ball = createRigid2D({
    motion: "dynamic",
    mass: 1,
    position: [3, 0],
    damping: 0.5,
  });
  ball.addShape(new Circle({ radius: 0.1 }));
  world.bodies.add(ball);
  world.addSpring(
    new LinearSpring(ball, anchor, {
      stiffness: 50,
      damping: 5,
      restLength: 1,
    }),
  );
  run(world, 6);
  assert.ok(
    Math.abs(ball.position.magnitude - 1) < 0.1,
    `${ball.position.magnitude}`,
  );
});

test("rotational springs pull towards their rest angle", () => {
  const world = new World();
  const anchor = createRigid2D({ motion: "static", position: [0, 0] });
  world.bodies.add(anchor);
  const body = createRigid2D({
    motion: "dynamic",
    mass: 1,
    position: [0, 0],
    angularDamping: 0.5,
  });
  body.addShape(new Box({ width: 1, height: 1 }));
  world.bodies.add(body);
  world.addSpring(
    new RotationalSpring(body, anchor, {
      stiffness: 20,
      damping: 2,
      restAngle: 1,
    }),
  );
  run(world, 6);
  // restAngle is angleB - angleA
  assert.ok(Math.abs(Math.abs(body.angle) - 1) < 0.1, `${body.angle}`);
});

test("raycasts hit the closest thing and respect masks and filters", () => {
  const world = new World();
  const near = staticBox(world, [5, 0], 1, 4);
  const far = staticBox(world, [10, 0], 1, 4);
  near.shapes[0].collisionGroup = 0b01;
  far.shapes[0].collisionGroup = 0b10;
  world.step(DT);

  const hit = world.raycast([0, 0], [20, 0]);
  assert.ok(hit);
  assert.equal(hit.body, near);
  assert.ok(Math.abs(hit.point[0] - 4.5) < 1e-3, `${hit.point}`);
  assert.ok(Math.abs(hit.normal[0] - -1) < 1e-3, `${hit.normal}`);
  assert.ok(Math.abs(hit.distance - 4.5) < 1e-3);

  assert.equal(
    world.raycast([0, 0], [20, 0], { collisionMask: 0b10 })?.body,
    far,
  );
  assert.equal(
    world.raycast([0, 0], [20, 0], { filter: (body) => body !== near })?.body,
    far,
  );
  assert.equal(world.raycast([0, 3], [20, 3]), null);
  assert.equal(world.raycastAll([0, 0], [20, 0]).length, 2);
  // Rays that stop short don't hit
  assert.equal(world.raycast([0, 0], [4, 0]), null);
});

test("raycasts hit circles, capsules and rotated boxes", () => {
  const world = new World();
  const circle = createRigid2D({ motion: "static", position: [5, 0] });
  circle.addShape(new Circle({ radius: 1 }));
  world.bodies.add(circle);
  const capsule = createRigid2D({ motion: "static", position: [5, 5] });
  capsule.addShape(new Capsule({ length: 2, radius: 0.5 }));
  world.bodies.add(capsule);
  const diamond = createRigid2D({
    motion: "static",
    position: [5, 10],
    angle: Math.PI / 4,
  });
  diamond.addShape(new Box({ width: 2, height: 2 }));
  world.bodies.add(diamond);
  world.step(DT);

  assert.ok(Math.abs(world.raycast([0, 0], [10, 0])!.point[0] - 4) < 1e-3);
  assert.ok(Math.abs(world.raycast([0, 5], [10, 5])!.point[0] - 3.5) < 1e-3);
  assert.ok(
    Math.abs(world.raycast([0, 10], [10, 10])!.point[0] - (5 - Math.SQRT2)) <
      1e-3,
  );
});

test("bodies can be removed, including during a contact", () => {
  const world = new World();
  staticBox(world, [2, 0], 1, 10);
  const ball = dynamicCircle(world, [0, 0], [5, 0]);
  run(world, 0.5);
  world.bodies.remove(ball);
  run(world, 0.5);
  assert.equal(world.bodies.all.has(ball), false);
});
