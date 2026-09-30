import { Page, test } from "@playwright/test";
import * as fs from "fs";
import {
  captureProfile,
  collectIssues,
  expectNoIssues,
  measureFrames,
} from "./helpers";

/** How many zombies to measure with. `ENEMIES=100,400` picks others */
const COUNTS = (process.env.ENEMIES ?? "50,100,200,400,800")
  .split(",")
  .map(Number);
/** From sending the wave to measuring, for them to spread out and find the player */
const SETTLE_MS = 4000;
const MEASURE_MS = 4000;
const PROFILE_MS = 4000;

const URL =
  "/?scene=arena&seed=1&char=chad&wave=zombie*0&arrival=spread&layout=hall&god";

/**
 * How the game scales with the number of enemies: waves of more and more
 * zombies spread over the arena's hall, with the player standing in the middle
 * (and unable to die) while they notice and close in. Lighting and vision are
 * off, so what's left is the enemies' own cost. Run with `npm run
 * benchmark:enemies` (or `npm run benchmark`, with the others).
 *
 * Ticks are at a fixed 120 per second, but frames aren't (there's no vsync in
 * benchmarks), so the costs that matter are per tick for the simulation and
 * per frame for rendering. `frame60` puts them together: the CPU time a frame
 * takes at 60 fps (two ticks and a render), which has to stay under 16.7 ms.
 */
test("benchmark: enemy count scaling", async ({ page }) => {
  test.setTimeout(60000 + COUNTS.length * 60000);
  const issues = collectIssues(page);
  await page.goto(URL);
  await page.waitForFunction(
    () => window.DEBUG?.game?.entities.getById("arenaScene"),
    null,
    { timeout: 120000 },
  );
  await page.evaluate(() => {
    for (const entity of window.DEBUG.game!.entities.all) {
      const name = entity.constructor.name;
      if (name === "LightingManager" || name === "VisionController") {
        (entity as any).enabled = false;
      }
    }
  });

  const results = [];
  for (const count of COUNTS) {
    await sendWave(page, count);
    await page.waitForTimeout(SETTLE_MS);
    const frames = await measureFrames(page, MEASURE_MS);
    const report = await captureProfile(page, PROFILE_MS);
    const objectives = await countObjectives(page);
    results.push(summarize(count, frames, report.stats, objectives));
  }
  await page.evaluate(() =>
    (window.DEBUG.game!.entities.getById("arenaScene") as any).clear(),
  );

  fs.mkdirSync("tests/output", { recursive: true });
  fs.writeFileSync(
    "tests/output/enemies-benchmark.json",
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(formatTable(results));
  for (const result of results) {
    console.log(formatTop(result));
  }
  expectNoIssues(issues);
});

/** Clears the arena and sends `count` zombies, with the player back in the middle */
function sendWave(page: Page, count: number) {
  return page.evaluate((count) => {
    const scene = window.DEBUG.game!.entities.getById("arenaScene") as any;
    scene.clear();
    scene.spawnPlayer(scene.layout.playerStart);
    scene.config.wave = { Zombie: count };
    scene.sendWave();
  }, count);
}

/** How many enemy controllers are doing what, to know what the AI was busy with */
function countObjectives(page: Page) {
  return page.evaluate(() => {
    const counts: Record<string, number> = {};
    for (const entity of window.DEBUG.game!.entities.all) {
      if (entity.constructor.name === "SimpleEnemyController") {
        const objective = (entity as any).objective ?? "none";
        counts[objective] = (counts[objective] ?? 0) + 1;
      }
    }
    return counts;
  });
}

type Frames = Awaited<ReturnType<typeof measureFrames>>;
type Stat = Awaited<ReturnType<typeof captureProfile>>["stats"][number];

function summarize(
  count: number,
  frames: Frames,
  stats: Stat[],
  objectives: Record<string, number>,
) {
  const find = (label: string) =>
    stats.find((s) => s.label === `Game.nextFrame > ${label}`);
  const ms = (label: string) => find(label)?.msPerFrame ?? 0;
  // Ticks per frame, from how often the tick ran while profiling
  const ticksPerFrame = find("Game.tick")?.callsPerFrame || 1;
  const perTick = (label: string) => ms(label) / ticksPerFrame;

  const tickMs = perTick("Game.tick");
  const physicsMs = perTick("World.step");
  const renderMs = ms("Game.render");
  const seconds = MEASURE_MS / 1000;
  const round = (n: number, places = 3) =>
    Math.round(n * 10 ** places) / 10 ** places;

  // The biggest sections under the tick, physics and render, per tick or per frame
  const top = stats
    .filter((s) => s.depth >= 2 && s.msPerFrame > 0)
    .map((s) => {
      const label = s.label.replace("Game.nextFrame > ", "");
      const tickLike = /^(Game\.tick|World\.step)/.test(label);
      const value = tickLike ? s.msPerFrame / ticksPerFrame : s.msPerFrame;
      return {
        label,
        per: tickLike ? "tick" : "frame",
        ms: round(value),
        calls: round(
          tickLike ? s.callsPerFrame / ticksPerFrame : s.callsPerFrame,
          1,
        ),
      };
    })
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 25);

  return {
    count,
    enemies: Object.values(objectives).reduce((a, b) => a + b, 0),
    objectives,
    entities: frames.entities,
    bodies: frames.bodies,
    fps: round(frames.frames / seconds, 1),
    ticksPerSecond: round(frames.ticks / seconds, 1),
    loopCpuMs: frames.loopCpuMs,
    frameIntervalMs: frames.frameIntervalMs,
    tickMs: round(tickMs),
    physicsMs: round(physicsMs),
    renderMs: round(renderMs),
    frame60Ms: round(2 * (tickMs + physicsMs) + renderMs),
    top,
  };
}

type Result = ReturnType<typeof summarize>;

function formatTable(results: Result[]): string {
  const header =
    "zombies   fps  tick/t  phys/t  rend/f  frame60   µs/zombie@60  objectives";
  const rows = results.map((r) => {
    const perZombie = (1000 * r.frame60Ms) / Math.max(1, r.count);
    const objectives = Object.entries(r.objectives)
      .map(([name, n]) => `${name.toLowerCase()} ${n}`)
      .join(", ");
    return [
      String(r.count).padStart(7),
      r.fps.toFixed(0).padStart(5),
      r.tickMs.toFixed(2).padStart(7),
      r.physicsMs.toFixed(2).padStart(7),
      r.renderMs.toFixed(2).padStart(7),
      r.frame60Ms.toFixed(2).padStart(8),
      perZombie.toFixed(1).padStart(14),
      " " + objectives,
    ].join(" ");
  });
  return [
    "Costs in ms of CPU: tick and physics per tick, render per frame, frame60 = 2 ticks + a render",
    header,
    ...rows,
  ].join("\n");
}

function formatTop(result: Result, rows = 12): string {
  return [
    `\n${result.count} zombies, biggest sections:`,
    ...result.top
      .slice(0, rows)
      .map(
        (s) =>
          `${s.ms.toFixed(3).padStart(8)} ms/${s.per.padEnd(5)} ${String(s.calls).padStart(7)} calls  ${s.label}`,
      ),
  ].join("\n");
}
