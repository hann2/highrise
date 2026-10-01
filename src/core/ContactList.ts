import type { Body } from "./physics/body/Body";
import type { Shape } from "./physics/shapes/Shape";

/**
 * The bodies and shapes in a contact. Not its contact equations, which are
 * only good during the physics step they come from.
 */
export interface Contact {
  shapeA: Shape;
  shapeB: Shape;
  bodyA: Body;
  bodyB: Body;
}
type BeginContactEvent = Contact;
type EndContactEvent = Contact;

/**
 * Manages a list of active physics contacts between bodies and shapes.
 * Tracks the beginning and end of collisions to maintain a current list
 * of ongoing contacts for collision handling.
 */
export class ContactList {
  private contacts: Contact[] = [];

  beginContact({ shapeA, shapeB, bodyA, bodyB }: Contact) {
    const contact = { shapeA, shapeB, bodyA, bodyB };
    if (shouldTrack(contact)) {
      this.contacts.push(contact);
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

  getContacts(): ReadonlyArray<Contact> {
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
