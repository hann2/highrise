import p2, { World } from "p2";
import { DEFAULT_LAYER, LAYERS } from "../config/layers";
import ContactList, {
  ContactInfo,
  ContactInfoWithEquations,
} from "./ContactList";
import EntityList from "./EntityList";
import { V } from "./Vector";
import Entity, { GameEventMap } from "./entity/Entity";
import { eventHandlerName } from "./entity/EventHandler";
import { WithOwner } from "./entity/WithOwner";
import {
  GameRenderer2d,
  GameRenderer2dOptions,
} from "./graphics/GameRenderer2d";
import { IOManager } from "./io/IO";
import CustomWorld from "./physics/CustomWorld";
import { lerp } from "./util/MathUtil";

interface GameOptions {
  audio?: AudioContext;
  ticksPerSecond?: number;
  world?: World | CustomWorld;
}

/**
 * Top Level control structure
 */
export default class Game {
  /** Keeps track of entities in lots of useful ways */
  readonly entities: EntityList;
  /** Keeps track of entities that are ready to be removed */
  readonly entitiesToRemove: Set<Entity>;
  /** TODO: Document game.renderer */
  readonly renderer: GameRenderer2d;
  /** Manages keyboard/mouse/gamepad state and events. */
  private _io!: IOManager;
  get io(): IOManager {
    return this._io;
  }
  private set io(value: IOManager) {
    this._io = value;
  }

  /** The top level container for physics. */
  readonly world: p2.World;
  /** Keep track of currently occuring collisions */
  readonly contactList: ContactList;
  /** A static physics body positioned at [0,0] with no shapes. Useful for constraints/springs */
  readonly ground: p2.Body;
  /** The audio context that is connected to the output */
  readonly audio: AudioContext;
  /** Volume control for all sound output by the game. */
  readonly masterGain: GainNode;
  /** Readonly. Whether or not the game is paused */
  paused: boolean = false;
  /** Readonly. Number of frames that have gone by */
  framenumber: number = 0;
  /** Readonly. Number of ticks that have gone by */
  ticknumber: number = 0;
  /** The timestamp when the last frame started */
  lastFrameTime: number = window.performance.now();
  /** Number of ticks that happen per frame at regular speed */
  readonly ticksPerSecond: number;
  /** Number of seconds to simulate per tick */
  readonly tickDuration: number;

  /** Total amount of game time that has elapsed */
  elapsedTime: number = 0;
  /** Total amount of game time that has elapsed while not paused */
  elapsedUnpausedTime: number = 0;
  /** Keep track of how long each frame is taking on average */
  averageFrameDuration = 1 / 60;

  /** TODO: Document game.camera */
  get camera() {
    return this.renderer.camera;
  }

  get averageDt() {
    return this.slowMo / (this.averageFrameDuration * this.ticksPerSecond);
  }

  private _slowMo: number = 1.0;
  /** Multiplier of time that passes during tick */
  get slowMo() {
    return this._slowMo;
  }

  set slowMo(value: number) {
    if (value != this._slowMo) {
      this._slowMo = value;
      this.dispatch("slowMoChanged", { slowMo: this._slowMo });
    }
  }

  /**
   * Create a new Game.
   * NOTE: You must call .init() before actually using the game.
   */
  constructor({ audio, ticksPerSecond = 120, world }: GameOptions = {}) {
    this.entities = new EntityList();
    this.entitiesToRemove = new Set();

    this.renderer = new GameRenderer2d(
      LAYERS,
      DEFAULT_LAYER,
      this.onResize.bind(this),
    );

    this.ticksPerSecond = ticksPerSecond;
    this.tickDuration = 1.0 / this.ticksPerSecond;
    // this.world = new World({ gravity: [0, 0] });
    this.world = world ?? new CustomWorld({ gravity: [0, 0] });
    this.world.on("beginContact", this.beginContact, null);
    this.world.on("endContact", this.endContact, null);
    this.world.on("impact", this.impact, null);
    this.ground = new p2.Body({ mass: 0 });
    this.world.addBody(this.ground);
    this.contactList = new ContactList();

    this.audio = audio ?? new AudioContext();
    this.masterGain = this.audio.createGain();
    this.masterGain.connect(this.audio.destination);
  }

  /** Start the event loop for the game. */
  async init({
    rendererOptions = {},
  }: {
    rendererOptions?: GameRenderer2dOptions;
  } = {}) {
    await this.renderer.init(rendererOptions);
    this.io = new IOManager(this.renderer.canvas);
    this.addEntity(this.renderer.camera);

    window.requestAnimationFrame(() => this.loop(this.lastFrameTime));
  }

  /** See pause() and unpause(). */
  togglePause() {
    if (this.paused) {
      this.unpause();
    } else {
      this.pause();
    }
  }

  /** TODO: Document onResize */
  onResize(size: [number, number]) {
    this.dispatch("resize", { size: V(size) });
  }

  /**
   * Pauses the game. This stops physics from running, calls onPause()
   * handlers, and stops updating `pausable` entities.
   */
  pause() {
    if (!this.paused) {
      this.paused = true;
      this.dispatch("pause", undefined);
    }
  }

  /** Resumes the game and calls onUnpause() handlers. */
  unpause() {
    this.paused = false;
    this.dispatch("unpause", undefined);
  }

  /** Dispatch an event. */
  dispatch<EventName extends keyof GameEventMap>(
    eventName: EventName,
    data: GameEventMap[EventName],
    respectPause = true,
  ) {
    const effectivelyPaused = respectPause && this.paused;
    for (const entity of this.entities.getHandlers(eventName)) {
      if (entity.game && !(effectivelyPaused && entity.pausable)) {
        const functionName = eventHandlerName(eventName);
        entity[functionName](data);
      }
    }
  }

  /** Add an entity to the game. */
  addEntity = <T extends Entity>(entity: T): T => {
    entity.game = this;
    if (entity.onAdd) {
      entity.onAdd({ game: this });
    }

    // If the entity was destroyed during it's onAdd, we shouldn't add it
    if (!entity.game) {
      return entity;
    }

    this.entities.add(entity);
    this.io.addHandler(entity);

    if (entity.body) {
      entity.body.owner = entity;
      this.world.addBody(entity.body);
    }
    if (entity.bodies) {
      for (const body of entity.bodies) {
        body.owner = entity;
        this.world.addBody(body);
      }
    }
    if (entity.springs) {
      for (const spring of entity.springs) {
        this.world.addSpring(spring);
      }
    }
    if (entity.constraints) {
      for (const constraint of entity.constraints) {
        this.world.addConstraint(constraint);
      }
    }

    if (entity.sprite) {
      this.renderer.addSprite(entity.sprite);
      entity.sprite.owner = entity;
    }
    if (entity.sprites) {
      for (const sprite of entity.sprites) {
        this.renderer.addSprite(sprite);
        sprite.owner = entity;
      }
    }

    if (entity.onResize) {
      entity.onResize({ size: this.renderer.getSize() });
    }

    if (entity.children) {
      for (const child of entity.children) {
        if (!child.game) {
          this.addEntity(child);
        }
      }
    }

    if (entity.onAfterAdded) {
      entity.onAfterAdded({ game: this });
    }

    return entity;
  };

  /** Shortcut for adding multiple entities. */
  addEntities<T extends readonly Entity[]>(...entities: T): T {
    for (const entity of entities) {
      this.addEntity(entity);
    }
    return entities;
  }

  /**
   * Remove an entity from the game.
   * The entity will actually be removed during the next removal pass.
   * This is because there are times when it's not safe to remove an entity, like in the middle of a physics step.
   */
  removeEntity(entity: Entity) {
    entity.game = undefined;
    if (this.world.stepping) {
      this.entitiesToRemove.add(entity);
    } else {
      this.cleanupEntity(entity);
    }
    return entity;
  }

  /**
   * Removes all non-persistent entities from the game scene.
   * Only removes top-level entities (those without parents) to avoid double-cleanup.
   *
   * @param persistenceThreshold - Entities with persistence level <= this value will be removed (default: 0)
   * @example
   * // Remove all level-specific entities (Persistence.Level)
   * game.clearScene();
   *
   * // Remove level and game-specific entities (Persistence.Level and Persistence.Game)
   * game.clearScene(Persistence.Game);
   */
  clearScene(persistenceThreshold = 0) {
    for (const entity of this.entities) {
      if (
        entity.game && // Not already destroyed
        !this.entitiesToRemove.has(entity) && // not already about to be destroyed
        entity.persistenceLevel <= persistenceThreshold &&
        !entity.parent // We only wanna deal with top-level things, let parents handle the rest
      ) {
        entity.destroy();
      }
    }
  }

  private timeToSimulate = 0.0;
  private iterationsRemaining = 0.0;
  /** The main event loop. Run one frame of the game.  */
  private loop(time: number): void {
    window.requestAnimationFrame((t) => this.loop(t));
    this.framenumber += 1;

    const lastFrameDuration = (time - this.lastFrameTime) / 1000;
    this.lastFrameTime = time;

    // TODO: This honestly doesn't work great
    // Keep a rolling average
    if (0 < lastFrameDuration && lastFrameDuration < 0.3) {
      // Ignore weird durations because they're probably flukes from the user
      // changing to a different tab/window or loading a new level or something
      this.averageFrameDuration = lerp(
        this.averageFrameDuration,
        lastFrameDuration,
        0.05,
      );
    }

    const renderDt = 1.0 / this.getScreenFps();
    this.elapsedTime += renderDt;
    if (!this.paused) {
      this.elapsedUnpausedTime += renderDt;
    }

    this.slowTick(renderDt * this.slowMo);

    this.timeToSimulate += renderDt * this.slowMo;
    while (this.timeToSimulate >= this.tickDuration) {
      this.timeToSimulate -= this.tickDuration;
      this.tick(this.tickDuration);
      if (!this.paused) {
        const stepDt = this.tickDuration;
        this.world.step(stepDt);
        this.cleanupEntities();
        this.contacts();
      }
    }

    this.afterPhysics();

    this.render(renderDt);
  }

  /**
   * Calculates and returns the current screen frames per second based on average frame duration.
   * @returns The current FPS rounded to the nearest integer
   */
  getScreenFps(): number {
    const duration = this.averageFrameDuration;
    return Math.round(1.0 / duration);
  }

  /** Actually remove all the entities slated for removal from the game. */
  private cleanupEntities() {
    for (const entity of this.entitiesToRemove) {
      this.cleanupEntity(entity);
    }
    this.entitiesToRemove.clear();
  }

  private cleanupEntity(entity: Entity) {
    entity.game = undefined; // This should be done by `removeEntity`, but better safe than sorry
    this.entities.remove(entity);
    this.io.removeHandler(entity);

    if (entity.body) {
      this.world.removeBody(entity.body);
    }
    if (entity.bodies) {
      for (const body of entity.bodies) {
        this.world.removeBody(body);
      }
    }
    if (entity.springs) {
      for (const spring of entity.springs) {
        this.world.removeSpring(spring);
      }
    }
    if (entity.constraints) {
      for (const constraint of entity.constraints) {
        this.world.removeConstraint(constraint);
      }
    }

    if (entity.sprite) {
      this.renderer.removeSprite(entity.sprite);
      entity.sprite.destroy({ children: true });
    }
    if (entity.sprites) {
      for (const sprite of entity.sprites) {
        this.renderer.removeSprite(sprite);
        sprite.destroy({ children: true });
      }
    }

    if (entity.onDestroy) {
      entity.onDestroy({ game: this });
    }
  }

  /** Called before physics. */
  private tick(dt: number) {
    this.ticknumber += 1;
    this.dispatch("beforeTick", dt);
    this.dispatch("tick", dt);
  }

  /** Called before normal ticks */
  private slowTick(dt: number) {
    this.dispatch("slowTick", dt);
  }

  /** Called after physics. */
  private afterPhysics() {
    this.cleanupEntities();
    this.dispatch("afterPhysics", undefined);
  }

  /** Called before actually rendering. */
  private render(dt: number) {
    this.cleanupEntities();
    this.dispatch("render", dt);
    this.dispatch("lateRender", dt);
    this.renderer.render();
  }

  // Handle beginning of collision between things.
  // Fired during narrowphase.
  private beginContact = (contactInfo: ContactInfoWithEquations) => {
    this.contactList.beginContact(contactInfo);
    const { shapeA, shapeB, bodyA, bodyB, contactEquations } = contactInfo;
    const ownerA = shapeA.owner || bodyA.owner;
    const ownerB = shapeB.owner || bodyB.owner;

    // If either owner has been removed from the game, we shouldn't do the contact
    if (!(ownerA && !ownerA.game) || (ownerB && !ownerB.game)) {
      if (ownerA?.onBeginContact) {
        ownerA.onBeginContact({
          other: ownerB,
          thisShape: shapeA,
          otherShape: shapeB,
          contactEquations,
        });
      }
      if (ownerB?.onBeginContact) {
        ownerB.onBeginContact({
          other: ownerA,
          thisShape: shapeB,
          otherShape: shapeA,
          contactEquations,
        });
      }
    }
  };

  // Handle end of collision between things.
  // Fired during narrowphase.
  private endContact = (contactInfo: ContactInfo) => {
    this.contactList.endContact(contactInfo);
    const { shapeA, shapeB, bodyA, bodyB } = contactInfo;
    const ownerA = shapeA.owner || bodyA.owner;
    const ownerB = shapeB.owner || bodyB.owner;

    // If either owner has been removed from the game, we shouldn't do the contact
    if (!(ownerA && !ownerA.game) || (ownerB && !ownerB.game)) {
      if (ownerA?.onEndContact) {
        ownerA.onEndContact({
          other: ownerB,
          thisShape: shapeA,
          otherShape: shapeB,
        });
      }
      if (ownerB?.onEndContact) {
        ownerB.onEndContact({
          other: ownerA,
          thisShape: shapeB,
          otherShape: shapeA,
        });
      }
    }
  };

  private contacts() {
    for (const contactInfo of this.contactList.getContacts()) {
      const { shapeA, shapeB, bodyA, bodyB, contactEquations } = contactInfo;
      const ownerA = shapeA.owner || bodyA.owner;
      const ownerB = shapeB.owner || bodyB.owner;
      if (ownerA?.onContacting) {
        ownerA.onContacting({
          other: ownerB,
          otherShape: shapeB,
          thisShape: shapeA,
          contactEquations,
        });
      }
      if (ownerB?.onContacting) {
        ownerB.onContacting({
          other: ownerA,
          otherShape: shapeA,
          thisShape: shapeB,
          contactEquations,
        });
      }
    }
  }

  // Handle collision between things.
  // Fired after physics step.
  private impact = (e: {
    bodyA: p2.Body & WithOwner;
    bodyB: p2.Body & WithOwner;
  }) => {
    const ownerA = e.bodyA.owner;
    const ownerB = e.bodyB.owner;
    // If either owner has been removed from the game, we shouldn't do the contact
    if (!(ownerA && !ownerA.game) || (ownerB && !ownerB.game)) {
      if (ownerA?.onImpact) {
        ownerA.onImpact({ other: ownerB });
      }
      if (ownerB?.onImpact) {
        ownerB.onImpact({ other: ownerA });
      }
    }
  };
}
