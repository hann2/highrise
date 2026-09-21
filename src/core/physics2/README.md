# Physics Engine

A custom 2D rigid body physics engine for game development, featuring constraint-based dynamics, multiple collision shapes, and optimizations like body sleeping and island splitting.

## Architecture Overview

```
World
├── BodyManager         — Manages all bodies, partitioned by shape/motion
│   └── Body            — Single class tagged by shape (pm2d/rigid2d/pm3d/rigid3d) and motion (static/kinematic/dynamic)
├── ConstraintManager   — Manages constraints between bodies
├── ContactMaterialManager — Friction/restitution between material pairs
├── Broadphase          — Spatial culling (SpatialHashingBroadphase or SAPBroadphase)
├── Springs             — Soft force-based connections
└── OverlapKeeper       — Tracks persistent contacts for begin/end events
```

### Core Concepts

| Concept             | Description                                                                   |
| ------------------- | ----------------------------------------------------------------------------- |
| **World**           | The simulation container. Call `world.step(dt)` each frame.                   |
| **Body**            | A rigid body with position, angle, and velocity. Contains one or more shapes. |
| **Shape**           | Collision geometry attached to a body (Circle, Box, Convex, etc.)             |
| **Constraint**      | Maintains a relationship between two bodies (distance, hinge, rigid lock)     |
| **Spring**          | Applies forces to maintain a relationship (softer than constraints)           |
| **Material**        | Identifier for collision properties                                           |
| **ContactMaterial** | Defines friction/restitution between two materials                            |

## Bodies

All physics objects are instances of a single `Body` class, tagged by two readonly fields:

- **`shape`** — one of `"pm2d"`, `"rigid2d"`, `"pm3d"`, `"rigid3d"`. Controls the DOF set (point-mass vs rigid, 2D vs 3D).
- **`motion`** — one of `"static"`, `"kinematic"`, `"dynamic"`. Controls the role in simulation.

Construct via the factories in `bodyFactories.ts` — they narrow the return type to a motion-appropriate view so callers get the right fields without runtime branching.

### Dynamic bodies

Respond to forces and collisions.

```typescript
import { createRigid2D } from "core/physics/body/bodyFactories";
import Circle from "core/physics/shapes/Circle";

const ball = createRigid2D({
  motion: "dynamic",
  mass: 1,
  position: [0, 10],
  velocity: [5, 0],
  damping: 0.1,
  angularDamping: 0.1,
});
ball.addShape(new Circle({ radius: 0.5 }));
world.bodies.add(ball);
```

### Static bodies

Immovable geometry (terrain, walls).

```typescript
const ground = createRigid2D({ motion: "static", position: [0, -1] });
ground.addShape(new Box({ width: 100, height: 2 }));
world.bodies.add(ground);
```

### Kinematic bodies

Scripted motion — set velocity directly; not affected by collisions.

```typescript
const platform = createRigid2D({ motion: "kinematic", position: [0, 5] });
platform.addShape(new Box({ width: 4, height: 0.5 }));
world.bodies.add(platform);
platform.velocity.set(2, 0);
```

### 3D / point-mass variants

- `createPointMass2D` — 2D particle (no rotation).
- `createPointMass3D` — 3D particle (adds Z).
- `createRigid3D` — full 6DOF rigid body (adds Z, roll, pitch). Used by the hull.

## Shapes

Shapes define collision geometry. Each body can have multiple shapes.

| Shape         | Description                 | Key Properties               |
| ------------- | --------------------------- | ---------------------------- |
| `Circle`      | Circular collider           | `radius`                     |
| `Box`         | Axis-aligned rectangle      | `width`, `height`            |
| `Convex`      | Arbitrary convex polygon    | `vertices` (array of points) |
| `Capsule`     | Rectangle with rounded ends | `length`, `radius`           |
| `Line`        | Line segment                | `length`                     |
| `Plane`       | Infinite plane              | `normal` direction           |
| `Particle`    | Point collider              | (no size)                    |
| `Heightfield` | Terrain data                | `heights`, `elementWidth`    |

### Shape Options

```typescript
new Circle({
  radius: 1,
  position: [0, 0.5], // Offset from body center
  angle: 0, // Local rotation
  collisionGroup: 0x0001, // What group this shape belongs to
  collisionMask: 0xffff, // What groups this shape collides with
  sensor: false, // If true, detects overlaps but doesn't collide
  material: myMaterial, // For friction/restitution lookup
});
```

### Collision Filtering

Use `collisionGroup` and `collisionMask` to control what collides:

```typescript
const PLAYER = 0x0001;
const ENEMY = 0x0002;
const BULLET = 0x0004;

// Player collides with enemies and bullets
playerShape.collisionGroup = PLAYER;
playerShape.collisionMask = ENEMY | BULLET;

// Enemy bullets don't hit enemies
enemyBulletShape.collisionGroup = BULLET;
enemyBulletShape.collisionMask = PLAYER; // Only hits player
```

## Constraints

Constraints maintain geometric relationships between bodies using iterative solving.

### DistanceConstraint

Maintains a fixed distance between two points.

```typescript
import DistanceConstraint from "core/physics/constraints/DistanceConstraint";

const rope = new DistanceConstraint(bodyA, bodyB, {
  distance: 5, // Target distance
  localAnchorA: [0, 0], // Attachment point on bodyA
  localAnchorB: [0, 0], // Attachment point on bodyB
  collideConnected: false, // Should connected bodies collide?
});
world.constraints.add(rope);
```

### RevoluteConstraint

A hinge/pivot joint allowing rotation around a point.

```typescript
import RevoluteConstraint from "core/physics/constraints/RevoluteConstraint";

const hinge = new RevoluteConstraint(bodyA, bodyB, {
  worldPivot: [5, 10], // Pivot point in world coordinates
  collideConnected: false,
});
world.constraints.add(hinge);
```

### LockConstraint

Rigidly locks two bodies together (no relative movement).

```typescript
import LockConstraint from "core/physics/constraints/LockConstraint";

const weld = new LockConstraint(bodyA, bodyB);
world.constraints.add(weld);
```

### Tuning Constraints

Constraints can be made softer using stiffness and relaxation:

```typescript
constraint.setStiffness(1000); // Lower = softer (default is very high)
constraint.setRelaxation(4); // Higher = more damping
```

## Springs

Springs apply forces rather than hard constraints, creating softer connections.

**Note:** Springs require `bodyA.motion === "dynamic"` since forces are only applied to dynamic bodies. `bodyB` can be any body.

### LinearSpring

Connects two points with a spring force.

```typescript
import LinearSpring from "core/physics/springs/LinearSpring";

const spring = new LinearSpring(dynamicBodyA, bodyB, {
  stiffness: 100, // Spring constant
  damping: 5, // Damping coefficient
  restLength: 2, // Natural length
  localAnchorA: [0, 0],
  localAnchorB: [0, 0],
});
world.addSpring(spring);
```

### Other Spring Types

| Spring                     | Description                                   |
| -------------------------- | --------------------------------------------- |
| `RotationalSpring`         | Applies torque to maintain relative angle     |
| `DampedRotationalSpring`   | Rotational spring with separate damping       |
| `RopeSpring`               | Only applies force when stretched (pull-only) |
| `AimSpring`                | Rotates body to face a target direction       |
| `RotationalSolenoidSpring` | Continuous spinning force                     |

## Materials

Materials define surface properties for collision response.

```typescript
import Material from "core/physics/material/Material";
import ContactMaterial from "core/physics/material/ContactMaterial";

const ice = new Material();
const rubber = new Material();

const iceOnRubber = new ContactMaterial(ice, rubber, {
  friction: 0.1, // Friction coefficient (0 = frictionless)
  restitution: 0.3, // Bounciness (0 = no bounce, 1 = perfect bounce)
  stiffness: 1e7, // Contact stiffness
  relaxation: 3, // Contact damping
  surfaceVelocity: 0, // For conveyor belts
});
world.contactMaterials.add(iceOnRubber);

// Assign materials to shapes
shape.material = ice;
```

## Events

The World emits events during simulation. Subscribe using the EventEmitter API.

```typescript
world.on("beginContact", (event) => {
  console.log("Contact started:", event.bodyA.id, event.bodyB.id);
  console.log("Shapes:", event.shapeA, event.shapeB);
  console.log("Contact points:", event.contactEquations);
});

world.on("endContact", (event) => {
  console.log("Contact ended:", event.bodyA.id, event.bodyB.id);
});

world.on("impact", (event) => {
  // First frame of contact (for sound effects, damage, etc.)
  const impulse = event.contactEquation.multiplier;
  console.log("Impact force:", impulse);
});
```

### Event Types

| Event                    | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `beginContact`           | Two shapes started overlapping                      |
| `endContact`             | Two shapes stopped overlapping                      |
| `impact`                 | First contact between shapes (with ContactEquation) |
| `preSolve`               | Before constraint solving (can modify equations)    |
| `postStep`               | After step completes                                |
| `addBody` / `removeBody` | Body added/removed from world                       |
| `sleep` / `wakeup`       | Body sleep state changed                            |

## Raycasting

Cast rays to find intersections with bodies.

```typescript
// Find closest hit
const hit = world.raycast([0, 0], [10, 0], {
  collisionMask: 0xffff, // What to hit
  skipBackfaces: true, // Ignore hits from inside shapes
  filter: (body, shape) => {
    // Custom filter function
    return body !== player;
  },
});

if (hit) {
  console.log("Hit:", hit.body, hit.shape);
  console.log("Point:", hit.point);
  console.log("Normal:", hit.normal);
  console.log("Distance:", hit.distance);
}

// Find all hits (sorted by distance)
const allHits = world.raycastAll([0, 0], [10, 0]);
```

## Simulation Pipeline

The `World.step(dt)` method runs 12 steps each frame:

1. **Apply forces** — Springs apply forces, damping reduces velocities
2. **Broadphase** — Spatial algorithm finds potentially colliding body pairs
3. **Narrowphase** — Detailed collision detection between shape pairs
4. **Overlap tracking** — Track which shapes are overlapping for events
5. **Contact equations** — Generate constraints to prevent penetration
6. **Friction equations** — Generate constraints for surface friction
7. **Wake-up handling** — Wake sleeping bodies hit by fast-moving objects
8. **Event emission** — Fire beginContact/endContact events
9. **Constraint solving** — Gauss-Seidel iterative solver
10. **Integration** — Update positions and velocities
11. **Impact events** — Fire impact events for first contacts
12. **Sleep updates** — Put idle bodies to sleep

## Advanced Features

### Body Sleeping

Bodies can sleep when idle to improve performance.

```typescript
// Enable sleeping globally
world.sleepMode = SleepMode.BODY_SLEEPING;
// or for island-based sleeping (more aggressive):
world.sleepMode = SleepMode.ISLAND_SLEEPING;
world.islandSplit = true;

// Configure per-body
dynamicBody.allowSleep = true;
dynamicBody.sleepSpeedLimit = 0.2; // Speed threshold
dynamicBody.sleepTimeLimit = 1; // Seconds idle before sleeping

// Manual control
body.sleep();
body.wakeUp();
```

### Continuous Collision Detection (CCD)

Prevent fast-moving bodies from tunneling through thin objects.

```typescript
const bullet = createRigid2D({
  motion: "dynamic",
  mass: 0.1,
  ccdSpeedThreshold: 100, // Enable CCD above this speed
  ccdIterations: 10, // Binary search iterations
});
```

### Island Splitting

Group connected bodies for more efficient solving and sleeping.

```typescript
world.islandSplit = true;
```

### Solver Configuration

Tune the constraint solver for stability vs. performance.

```typescript
const world = new World({
  solverConfig: {
    iterations: 10, // More = more stable, slower
    tolerance: 0.0001, // Convergence threshold
  },
});
```

## File Structure

```
physics/
├── body/
│   ├── Body.ts              — Single Body class (shape + motion tagged)
│   ├── bodyFactories.ts     — Typed factory functions (createRigid2D, createPointMass3D, …)
│   ├── bodyInterfaces.ts    — Narrowed structural views per shape/motion
│   ├── body-helpers.ts      — Type guards (isDynamic, isStatic, isRigid3D, …)
│   └── SleepBehavior.ts     — Per-body sleep state
├── systems/
│   ├── AABBSystem.ts        — AABB recompute
│   ├── DampingSystem.ts     — Velocity damping
│   ├── ForceSystem.ts       — Force/impulse application
│   ├── IntegrationSystem.ts — Position/velocity integration
│   ├── MassPropertiesSystem.ts
│   └── SleepSystem.ts
├── shapes/
│   ├── Shape.ts             — Abstract base class
│   ├── Circle.ts, Box.ts, Convex.ts, Capsule.ts, Line.ts, Plane.ts, Particle.ts, Heightfield.ts
├── constraints/
│   ├── Constraint.ts        — Abstract base class
│   ├── DistanceConstraint.ts, RevoluteConstraint.ts, LockConstraint.ts
├── springs/
│   ├── Spring.ts            — Abstract base class
│   ├── LinearSpring.ts, RotationalSpring.ts, RopeSpring.ts, AimSpring.ts, etc.
├── collision/
│   ├── broadphase/          — Spatial culling algorithms
│   ├── narrowphase/         — Shape-vs-shape collision detection
│   ├── raycast/             — Ray intersection queries
│   ├── response/            — Contact/friction equation generation
│   └── AABB.ts              — Axis-aligned bounding boxes
├── equations/
│   ├── Equation.ts          — Base constraint equation
│   ├── ContactEquation.ts   — Penetration prevention
│   ├── FrictionEquation.ts  — Surface friction
│   └── (rotational equations)
├── material/
│   ├── Material.ts          — Material identifier
│   └── ContactMaterial.ts   — Material pair properties
├── solver/
│   └── GSSolver.ts          — Gauss-Seidel constraint solver
├── events/
│   ├── EventEmitter.ts      — Event system
│   └── PhysicsEvents.ts     — Event type definitions
├── world/
│   ├── World.ts             — Main simulation class
│   ├── BodyManager.ts       — Body collection management
│   ├── ConstraintManager.ts — Constraint collection management
│   ├── ContactMaterialManager.ts
│   ├── OverlapKeeper.ts     — Contact tracking for events
│   └── Island.ts            — Island detection for sleeping
├── internal.ts              — Symbol exports for solver internals (advanced)
└── utils/
    └── (helper utilities)
```

## Integration with Game Engine

In the game engine, physics bodies are managed through entities:

```typescript
class Ball extends BaseEntity implements Entity {
  body = createRigid2D({ motion: "dynamic", mass: 1, position: [0, 10] });

  constructor() {
    super();
    this.body.addShape(new Circle({ radius: 0.5 }));
  }

  @on("render")
  onRender() {
    // Sync sprite position with physics body
    this.sprite?.position.set(...this.body.position);
    this.sprite?.rotation = this.body.angle;
  }
}
```

When an entity with a `body` property is added to the game, the body is automatically added to the physics world. When the entity is destroyed, the body is automatically removed.

See the main [core README](../Readme.md) for more on entity-physics integration.
