import { initContactMaterials } from "../config/PhysicsMaterials";
import AutoPauser from "../core/AutoPauser";
import { desktop } from "../core/desktop";
import Game from "../core/Game";
import { SpatialHashingBroadphase } from "../core/physics/collision/broadphase/SpatialHashingBroadphase";
import { World } from "../core/physics/world/World";
import PositionalSoundListener from "../core/sound/PositionalSoundListener";
import { gpuProfiler } from "../core/util/GpuProfiler";
import { profiler } from "../core/util/Profiler";
import { seedRandom } from "../core/util/Random";
import { createLeanPanel } from "../core/util/stats-overlay/LeanPanel";
import { createProfilerPanel } from "../core/util/stats-overlay/ProfilerPanel";
import { createRenderPanel } from "../core/util/stats-overlay/RenderPanel";
import { StatsOverlay } from "../core/util/stats-overlay/StatsOverlay";
import { CELL_SIZE, DEFAULT_LEVEL_SIZE } from "./constants/constants";
import CheatController from "./controllers/CheatController";
import { GameController } from "./controllers/GameController";
import MusicController from "./controllers/MusicController";
import VolumeController from "./controllers/VolumeController";
import ArenaScene from "./arena/ArenaScene";
import FireTestScene from "./fire/FireTestScene";
import DeathsTestScene from "./enemies/remains/DeathsTestScene";
import RigTestScene from "./rig/RigTestScene";
import { isHuman } from "./human/Human";
import { getStartingCharacter } from "./lobby/Lobby";
import { generateRunPlan } from "./run/RunPlan";
import { CHARACTERS } from "./characters/Character";
import { clamp } from "../core/util/MathUtil";
import { antialiasFor, loadSettings } from "./settings/settings";
import SettingsController, { getSetting } from "./settings/SettingsController";
import { createFpsPanel } from "../core/util/stats-overlay/FpsPanel";
import Preloader from "./preloader/Preloader";

declare global {
  interface Window {
    DEBUG: {
      game?: Game;
      profiler?: typeof profiler;
      gpuProfiler?: typeof gpuProfiler;
    };
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
  // ?fps=120 runs as if the display were 120 Hz, every animation frame one of
  // its refreshes, for benchmarks, which run without vsync: as fast as the game
  // can go, each frame 1/120 s of game time (see `refreshRateOverride`)
  const fps = parseInt(params.get("fps") ?? "", 10);
  if (fps > 0) {
    game.refreshRateOverride = fps;
  }

  window.DEBUG = { game, profiler, gpuProfiler };
  // The player's antialiasing setting, unless ?aa=0 or ?aa=1 turns it off or on
  const aa = params.get("aa");
  await game.init({
    rendererOptions: {
      antialias:
        aa != null ? aa !== "0" : antialiasFor(loadSettings().antialias),
    },
  });

  const preloader = game.addEntity(new Preloader());
  await preloader.waitTillReady();
  preloader.destroy();

  // Add some filters for fast lookup of certain entities later
  // Think of these like indexes in a DB
  game.entities.addFilter(isHuman);

  // First, so that everything after can read the settings
  game.addEntity(new SettingsController());
  game.addEntity(new AutoPauser(getSetting(game, "autoPause")));
  game.addEntity(new VolumeController());
  // The arena is for testing, and the music gets in the way of hearing things
  if (params.get("scene") !== "arena") {
    game.addEntity(new MusicController());
  }
  game.addEntity(new PositionalSoundListener());
  game.addEntity(new GameController());
  // Backslash cycles the stats panels; ?profile=1 starts with the profiler
  // one, else the Show FPS setting starts it on the frame rate
  game.addEntity(
    new StatsOverlay(
      [
        createFpsPanel(),
        createLeanPanel(),
        createProfilerPanel(),
        createRenderPanel(),
      ],
      params.has("profile")
        ? "profiler"
        : getSetting(game, "showFps")
          ? "fps"
          : undefined,
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

  // ?scene=deaths (development only) is for looking at how zombies die
  if (
    process.env.NODE_ENV === "development" &&
    params.get("scene") === "deaths"
  ) {
    game.addEntity(new DeathsTestScene());
    return;
  }

  // ?scene=rig (development only) is for looking at how humans are animated
  if (process.env.NODE_ENV === "development" && params.get("scene") === "rig") {
    game.addEntity(new RigTestScene());
    return;
  }

  // ?scene=arena (development only) is for trying loadouts against enemies
  if (
    process.env.NODE_ENV === "development" &&
    params.get("scene") === "arena"
  ) {
    game.addEntity(new ArenaScene());
    return;
  }

  // ?play (development only) skips the title and lobby and starts a run.
  // ?play=Chad picks the character (else whoever was played last), and
  // ?floor=5 starts on that floor (else floor 1); ?floor=0 plays the tutorial
  if (process.env.NODE_ENV === "development" && params.has("play")) {
    const name = params.get("play")?.toLowerCase();
    const character =
      CHARACTERS.find((c) => c.name.toLowerCase() === name) ??
      getStartingCharacter();
    const plan = generateRunPlan();
    const floor = parseInt(params.get("floor") ?? "1", 10);
    const startFloor = clamp(isNaN(floor) ? 1 : floor, 0, plan.length);
    if (startFloor === 0) {
      game.dispatch("startTutorial", undefined);
    } else {
      game.dispatch("newGame", { character, plan, startFloor });
    }
    return;
  }

  game.dispatch("goToLobby", { from: "boot" });

  if (desktop?.smoke) {
    // The desktop app's smoke test (electron/main.ts) waits for this
    console.info("[smoke] title-ok");
  }
  // The desktop app has a real fullscreen window instead, which Escape doesn't leave
  if (!desktop) {
    game.renderer.requestFullscreen();
  }
}
