/**
 * Records a short video of a test scene, for looking at effects and animations
 * without playing the game. Needs a dev server running (`npm run dev-server`).
 *
 *   npm run clip -- [--scene fire|deaths|rig] [--seconds 6] [--fps 60]
 *     [--size 1280x720] [--dpr 1] [--crf 12] [--cycle 1] [--port 1234]
 *     [--out file.mp4] [--keep-frames] [--query "gun=ar-15&zoom=3"]
 *
 * The scene (`?scene=<scene>&auto`) has to play by itself and be an entity
 * with the id `<scene>TestScene` that counts its `cycles`.
 *
 * It's recorded a frame at a time rather than as a screen recording: the
 * game's own loop is stopped (`Game.manualFrames`), and each frame is run
 * (`Game.stepFrames`, at exactly `fps`), then screenshotted losslessly, so
 * the video has every frame, evenly spaced, however slowly the machine draws
 * them, and none of a screen recording's compression. Frames are
 * screenshots of the page, so the HTML over the canvas is in them too.
 *
 * Steps the game until the scene's `cycle` has begun, records `seconds` of
 * it at `size` (times `dpr`, the device pixel ratio: 2 is a retina display),
 * and writes an mp4 (H.264 at quality `crf`, lower is better, 0 lossless;
 * 4:2:0 so it plays anywhere) to `tests/output/<scene>.mp4` unless `--out`
 * says otherwise, and 12 of its frames side by side to `<out>-sheet.png`.
 * `--keep-frames` keeps the PNGs, in `<out>-frames/`.
 */
import { chromium } from "@playwright/test";
import { execFileSync } from "child_process";
import ffmpegPath from "ffmpeg-static";
import { cpSync, mkdirSync, mkdtempSync, rmSync } from "fs";
import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const scene = arg("scene", "fire");
const seconds = Number(arg("seconds", "6"));
const fps = Number(arg("fps", "60"));
const [width, height] = arg("size", "1280x720").split("x").map(Number);
const dpr = Number(arg("dpr", "1"));
const crf = arg("crf", "12");
const cycle = Number(arg("cycle", "1"));
const port = arg("port", "1234");
const out = arg("out", `tests/output/${scene}.mp4`);
const keepFrames = process.argv.includes("--keep-frames");
// More of the URL, like "profile=1&floor=wood"
const query = arg("query", "");

/** Frames run per round trip to the page while waiting for the cycle */
const WAIT_STEP = 10;

async function main() {
  const framesDir = mkdtempSync(path.join(tmpdir(), "highrise-clip-"));
  const browser = await chromium.launch({
    headless: false,
    args: ["--headless=new", "--ignore-gpu-blocklist", "--mute-audio"],
  });
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: dpr,
  });
  page.on("pageerror", (error) => console.error("pageerror:", error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      console.error(`console.${message.type()}:`, message.text());
    }
  });

  await page.goto(
    `http://localhost:${port}/?scene=${scene}&auto&seed=1${query ? `&${query}` : ""}`,
  );
  // Take over the game's loop as soon as there is one
  await page.waitForFunction(() => (window as any).DEBUG?.game, undefined, {
    timeout: 180000,
    polling: 20,
  });
  await page.evaluate((fps) => {
    const game = (window as any).DEBUG.game;
    game.refreshRateOverride = fps;
    game.manualFrames = true;
  }, fps);

  // Step until the cycle has begun. Real time goes by between steps, so
  // anything still loading (the preloader, fonts) gets to finish.
  const id = `${scene}TestScene`;
  const deadline = Date.now() + 180000;
  while (
    !(await page.evaluate(
      ({ id, cycle, steps }) => {
        // No named functions in here: tsx would wrap them in a helper the
        // page doesn't have
        const game = (window as any).DEBUG.game;
        for (let i = 0; i <= steps; i++) {
          if ((game.entities.getById(id)?.cycles ?? 0) >= cycle) {
            return true;
          }
          if (i < steps) {
            game.stepFrames(1);
          }
        }
        return false;
      },
      { id, cycle, steps: WAIT_STEP },
    ))
  ) {
    if (Date.now() > deadline) {
      throw new Error(`${id} never reached cycle ${cycle}`);
    }
    await page.waitForTimeout(5);
  }

  // Straight from Chrome, with the PNG compressed for speed rather than size
  const cdp = await page.context().newCDPSession(page);
  const frames = Math.round(seconds * fps);
  const started = Date.now();
  const writes: Promise<void>[] = [];
  for (let i = 0; i < frames; i++) {
    await page.evaluate(() => (window as any).DEBUG.game.stepFrames(1));
    const { data } = await cdp.send("Page.captureScreenshot", {
      format: "png",
      optimizeForSpeed: true,
      // Device pixels: without a clip it's CSS pixels whatever the dpr
      clip: { x: 0, y: 0, width, height, scale: dpr },
    });
    writes.push(
      writeFile(
        path.join(framesDir, `frame-${String(i).padStart(5, "0")}.png`),
        Buffer.from(data, "base64"),
      ),
    );
    if (i % fps === fps - 1) {
      process.stdout.write(`\r${i + 1}/${frames} frames`);
    }
  }
  await Promise.all(writes);
  console.log(
    `\r${frames} frames in ${((Date.now() - started) / 1000).toFixed(1)} s`,
  );
  await browser.close();

  mkdirSync(path.dirname(out), { recursive: true });
  execFileSync(
    ffmpegPath as unknown as string,
    [
      "-y",
      "-loglevel",
      "error",
      "-framerate",
      String(fps),
      "-i",
      path.join(framesDir, "frame-%05d.png"),
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-tune",
      "animation",
      "-crf",
      crf,
      "-pix_fmt",
      "yuv420p",
      // Even dimensions, which 4:2:0 needs
      "-vf",
      "pad=ceil(iw/2)*2:ceil(ih/2)*2",
      "-movflags",
      "+faststart",
      out,
    ],
    { stdio: "inherit" },
  );
  const base = out.replace(/\.mp4$/, "");
  if (keepFrames) {
    rmSync(`${base}-frames`, { recursive: true, force: true });
    cpSync(framesDir, `${base}-frames`, { recursive: true });
  }
  rmSync(framesDir, { recursive: true, force: true });

  // Frames side by side, for looking at it without playing it
  const sheet = `${base}-sheet.png`;
  execFileSync(
    ffmpegPath as unknown as string,
    [
      "-y",
      "-loglevel",
      "error",
      "-i",
      out,
      "-vf",
      `fps=${12 / seconds},scale=640:-1,tile=3x4`,
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
