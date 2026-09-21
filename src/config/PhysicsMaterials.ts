import type Game from "../core/Game";
import { ContactMaterial } from "../core/physics/material/ContactMaterial";
import { Material } from "../core/physics/material/Material";

export const PhysicsMaterials = {
  wall: new Material(),
  glowstick: new Material(),
};

export const ContactMaterials: ReadonlyArray<ContactMaterial> = [
  new ContactMaterial(PhysicsMaterials.wall, PhysicsMaterials.glowstick, {
    restitution: 0.5,
  }),
];

export function initContactMaterials(game: Game) {
  for (const contactMaterial of ContactMaterials) {
    game.world.contactMaterials.add(contactMaterial);
  }
}
