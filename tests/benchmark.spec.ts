import { test } from "@playwright/test";
import * as fs from "fs";
import { collectIssues, expectNoIssues, loadGame, startGame } from "./helpers";

const WARMUP_MS = 3000;
const MEASURE_MS = 10000;

/**
 * Measures frame times for a fixed seeded scenario. Run with `npm run benchmark`.
 * Numbers are only comparable when taken on the same machine.
 */
test("benchmark: seeded level frame times", async ({ page }) => {
  const issues = collectIssues(page);
  await loadGame(page, 424242);
  await startGame(page);
  await page.waitForTimeout(WARMUP_MS);

  // Wander around while measuring so that lighting and AI have work to do
  const wander = (async () => {
    const keys = ["KeyD", "KeyS", "KeyA", "KeyW"];
    const end = Date.now() + MEASURE_MS;
    for (let i = 0; Date.now() < end; i++) {
      const key = keys[i % keys.length];
      await page.keyboard.down(key);
      await page.waitForTimeout(500);
      await page.keyboard.up(key);
    }
  })();

  const result = await page.evaluate(async (measureMs) => {
    const game = window.DEBUG.game!;
    const frameTimes: number[] = [];
    // Frame intervals are capped by vsync, so also measure the CPU time spent
    // inside the game loop, which is the number that actually matters.
    const loopTimes: number[] = [];
    const originalLoop = (game as any).loop;
    (game as any).loop = function (...args: unknown[]) {
      const loopStart = performance.now();
      originalLoop.apply(this, args);
      loopTimes.push(performance.now() - loopStart);
    };
    const startTick = game.ticknumber;
    const start = performance.now();
    let last = start;
    await new Promise<void>((resolve) => {
      const frame = (now: number) => {
        frameTimes.push(now - last);
        last = now;
        if (now - start < measureMs) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(frame);
    });
    (game as any).loop = originalLoop;
    const round = (n: number) => Math.round(n * 100) / 100;
    const summarize = (times: number[]) => {
      times.sort((a, b) => a - b);
      const percentile = (p: number) =>
        times[Math.min(times.length - 1, Math.floor(times.length * p))];
      return {
        mean: round(times.reduce((a, b) => a + b, 0) / times.length),
        p50: round(percentile(0.5)),
        p95: round(percentile(0.95)),
        p99: round(percentile(0.99)),
        max: round(times[times.length - 1]),
      };
    };
    return {
      frames: frameTimes.length,
      ticks: game.ticknumber - startTick,
      loopCpuMs: summarize(loopTimes),
      frameIntervalMs: summarize(frameTimes),
      entities: game.entities.all.size,
      bodies: game.world.bodies.length,
    };
  }, MEASURE_MS);
  await wander;

  fs.mkdirSync("tests/output", { recursive: true });
  fs.writeFileSync(
    "tests/output/benchmark.json",
    JSON.stringify(result, null, 2) + "\n"
  );
  console.log(JSON.stringify(result, null, 2));
  expectNoIssues(issues);
});
