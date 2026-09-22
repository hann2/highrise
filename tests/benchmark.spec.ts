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
const MEASURE_MS = 10000;
const PROFILE_MS = 8000;

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
  const wandering = wander(page, MEASURE_MS + PROFILE_MS);
  const summary = await measureFrames(page, MEASURE_MS);

  // Where the loop time goes. Measured separately because per-entity timing
  // adds a little overhead of its own, which would skew loopCpuMs.
  const profile = (await captureProfile(page, PROFILE_MS)).stats.map((s) => ({
    label: s.label.replace("Game.nextFrame > ", ""),
    depth: s.depth,
    msPerFrame: Math.round(s.msPerFrame * 1000) / 1000,
    callsPerFrame: Math.round(s.callsPerFrame * 100) / 100,
    maxMs: Math.round(s.maxMs * 100) / 100,
  }));
  await wandering;
  const result = { ...summary, profile };

  fs.mkdirSync("tests/output", { recursive: true });
  fs.writeFileSync(
    "tests/output/benchmark.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(summary, null, 2));
  console.log(formatProfile(profile));
  expectNoIssues(issues);
});

/** The top of the profile as an indented table, for reading in the terminal */
function formatProfile(
  profile: { label: string; depth: number; msPerFrame: number }[],
  minMs = 0.02,
): string {
  const frameMs = profile[0]?.msPerFrame ?? 0;
  const rows = profile
    .filter((s) => s.msPerFrame >= minMs)
    .map((s) => {
      const label = "  ".repeat(s.depth) + s.label.split(" > ").pop();
      const percent = frameMs
        ? ((100 * s.msPerFrame) / frameMs).toFixed(0)
        : "";
      return `${s.msPerFrame.toFixed(3).padStart(8)} ms ${percent.padStart(4)}%  ${label}`;
    });
  return ["ms/frame      %  section", ...rows].join("\n");
}
