import { test } from "@playwright/test";
import * as fs from "fs";
import {
  captureProfile,
  collectIssues,
  expectNoIssues,
  loadGame,
  measureFrames,
  startGame,
  wander,
} from "./helpers";

const WARMUP_MS = 3000;
const MEASURE_MS = 6000;
const PROFILE_MS = 6000;

/**
 * How much the lighting and vision systems cost, measured by turning them
 * off. Frame intervals include GPU time (benchmarks run without vsync), which
 * the CPU profiler can't see. Run with `npm run benchmark`.
 */
test("benchmark: lighting and vision cost", async ({ page }) => {
  const issues = collectIssues(page);
  await loadGame(page, 424242);
  await startGame(page);
  await page.waitForTimeout(WARMUP_MS);

  const setEnabled = (lighting: boolean, vision: boolean) =>
    page.evaluate(
      ([lighting, vision]) => {
        const game = window.DEBUG.game!;
        for (const entity of game.entities.all) {
          const name = entity.constructor.name;
          if (name === "LightingManager") {
            (entity as any).enabled = lighting;
          } else if (name === "VisionController") {
            (entity as any).enabled = vision;
          }
        }
      },
      [lighting, vision],
    );

  const variants = [
    { name: "full", lighting: true, vision: true },
    { name: "noVision", lighting: true, vision: false },
    { name: "noLighting", lighting: false, vision: true },
    { name: "neither", lighting: false, vision: false },
  ];

  const results: Record<string, unknown> = {};
  for (const variant of variants) {
    await setEnabled(variant.lighting, variant.vision);
    const wandering = wander(page, MEASURE_MS);
    results[variant.name] = await measureFrames(page, MEASURE_MS);
    await wandering;
  }
  await setEnabled(true, true);

  // The CPU side in detail, with the lighting sections nested under the
  // entities that call them
  const wandering = wander(page, PROFILE_MS);
  const profile = (await captureProfile(page, PROFILE_MS)).stats
    .filter(
      (s) =>
        /Light|Shadow|Vision|Renderer\.render|Game\.render|Game\.nextFrame/.test(
          s.label,
        ) && s.msPerFrame >= 0.005,
    )
    .map((s) => ({
      label: s.label.replace("Game.nextFrame > ", ""),
      depth: s.depth,
      msPerFrame: Math.round(s.msPerFrame * 1000) / 1000,
      callsPerFrame: Math.round(s.callsPerFrame * 100) / 100,
      maxMs: Math.round(s.maxMs * 100) / 100,
    }));
  await wandering;

  fs.mkdirSync("tests/output", { recursive: true });
  fs.writeFileSync(
    "tests/output/lighting-benchmark.json",
    JSON.stringify({ variants: results, profile }, null, 2) + "\n",
  );

  const rows = Object.entries(results).map(([name, r]: [string, any]) => {
    const f = r.frameIntervalMs;
    const c = r.loopCpuMs;
    return `${name.padEnd(12)} frame mean ${f.mean.toFixed(2).padStart(6)}  p95 ${f.p95.toFixed(2).padStart(6)}   loop cpu mean ${c.mean.toFixed(2).padStart(5)}  p95 ${c.p95.toFixed(2).padStart(5)}`;
  });
  console.log(rows.join("\n"));
  console.log(
    profile
      .map(
        (s) =>
          `${s.msPerFrame.toFixed(3).padStart(8)} ms  ${s.callsPerFrame.toFixed(1).padStart(5)}/f  ${"  ".repeat(s.depth)}${s.label.split(" > ").pop()}`,
      )
      .join("\n"),
  );
  expectNoIssues(issues);
});
