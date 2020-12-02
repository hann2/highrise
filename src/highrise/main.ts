import AutoPauser from "../core/AutoPauser";
import Game from "../core/Game";
import FPSMeter from "../core/util/FPSMeter";
import LevelController from "./entities/controllers/LevelController";
import { initLayers } from "./layers";
import { initContactMaterials } from "./P2Materials";
import Preloader from "./Preloader";
import CameraController from "./entities/controllers/CameraController";
import PositionalSoundListener from "../core/sound/PositionalSoundListener";

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
  initLayers(game);
  initContactMaterials(game);

  window.DEBUG = { game };
  game.start();

  const preloader = game.addEntity(new Preloader());
  await preloader.waitTillLoaded();
  preloader.destroy();

  game.addEntity(new AutoPauser());
  game.addEntity(new FPSMeter());
  game.addEntity(new LevelController());
  game.addEntity(new CameraController(game.camera));
  game.addEntity(new PositionalSoundListener());

  game.dispatch({ type: "newGame" });
}
