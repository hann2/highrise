import { GameEventName } from "./Entity";

/** Utility type to convert an event name to the name of the handler for it */
export type EventHandlerName<T extends string> = `on${Capitalize<T>}`;

/** Converts an event name to the name of the event handler method. */
export function eventHandlerName<T extends string>(
  eventName: T,
): EventHandlerName<T> {
  return `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}` as EventHandlerName<T>;
}

export type EventHandler<EventMap> = {
  [
    K in keyof EventMap as EventHandlerName<string & K>
  ]?: EventMap[K] extends void ? () => void : (eventData: EventMap[K]) => void;
};

/** Converts an event handler method name to the name of the event it handles. */
export function handlerNameToEventName(handlerName: string): GameEventName {
  const firstLetter = handlerName[2];
  const rest = handlerName.slice(3);
  return (firstLetter.toLowerCase() + rest) as GameEventName;
}
