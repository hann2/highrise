import Entity, { GameEventHandler, GameEventName } from "./entity/Entity";
import { handlerNameToEventName } from "./entity/EventHandler";
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

    for (const methodName of getAllMethods(entity)) {
      if (methodName.startsWith("on")) {
        this.handlers.add(handlerNameToEventName(methodName), entity);
      }
    }

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

    for (const methodName of getAllMethods(entity)) {
      if (methodName.startsWith("on")) {
        this.handlers.remove(handlerNameToEventName(methodName), entity);
      }
    }

    if (entity.id) {
      this.idToEntity.delete(entity.id);
    }
  }

  /** Get the entity with the given id. */
  getById(id: string) {
    return this.idToEntity.get(id);
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

  /**
   * Iterate through all the entities.
   */
  [Symbol.iterator]() {
    return this.all[Symbol.iterator]();
  }
}

function getAllMethods(entity: object): string[] {
  const methods: string[] = [];
  let current = entity;

  // Traverse up the prototype chain
  while (
    current !== null &&
    current !== undefined &&
    current !== Object.prototype
  ) {
    // Get own property names of the current object
    const propertyNames = Object.getOwnPropertyNames(current);

    // Filter out non-function properties and already added methods
    for (const name of propertyNames as [keyof typeof current]) {
      // Access on entity and not currentObject because we're looking at prototypes
      if (typeof entity[name] === "function" && !methods.includes(name)) {
        methods.push(name);
      }
    }

    // Move up the prototype chain
    current = Object.getPrototypeOf(current);
  }

  return methods;
}
