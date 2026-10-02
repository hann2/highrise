import { Page, test } from "@playwright/test";
import * as fs from "fs";
import {
  captureProfile,
  collectIssues,
  DISPLAY,
  expectNoIssues,
  getResolution,
  measureFrames,
  useDisplay,
} from "./helpers";

test.use({ deviceScaleFactor: DISPLAY.deviceScaleFactor });

/**
 * The arena layout: `offices` (a real floor's wall density), or `sprawl` (the
 * same rooms sixteen times over, for how lighting holds up on a huge level).
 * `LAYOUT=sprawl` picks it
 */
const LAYOUT = process.env.LAYOUT ?? "offices";
/**
 * With `NEAR=1`, the fires only go in an area the offices' size around the
 * player, so a bigger layout has the same fires in view and only its size
 * differs: for what far walls cost
 */
const NEAR = process.env.NEAR === "1";
/**
 * How many fires to measure with, by default as many per square meter on
 * either layout (or on the area around the player). `FIRES=8,32` picks others
 */
const COUNTS = (
  process.env.FIRES ??
  (LAYOUT === "sprawl" && !NEAR ? "0,64,128,256,512" : "0,4,8,16,32")
)
  .split(",")
  .map(Number);
/**
 * With `DOORS=1`, a door in every doorway (the arena's `doors`), and each
 * count is also measured with every door being kicked open over and over, so
 * the static lights near them have to be drawn again
 */
const DOORS = process.env.DOORS === "1";
/** From lighting the fires to measuring, for them to spread and the smoke to build up */
const SETTLE_MS = 6000;
const MEASURE_MS = 4000;
const PROFILE_MS = 4000;

const URL = `/?scene=arena&seed=1&char=chad&wave=zombie*0&layout=${LAYOUT}&god&dark&fog&fps=120${DOORS ? "&doors" : ""}`;

/** Profiler sections worth showing on their own, wherever they are in the tree */
const SECTIONS = [
  "LightingManager.moving",
  "LightingManager.pack",
  "LightingManager.masks",
  "LightingManager.lights",
  "LightingManager.composite",
  "VisionController",
  "Renderer.render",
];

/**
 * How the game scales with fire: more and more molotov-sized pools of fire
 * that never go out (the arena's `fires` option), spread over the arena's
 * `offices` (rooms with doorways, as many walls near any spot as on a real
 * floor, which is what shadows cost by) or `LAYOUT`, dark and with fog of
 * war, as on a floor. The player stands in the middle with no enemies around.
 * For each count it measures the frames with everything on, then with lighting and vision off, which (since benchmarks
 * run without vsync, so frame intervals include GPU time) shows what they
 * cost the GPU as well as the CPU. Run with `npm run benchmark:fire` (or `npm
 * run benchmark`, with the others).
 */
test("benchmark: fire and lighting scaling", async ({ page }) => {
  test.setTimeout(60000 + COUNTS.length * 60000);
  const issues = collectIssues(page);
  await useDisplay(page);
  await page.goto(URL);
  await page.waitForFunction(
    () => window.DEBUG?.game?.entities.getById("arenaScene"),
    null,
    { timeout: 120000 },
  );

  const results = [];
  for (const count of COUNTS) {
    await setFires(page, count);
    await page.waitForTimeout(SETTLE_MS);
    const frames = await measureFrames(page, MEASURE_MS);
    // Totals without timing each entity, which would add to them, then which
    // entity class is which
    const totals = await captureProfile(page, PROFILE_MS, {
      entityDetail: false,
    });
    const detail = await captureProfile(page, PROFILE_MS);
    const counts = await countFireAndLights(page);
    await setLightingAndVision(page, false);
    const unlit = await measureFrames(page, MEASURE_MS);
    const unlitTotals = await captureProfile(page, PROFILE_MS, {
      entityDetail: false,
    });
    await setLightingAndVision(page, true);
    let swinging: Swinging | undefined;
    if (DOORS) {
      await kickDoors(page, true);
      await page.waitForTimeout(500);
      swinging = summarizeSwinging(
        await measureFrames(page, MEASURE_MS),
        await captureProfile(page, PROFILE_MS, { entityDetail: false }),
      );
      await kickDoors(page, false);
      // Shut again
      await page.waitForTimeout(3000);
    }
    results.push(
      summarize(
        count,
        frames,
        unlit,
        totals.stats,
        totals.gpu,
        unlitTotals.gpu,
        detail.stats,
        detail.gpu,
        counts,
        swinging,
      ),
    );
  }
  await setFires(page, 0);

  fs.mkdirSync("tests/output", { recursive: true });
  fs.writeFileSync(
    `tests/output/fire-benchmark${LAYOUT === "offices" ? "" : `-${LAYOUT}`}${NEAR ? "-near" : ""}${DOORS ? "-doors" : ""}${DISPLAY.suffix}.json`,
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(
    `Layout: ${LAYOUT}${NEAR ? ", fires near the player" : ""}${DOORS ? ", with doors" : ""}, ${results[0].casterShapes} shadow shapes, resolution ${await getResolution(page)}`,
  );
  console.log(formatTable(results));
  if (DOORS) {
    console.log(formatSwinging(results));
  }
  console.log(formatSections(results));
  for (const result of results) {
    console.log(formatGpuSections(result));
  }
  for (const result of results) {
    console.log(formatTop(result));
  }
  expectNoIssues(issues);
});

/** Puts out the fire and lights `count` fires, with the player back in the middle */
function setFires(page: Page, count: number) {
  return page.evaluate(
    ({ count, near }) => {
      const scene = window.DEBUG.game!.entities.getById("arenaScene") as any;
      if (near) {
        const [x, y] = scene.layout.playerStart;
        scene.fireArea = { x: x - 30, y: y - 20, width: 60, height: 40 };
      }
      scene.config.fires = count;
      scene.clear();
      scene.spawnPlayer(scene.layout.playerStart);
    },
    { count, near: NEAR },
  );
}

/**
 * Starts (or stops) kicking every door open, one way then the other, a few
 * times a second, so they never come to rest
 */
function kickDoors(page: Page, on: boolean) {
  return page.evaluate((on) => {
    const w = window as any;
    clearInterval(w.__doorKicks);
    if (!on) {
      return;
    }
    let way = 1;
    w.__doorKicks = setInterval(() => {
      way = -way;
      for (const entity of window.DEBUG.game!.entities.all) {
        if (entity.constructor.name === "Door") {
          const body = (entity as any).body;
          body.wakeUp();
          body.angularVelocity = way * 4;
        }
      }
    }, 400);
  }, on);
}

type Swinging = ReturnType<typeof summarizeSwinging>;

/** With the doors swinging: the frames, and the static lights drawn again */
function summarizeSwinging(
  frames: Awaited<ReturnType<typeof measureFrames>>,
  profile: Awaited<ReturnType<typeof captureProfile>>,
) {
  const section = profile.stats.find((s) =>
    s.label.endsWith("> LightingManager.static"),
  );
  const seconds = MEASURE_MS / 1000;
  return {
    fps: Math.round((frames.frames / seconds) * 10) / 10,
    frameIntervalMs: frames.frameIntervalMs.mean,
    loopCpuMs: frames.loopCpuMs.mean,
    staticMs: Math.round((section?.msPerFrame ?? 0) * 1000) / 1000,
    staticCalls: Math.round((section?.callsPerFrame ?? 0) * 100) / 100,
    gpuMs:
      Math.round(
        (profile.gpu.stats.find((s) => s.label === "Game.render")?.msPerFrame ??
          0) * 1000,
      ) / 1000,
  };
}

function setLightingAndVision(page: Page, enabled: boolean) {
  return page.evaluate((enabled) => {
    for (const entity of window.DEBUG.game!.entities.all) {
      const name = entity.constructor.name;
      if (name === "LightingManager" || name === "VisionController") {
        (entity as any).enabled = enabled;
      }
    }
  }, enabled);
}

/**
 * Burning cells, and lights: all of them, the ones in view (baked and drawn),
 * and how many shadow shapes the ones in view have on average
 */
function countFireAndLights(page: Page) {
  return page.evaluate(() => {
    const game = window.DEBUG.game!;
    let burning = 0;
    let lights = 0;
    let lightsInView = 0;
    let shadowedInView = 0;
    let shadowShapes = 0;
    let casterShapes = 0;
    for (const entity of game.entities.all) {
      const name = entity.constructor.name;
      if (name === "FireGrid") {
        burning = (entity as any).burningCount;
      } else if (name === "LightingManager") {
        const manager = entity as any;
        for (const body of manager.shadowCasters.bodies) {
          casterShapes += body.shapes.length;
        }
        const camera = game.camera;
        const [minX, minY] = camera.toWorld([0, 0] as any);
        const [maxX, maxY] = camera.toWorld(camera.getViewportSize());
        for (const light of manager.lights) {
          lights += 1;
          if (manager.shouldRenderLight(light, minX, minY, maxX, maxY)) {
            lightsInView += 1;
            if (light.shadowsEnabled) {
              shadowedInView += 1;
              shadowShapes += manager.countCasterShapes(light);
            }
          }
        }
      }
    }
    const shadowsPerLight =
      Math.round((10 * shadowShapes) / Math.max(1, shadowedInView)) / 10;
    return {
      burning,
      lights,
      lightsInView,
      shadowedInView,
      shadowsPerLight,
      casterShapes,
    };
  });
}

type Frames = Awaited<ReturnType<typeof measureFrames>>;
type Stat = Awaited<ReturnType<typeof captureProfile>>["stats"][number];
type GpuReport = Awaited<ReturnType<typeof captureProfile>>["gpu"];

function summarize(
  count: number,
  frames: Frames,
  unlit: Frames,
  stats: Stat[],
  gpu: GpuReport,
  unlitGpu: GpuReport,
  detailStats: Stat[],
  detailGpu: GpuReport,
  counts: Awaited<ReturnType<typeof countFireAndLights>>,
  swinging: Swinging | undefined,
) {
  const round = (n: number, places = 3) =>
    Math.round(n * 10 ** places) / 10 ** places;
  const find = (label: string) =>
    stats.find((s) => s.label === `Game.nextFrame > ${label}`);
  const ms = (label: string) => find(label)?.msPerFrame ?? 0;
  const ticksPerFrame = find("Game.tick")?.callsPerFrame || 1;
  const seconds = MEASURE_MS / 1000;

  // Each of `SECTIONS`, added up wherever it's nested, per frame
  const sections: Record<string, { ms: number; calls: number }> = {};
  for (const name of SECTIONS) {
    let total = 0;
    let calls = 0;
    for (const s of stats) {
      const last = s.label.split(" > ").pop()!;
      if (last === name || last.startsWith(name + ".")) {
        // Only the outermost, so nested ones (VisionController.*) aren't counted twice
        const parents = s.label.split(" > ").slice(0, -1);
        if (!parents.some((p) => p === name || p.startsWith(name + "."))) {
          total += s.msPerFrame;
          calls += s.callsPerFrame;
        }
      }
    }
    sections[name] = { ms: round(total), calls: round(calls, 1) };
  }

  const top = detailStats
    .filter((s) => s.depth >= 2 && s.msPerFrame > 0)
    .map((s) => ({
      label: s.label.replace("Game.nextFrame > ", ""),
      ms: round(s.msPerFrame),
      calls: round(s.callsPerFrame, 1),
    }))
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 25);

  return {
    count,
    ...counts,
    entities: frames.entities,
    fps: round(frames.frames / seconds, 1),
    unlitFps: round(unlit.frames / seconds, 1),
    frameIntervalMs: frames.frameIntervalMs,
    unlitFrameIntervalMs: unlit.frameIntervalMs,
    loopCpuMs: frames.loopCpuMs,
    unlitLoopCpuMs: unlit.loopCpuMs,
    tickMs: round(ms("Game.tick") / ticksPerFrame),
    renderMs: round(ms("Game.render")),
    fireTickMs: round(ms("Game.tick > fire") / ticksPerFrame),
    fireRenderMs: round(ms("Game.render > fire")),
    sections,
    // GPU ms per frame for the whole render, with and without lighting and
    // vision. Timing sections of it separately is unreliable (see
    // GpuProfiler), so their cost is the difference.
    gpuMs: round(renderGpuMs(gpu)),
    unlitGpuMs: round(renderGpuMs(unlitGpu)),
    top,
    swinging,
    // The GPU's time per section, in drawing order, from timing them all
    // separately, which adds to them (see GpuProfiler): for comparing
    // sections with each other
    gpuSections: detailGpu.stats
      .filter((s) => s.msPerFrame >= 0.01)
      .map((s) => ({
        label: s.label,
        depth: s.depth,
        ms: round(s.msPerFrame),
        selfMs: round(s.selfMs),
      })),
  };
}

function renderGpuMs(report: GpuReport): number {
  return report.stats.find((s) => s.label === "Game.render")?.msPerFrame ?? 0;
}

type Result = ReturnType<typeof summarize>;

function formatTable(results: Result[]): string {
  const header =
    "fires  burning  lights  in view  shadows/l   fps  interval  cpu/f  gpu/f   unlit: fps  interval  cpu/f  gpu/f   tick/t  rend/f  fire t/r";
  const rows = results.map((r) =>
    [
      String(r.count).padStart(5),
      String(r.burning).padStart(8),
      String(r.lights).padStart(7),
      String(r.lightsInView).padStart(8),
      r.shadowsPerLight.toFixed(1).padStart(10),
      r.fps.toFixed(0).padStart(5),
      r.frameIntervalMs.mean.toFixed(2).padStart(9),
      r.loopCpuMs.mean.toFixed(2).padStart(6),
      r.gpuMs.toFixed(2).padStart(6),
      r.unlitFps.toFixed(0).padStart(11),
      r.unlitFrameIntervalMs.mean.toFixed(2).padStart(9),
      r.unlitLoopCpuMs.mean.toFixed(2).padStart(6),
      r.unlitGpuMs.toFixed(2).padStart(6),
      r.tickMs.toFixed(2).padStart(8),
      r.renderMs.toFixed(2).padStart(7),
      `${r.fireTickMs.toFixed(2)}/${r.fireRenderMs.toFixed(2)}`.padStart(10),
    ].join(" "),
  );
  return [
    "Interval = mean ms between frames (GPU included, no vsync), cpu/f = ms of CPU per frame, gpu/f = ms of GPU per frame (the render, an upper bound); shadows/l = shadow shapes per light in view; unlit = lighting and vision off",
    header,
    ...rows,
  ].join("\n");
}

/** With the doors swinging, against at rest */
function formatSwinging(results: Result[]): string {
  const header =
    "fires   at rest: fps  interval  cpu/f   swinging: fps  interval  cpu/f  gpu/f   static lights drawn: ms/f  frames drawing them";
  const rows = results.map((r) => {
    const s = r.swinging!;
    return [
      String(r.count).padStart(5),
      r.fps.toFixed(0).padStart(13),
      r.frameIntervalMs.mean.toFixed(2).padStart(9),
      r.loopCpuMs.mean.toFixed(2).padStart(6),
      s.fps.toFixed(0).padStart(14),
      s.frameIntervalMs.toFixed(2).padStart(9),
      s.loopCpuMs.toFixed(2).padStart(6),
      s.gpuMs.toFixed(2).padStart(6),
      s.staticMs.toFixed(3).padStart(27),
      `${Math.round(s.staticCalls * 100)}%`.padStart(20),
    ].join(" ");
  });
  return [
    "\nDoors swinging (kicked open every 0.4 s), against at rest; static lights drawn = LightingManager.static, the CPU drawing static lights again",
    header,
    ...rows,
  ].join("\n");
}

/** The lighting sections, in ms per frame (and calls per frame) */
function formatSections(results: Result[]): string {
  const header = ["fires", ...SECTIONS.map((n) => n.padStart(26))].join(" ");
  const rows = results.map((r) =>
    [
      String(r.count).padStart(5),
      ...SECTIONS.map((name) => {
        const s = r.sections[name];
        return `${s.ms.toFixed(2)} (${s.calls})`.padStart(26);
      }),
    ].join(" "),
  );
  return [
    "\nLighting sections, without per-entity timing: ms per frame (calls per frame)",
    header,
    ...rows,
  ].join("\n");
}

/** The GPU's time per section, as a tree, timed separately (so inflated) */
function formatGpuSections(result: Result): string {
  return [
    `\n${result.count} fires, GPU ms per frame by section (each timed separately, which adds to them; total ${result.gpuMs.toFixed(2)} timed alone):`,
    ...result.gpuSections.map(
      (s) =>
        `${s.ms.toFixed(3).padStart(8)} ms  ${"  ".repeat(s.depth)}${s.label.split(" > ").pop()}`,
    ),
  ].join("\n");
}

function formatTop(result: Result, rows = 12): string {
  return [
    `\n${result.count} fires, biggest sections (ms per frame, with per-entity timing):`,
    ...result.top
      .slice(0, rows)
      .map(
        (s) =>
          `${s.ms.toFixed(3).padStart(8)} ms ${String(s.calls).padStart(7)} calls  ${s.label}`,
      ),
  ].join("\n");
}
