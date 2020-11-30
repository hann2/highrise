import p2, { Broadphase, Narrowphase } from "p2";
import ContactList, {
  ContactInfo,
  ContactInfoWithEquations,
} from "./ContactList";
import Entity, { WithOwner } from "./entity/Entity";
import EntityList from "./EntityList";
import { GameRenderer2d } from "./graphics/GameRenderer2d";
import { IOManager } from "./io/IO";
import CustomWorld from "./physics/CustomWorld";

interface GameOptions {
  audio?: AudioContext;
  tickIterations?: number;
  framerate?: number;
  broadphase?: Broadphase;
  narrowphase?: Narrowphase;
}

/**
 * Top Level control structure
 */
export default class Game {
  /** Keeps track of entities in lots of useful ways */
  entities: EntityList;
  /** Keeps track of entities that are ready to be removed */
  entitiesToRemove: Set<Entity>;

  renderer: GameRenderer2d;

  /** Manages keyboard/mouse/gamepad state and events. */
  io: IOManager;
  /** The top level container for physics. */
  world: p2.World;
  /** Keep track of currently occuring collisions */
  contactList: ContactList;
  /** A static physics body positioned at [0,0] with no shapes. Useful for constraints/springs */
  ground: p2.Body;
  /** The audio context that is connected to the output */
  audio: AudioContext;
  /** Volume control for all sound output by the game. */
  masterGain: GainNode;
  /** Readonly. Whether or not the game is paused */
  paused: boolean = false;
  /** Multiplier of time that passes during tick */
  slowMo: number = 1;
  /** Target number of frames per second */
  framerate: number;
  /** Readonly. Number of frames that have gone by */
  framenumber: number = 0;
  /** Readonly. Number of ticks that have gone by */
  ticknumber: number = 0;
  /** The timestamp when the last frame started */
  lastFrameTime: number = window.performance.now();
  /** Number of ticks that happen per frame */
  tickIterations: number;

  get camera() {
    return this.renderer.camera;
  }

  /**
   * Create a new Game.
   */
  constructor({ audio, tickIterations = 5, framerate = 60 }: GameOptions) {
    this.entities = new EntityList();
    this.entitiesToRemove = new Set();

    this.renderer = new GameRenderer2d();

    this.io = new IOManager(this.renderer.pixiRenderer.view);

    this.tickIterations = tickIterations;
    this.framerate = framerate;
    this.world = new CustomWorld({ gravity: [0, 0] });
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

  /** The current intended time between renders in game seconds */
  get renderTimestep(): number {
    return (1 / this.framerate) * this.slowMo;
  }

  /** The intended time between renders in real-world seconds */
  get trueRenderTimestep(): number {
    return (1 / this.framerate) * this.slowMo;
  }

  /** The intended time between ticks in game seconds */
  get tickTimestep(): number {
    return this.renderTimestep / this.tickIterations;
  }

  /** The intended time between ticks in real-world seconds */
  get trueTickTimestep(): number {
    return this.trueRenderTimestep / this.tickIterations;
  }

  /** Total amount of game time elapsed since starting */
  get elapsedTime(): number {
    return this.ticknumber / (this.framerate * this.tickIterations);
  }

  /** Start the event loop for the game. */
  start(): void {
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

  /**
   * Pauses the game. This stops physics from running, calls onPause()
   * handlers, and stops updating `pausable` entities.
   **/
  pause() {
    if (!this.paused) {
      this.paused = true;
      for (const entity of this.entities.filtered.onPause) {
        entity.onPause!();
      }
    }
  }

  /** Resumes the game and calls onUnpause() handlers. */
  unpause() {
    this.paused = false;
    for (const entity of this.entities.filtered.onUnpause) {
      entity.onUnpause!();
    }
  }

  /** Dispatch a custom event. */
  dispatch<T extends { type: string }>(event: T) {
    const type: string = event.type;
    for (const entity of this.entities.getHandlers(type)) {
      entity.handlers![type](event);
    }
  }

  /** Add an entity to the game. */
  addEntity = <T extends Entity>(entity: T): T => {
    entity.game = this;
    if (entity.onAdd) {
      entity.onAdd(this);
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

    if (entity.children) {
      this.addEntities(entity.children);
    }

    if (entity.afterAdded) {
      entity.afterAdded(this);
    }

    return entity;
  };

  /** Shortcut for adding multiple entities. */
  addEntities<T extends Entity[]>(entities: T): T {
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
    entity.game = null;
    if (this.world.stepping) {
      this.entitiesToRemove.add(entity);
    } else {
      this.cleanupEntity(entity);
    }
    return entity;
  }

  /** Remove all non-persistent entities. I think this is kinda sketchy. */
  clearScene() {
    for (const entity of this.entities) {
      if (
        entity.game &&
        !this.entitiesToRemove.has(entity) &&
        !entity.persistent
      ) {
        entity.destroy();
      }
    }
  }

  private iterationsRemaining = 0.0;
  /** The main event loop. Run one frame of the game.  */
  private loop(time: number): void {
    window.requestAnimationFrame((t) => this.loop(t));
    this.framenumber += 1;
    this.lastFrameTime = time;

    const dt = this.tickTimestep;
    this.iterationsRemaining += this.tickIterations * this.slowMo;
    for (; this.iterationsRemaining > 1.0; this.iterationsRemaining--) {
      this.tick(dt);
      if (!this.paused) {
        this.world.step(dt);
      }
      this.contacts();
    }
    this.afterPhysics();

    this.render();
  }

  /** Actually remove all the entities slated for removal from the game. */
  private cleanupEntities() {
    for (const entity of this.entitiesToRemove) {
      this.cleanupEntity(entity);
    }
    this.entitiesToRemove.clear();
  }

  private cleanupEntity(entity: Entity) {
    entity.game = null; // This should be done by `removeEntity`, but better safe than sorry
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
    }
    if (entity.sprites) {
      for (const sprite of entity.sprites) {
        this.renderer.removeSprite(sprite);
      }
    }

    if (entity.onDestroy) {
      entity.onDestroy(this);
    }
  }

  /** Called before physics. */
  private tick(dt: number) {
    this.ticknumber += 1;
    this.cleanupEntities();
    for (const entity of this.entities.filtered.beforeTick) {
      if (entity.game && !(this.paused && entity.pausable)) {
        entity.beforeTick!();
      }
    }
    this.cleanupEntities();
    for (const entity of this.entities.filtered.onTick) {
      if (entity.game && !(this.paused && entity.pausable)) {
        entity.onTick!(dt);
      }
    }
    this.cleanupEntities();
  }

  /** Called after physics. */
  private afterPhysics() {
    this.cleanupEntities();
    for (const entity of this.entities.filtered.afterPhysics) {
      if (entity.game && !(this.paused && entity.pausable)) {
        entity.afterPhysics!();
      }
    }
  }

  /** Called before actually rendering. */
  private render() {
    this.cleanupEntities();
    for (const entity of this.entities.filtered.onRender) {
      if (entity.game) {
        entity.onRender!();
      }
    }
    // this.renderer2d?.render();
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
        ownerA.onBeginContact(ownerB, shapeA, shapeB, contactEquations);
      }
      if (ownerB?.onBeginContact) {
        ownerB.onBeginContact(ownerA, shapeB, shapeA, contactEquations);
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
        ownerA.onEndContact(ownerB, shapeA, shapeB);
      }
      if (ownerB?.onEndContact) {
        ownerB.onEndContact(ownerA, shapeB, shapeA);
      }
    }
  };

  private contacts() {
    for (const contactInfo of this.contactList.getContacts()) {
      const { shapeA, shapeB, bodyA, bodyB, contactEquations } = contactInfo;
      const ownerA = shapeA.owner || bodyA.owner;
      const ownerB = shapeB.owner || bodyB.owner;
      if (ownerA?.onContacting) {
        ownerA.onContacting(ownerB, shapeA, shapeB, contactEquations);
      }
      if (ownerB?.onContacting) {
        ownerB.onContacting(ownerA, shapeB, shapeA, contactEquations);
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
        ownerA.onImpact(ownerB);
      }
      if (ownerB?.onImpact) {
        ownerB.onImpact(ownerA);
      }
    }
  };
}
