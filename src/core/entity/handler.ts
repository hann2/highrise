/**
 * Type-safe event handler decorator for entities.
 *
 * Usage:
 *   @on("tick")
 *   onTick({ dt }: GameEventMap["tick"]) { ... }
 */

import type { GameEventMap, GameEventName } from "./Entity";

// Type for what a handler function should look like for a given event
type HandlerFn<K extends GameEventName> = GameEventMap[K] extends void
  ? () => void
  : (data: GameEventMap[K]) => void;

// Map from class constructor to its directly declared handlers
const classHandlers = new WeakMap<object, Set<GameEventName>>();

/**
 * Decorator that marks a method as an event handler.
 * Provides compile-time type checking for the handler signature.
 *
 * @example
 * class MyEntity extends BaseEntity {
 *   @on("tick")
 *   onTick({ dt }: GameEventMap["tick"]) {
 *     // Parameters are type-checked against GameEventMap
 *   }
 *
 *   @on("render")
 *   onRender({ dt, draw }: GameEventMap["render"]) {
 *     // Parameters are type-checked
 *   }
 * }
 */
export function on<K extends GameEventName>(event: K) {
  return function (
    target: object,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ): void {
    // Validate method name matches expected pattern
    const expectedName = `on${event.charAt(0).toUpperCase()}${event.slice(1)}`;
    if (propertyKey !== expectedName) {
      throw new Error(
        `@on("${event}") requires the method to be named "${expectedName}", but found "${propertyKey}"`,
      );
    }

    // Register this event for the class that owns the method
    const owningClass = target.constructor;
    let handlers = classHandlers.get(owningClass);
    if (!handlers) {
      handlers = new Set();
      classHandlers.set(owningClass, handlers);
    }
    handlers.add(event);
  };
}

/**
 * Get all registered event handlers for an entity.
 * Returns an array of event names that the entity handles.
 * Walks up the prototype chain to collect handlers from parent classes.
 */
export function getHandlers(entity: object): readonly GameEventName[] {
  const result = new Set<GameEventName>();

  // Walk up the prototype chain to collect all handlers
  let current: object | null = entity.constructor;
  while (current && current !== Object && current !== Function) {
    const handlers = classHandlers.get(current);
    if (handlers) {
      for (const event of handlers) {
        result.add(event);
      }
    }
    current = Object.getPrototypeOf(current);
  }

  return Array.from(result);
}
