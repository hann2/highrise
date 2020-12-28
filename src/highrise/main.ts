import AutoPauser from "../core/AutoPauser";
import Game from "../core/Game";
import CustomWorld from "../core/physics/CustomWorld";
import SpatialHashingBroadphase from "../core/physics/SpatialHashingBroadphase";
import PositionalSoundListener from "../core/sound/PositionalSoundListener";
import FPSMeter from "../core/util/FPSMeter";
import { initLayers, Layer } from "./config/layers";
import { initContactMaterials } from "./config/PhysicsMaterials";
import { CELL_WIDTH, LEVEL_SIZE } from "./constants/constants";
import CheatController from "./controllers/CheatController";
import { GameController } from "./controllers/GameController";
import { GraphicsQualityController } from "./controllers/GraphicsQualityController";
import MusicController from "./controllers/MusicController";
import VolumeController from "./controllers/VolumeController";
import { isHuman } from "./human/Human";
import Preloader from "./preloader/Preloader";

declare global {
  interface Window {
    DEBUG: { game?: Game };
  }
}

export async function main() {
  await new Promise((resolve) => window.addEventListener("load", resolve));

  const game = new Game({
    tickIterations: 1,
    world: new CustomWorld({
      gravity: [0, 0],
      broadphase: new SpatialHashingBroadphase(
        CELL_WIDTH / 2,
        LEVEL_SIZE * 2,
        LEVEL_SIZE * 2
      ),
    }),
  });
  game.world.frictionGravity = 10;
  initLayers(game);
  initContactMaterials(game);

  window.DEBUG = { game };
  game.start();

  const preloader = game.addEntity(new Preloader());
  await preloader.waitTillLoaded();
  preloader.destroy();

  // Add some filters for fast lookup of certain entities later
  // Think of these like indexes in a DB
  game.entities.addFilter(isHuman);

  game.addEntity(new AutoPauser());
  game.addEntity(new VolumeController());
  game.addEntity(new MusicController());
  game.addEntity(new PositionalSoundListener());
  game.addEntity(new GraphicsQualityController());
  game.addEntity(new GameController());

  if (process.env.NODE_ENV === "development") {
    game.addEntity(new FPSMeter(Layer.MENU));
    game.addEntity(new CheatController());
  }

  game.dispatch({ type: "goToMainMenu" });

  const element = game.renderer.pixiRenderer.view;

  const makeFullScreen = () => {
    element.requestFullscreen();
    element.removeEventListener("click", makeFullScreen);
  };
  element.addEventListener("click", makeFullScreen);
}
