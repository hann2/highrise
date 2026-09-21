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
import type { Body } from "../../src/core/physics/body/Body";
import {
  createPointMass2D,
  createRigid2D,
} from "../../src/core/physics/body/bodyFactories";
import { SAPBroadphase } from "../../src/core/physics/collision/broadphase/SAPBroadphase";
import { DistanceConstraint } from "../../src/core/physics/constraints/DistanceConstraint";
import { LockConstraint } from "../../src/core/physics/constraints/LockConstraint";
import { RevoluteConstraint } from "../../src/core/physics/constraints/RevoluteConstraint";
import { ContactMaterial } from "../../src/core/physics/material/ContactMaterial";
import { Material } from "../../src/core/physics/material/Material";
import { Box } from "../../src/core/physics/shapes/Box";
import { Capsule } from "../../src/core/physics/shapes/Capsule";
import { Circle } from "../../src/core/physics/shapes/Circle";
import { Convex } from "../../src/core/physics/shapes/Convex";
import { Line } from "../../src/core/physics/shapes/Line";
import { Particle } from "../../src/core/physics/shapes/Particle";
import { AimSpring } from "../../src/core/physics/springs/AimSpring";
import { DampedRotationalSpring } from "../../src/core/physics/springs/DampedRotationalSpring";
import { LinearSpring } from "../../src/core/physics/springs/LinearSpring";
import { RopeSpring } from "../../src/core/physics/springs/RopeSpring";
import { RotationalSolenoidSpring } from "../../src/core/physics/springs/RotationalSolenoidSpring";
import { RotationalSpring } from "../../src/core/physics/springs/RotationalSpring";
import { SleepMode, World } from "../../src/core/physics/world/World";
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

// ─────────────────────────────────────────────────────────────────────────
// Solver regression tests
//
// These scenarios exercise the specialised solver paths (planar / angular /
// point-to-point / point-to-rigid / general equations, substepping, island
// splitting, warm starting, sleeping). Several are pinned to concrete numbers
// recorded from a known-good build, so a wrong index or stride in the solver
// shows up as a numeric diff rather than going unnoticed.
//
// To re-record after an *intentional* behaviour change:
//   PHYSICS_RECORD_PINS=1 npm run test:physics
// and paste the printed values into PINS.
// ─────────────────────────────────────────────────────────────────────────

const RECORD_PINS = !!process.env.PHYSICS_RECORD_PINS;

const PINS: Record<string, number[]> = {
  "friction/slippery": [
    6.000000454485416, 0.49430281873961873, -0.000004526255066742838,
    6.000000894069672, -1.5075427572952549e-9, -1.1706182472209867e-8,
  ],
  "friction/grippy": [
    4.975337199173744, 0.4943023661322337, -0.000005621131158082303,
    3.991027920457983, -7.054658884841913e-9, -4.5794867381939585e-9,
  ],
  "friction/fixedSlipForce": [
    1.719845935985543, 0.494293735775203, 0.00006763380917299542,
    0.00022855698178673203, 0.00022560934580892478, -0.0004569680847529863,
  ],
  pile: [
    -0.00012539920176431608, 0.4942749931438415, -0.00018632182227281145,
    -0.00010897697277000427, 7.065202145550842e-9, 1.8002617298762055e-7,
    0.049920803103468483, 1.4892630095040775, -0.0001897539052017946,
    -0.00017943783438284223, 1.3348906952037609e-8, 1.7839624334888005e-7,
    0.1000859676346088, 2.4842496641580913, -0.0001413885390649522,
    -0.00017956259075180376, 2.032559587306082e-8, 1.2799515286315757e-7,
  ],
  "chain/substeps4": [
    0.036444614602780555, 0.49871124186786175, 1.497847831209509,
    -0.6734213391703372, 0.05082174404728107, 1.3504911566564615,
    0.09424998969302008, 1.4969959087926699, 1.5280445344661822,
    -1.9516686252115025, 0.12910306384579365, 1.210831535844923,
    0.11466960950191794, 2.4966076574017637, 1.5726799329412584,
    -3.135897892809922, 0.15594038846037742, 1.1587109588930777,
  ],
  "chain/substeps1": [
    0.03361905332262706, 0.4994103623505984, 1.5036417924964696,
    -0.6730064414132393, 0.053208374566560857, 1.348803601451091,
    0.08762358592371458, 1.4988858458867995, 1.5301016420700921,
    -1.9626934288204765, 0.13797500620476263, 1.2341724697068428,
    0.10849726090120404, 2.4995679380338047, 1.5698742975838478,
    -3.1358422787614892, 0.17471897917481993, 1.1117649027904508,
  ],
  "chain/islandSplit": [
    0.034003430814124984, 0.4993786795586675, 1.5028708509281508,
    -0.6711311111929489, 0.053669151696163625, 1.3454318201270081,
    0.08722244994037257, 1.498870560271694, 1.5324362248082686,
    -1.9583243527016054, 0.1373372633562106, 1.2325855043218763,
    0.1049811041216446, 2.499611205211462, 1.5737671261673023,
    -3.140364508679935, 0.17054205678516077, 1.1309629994415193,
  ],
  pointMass: [
    4.487937514246015, 0.09010566663496053, 0, -0.017159711935752883,
    4.068358419324389e-31, 0, 2.123747977554858, 11.520515040123222, 0,
    0.7072160577316615, -0.8210373737768542, 0, 0.7920840074817141,
    10.826494986625587, 0, -0.23573868591055414, 0.940345791258951, 0,
    2.5390953480352048, 22.612537429518785, 0, 0.4949989917403342,
    -0.4940623587306855, 0, 0.7304523259823973, 21.69373128524061,
    -2.5862347308799896, -0.2474994958701671, 1.747031179365342,
    -2.5288992760423845,
  ],
  ropeSpring: [
    -1.79097451897102, 4.599422791346779, 5.419096547049776,
    -0.35543713762905216, -0.2463050773616622, -1.792476606028492,
  ],
  rotationalSprings: [
    0, 0, 0.7999999999999996, 0, 0, 2.2204460492503135e-15, 0, 10,
    -0.5000000000011132, 0, 0, -1.1776768067928977e-10, 0, 20,
    0.2999075710383065, 0, 0, 0.00007844197296002058,
  ],
  revolute: [
    -0.32671615539812465, 0.3801595778025896, -4.002816218568203,
    0.7503877662774796, 0.6668779715069747, -2.0028674313348804,
    0.4126673116420625, 10.282533729901115, 0.6009937891310514,
    -5.927671229172375e-10, -1.5613807469172514e-9, -5.014826054416943e-9,
  ],
  "distance/offCentre": [
    2.6697846056886756, 1.8453365334325798, 1.3783118889939732,
    0.34501184184649075, 0.9945284672671463, 0.5115193355106329,
    1.9320861577245285, 2.7618653866269693, -0.20575562377677648,
    -0.13800473673859637, 0.602188613093141, 0.5284935259147157,
  ],
  lock: [
    1.0895462499591249, -0.04569745439995966, 1.334506534288213,
    1.309725391841621, 0.7638368090994352, 1.2448629253487657,
    0.9552268750204383, 1.5311820605333124, 1.6340877462005325,
    -0.6548626959208105, 0.6180815954502807, 1.2449180796748296,
  ],
  offCentreCollision: [
    -0.33814989396134687, -1.502265199549055, 3.1605037880234836,
    0.11639869268937113, -1.4187022191442356, 2.679947859399068,
    -1.8309250530193262, 1.4511325997745277, 3.702823436535341,
    -2.0581993463446855, 0.7093511095721178, 3.2138935797650054,
  ],
  determinism: [
    1.0950383700447006, 0.7911805822197528, 4.204123135745495,
    0.0555929917497335, -0.2511434884603999, 1.9068183993143775,
    1.5842843608006307, 0.6210752988581184, 4.336366931194799,
    0.4102096845643952, 0.7415635427386698, 2.1906382566611673,
    1.2460564573312425, 1.836685594241715, -0.25751599947606174,
    0.19378599224925097, -0.3982172371827525, 0.6459532030601469,
    -0.6153072920011275, -0.3811015040764828, -0.5866540777829279,
    -0.3093929989260844, -0.6698028886945118, -0.36954653907031587,
    -0.6693137933886328, 2.204983288916053, -1.3276109184903007,
    -0.06711373369434233, 0.0006893269250700703, -0.2237124456478079,
    -1.9130442264817653, 0.7374816835896093, 0.6481480809575507,
    -0.5899813836383873, 0.14683325562560348, 0.8220047719481406,
    -2.7347755569219587, 0.42888336065388466, -2.5089808340731032,
    -0.8857289517119067, 0.21846736122775826, -1.372937416852031,
    -1.2251039450170103, -0.768687774163567, 1.1858830047175501,
    -0.22416761111077543, -0.16211544664300806, 0.1681454630732739,
    -0.723152339141966, -2.124069811768978, -2.422980111487866,
    0.08548376089839109, 0.1647554296366188, -0.2849458697291687,
    0.17773389761937056, -0.9569037524381402, 8.249862573872598,
    0.09966422929985123, -0.026471118491212822, 4.077408014036573,
    1.1417601436902085, -2.1535483349473226, -1.1378858166401478,
    0.2660947857182195, -0.640360539984733, -0.4971374646934053,
    2.485955329984959, -1.4254634711981242, -2.1463038778399066,
    0.8577761523786255, -0.48906069375952643, -0.7244094155856706,
  ],
};

function pin(name: string, values: number[]) {
  assertFinite(...values);
  if (RECORD_PINS) {
    console.log(`  ${JSON.stringify(name)}: ${JSON.stringify(values)},`);
    return;
  }
  const expected = PINS[name];
  assert.ok(expected, `no pinned values recorded for "${name}"`);
  assert.equal(values.length, expected.length, `${name}: length`);
  for (let i = 0; i < values.length; i++) {
    const tolerance = 1e-4 * Math.max(1, Math.abs(expected[i]));
    assert.ok(
      Math.abs(values[i] - expected[i]) <= tolerance,
      `${name}[${i}]: expected ${expected[i]}, got ${values[i]}`,
    );
  }
}

function bodyState(...bodies: Body[]): number[] {
  const out: number[] = [];
  for (const b of bodies) {
    out.push(
      b.position[0],
      b.position[1],
      b.angle,
      b.velocity[0],
      b.velocity[1],
      b.angularVelocity,
    );
  }
  return out;
}

function dynamicBox(
  world: World,
  position: [number, number],
  options: {
    width?: number;
    height?: number;
    mass?: number;
    velocity?: [number, number];
    angle?: number;
    angularVelocity?: number;
    material?: Material;
  } = {},
) {
  const body = createRigid2D({
    motion: "dynamic",
    mass: options.mass ?? 1,
    position,
    velocity: options.velocity ?? [0, 0],
    angle: options.angle ?? 0,
    angularVelocity: options.angularVelocity ?? 0,
  });
  body.addShape(
    new Box({
      width: options.width ?? 1,
      height: options.height ?? 1,
      material: options.material,
    }),
  );
  world.bodies.add(body);
  return body;
}

/** A box pressed onto a static floor box and sliding along it. */
function slidingBoxScenario(
  friction: number,
  options: ConstructorParameters<typeof World>[0] = {},
) {
  const world = new World(options);
  const material = new Material();
  world.contactMaterials.add(
    new ContactMaterial(material, material, { friction, restitution: 0 }),
  );
  const floor = staticBox(world, [0, -0.5], 40, 1);
  floor.shapes[0].material = material;
  const box = dynamicBox(world, [0, 0.5], { velocity: [6, 0], material });
  // No gravity in this engine: press the box into the floor by hand.
  run(world, 1, () => box.applyForce(V(0, -10)));
  return box;
}

test("box-on-box friction from contact force slows a sliding box", () => {
  // With friction pre-iterations the slip force is derived from the contact
  // force: mu * (average normal force over the contact points). The box rests
  // on two contact points carrying 5N each, so mu = 0.4 gives 2N of friction.
  const solverConfig = { frictionIterations: 3 };
  const slippery = slidingBoxScenario(0, { solverConfig });
  const grippy = slidingBoxScenario(0.4, { solverConfig });
  // Neither sinks into the floor
  assert.ok(Math.abs(slippery.position[1] - 0.5) < 0.05);
  assert.ok(Math.abs(grippy.position[1] - 0.5) < 0.05);
  assert.ok(Math.abs(slippery.velocity[0] - 6) < 0.05, `${slippery.velocity}`);
  assert.ok(Math.abs(grippy.velocity[0] - 4) < 0.2, `${grippy.velocity[0]}`);
  assert.ok(grippy.position[0] < slippery.position[0] - 0.5);
  pin("friction/slippery", bodyState(slippery));
  pin("friction/grippy", bodyState(grippy));
});

test("without friction pre-iterations a fixed slip force is used", () => {
  // frictionIterations defaults to 0, in which case every friction equation
  // is bounded by a constant 10N slip force regardless of the coefficient.
  const box = slidingBoxScenario(0.4);
  assert.ok(Math.abs(box.velocity[0]) < 0.1, `${box.velocity[0]}`);
  assert.ok(box.position[0] > 1 && box.position[0] < 3, `${box.position[0]}`);
  pin("friction/fixedSlipForce", bodyState(box));
});

test("a pile of boxes pressed onto a floor stays stacked", () => {
  const world = new World({ solverConfig: { iterations: 30 } });
  const material = new Material();
  world.contactMaterials.add(
    new ContactMaterial(material, material, { friction: 0.5 }),
  );
  const floor = staticBox(world, [0, -0.5], 20, 1);
  floor.shapes[0].material = material;
  const boxes = [0, 1, 2].map((i) =>
    dynamicBox(world, [i * 0.05, 0.5 + i * 1.0], { material }),
  );
  run(world, 2, () => {
    for (const box of boxes) box.applyForce(V(0, -10));
  });
  for (let i = 0; i < boxes.length; i++) {
    assert.ok(
      Math.abs(boxes[i].position[1] - (0.5 + i)) < 0.1,
      `box ${i} at ${boxes[i].position}`,
    );
    assert.ok(Math.abs(boxes[i].angle) < 0.05, `box ${i} tipped`);
    assert.ok(boxes[i].velocity.magnitude < 0.2);
  }
  pin("pile", bodyState(...boxes));
});

/** A three link chain of off-centre hinged boxes whipped around by a force. */
function chainScenario(options: ConstructorParameters<typeof World>[0]) {
  const world = new World(options);
  const anchor = createRigid2D({ motion: "static", position: [0, 0] });
  world.bodies.add(anchor);
  const links: Body[] = [];
  let previous: Body = anchor;
  for (let i = 0; i < 3; i++) {
    const link = dynamicBox(world, [0.5 + i, 0], { width: 1, height: 0.2 });
    world.constraints.add(
      new RevoluteConstraint(previous, link, { worldPivot: [i, 0] }),
    );
    links.push(link);
    previous = link;
  }
  run(world, 2, () => links[2].applyForce(V(0, 3)));
  return { world, links };
}

test("substepping keeps a hinge chain together", () => {
  const { links } = chainScenario({ substeps: 4 });
  const first = links[0].toWorldFrame(V(-0.5, 0));
  assert.ok(first.magnitude < 0.02, `chain detached from anchor: ${first}`);
  for (let i = 0; i < 2; i++) {
    const end = links[i].toWorldFrame(V(0.5, 0));
    const start = links[i + 1].toWorldFrame(V(-0.5, 0));
    assert.ok(end.sub(start).magnitude < 0.02, `joint ${i} separated`);
  }
  assert.ok(Math.abs(links[2].angle) > 0.2, "chain should have swung");
  pin("chain/substeps4", bodyState(...links));
  pin("chain/substeps1", bodyState(...chainScenario({}).links));
});

test("island splitting solves separate groups independently", () => {
  const { world, links } = chainScenario({ islandSplit: true });
  assert.ok(world.solverIslandCount >= 1);
  assert.ok(links[0].toWorldFrame(V(-0.5, 0)).magnitude < 0.05);
  pin("chain/islandSplit", bodyState(...links));

  // Two unrelated collisions in one world
  const split = new World({ islandSplit: true });
  staticBox(split, [5, 0], 1, 4);
  staticBox(split, [5, 20], 1, 4);
  const a = dynamicCircle(split, [0, 0], [5, 0]);
  const b = dynamicCircle(split, [0, 20], [5, 0]);
  run(split, 2);
  assert.ok(a.position[0] < 4.05 && b.position[0] < 4.05);
  assert.ok(Math.abs(a.position[0] - b.position[0]) < 1e-9);
});

test("idle bodies fall asleep and wake up when hit", () => {
  const world = new World();
  world.sleepMode = SleepMode.BODY_SLEEPING;
  const idle = createRigid2D({
    motion: "dynamic",
    mass: 1,
    position: [0, 0],
    sleepTimeLimit: 0.5,
  });
  idle.addShape(new Circle({ radius: 0.5 }));
  world.bodies.add(idle);
  const mover = dynamicCircle(world, [-10, 0], [4, 0]);
  run(world, 1);
  assert.ok(idle.isSleeping(), "idle body should be asleep");
  assert.ok(!mover.isSleeping(), "moving body should stay awake");
  run(world, 2.5);
  assert.ok(!idle.isSleeping(), "should have been woken by the collision");
  assert.ok(idle.velocity[0] > 0.5, `${idle.velocity[0]}`);

  idle.sleep();
  assert.ok(idle.isSleeping());
  idle.wakeUp();
  assert.ok(idle.isAwake());
});

test("islands fall asleep together with island sleeping", () => {
  const world = new World({ islandSplit: true });
  world.sleepMode = SleepMode.ISLAND_SLEEPING;
  const a = dynamicCircle(world, [0, 0]);
  const b = dynamicCircle(world, [2, 0]);
  world.constraints.add(new DistanceConstraint(a, b));
  run(world, 3);
  assert.ok(a.isSleeping() && b.isSleeping());
  assertFinite(...bodyState(a, b));
});

test("point masses move, collide and are constrained but never rotate", () => {
  const world = new World();
  staticBox(world, [5, 0], 1, 10);
  const point = createPointMass2D({
    motion: "dynamic",
    mass: 1,
    position: [0, 0],
    velocity: [5, 0],
  });
  point.addShape(new Particle());
  world.bodies.add(point);
  point.applyImpulse(V(0, 0.1), V(1, 1));
  point.angularForce = 5;

  // pm2d <-> pm2d distance constraint
  const p1 = createPointMass2D({
    motion: "dynamic",
    mass: 1,
    position: [0, 10],
    velocity: [0, 2],
  });
  const p2 = createPointMass2D({
    motion: "dynamic",
    mass: 3,
    position: [1.5, 10],
  });
  world.bodies.add(p1);
  world.bodies.add(p2);
  world.constraints.add(new DistanceConstraint(p1, p2));

  // pm2d <-> rigid2d distance constraint, off-centre anchor on the rigid
  const p3 = createPointMass2D({
    motion: "dynamic",
    mass: 1,
    position: [0, 20],
    velocity: [0, 3],
  });
  world.bodies.add(p3);
  const rigid = dynamicBox(world, [2, 20], { mass: 2 });
  const tether = new DistanceConstraint(rigid, p3, {
    localAnchorA: [-0.5, 0.25],
  });
  world.constraints.add(tether);

  run(world, 2);
  assert.ok(point.position[0] < 4.55, `particle tunneled: ${point.position}`);
  assert.equal(point.angle, 0);
  assert.equal(p1.angle, 0);
  assert.ok(Math.abs(p1.position.sub(p2.position).magnitude - 1.5) < 0.02);
  // momentum of the pair is conserved
  assert.ok(Math.abs(p1.velocity[1] + 3 * p2.velocity[1] - 2) < 1e-3);
  const anchor = rigid.toWorldFrame(V(-0.5, 0.25));
  assert.ok(
    Math.abs(anchor.sub(p3.position).magnitude - tether.distance) < 0.02,
  );
  assert.ok(Math.abs(rigid.angularVelocity) > 0.05, "rigid should be spun");
  pin("pointMass", bodyState(point, p1, p2, p3, rigid));
});

test("rope springs only pull", () => {
  const world = new World();
  const anchor = createRigid2D({ motion: "static", position: [0, 0] });
  world.bodies.add(anchor);
  const slack = dynamicCircle(world, [1, 0]);
  const taut = dynamicBox(world, [3, 5]);
  world.addSpring(
    new RopeSpring(anchor, slack, { restLength: 2, stiffness: 50 }),
  );
  world.addSpring(
    new RopeSpring(anchor, taut, {
      restLength: 2,
      stiffness: 50,
      damping: 4,
      localAnchorA: [0, 5],
      localAnchorB: [-0.5, 0.5],
    }),
  );
  run(world, 3);
  assert.deepEqual([...slack.position], [1, 0]);
  assert.ok(taut.position[0] < 2.9, `${taut.position}`);
  pin("ropeSpring", bodyState(taut));
});

test("damped rotational, aim and solenoid springs settle on their target", () => {
  const world = new World();
  const anchor = createRigid2D({ motion: "static", position: [0, 0] });
  world.bodies.add(anchor);

  const damped = dynamicBox(world, [0, 0]);
  world.addSpring(
    new DampedRotationalSpring(anchor, damped, {
      stiffness: 20,
      damping: 4,
      restAngle: 0.8,
      maxTorque: 5,
    }),
  );

  const aimed = dynamicBox(world, [0, 10], { angle: 1 });
  const aim = new AimSpring(aimed);
  aim.restAngle = -0.5;
  world.addSpring(aim);

  // The solenoid spring is strongly non-linear (bang-bang-ish), so just
  // check it pushes the right way and stays finite.
  const solenoid = dynamicBox(world, [0, 20], { mass: 50, width: 4 });
  world.addSpring(
    new RotationalSolenoidSpring(anchor, solenoid, {
      stiffness: 0.001,
      damping: 0.01,
      restAngle: 0.3,
    }),
  );
  world.step(DT);
  assert.ok(solenoid.angularVelocity > 0, "solenoid should push towards rest");

  run(world, 8);
  assert.ok(Math.abs(damped.angle - 0.8) < 0.05, `damped: ${damped.angle}`);
  assert.ok(Math.abs(aimed.angle + 0.5) < 0.05, `aimed: ${aimed.angle}`);
  pin("rotationalSprings", bodyState(damped, aimed, solenoid));
});

test("revolute motors drive and revolute limits stop", () => {
  const world = new World();
  const frame = createRigid2D({ motion: "static", position: [0, 0] });
  world.bodies.add(frame);

  const rotor = dynamicBox(world, [0.5, 0], { width: 1, height: 0.2 });
  const motor = new RevoluteConstraint(frame, rotor, { worldPivot: [0, 0] });
  motor.enableMotor();
  motor.setMotorSpeed(2);
  world.constraints.add(motor);

  const door = dynamicBox(world, [0.5, 10], { width: 1, height: 0.2 });
  const hinge = new RevoluteConstraint(frame, door, { worldPivot: [0, 10] });
  hinge.setLimits(-0.4, 0.6);
  world.constraints.add(hinge);

  run(world, 2, () =>
    door.applyForce(V(0, 3), door.vectorToWorldFrame(V(0.5, 0))),
  );
  assert.ok(Math.abs(Math.abs(rotor.angularVelocity) - 2) < 0.05);
  assert.ok(Math.abs(rotor.angle) > 3, `${rotor.angle}`);
  assert.ok(rotor.toWorldFrame(V(-0.5, 0)).magnitude < 0.05);
  assert.ok(Math.abs(door.angle - 0.6) < 0.05, `door: ${door.angle}`);
  pin("revolute", bodyState(rotor, door));
});

test("distance constraint between spinning bodies with off-centre anchors", () => {
  const world = new World();
  const a = dynamicBox(world, [0, 0], { mass: 1, angularVelocity: 2 });
  const b = dynamicBox(world, [3, 0.5], {
    mass: 2.5,
    width: 2,
    height: 0.5,
    angle: 0.4,
    angularVelocity: -1.5,
    velocity: [0, 1],
  });
  const constraint = new DistanceConstraint(a, b, {
    localAnchorA: [0.5, 0.5],
    localAnchorB: [-1, 0.25],
  });
  world.constraints.add(constraint);
  const momentum = () => a.velocity.mul(a.mass).add(b.velocity.mul(b.mass));
  const before = momentum();
  run(world, 3);
  const separation = a
    .toWorldFrame(V(0.5, 0.5))
    .sub(b.toWorldFrame(V(-1, 0.25))).magnitude;
  assert.ok(
    Math.abs(separation - constraint.distance) < 0.02,
    `${separation} vs ${constraint.distance}`,
  );
  const after = momentum();
  assert.ok(after.sub(before).magnitude < 1e-3, "linear momentum conserved");
  pin("distance/offCentre", bodyState(a, b));
});

test("lock constraint holds relative angle under torque", () => {
  const world = new World();
  const a = dynamicBox(world, [0, 0]);
  const b = dynamicBox(world, [1.5, 0.5], { mass: 2, angle: 0.3 });
  world.constraints.add(new LockConstraint(a, b));
  run(world, 2, () => {
    a.angularForce += 1;
    b.applyForce(V(0, 1));
  });
  assert.ok(Math.abs(b.angle - a.angle - 0.3) < 0.02);
  assert.ok(Math.abs(a.angle) > 0.1, "pair should be rotating");
  pin("lock", bodyState(a, b));
});

test("off-centre box collisions make both boxes spin", () => {
  const world = new World();
  const a = dynamicBox(world, [-2, 0], { velocity: [4, 0] });
  const b = dynamicBox(world, [2, 0.7], { velocity: [-4, 0], mass: 2 });
  run(world, 1.5);
  assert.ok(Math.abs(a.angularVelocity) > 0.1, `a: ${a.angularVelocity}`);
  assert.ok(Math.abs(b.angularVelocity) > 0.1, `b: ${b.angularVelocity}`);
  // Linear momentum: 1*4 + 2*-4 = -4
  assert.ok(Math.abs(a.velocity[0] + 2 * b.velocity[0] + 4) < 1e-3);
  assert.ok(Math.abs(a.velocity[1] + 2 * b.velocity[1]) < 1e-3);
  pin("offCentreCollision", bodyState(a, b));
});

test("the SAP broadphase gives the same answer as spatial hashing", () => {
  const solverConfig = { frictionIterations: 3 };
  const hashed = slidingBoxScenario(0.4, { solverConfig });
  const swept = slidingBoxScenario(0.4, {
    solverConfig,
    broadphase: new SAPBroadphase(),
  });
  assert.deepEqual(bodyState(swept), bodyState(hashed));
});

test("the simulation is deterministic", () => {
  function scenario() {
    const world = new World({ substeps: 2 });
    staticBox(world, [0, -3], 12, 1);
    staticBox(world, [0, 3], 12, 1);
    staticBox(world, [-6, 0], 1, 7);
    staticBox(world, [6, 0], 1, 7);
    const bodies: Body[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const position: [number, number] = [Math.cos(angle), Math.sin(angle)];
      bodies.push(
        i % 2 === 0
          ? dynamicCircle(world, position, [-position[0], -position[1]], 0.3)
          : dynamicBox(world, position, {
              width: 0.5,
              height: 0.4,
              velocity: [-position[0] * 2, -position[1] * 2],
              angularVelocity: i,
            }),
      );
    }
    world.constraints.add(new DistanceConstraint(bodies[0], bodies[1]));
    run(world, 2);
    return bodyState(...bodies);
  }
  const first = scenario();
  const second = scenario();
  assert.deepEqual(first, second);
  pin("determinism", first);
});
