import AutoPauser from "../core/AutoPauser";
import Game from "../core/Game";
import CustomWorld from "../core/physics/CustomWorld";
import SpatialHashingBroadphase from "../core/physics/SpatialHashingBroadphase";
import PositionalSoundListener from "../core/sound/PositionalSoundListener";
import FPSMeter from "../core/util/FPSMeter";
import ResizeListener from "../core/util/ResizeListener";
import { CELL_WIDTH, LEVEL_SIZE } from "./data/levels/levelGeneration";
import CameraController from "./entities/controllers/CameraController";
import CheatController from "./entities/controllers/CheatController";
import LevelController from "./entities/controllers/LevelController";
import PartyManager from "./entities/PartyManager";
import { initLayers } from "./layers";
import LightingManager from "./lighting/LightingManager";
import MainMenu from "./menu/MainMenu";
import PauseMenuController from "./menu/PauseMenuController";
import MusicController from "./MusicController";
import { initContactMaterials } from "./physics/PhysicsMaterials";
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
        CELL_WIDTH,
        LEVEL_SIZE,
        LEVEL_SIZE
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

  game.addEntity(new AutoPauser());
  game.addEntity(new ResizeListener());
  game.addEntity(new LevelController());
  game.addEntity(new PartyManager());
  game.addEntity(new CameraController(game.camera));
  game.addEntity(new PositionalSoundListener());
  game.addEntity(new LightingManager());
  game.addEntity(new MusicController());
  game.addEntity(new MainMenu());

  if (process.env.NODE_ENV === "development") {
    game.addEntity(new FPSMeter());
    game.addEntity(new CheatController());
  }

  // It seems like we were kinda loud on average
  game.masterGain.gain.value = 0.8;
}
