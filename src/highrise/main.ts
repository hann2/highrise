import { initContactMaterials } from "../config/PhysicsMaterials";
import AutoPauser from "../core/AutoPauser";
import Game from "../core/Game";
import { SpatialHashingBroadphase } from "../core/physics/collision/broadphase/SpatialHashingBroadphase";
import { World } from "../core/physics/world/World";
import PositionalSoundListener from "../core/sound/PositionalSoundListener";
import { profiler } from "../core/util/Profiler";
import { seedRandom } from "../core/util/Random";
import { createLeanPanel } from "../core/util/stats-overlay/LeanPanel";
import { createProfilerPanel } from "../core/util/stats-overlay/ProfilerPanel";
import { createRenderPanel } from "../core/util/stats-overlay/RenderPanel";
import { StatsOverlay } from "../core/util/stats-overlay/StatsOverlay";
import { CELL_SIZE, DEFAULT_LEVEL_SIZE } from "./constants/constants";
import CheatController from "./controllers/CheatController";
import { GameController } from "./controllers/GameController";
import { GraphicsQualityController } from "./controllers/GraphicsQualityController";
import MusicController from "./controllers/MusicController";
import VolumeController from "./controllers/VolumeController";
import FireTestScene from "./fire/FireTestScene";
import { isHuman } from "./human/Human";
import { loadSaveData } from "./persistence/SaveData";
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
  await preloader.waitTillReady();
  preloader.destroy();

  // Add some filters for fast lookup of certain entities later
  // Think of these like indexes in a DB
  game.entities.addFilter(isHuman);

  game.addEntity(new AutoPauser(loadSaveData().autoPause));
  game.addEntity(new VolumeController());
  game.addEntity(new MusicController());
  game.addEntity(new PositionalSoundListener());
  game.addEntity(new GraphicsQualityController());
  game.addEntity(new GameController());
  // Backslash cycles the stats panels; ?profile=1 starts with the profiler one
  game.addEntity(
    new StatsOverlay(
      [createLeanPanel(), createProfilerPanel(), createRenderPanel()],
      params.has("profile") ? "profiler" : undefined,
    ),
  );

  if (process.env.NODE_ENV === "development") {
    game.addEntity(new CheatController());
  }

  // ?scene=fire (development only) skips the menus for a fire test scene
  if (
    process.env.NODE_ENV === "development" &&
    params.get("scene") === "fire"
  ) {
    game.addEntity(new FireTestScene());
    return;
  }

  game.dispatch("goToLobby", { showTitle: true });

  game.renderer.requestFullscreen();
}
