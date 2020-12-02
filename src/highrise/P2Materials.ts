import { ContactMaterial } from "p2";
import Game from "../core/Game";

export const P2Materials = {
  // ball: new Material(),
};

export const ContactMaterials: ReadonlyArray<ContactMaterial> = [];

export function initContactMaterials(game: Game) {
  for (const contactMaterial of ContactMaterials) {
    game.world.addContactMaterial(contactMaterial);
  }
}
