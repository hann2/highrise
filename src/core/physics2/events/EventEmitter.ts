/**
 * Event object passed to listeners
 */
export interface P2Event {
  type: string;
  target?: EventEmitter;
}

/**
 * Listener function with optional context.
 * Internal storage uses the base type - the public API provides type safety.
 */
interface ListenerWithContext {
  (event: P2Event): void;
  context?: unknown;
}

/**
 * Base class for objects that dispatch events.
 * @template EventMap - A map of event type names to their event payloads
 */
export class EventEmitter<
  EventMap extends Record<string, P2Event> = Record<string, P2Event>,
> {
  // Type-erased internal storage. Public API ensures we only store/retrieve
  // correctly typed listeners for each event type.
  private _listeners?: Partial<Record<keyof EventMap, ListenerWithContext[]>>;

  /**
   * Add an event listener
   * @param type Event type
   * @param listener Callback function
   * @param context Optional context to bind the listener to
   * @returns The self object, for chainability.
   */
  on<K extends keyof EventMap>(
    type: K,
    listener: (event: EventMap[K]) => void,
    context?: unknown,
  ): this {
    const stored = listener as ListenerWithContext;
    stored.context = context ?? this;

    if (this._listeners === undefined) {
      this._listeners = {};
    }

    const listeners = this._listeners;
    if (listeners[type] === undefined) {
      listeners[type] = [];
    }

    const typeListeners = listeners[type]!;
    if (typeListeners.indexOf(stored) === -1) {
      typeListeners.push(stored);
    }

    return this;
  }

  /**
   * Check if an event listener is added
   * @param type Event type
   * @param listener Optional specific listener to check for
   * @returns True if listener(s) exist for the type
   */
  has<K extends keyof EventMap>(
    type: K,
    listener?: (event: EventMap[K]) => void,
  ): boolean {
    const typeListeners = this._listeners?.[type];
    if (!typeListeners) {
      return false;
    }
    if (listener) {
      return typeListeners.indexOf(listener as ListenerWithContext) !== -1;
    }
    return true;
  }

  /**
   * Remove an event listener
   * @param type Event type
   * @param listener The listener to remove
   * @returns The self object, for chainability.
   */
  off<K extends keyof EventMap>(
    type: K,
    listener: (event: EventMap[K]) => void,
  ): this {
    const typeListeners = this._listeners?.[type];
    if (typeListeners) {
      const index = typeListeners.indexOf(listener as ListenerWithContext);
      if (index !== -1) {
        typeListeners.splice(index, 1);
      }
    }
    return this;
  }

  /**
   * Emit an event.
   * @param event The event object to emit
   * @returns The self object, for chainability.
   */
  emit<K extends keyof EventMap>(event: EventMap[K]): this {
    const listenerArray = this._listeners?.[event.type as K];
    if (listenerArray) {
      (event as P2Event).target = this;
      for (const listener of listenerArray) {
        listener.call(listener.context, event);
      }
    }
    return this;
  }
}
