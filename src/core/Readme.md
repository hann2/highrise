# Core

These files make up the game "engine". They are a collection of useful patterns that I have developed over many years and many games. I tend to just copy/paste this folder from project to project as I go, rather than actually publishing this as a library, because I tend to make lots of upgrades to it, but sometimes I also make some game-specific changes to it.

Nothing in here should import from the game (`src/highrise/`). The game configures the engine through `src/config/` (render layers, custom events, collision groups, physics materials), and type-only imports from there are the one exception.

## Game

The `Game` class is the top level data structure that is in charge of making everything happen. There is exactly one.

Some things that `Game` does:

- Initializes the physics (`game.world`), rendering (`game.renderer`, `game.camera`), input (`game.io`), and audio (`game.audio`) systems
- Keeps track of entities (`game.entities`)
- Runs the game loop: a fixed timestep for `tick` (120 per second by default), one `render` per animation frame
- Runs the event system, dispatching events and calling the appropriate handlers on entities
- Pauses (`pause()`, `unpause()`, `togglePause()`; entities with `pausable = false` keep ticking), runs in slow motion (`slowMo`), and clears the scene (`clearScene(persistenceThreshold)` removes every entity whose `persistenceLevel` is below the threshold)

## Entities

Just about anything you want in the game will be implemented as an `Entity`. This `Entity` is roughly equivalent to Unity's `GameObject`, or Unreal's `Actor`.

Every entity should extend the `BaseEntity` class and implement the `Entity` interface, and is added to the game with `game.addEntity(entity)`.

```TypeScript
class Ball extends BaseEntity implements Entity {
  constructor() {
    super();
    // initialize stuff...
  }
}
```

An entity can optionally declare a `body` (or `bodies`), a `sprite` (or `sprites`), `springs`, `constraints`, and `children`. The `Game` registers those with physics/rendering when the entity is added and cleans them up when it is destroyed (`entity.destroy()`). Children added with `this.addChild(entity)` are added and destroyed with their parent.

`this.game` is the `Game` the entity is in; reading it while the entity isn't in a game throws. `this.isAdded` and `this.isDestroyed` cover the rare cases where that is possible. `this.wait(seconds)` returns a promise that resolves in game time (so it pauses with the game), and code after an `await this.wait(...)` never runs once the entity is destroyed.

### Body

If you want an entity to be included in the physics simulation, you can give it a `body`, made with one of the factories in `physics/body/bodyFactories.ts`:

```TypeScript
this.body = createRigid2D({ motion: "dynamic", mass: 1, position: [0, 0] });
this.body.addShape(new Circle({ radius: 1 /** in meters, generally */ }));
```

If you want to give an entity multiple bodies, you can use the `bodies` field instead, though be careful.

### Sprite

If you want an entity to have a visual representation in the world, you can give it a `sprite`. Any Pixi display object works; it renders on the layer named by its `layerName` (see Graphics).

```TypeScript
this.sprite = Sprite.from("ball");
this.sprite.layerName = Layer.DECORATIONS;
```

Image, sound and font names are type checked against the manifest in `resources/`, so autocomplete knows what exists.

### Events

Entities can run code at certain times in the game loop. Handlers are methods named `on<EventName>` marked with the `@on("eventName")` decorator from `entity/handler.ts`; the decorator is what registers them, so an undecorated `on*` method is never called. Every handler takes one argument, the event's payload. The built-in events and their payloads are listed in `entity/BaseGameEvents.ts`, `entity/IoEvents.ts` and `entity/PhysicsEvents.ts`. The three most important are probably `add`, `tick`, and `render`.

#### `onAdd({ game })`

Called when added to the game, before dealing with the body, sprite, children, or anything else. Useful for initializing stuff that you need access to the `game` for.

#### `onTick(dt)`

If you want an entity to do something every physics step, put that logic in `onTick`.

```TypeScript
  @on("tick")
  onTick(dt: number) {
    if (this.game.io.isKeyDown("Space")) {
      // Accelerate upwards
      this.body.applyForce(V(0, -10));
    }
  }
```

Ticks run in layers, declared by the game in `src/config/tickLayers.ts`. An entity picks one with `tickLayer = "camera" as const`; entities in an earlier layer all tick before any entity in a later one.

#### `onRender(dt)`

Called on every frame right before the screen is redrawn. Useful for logic like updating the position of the sprite.

```TypeScript
  @on("render")
  onRender(dt: number) {
    this.sprite.position.copyFrom(this.body.position);
  }
```

#### Less important events

- `onAfterAdded({ game })` — called when added to the game, _after_ the body, sprite, children, and everything else is dealt with. Most of the time you probably want `onAdd`, but there are some times when this comes in handy.
- `onBeforeTick(dt)` — sometimes you want to make sure stuff happens at the beginning of the tick, before any `onTick` handlers are called.
- `onAfterPhysics()` — after the physics step, before the next tick.
- `onLateRender(dt)` — called _right_ before rendering. This is for special cases only.
- `onPause()` / `onUnpause()` — called when the game is paused / unpaused.
- `onDestroy({ game })` — called after being destroyed.
- `onResize({ size })` — called when the renderer is resized. You shouldn't need to deal with this often.
- Input: `onKeyDown({ key })`, `onKeyUp`, `onButtonDown({ button })`, `onMouseDown`, ... (see `entity/IoEvents.ts`).
- Physics: `onBeginContact({ other, ... })`, `onEndContact`, `onImpact`, ... (see `entity/PhysicsEvents.ts`).

### Custom Events

Custom events are declared with their payload types in `src/config/CustomEvent.ts`:

```TypeScript
export type CustomEvents = {
  levelStarted: { level: number };
};
```

Say we have a `LevelManager` class somewhere that determines when we start a level. It can dispatch a `levelStarted` event using `Game#dispatch`...

```TypeScript
class LevelManager extends BaseEntity implements Entity {
  @on("tick")
  onTick() {
    //...level management stuff
    this.game.dispatch("levelStarted", { level: 1 });
  }
}
```

and then we can listen for that event in our `Ball` class to do something at the start of a level. The payload is type checked against the declaration.

```TypeScript
class Ball extends BaseEntity implements Entity {
  @on("levelStarted")
  onLevelStarted({ level }: { level: number }) {
    this.body.velocity.set(0, 0);
  }
}
```

## Finding Entities

Entities have a `tags` property you can add to them to make them easy to find. You can use `game.entities.getTagged("yourTagName")` to get a list of all the entities that have `yourTagName` in their `tags` list. You can also use `game.entities.getTaggedAll` and `game.entities.getTaggedAny` to find entities that match all of a given list of tags, or any of them, respectively.

If you know there is only ever going to be one instance of a class, `game.entities.getSingleton(TheClass)` retrieves it (and throws if there isn't exactly one). `game.entities.getByConstructor(TheClass)` returns all instances of exactly that class. You can also give an entity a string `id` and find it with `game.entities.getById("entityId")`; adding two entities with the same `id` throws.

For anything else, register a type guard once with `game.entities.addFilter(isHuman)` and read the matching entities with `game.entities.getByFilter(isHuman)`; the list is kept up to date as entities come and go, so it's much cheaper than filtering `game.entities.all` every frame.

## Graphics

Rendering is [Pixi.js](https://pixijs.com/) v8, wrapped by `graphics/GameRenderer2d.ts`. The differences from plain Pixi:

- **Layers.** The game declares its render layers, bottom to top, in `src/config/layers.ts`, and every sprite says which one it's on with `sprite.layerName`. A layer can have a parallax factor (`LayerInfo`); a layer with a parallax of 0 is screen space (HUD, menus, and screen-sized effects).
- **Camera.** `graphics/Camera2d.ts` has a position, zoom (`z`, in pixels per meter) and angle, and the parallax layers follow it. `camera.getMatrix()` gives the world-to-screen transform for anything that needs to do the math itself.
- **GameSprite.** The type of `entity.sprite`: a Pixi `Container` with a `layerName` and a back reference to its owner. `createGraphics(layerName)` makes a `Graphics` with the layer set.

The UI convention in this game is that the world is Pixi and the UI is HTML: `ReactEntity` renders Preact content into a `div` over the canvas and re-renders it every frame.

## IO

`game.io` (`io/IO.ts`) tracks the keyboard (`isKeyDown(key)`, with `KeyCode`s from `io/Keys.ts`), the mouse (`mousePosition`, in screen pixels; `io/MouseButtons.ts`) and gamepads (`io/Gamepad.ts`, with `ControllerButton`s and axes). `usingGamepad` says which device the player used last, so UI can show the right prompts. Input events are dispatched to entities as the `keyDown`, `buttonDown`, `mouseDown`, ... events above.

## Physics

`physics/` is a custom 2D rigid body engine (it started as a fork of p2.js but no longer resembles it). It has its own [README](./physics/README.md) with the API and its [CLAUDE.md](./physics/CLAUDE.md) with the architecture. The short version: bodies come from the factories in `physics/body/bodyFactories.ts` (`createRigid2D`, `createPointMass2D` for things that never rotate), shapes are attached to bodies, an entity's `body` is added to `game.world` with it, and contacts arrive as the `beginContact`/`endContact`/`impact` events. There is no gravity. `game.world.raycast(from, to, options)` finds the closest hit along a line.

## Sound

Playing sounds in the game is done by creating instances of the `SoundInstance` entity and adding them to the game; `PositionalSound` is the same with stereo panning and distance falloff from a world position. Sounds are entities, so they pause with the game and can be destroyed early.

```TypeScript
this.game.addEntity(new PositionalSound("wallHit1", position, { speed: 1.4 }));
```

### Audio Effects

It is possible to add audio effects by overriding the `makeChain` method, which builds the Web Audio node chain between the source and the master gain.

## Util

There are a lot of random utilities I've written over the years. In particular, make sure you check out:

- [MathUtil.ts](./util/MathUtil.ts) — various math stuff like polar/cartesian conversions, interpolations, clamping, etc.
- [Random.ts](./util/Random.ts) — useful for all sorts of random number stuff. I particularly like `choose(...options)`. Everything goes through one seedable generator, so a game can be made reproducible. Don't call `Math.random()` directly, and don't consume randomness at module load time (the seed is applied after modules have run)
- [ColorUtils.ts](./util/ColorUtils.ts) — for converting colors between formats, blending/lerping colors, etc.
- [Profiler.ts](./util/Profiler.ts) and [stats-overlay/](./util/stats-overlay/) — a per-frame CPU breakdown (`@profile` on a method, or `profiler.measure("label", () => ...)`) and the corner overlay that shows it

## Vector

`Vector.ts` has `V2d`, the 2D vector class used everywhere, and `V(x, y)` to make one. It extends `Array`, so it's compatible with `[x, y]` tuples anywhere a vector is expected. Methods prefixed with `i` mutate in place (`iadd`, `imul`, `inormalize`, ...); the others return a new vector. Pixi points can be set from a vector with `point.copyFrom(v)`.
