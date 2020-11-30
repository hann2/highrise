import FilterList from "./util/FilterList";
import Entity from "./entity/Entity";
import ListMap from "./util/ListMap";
import { CustomHandlersMap } from "./entity/GameEventHandler";

/**
 * Keeps track of entities. Has lots of useful indexes.
 */
export default class EntityList implements Iterable<Entity> {
  private idToEntity = new Map<string, Entity>();
  private tagged = new ListMap<string, Entity>();
  private handlers = new ListMap<string, Entity>();

  all = new Set<Entity>();

  filtered = {
    afterPhysics: new FilterList<Entity>((e) => Boolean(e.afterPhysics)),
    beforeTick: new FilterList<Entity>((e) => Boolean(e.beforeTick)),
    onRender: new FilterList<Entity>((e) => Boolean(e.onRender)),
    onTick: new FilterList<Entity>((e) => Boolean(e.onTick)),
    onPause: new FilterList<Entity>((e) => Boolean(e.onPause)),
    onUnpause: new FilterList<Entity>((e) => Boolean(e.onUnpause)),
    hasBody: new FilterList<Entity>((e) => Boolean(e.body)),
  };

  add(entity: Entity) {
    this.all.add(entity);
    for (const list of Object.values(this.filtered)) {
      list.addIfValid(entity);
    }

    if (entity.tags) {
      for (const tag of entity.tags) {
        this.tagged.add(tag, entity);
      }
    }

    if (entity.handlers) {
      for (const handler of Object.keys(entity.handlers)) {
        this.handlers.add(handler, entity);
      }
    }

    if (entity.id) {
      if (this.idToEntity.has(entity.id)) {
        throw new Error(`entities with duplicate ids: ${entity.id}`);
      }
      this.idToEntity.set(entity.id, entity);
    }
  }

  remove(entity: Entity) {
    this.all.delete(entity);
    for (const list of Object.values(this.filtered)) {
      list.remove(entity);
    }

    if (entity.tags) {
      for (const tag of entity.tags) {
        this.tagged.remove(tag, entity);
      }
    }

    if (entity.handlers) {
      for (const handler of Object.keys(entity.handlers)) {
        this.handlers.remove(handler, entity);
      }
    }

    if (entity.id) {
      this.idToEntity.delete(entity.id);
    }
  }

  byId(id: string) {
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
      tags.every((t) => e.tags!.includes(t))
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
    return Array.from(result);
  }

  getHandlers(eventType: string): ReadonlyArray<Entity> {
    return this.handlers.get(eventType);
  }

  [Symbol.iterator]() {
    return this.all[Symbol.iterator]();
  }
}
