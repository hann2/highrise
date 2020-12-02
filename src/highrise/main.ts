import AutoPauser from "../core/AutoPauser";
import Game from "../core/Game";
import FPSMeter from "../core/util/FPSMeter";
import { newGame } from "./data/levels/switchLevel";
import { ContactMaterials } from "./P2Materials";
import Preloader from "./Preloader";

declare global {
  interface Window {
    DEBUG: { game?: Game };
  }
}

export async function main() {
  await new Promise((resolve) => window.addEventListener("load", resolve));

  const game = new Game({
    tickIterations: 4,
  });
  game.world.frictionGravity = 10;

  for (const contactMaterial of ContactMaterials) {
    game.world.addContactMaterial(contactMaterial);
  }

  window.DEBUG = { game };
  game.start();

  const preloader = game.addEntity(new Preloader());
  await preloader.waitTillLoaded();
  preloader.destroy();

  game.addEntity(new AutoPauser());
  game.addEntity(new FPSMeter());

  newGame(game);
}
