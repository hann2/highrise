import { PhysicsEventMap } from "./physics/events/PhysicsEvents";

type BeginContactEvent = PhysicsEventMap["beginContact"];
type EndContactEvent = PhysicsEventMap["endContact"];

/**
 * Manages a list of active physics contacts between bodies and shapes.
 * Tracks the beginning and end of collisions to maintain a current list
 * of ongoing contacts for collision handling.
 */
export class ContactList {
  private contacts: BeginContactEvent[] = [];

  beginContact(event: BeginContactEvent) {
    if (shouldTrack(event)) {
      this.contacts.push(event);
    }
  }

  endContact(event: EndContactEvent) {
    if (shouldTrack(event)) {
      const index = this.contacts.findIndex((info) =>
        contactsAreEqual(info, event),
      );
      if (index !== -1) {
        this.contacts.splice(index, 1);
      }
    }
  }

  getContacts(): ReadonlyArray<BeginContactEvent> {
    return this.contacts;
  }
}

/** Whether or not this is a collision we need to keep track of */
function shouldTrack(_event: BeginContactEvent | EndContactEvent): boolean {
  return true;
}

/** Whether or not two contact events represent the same contact */
function contactsAreEqual(
  a: BeginContactEvent | EndContactEvent,
  b: BeginContactEvent | EndContactEvent,
): boolean {
  return (
    (a.bodyA === b.bodyA &&
      a.bodyB === b.bodyB &&
      a.shapeA === b.shapeA &&
      a.shapeB === b.shapeB) ||
    (a.bodyA === b.bodyB &&
      a.bodyB === b.bodyA &&
      a.shapeA === b.shapeB &&
      a.shapeB === b.shapeA)
  );
}
