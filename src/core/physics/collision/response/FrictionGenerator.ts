import type { Body } from "../../body/Body";
import type { EquationPool } from "../../equations/EquationPool";
import { ContactEquation } from "../../equations/ContactEquation";
import { FrictionEquation } from "../../equations/FrictionEquation";
import { ContactMaterial } from "../../material/ContactMaterial";
import { Collision } from "../narrowphase/getContactsFromCollisionPairs";

/**
 * Initial slip force value used before the solver recalculates based on contact forces.
 * The solver will update friction bounds after an initial iteration phase using:
 * slipForce = sum(contactMultipliers) * frictionCoefficient / numContacts
 */
const INITIAL_SLIP_FORCE = 10.0;

/** Creates a list of FrictionEquations for a collision.
 * Chooses to create one for each contact or create one averaged equation. */
export function generateFrictionEquationsForCollision(
  collision: Collision,
  contactEquations: ReadonlyArray<ContactEquation>,
  contactMaterial: ContactMaterial,
  frictionReduction: boolean,
  /** Where to get the equations from; new ones if not given */
  pool?: EquationPool<FrictionEquation>,
): FrictionEquation[] {
  if (frictionReduction && contactEquations.length > 1) {
    return [
      generateAverageFrictionEquationForCollision(
        collision,
        contactEquations,
        contactMaterial,
        pool,
      ),
    ];
  } else {
    return generateAllFrictionEquationsForCollision(
      collision,
      contactEquations,
      contactMaterial,
      pool,
    );
  }
}

/** A friction equation that slips at `INITIAL_SLIP_FORCE` until the solver bounds it */
function makeFrictionEquation(
  bodyA: Body,
  bodyB: Body,
  pool: EquationPool<FrictionEquation> | undefined,
): FrictionEquation {
  if (!pool) {
    return new FrictionEquation(bodyA, bodyB, INITIAL_SLIP_FORCE);
  }
  const eq = pool.take(bodyA, bodyB);
  eq.setSlipForce(INITIAL_SLIP_FORCE);
  return eq;
}

function generateAllFrictionEquationsForCollision(
  collision: Collision,
  contactEquations: ReadonlyArray<ContactEquation>,
  contactMaterial: ContactMaterial,
  pool: EquationPool<FrictionEquation> | undefined,
): FrictionEquation[] {
  // Only enable equations if all parties have collisionResponse enabled
  const enabled =
    collision.bodyA.collisionResponse &&
    collision.bodyB.collisionResponse &&
    collision.shapeA.collisionResponse &&
    collision.shapeB.collisionResponse;

  return contactEquations.map((contact) => {
    const eq = makeFrictionEquation(contact.bodyA, contact.bodyB, pool);
    eq.shapeA = contact.shapeA;
    eq.shapeB = contact.shapeB;

    eq.contactPointA.set(contact.contactPointA);
    eq.contactPointB.set(contact.contactPointB);
    eq.t.set(contact.normalA).irotate90cw();
    eq.contactEquations.push(contact);

    eq.frictionCoefficient = contactMaterial.friction;
    eq.relativeVelocity = contactMaterial.surfaceVelocity;
    eq.stiffness = contactMaterial.frictionStiffness;
    eq.relaxation = contactMaterial.frictionRelaxation;

    eq.needsUpdate = true;
    eq.enabled = enabled;

    return eq;
  });
}

function generateAverageFrictionEquationForCollision(
  collision: Collision,
  contactEquations: ReadonlyArray<ContactEquation>,
  contactMaterial: ContactMaterial,
  pool: EquationPool<FrictionEquation> | undefined,
): FrictionEquation {
  const eq = makeFrictionEquation(collision.bodyA, collision.bodyB, pool);

  eq.shapeA = collision.shapeA;
  eq.shapeB = collision.shapeB;

  eq.frictionCoefficient = contactMaterial.friction;
  eq.relativeVelocity = contactMaterial.surfaceVelocity;
  eq.stiffness = contactMaterial.frictionStiffness;
  eq.relaxation = contactMaterial.frictionRelaxation;

  // Only enable equations if all parties have collisionResponse enabled
  eq.enabled =
    collision.bodyA.collisionResponse &&
    collision.bodyB.collisionResponse &&
    collision.shapeA.collisionResponse &&
    collision.shapeB.collisionResponse;

  eq.contactPointA.set(0, 0);
  eq.contactPointB.set(0, 0);
  eq.t.set(0, 0);

  for (const contact of contactEquations) {
    if (contact.bodyA === collision.bodyA) {
      eq.t.iadd(contact.normalA);
      eq.contactPointA.iadd(contact.contactPointA);
      eq.contactPointB.iadd(contact.contactPointB);
    } else {
      eq.t.isub(contact.normalA);
      eq.contactPointA.iadd(contact.contactPointB);
      eq.contactPointB.iadd(contact.contactPointA);
    }
    eq.contactEquations.push(contact);
  }

  const invNumContacts = 1 / contactEquations.length;
  eq.contactPointA.imul(invNumContacts);
  eq.contactPointB.imul(invNumContacts);
  eq.t.inormalize();
  eq.t.irotate90cw();

  return eq;
}
