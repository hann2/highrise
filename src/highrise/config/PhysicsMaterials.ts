import { ContactMaterial, Material } from "p2";
import type Game from "../../core/Game";

export const P2Materials = {
  wall: new Material(),
  glowstick: new Material(),
};

export const ContactMaterials: ReadonlyArray<ContactMaterial> = [
  new ContactMaterial(P2Materials.wall, P2Materials.glowstick, {
    restitution: 0.5,
  }),
];

export function initContactMaterials(game: Game) {
  for (const contactMaterial of ContactMaterials) {
    game.world.addContactMaterial(contactMaterial);
  }
}
