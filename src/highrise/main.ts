import AutoPauser from "../core/AutoPauser";
import Game from "../core/Game";
import FPSMeter from "../core/util/FPSMeter";
import { V } from "../core/Vector";
import Level1 from "./data/levels/lvl1";
import AIHumanController from "./entities/AIHumanController";
import Pistol from "./entities/guns/Pistol";
import Rifle from "./entities/guns/Rifle";
import Shotgun from "./entities/guns/Shotgun";
import Human from "./entities/Human";
import Party from "./entities/Party";
import PlayerHumanController from "./entities/PlayerHumanController";
import { ContactMaterials } from "./P2Materials";
import Preloader from "./Preloader";
import CameraController from "./entities/CameraController";
import { choose } from "../core/util/Random";
import { newGame } from "./data/levels/switchLevel";

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
