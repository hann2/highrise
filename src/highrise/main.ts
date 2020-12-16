import AutoPauser from "../core/AutoPauser";
import Game from "../core/Game";
import CustomWorld from "../core/physics/CustomWorld";
import SpatialHashingBroadphase from "../core/physics/SpatialHashingBroadphase";
import PositionalSoundListener from "../core/sound/PositionalSoundListener";
import FPSMeter from "../core/util/FPSMeter";
import ResizeListener from "../core/util/ResizeListener";
import {
  CELL_WIDTH,
  LEVEL_SIZE,
} from "./levels/level-generation/levelGeneration";
import CameraController from "./controllers/CameraController";
import CheatController from "./controllers/CheatController";
import LevelController from "./controllers/LevelController";
import { isHuman } from "./human/Human";
import PartyManager from "./environment/PartyManager";
import { initLayers, Layers } from "./config/layers";
import LightingManager from "./lighting-and-vision/LightingManager";
import MainMenu from "./menu/MainMenu";
import MusicController from "./controllers/MusicController";
import { initContactMaterials } from "./config/PhysicsMaterials";
import Preloader from "./preloader/Preloader";
import VolumeController from "./controllers/VolumeController";

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
  game.addEntity(new ResizeListener());
  game.addEntity(new VolumeController());
  game.addEntity(new MusicController());
  game.addEntity(new LevelController());
  game.addEntity(new PartyManager());
  game.addEntity(new CameraController(game.camera));
  game.addEntity(new PositionalSoundListener());
  game.addEntity(new LightingManager());
  game.addEntity(new MainMenu());

  if (process.env.NODE_ENV === "development") {
    game.addEntity(new FPSMeter(Layers.MENU));
    game.addEntity(new CheatController());
  }
}
