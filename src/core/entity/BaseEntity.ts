import { EntityDef } from "../EntityDef";
import Game from "../Game";
import { V, V2d } from "../Vector";
import { clamp } from "../util/MathUtil";
import type { Body } from "../physics/body/Body";
import { createRigid2D } from "../physics/body/bodyFactories";
import type { Constraint } from "../physics/constraints/Constraint";
import type { Spring } from "../physics/springs/Spring";
import { shapeFromDef } from "../physics/utils/ShapeUtils";
import Entity, { GameEventMap } from "./Entity";
import { GameSprite, spriteFromDef } from "./GameSprite";
import { on } from "./handler";

/**
 * Base class for lots of stuff in the game.
 */
export default abstract class BaseEntity implements Entity {
  bodies?: Body[];
  body?: Body;
  children: Entity[] = [];
  constraints?: Constraint[];
  game: Game | undefined = undefined;
  parent?: Entity;
  pausable: boolean = true;
  persistenceLevel: number = 0;
  springs?: Spring[];
  id?: string;
  tags: string[] = [];
  sprite?: GameSprite;
  sprites?: GameSprite[];

  constructor(entityDef?: EntityDef) {
    if (entityDef) {
      this.loadFromDef(entityDef);
    }
  }

  loadFromDef(def: EntityDef): void {
    if (this.game) {
      throw new Error(
        "Can't load from def after entity has been added to game.",
      );
    }

    if (def.sprites) {
      if (def.sprites.length === 1) {
        this.sprite = spriteFromDef(def.sprites[0]);
      } else {
        this.sprites = def.sprites.map((spriteDef) => spriteFromDef(spriteDef));
      }
    }

    if (def.body) {
      this.body = createRigid2D({ motion: "dynamic", mass: def.body.mass });
      for (const shapeDef of def.body.shapes) {
        const shape = shapeFromDef(shapeDef);
        this.body.addShape(shape, shape.position, shape.angle);
      }
    }
  }

  /** Convert local coordinates to world coordinates. Requires a body */
  localToWorld(localPoint: V2d | [number, number]): V2d {
    if (this.body) {
      return this.body.toWorldFrame(V(localPoint));
    }
    return V(0, 0);
  }

  worldToLocal(worldPoint: V2d | [number, number]): V2d {
    if (this.body) {
      return this.body.toLocalFrame(V(worldPoint));
    }
    return V(0, 0);
  }

  getPosition(): V2d {
    if (this.body) {
      return V(this.body.position);
    } else if (this.sprite) {
      return V(this.sprite.position.x, this.sprite.position.y);
    }
    throw new Error("Position is not implemented for this entity");
  }

  get isDestroyed() {
    return this.game == null;
  }

  // Removes this from the game. You probably shouldn't override this method.
  destroy() {
    if (this.game) {
      this.game.removeEntity(this);
      while (this.children?.length) {
        this.children[this.children.length - 1].destroy();
      }
      if (this.parent) {
        const pChildren = this.parent.children!;
        const index = pChildren.lastIndexOf(this);
        if (index < 0) {
          throw new Error(`Parent doesn't have child`);
        }
        pChildren.splice(index, 1);
      }
    }
  }

  /** Add another entity as a child of this one. Child entities will get destroyed when their parent is destroyed. */
  addChild<T extends Entity>(child: T, changeParent: boolean = false): T {
    if (child.parent) {
      if (changeParent) {
        // This can lead to weird state where a child is added but its parent isn't, dunno if that's bad
        const oldParent = child.parent;
        oldParent.children!.splice(oldParent.children!.indexOf(child), 1);
      } else {
        throw new Error("Child already has a parent.");
      }
    }
    child.parent = this;
    this.children = this.children ?? [];
    this.children.push(child);

    if (this.game && !child.game) {
      this.game.addEntity(child);
    }
    return child;
  }

  /** Add multiple entities as children of this one. See addChild. */
  addChildren(...children: readonly Entity[]): void {
    for (const child of children) {
      this.addChild(child);
    }
  }

  /**
   * Fulfills after the given amount of game time.
   * Use with delay=0 to wait until the next tick.
   * @param onTick  Do something every tick while waiting
   */
  wait(
    delay: number = 0,
    onTick?: (dt: number, t: number) => void,
    timerId?: string,
  ): Promise<void> {
    return new Promise((resolve) => {
      const timer = new Timer(delay, () => resolve(), onTick, timerId);
      timer.persistenceLevel = this.persistenceLevel;
      this.addChild(timer);
    });
  }

  /**
   * Fulfills after the given amount of game time.
   * Use with delay=0 to wait until the next tick.
   * @param onRender  Do something every render while waiting
   */
  waitRender(
    delay: number = 0,
    onRender?: (dt: number, t: number) => void,
    timerId?: string,
  ): Promise<void> {
    return new Promise((resolve) => {
      const timer = new RenderTimer(delay, () => resolve(), onRender, timerId);
      timer.persistenceLevel = this.persistenceLevel;
      this.addChild(timer);
    });
  }

  /**
   * Wait until a condition is filled. Probably not great to use, but seems kinda cool too.
   */
  waitUntil(
    predicate: () => boolean,
    onTick?: (dt: number, t: number) => void,
    timerId?: string,
  ): Promise<void> {
    return new Promise((resolve) => {
      const timer = new Timer(
        Infinity,
        () => resolve(),
        (dt, t) => {
          if (onTick) {
            onTick(dt, t);
          }
          if (predicate()) {
            timer.timeRemaining = 0;
          }
        },
        timerId,
      );
      timer.persistenceLevel = this.persistenceLevel;
      this.addChild(timer);
    });
  }

  /**
   * Remove all timers from this instance. i.e. cancel all 'waits'.
   */
  clearTimers(timerId?: string): void {
    if (this.children) {
      const timers = this.children.filter(isTimer);
      for (const timer of timers) {
        if (!timerId || timerId === timer.timerId) {
          timer.destroy();
        }
      }
    }
  }

  /**
   * Update the time remaing on a timer (or all timers).
   */
  updateTimers(value: number = 0, timerId?: string): void {
    if (this.children) {
      const timers = this.children.filter(isTimer);
      for (const timer of timers) {
        if (!timerId || timerId === timer.timerId) {
          timer.timeRemaining = value;
        }
      }
    }
  }

  /** Dispatch an event. */
  dispatch<EventName extends keyof GameEventMap>(
    eventName: EventName,
    data: GameEventMap[EventName],
    respectPause?: boolean,
  ) {
    this.game?.dispatch(eventName, data, respectPause);
  }
}

class Timer extends BaseEntity implements Entity {
  timeRemaining: number = 0;
  endEffect?: () => void;
  duringEffect?: (dt: number, t: number) => void;

  constructor(
    private delay: number,
    endEffect?: () => void,
    duringEffect?: (dt: number, t: number) => void,
    public timerId?: string,
  ) {
    super();
    this.timeRemaining = delay;
    this.endEffect = endEffect;
    this.duringEffect = duringEffect;
  }

  @on("tick")
  onTick(dt: number) {
    this.timeRemaining -= dt;
    const t = clamp(1.0 - this.timeRemaining / this.delay);
    this.duringEffect?.(dt, t);
    if (this.timeRemaining <= 0) {
      this.endEffect?.();
      this.destroy();
    }
  }
}

class RenderTimer extends BaseEntity implements Entity {
  timeRemaining: number = 0;
  endEffect?: () => void;
  duringEffect?: (dt: number, t: number) => void;

  constructor(
    private delay: number,
    endEffect?: () => void,
    duringEffect?: (dt: number, t: number) => void,
    public timerId?: string,
  ) {
    super();
    this.timeRemaining = delay;
    this.endEffect = endEffect;
    this.duringEffect = duringEffect;
  }

  @on("render")
  onRender(dt: number) {
    this.timeRemaining -= dt;
    const t = clamp(1.0 - this.timeRemaining / this.delay);
    this.duringEffect?.(dt, t);
    if (this.timeRemaining <= 0) {
      this.endEffect?.();
      this.destroy();
    }
  }
}

function isTimer(e?: Entity): e is Timer {
  return e instanceof Timer;
}
