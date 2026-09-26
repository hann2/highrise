/**
 * Records a short video of a test scene, for looking at effects without
 * playing the game. Needs a dev server running (`npm run dev-server`).
 *
 *   npm run clip -- [--scene fire] [--seconds 6] [--port 1234] [--out file.mp4]
 *     [--query "profile=1&fireLights=cells"]
 *
 * Waits for the scene's second cycle (so the first-time costs of compiling
 * shaders and loading are out of the way), records `seconds` of it at
 * 1280×720, and writes an mp4 (H.264, so it plays anywhere) to
 * `tests/output/<scene>.mp4` unless `--out` says otherwise, and 12 of its
 * frames side by side to `<out>-sheet.png`.
 */
import { chromium } from "@playwright/test";
import { execFileSync } from "child_process";
import ffmpegPath from "ffmpeg-static";
import { mkdirSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const scene = arg("scene", "fire");
const seconds = Number(arg("seconds", "6"));
const port = arg("port", "1234");
const out = arg("out", `tests/output/${scene}.mp4`);
// More of the URL, like "profile=1&fireLights=cells"
const query = arg("query", "");

async function main() {
  const videoDir = mkdtempSync(path.join(tmpdir(), "highrise-clip-"));
  const browser = await chromium.launch({
    headless: false,
    args: ["--headless=new", "--ignore-gpu-blocklist", "--mute-audio"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  const recordingStart = Date.now();
  page.on("pageerror", (error) => console.error("pageerror:", error.message));

  await page.goto(
    `http://localhost:${port}/?scene=${scene}&seed=1${query ? `&${query}` : ""}`,
  );
  // The start of the second cycle
  await page.waitForFunction(
    () =>
      ((window as any).DEBUG?.game?.entities.getById("fireTestScene") as any)
        ?.cycles >= 2,
    null,
    { timeout: 180000, polling: 50 },
  );
  const clipStart = (Date.now() - recordingStart) / 1000;
  await page.waitForTimeout(seconds * 1000);
  await context.close();
  await browser.close();

  const video = await page.video()!.path();
  mkdirSync(path.dirname(out), { recursive: true });
  execFileSync(
    ffmpegPath as unknown as string,
    [
      "-y",
      "-loglevel",
      "error",
      "-ss",
      String(clipStart),
      "-i",
      video,
      "-t",
      String(seconds),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "20",
      "-movflags",
      "+faststart",
      out,
    ],
    { stdio: "inherit" },
  );
  rmSync(videoDir, { recursive: true, force: true });

  // Frames side by side, for looking at it without playing it
  const sheet = out.replace(/\.mp4$/, "") + "-sheet.png";
  const fps = 12 / seconds;
  execFileSync(
    ffmpegPath as unknown as string,
    [
      "-y",
      "-loglevel",
      "error",
      "-i",
      out,
      "-vf",
      `fps=${fps},scale=640:-1,tile=3x4`,
      "-frames:v",
      "1",
      sheet,
    ],
    { stdio: "inherit" },
  );
  console.log(`Wrote ${out} and ${sheet}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
