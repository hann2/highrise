import { Page, test } from "@playwright/test";
import * as fs from "fs";
import {
  captureProfile,
  collectIssues,
  expectNoIssues,
  measureFrames,
} from "./helpers";

/** How many fires to measure with. `FIRES=8,32` picks others */
const COUNTS = (process.env.FIRES ?? "0,4,8,16,32").split(",").map(Number);
/** From lighting the fires to measuring, for them to spread and the smoke to build up */
const SETTLE_MS = 6000;
const MEASURE_MS = 4000;
const PROFILE_MS = 4000;

const URL =
  "/?scene=arena&seed=1&char=chad&wave=zombie*0&layout=offices&god&dark&fog&fps=120";

/** Profiler sections worth showing on their own, wherever they are in the tree */
const SECTIONS = [
  "Light.bake",
  "Shadows.renderMask",
  "LightingManager.composite",
  "VisionController",
  "Renderer.render",
];

/**
 * How the game scales with fire: more and more molotov-sized pools of fire
 * that never go out (the arena's `fires` option), spread over the arena's
 * `offices` (rooms with doorways, as many walls near any spot as on a real
 * floor, which is what shadows cost by), dark and with fog of war, as on a
 * floor. The player stands in the middle with no enemies around. For each count it measures the frames with
 * everything on, then with lighting and vision off, which (since benchmarks
 * run without vsync, so frame intervals include GPU time) shows what they
 * cost the GPU as well as the CPU. Run with `npm run benchmark:fire` (or `npm
 * run benchmark`, with the others).
 */
test("benchmark: fire and lighting scaling", async ({ page }) => {
  test.setTimeout(60000 + COUNTS.length * 60000);
  const issues = collectIssues(page);
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
    await setLightingAndVision(page, true);
    results.push(
      summarize(count, frames, unlit, totals.stats, detail.stats, counts),
    );
  }
  await setFires(page, 0);

  fs.mkdirSync("tests/output", { recursive: true });
  fs.writeFileSync(
    "tests/output/fire-benchmark.json",
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(formatTable(results));
  console.log(formatSections(results));
  for (const result of results) {
    console.log(formatTop(result));
  }
  expectNoIssues(issues);
});

/** Puts out the fire and lights `count` fires, with the player back in the middle */
function setFires(page: Page, count: number) {
  return page.evaluate((count) => {
    const scene = window.DEBUG.game!.entities.getById("arenaScene") as any;
    scene.config.fires = count;
    scene.clear();
    scene.spawnPlayer(scene.layout.playerStart);
  }, count);
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
    for (const entity of game.entities.all) {
      const name = entity.constructor.name;
      if (name === "FireGrid") {
        burning = (entity as any).burningCount;
      } else if (name === "LightingManager") {
        const manager = entity as any;
        const camera = game.camera;
        const [minX, minY] = camera.toWorld([0, 0] as any);
        const [maxX, maxY] = camera.toWorld(camera.getViewportSize());
        for (const light of manager.lights) {
          lights += 1;
          if (manager.shouldRenderLight(light, minX, minY, maxX, maxY)) {
            lightsInView += 1;
            if (light.shadows) {
              shadowedInView += 1;
              shadowShapes += light.shadows.countCasterShapes();
            }
          }
        }
      }
    }
    const shadowsPerLight =
      Math.round((10 * shadowShapes) / Math.max(1, shadowedInView)) / 10;
    return { burning, lights, lightsInView, shadowedInView, shadowsPerLight };
  });
}

type Frames = Awaited<ReturnType<typeof measureFrames>>;
type Stat = Awaited<ReturnType<typeof captureProfile>>["stats"][number];

function summarize(
  count: number,
  frames: Frames,
  unlit: Frames,
  stats: Stat[],
  detailStats: Stat[],
  counts: Awaited<ReturnType<typeof countFireAndLights>>,
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
    top,
  };
}

type Result = ReturnType<typeof summarize>;

function formatTable(results: Result[]): string {
  const header =
    "fires  burning  lights  in view  shadows/l   fps  interval  cpu/f   unlit: fps  interval  cpu/f   tick/t  rend/f  fire t/r";
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
      r.unlitFps.toFixed(0).padStart(11),
      r.unlitFrameIntervalMs.mean.toFixed(2).padStart(9),
      r.unlitLoopCpuMs.mean.toFixed(2).padStart(6),
      r.tickMs.toFixed(2).padStart(8),
      r.renderMs.toFixed(2).padStart(7),
      `${r.fireTickMs.toFixed(2)}/${r.fireRenderMs.toFixed(2)}`.padStart(10),
    ].join(" "),
  );
  return [
    "Interval = mean ms between frames (GPU included, no vsync), cpu/f = ms of CPU per frame; shadows/l = shadow shapes per light in view; unlit = lighting and vision off",
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
