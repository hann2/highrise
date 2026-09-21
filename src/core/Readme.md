# Core

These files make up the game "engine". They are a collection of useful patterns that I have developed over many years and many games. I tend to just copy/paste this folder from project to project as I go, rather than actually publishing this as a library because I tend to make lots of upgrades to it,
but sometimes I also make some game-specific changes to it.

## Game

The `Game` class is the top level data structure that is in charge of making everything happen.
There will be exactly

Some things that `Game` does:

- Initializes the physics, rendering, and input handling systems
- Keeps track of entities
- Runs the game loop
- Runs the event system, dispatching events and calling the appropriate handlers on entities

## Entities

Just about anything you want in the game will be implemented as an `Entity`.
This `Entity` is roughly equivalent to Unity's `GameObject`, or Unreal's `Actor`.

Every entity should extend the `BaseEntity` class and implement the `Entity` interface.

```TypeScript
class Ball extends BaseEntity implements Entity  {
  constructor() {
    super()
    // initialize stuff...
  }
}
```

### Body

If you want an entity to be included in the physics simulation, you can give it a `body`.

```TypeScript
const shape = new Circle({ radius: 1 /** in meters, generally */ });
this.body.addShape(shape);
```

If you want to give an entity multiple bodies, you can use the `bodies` field instead, though be careful.

### Sprite

If you want an entity to have a visual representation in the world, you can give it a `sprite`.

```TypeScript
this.sprite = Sprite.from(imageName("favicon"));
```

_Note: `imageName` is a helper function that limits the string type to only names of images found in our `resources/` folder. It's really handy for autocomplete_

### Events

Entities can run code at certain times in the game loop.
The three most important events are probably `onAdd`, `onTick`, and `onRender`.

#### `onAdd?(game: Game)`

Called when added to the game, before dealing with the body, sprite, handlers, or anything else.
Useful for initializing stuff that you need access to the `game` for.

#### `onTick()`

If you want an entity to do something every frame, put that logic in the `onTick()` method.

```TypeScript
  onTick(dt: number) {
    if (this.game!.io.keyIsDown("Space")) {
      // Accelerate upwards
      this.body.applyForce([-10, 0]);
    }
  }
```

#### `onRender?(dt: number)`

Called on every frame right before the screen is redrawn.
Useful for logic like updating the position of the sprite.

```TypeScript
  onRender(dt: number): void {
    this.sprite?.position.set(...this.body.position);
  }
```

### Less important events

`afterAdded?(game: Game)` — Called when added to the game, _after_ the body, sprite, handlers, and everything else is dealt with.
Most of the time you probably want to use `onAdd`, but there are some times when this comes in handy.

`beforeTick?()` — Sometimes you want to make sure stuff happens at the beginning of the tick, before any `onTick()` handlers are called.
That's when this is useful.

`onLateRender?(dt: number)` — Called _right_ before rendering. This is for special cases only

`onPause?()` — Called when the game is paused

`onUnpause?()` — Called when the game is unpaused

`onDestroy?(game: Game)` — Called after being destroyed.

`onResize?(size: [number, number])` — Called when the renderer is resized or recreated for some reason.
You shouldn't need to deal with this often.

### Custom Events

You can define handlers for any type of custom event you want using the `handlers` field.

For example, say we have a `LevelManager` class somewhere that determines when we start a level.
It can dispatch a `levelStarted` event using `Game#dispatch`...

```TypeScript
class LevelManager extends BaseEntity implements Entity {
  //...
  onTick() {
    //...level management stuff
    this.game.dispatch({ type: 'levelStarted', level: 1 });
  }
}
```

and then we can listen for that event in our `Ball` class to do something at the start of a level.

```TypeScript
class Ball extends BaseEntity implements Entity
  handlers = {
    levelStarted: () => {
      this.body.velocity = [0, 0];
    },
  };
```

## Finding Entities

Entities have a `tags` property you can add to them to make them easy to find.
You can use `game.entities.getTagged("yourTagName")` to get a list of all the entities that have `yourTagName` in their `tags` list.
You can also use `game.entities.getTaggedAll` and `game.entities.getTaggedAny` to find entities that match all of a given list of tags, or any of them, respectively.

If you know there is only ever going to be 1 instance of an entity, you can give it an `id`.
This lets you use `game.entities.getById('entityId')` to easily retrieve your entity.
If you try to add an entity to the game with the same `id` as one that is already in the game, it will throw an error, so be cautious with this.

## Graphics

TODO: Write documentation on Graphics engine, in particular things that are different from base Pixi.js.

- Layers
- GameSprite

See [pixi.js]

## IO

TODO: Write documention on IO.

## Physics

TODO: Write more documentation on physics, in particular things that are specific to this engine.

- Things that are changed from `p2.js`
- Custom World
- Custom Broadphase

See `p2.js`.

### Constraints

TODO: Write documentation on Constraints

### Springs

TODO: Write documentation on Springs

## Sound

Playing sounds in the game is done by creating instances of the `SoundInstance` entity and adding them to the game.

### Audio Effects

It is possible to add audio effects to Sound Instances by overriding the `makeChain` method.

## Util

There are a lot of random utilities I've written over the years. In particular, make sure you check out:

- [MathUtil.ts](./util/MathUtil.ts) — Various math stuff like polar/cartesian conversions, interpolations, clamping, etc.
- [Random.ts](./util/Random.ts) — Useful for all sorts of random number stuff. I particularly like `choose(...options)`
- [ColorUtils.ts](./util/ColorUtils.ts) — For dealing with converting colors between different formats, blending/lerping colors, etc.

## Vector

TODO: Write Vector documentation

```

```
