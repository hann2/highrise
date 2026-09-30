import type Game from "../core/Game";
import { ContactMaterial } from "../core/physics/material/ContactMaterial";
import { Material } from "../core/physics/material/Material";

export const PhysicsMaterials = {
  wall: new Material(),
  smallObject: new Material(),
  enemy: new Material(),
};

export const ContactMaterials: ReadonlyArray<ContactMaterial> = [
  new ContactMaterial(PhysicsMaterials.wall, PhysicsMaterials.smallObject, {
    restitution: 0.5,
  }),
  // Enemies slide past each other rather than gripping, so a crowd flows
  // around things (and is cheaper: frictionless contacts need no friction
  // equations)
  new ContactMaterial(PhysicsMaterials.enemy, PhysicsMaterials.enemy, {
    friction: 0,
  }),
];

export function initContactMaterials(game: Game) {
  for (const contactMaterial of ContactMaterials) {
    game.world.contactMaterials.add(contactMaterial);
  }
}
