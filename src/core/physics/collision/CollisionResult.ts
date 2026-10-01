import { V, V2d } from "../../Vector";

/**
 * Result of a collision detection between two shapes.
 * Contains the raw collision data (contact points, normals, depths)
 * before equation generation.
 */
export interface CollisionContact {
  /** Contact point on shape A in world space */
  worldContactA: V2d;
  /** Contact point on shape B in world space */
  worldContactB: V2d;
  /** Contact normal (pointing from shape A to shape B) */
  normal: V2d;
  /** Penetration depth (positive = overlapping) */
  depth: number;
}

/**
 * Result from collision detection.
 * Null means no collision.
 */
export interface CollisionResult {
  /** Individual contacts found */
  contacts: CollisionContact[];
}

// Results and contacts are reused from one physics step to the next (see
// `releaseCollisionResults`), rather than made new for every pair every step
const resultPool: CollisionResult[] = [];
let resultsUsed = 0;
const contactPool: CollisionContact[] = [];
let contactsUsed = 0;

/** An empty collision result, good until `releaseCollisionResults` */
export function createCollisionResult(): CollisionResult {
  let result = resultPool[resultsUsed];
  if (!result) {
    result = { contacts: [] };
    resultPool.push(result);
  }
  resultsUsed++;
  result.contacts.length = 0;
  return result;
}

/**
 * Adds a contact to `result` and returns it for the caller to fill in: all
 * of its fields, since it's reused and still has whatever it had last
 */
export function addContact(result: CollisionResult): CollisionContact {
  let contact = contactPool[contactsUsed];
  if (!contact) {
    contact = { worldContactA: V(), worldContactB: V(), normal: V(), depth: 0 };
    contactPool.push(contact);
  }
  contactsUsed++;
  result.contacts.push(contact);
  return contact;
}

/**
 * Frees every collision result and contact made so far, to be reused. The
 * narrowphase calls this at the start of each step: nothing may use them
 * after that.
 */
export function releaseCollisionResults(): void {
  resultsUsed = 0;
  contactsUsed = 0;
}
