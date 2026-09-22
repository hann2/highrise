import { Layer } from "../config/layers";
import { initContactMaterials } from "../config/PhysicsMaterials";
import AutoPauser from "../core/AutoPauser";
import Game from "../core/Game";
import { SpatialHashingBroadphase } from "../core/physics/collision/broadphase/SpatialHashingBroadphase";
import { World } from "../core/physics/world/World";
import PositionalSoundListener from "../core/sound/PositionalSoundListener";
import FPSMeter from "../core/util/FPSMeter";
import { profiler } from "../core/util/Profiler";
import ProfilerOverlay from "../core/util/ProfilerOverlay";
import { seedRandom } from "../core/util/Random";
import { CELL_SIZE, DEFAULT_LEVEL_SIZE } from "./constants/constants";
import CheatController from "./controllers/CheatController";
import { StatsOverlayController } from "./controllers/StatsOverlayController";
import { GameController } from "./controllers/GameController";
import { GraphicsQualityController } from "./controllers/GraphicsQualityController";
import MusicController from "./controllers/MusicController";
import VolumeController from "./controllers/VolumeController";
import { isHuman } from "./human/Human";
import Preloader from "./preloader/Preloader";

declare global {
  interface Window {
    DEBUG: { game?: Game; profiler?: typeof profiler };
  }
}

export async function main() {
  await new Promise((resolve) => window.addEventListener("load", resolve));

  const params = new URLSearchParams(window.location.search);
  // Allow reproducible runs (mostly for tests and benchmarks) with ?seed=123
  const seed = params.get("seed");
  if (seed != null) {
    seedRandom(parseInt(seed, 10));
  }

  const game = new Game({
    ticksPerSecond: 60,
    world: new World({
      // Needed for contact friction to be based on how hard things are pressed together
      solverConfig: { frictionIterations: 2 },
      broadphase: new SpatialHashingBroadphase({
        cellSize: CELL_SIZE / 2,
        width: DEFAULT_LEVEL_SIZE * 2,
        height: DEFAULT_LEVEL_SIZE * 2,
      }),
    }),
  });
  initContactMaterials(game);

  window.DEBUG = { game, profiler };
  await game.init();

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
  game.addEntity(new FPSMeter(Layer.MENU));
  game.addEntity(new ProfilerOverlay(Layer.MENU));
  // ?profile=1 starts with the profiler breakdown on screen
  game.addEntity(
    new StatsOverlayController(params.has("profile") ? "profiler" : "off"),
  );

  if (process.env.NODE_ENV === "development") {
    game.addEntity(new CheatController());
  }

  game.dispatch("goToMainMenu", undefined);

  game.renderer.requestFullscreen();
}
