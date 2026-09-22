import { DEFAULT_TICK_LAYER, TickLayerName } from "../config/tickLayers";
import Entity, { GameEventHandler, GameEventName } from "./entity/Entity";
import { getHandlers } from "./entity/handler";
import { EntityFilter, hasBody } from "./EntityFilter";
import { FilterMultiMap } from "./util/FilterListMap";
import MultiMap from "./util/ListMap";

/**
 * Keeps track of entities. Has lots of useful indexes.
 */
export default class EntityList implements Iterable<Entity> {
  /** Maps entity ids to entities */
  private idToEntity = new Map<string, Entity>();
  /** Maps tags to entities */
  private tagged = new MultiMap<string, Entity>();
  /** Maps event types to entities that handle them */
  private handlers = new MultiMap<GameEventName, Entity>();
  /** Maps tick layers to the entities that tick on them */
  private tickLayerEntities = new MultiMap<TickLayerName, Entity>();
  /** Maps constructors to their instances */
  private byConstructor = new MultiMap<Constructor<Entity>, Entity>();
  /** Maps filters to entities that pass them */
  private filters = new FilterMultiMap<Entity>();
  /** All entities */
  all = new Set<Entity>();

  constructor() {
    this.addFilter(hasBody);
  }

  get withBody() {
    return this.getByFilter(hasBody);
  }

  /** Adds an entity to this list and all sublists and does all the bookkeeping */
  add(entity: Entity) {
    this.all.add(entity);

    this.filters.addItem(entity);

    if (entity.tags) {
      for (const tag of entity.tags) {
        this.tagged.add(tag, entity);
      }
    }

    for (const eventName of getHandlers(entity)) {
      this.handlers.add(eventName, entity);
    }
    if (this.handlers.has("tick", entity)) {
      for (const layer of tickLayersOf(entity)) {
        this.tickLayerEntities.add(layer, entity);
      }
    }

    this.byConstructor.add(entity.constructor as Constructor<Entity>, entity);

    if (entity.id) {
      if (this.idToEntity.has(entity.id)) {
        throw new Error(`entities with duplicate ids: ${entity.id}`);
      }
      this.idToEntity.set(entity.id, entity);
    }
  }

  /** Removes an entity from this list and all the sublists and does some bookkeeping */
  remove(entity: Entity) {
    this.all.delete(entity);

    this.filters.removeItem(entity);

    if (entity.tags) {
      for (const tag of entity.tags) {
        this.tagged.remove(tag, entity);
      }
    }

    if (this.handlers.has("tick", entity)) {
      for (const layer of tickLayersOf(entity)) {
        this.tickLayerEntities.remove(layer, entity);
      }
    }
    for (const eventName of getHandlers(entity)) {
      this.handlers.remove(eventName, entity);
    }

    this.byConstructor.remove(
      entity.constructor as Constructor<Entity>,
      entity,
    );

    if (entity.id) {
      this.idToEntity.delete(entity.id);
    }
  }

  /** Get the entity with the given id. */
  getById(id: string) {
    return this.idToEntity.get(id);
  }

  /** Returns all entities of the given class (exact class, not subclasses). */
  getByConstructor<T extends Entity>(
    constructor: Constructor<T>,
  ): ReadonlyArray<T> {
    return this.byConstructor.get(constructor) as ReadonlyArray<T>;
  }

  /** Returns the one entity of the given class. Throws if there isn't exactly one. */
  getSingleton<T extends Entity>(constructor: Constructor<T>): T {
    const instances = this.getByConstructor(constructor);
    if (instances.length !== 1) {
      throw new Error(
        `Expected exactly one ${constructor.name}, found ${instances.length}`,
      );
    }
    return instances[0];
  }

  /** Returns all entities with the given tag. */
  getTagged(tag: string): readonly Entity[] {
    return this.tagged.get(tag);
  }

  /** Returns all entities that have all the given tags */
  getTaggedAll(...tags: string[]): Entity[] {
    if (tags.length === 0) {
      return [];
    }
    return this.getTagged(tags[0]).filter((e) =>
      tags.every((t) => e.tags!.includes(t)),
    );
  }

  /** Returns all entities that have at least one of the given tags */
  getTaggedAny(...tags: string[]): Entity[] {
    const result = new Set<Entity>();
    for (const tag of tags) {
      for (const e of this.getTagged(tag)) {
        result.add(e);
      }
    }
    return [...result];
  }

  /**
   * Adds a filter for fast lookup with getByFilter() in the future.
   */
  addFilter<T extends Entity>(filter: EntityFilter<T>): void {
    this.filters.addFilter(filter, this.all);
  }

  /**
   * Removes a filter that was added with addFilter().
   */
  removeFilter<T extends Entity>(filter: EntityFilter<T>): void {
    this.filters.removeFilter(filter);
  }

  /**
   * Return all the entities that pass a type guard.
   * Pair with addFilter() to make this fast.
   */
  getByFilter<T extends Entity>(
    filter: EntityFilter<T>,
  ): Iterable<T> & { readonly length: number } {
    const result = this.filters.getItems(filter);
    return result ?? [...this.all].filter(filter);
  }

  /**
   * Get all entities that handle a specific event type.
   */
  getHandlers(
    eventType: GameEventName,
  ): ReadonlyArray<Entity & GameEventHandler<GameEventName>> {
    return this.handlers.get(eventType) as ReadonlyArray<
      Entity & GameEventHandler<GameEventName>
    >;
  }

  /** All the entities that tick on the given layer. */
  getTickersOnLayer(layer: TickLayerName): ReadonlyArray<Entity> {
    return this.tickLayerEntities.get(layer);
  }

  /**
   * Iterate through all the entities.
   */
  [Symbol.iterator]() {
    return this.all[Symbol.iterator]();
  }
}

type Constructor<T> = abstract new (...args: any[]) => T;

function tickLayersOf(entity: Entity): readonly TickLayerName[] {
  return entity.tickLayers ?? [entity.tickLayer ?? DEFAULT_TICK_LAYER];
}
