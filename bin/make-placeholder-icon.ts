import { chromium } from "@playwright/test";
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

/*
 * Makes the desktop app's placeholder icon, electron/icon.png and
 * electron/icon.icns: a zombie reaching up out of a dark rounded square, drawn
 * in a browser. Replace both files with real art when there is some. Needs
 * macOS (sips and iconutil).
 *
 *   npx tsx bin/make-placeholder-icon.ts
 */

const ROOT = path.resolve(__dirname, "..");
const ZOMBIE = path.join(ROOT, "resources/images/zombies/zombie-1.png");
const OUT_PNG = path.join(ROOT, "electron/icon.png");
const OUT_ICNS = path.join(ROOT, "electron/icon.icns");

async function main() {
  const zombie = fs.readFileSync(ZOMBIE).toString("base64");
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1024, height: 1024 },
  });
  // macOS icons are a rounded square inset about 10% into the canvas
  await page.setContent(`
    <body style="margin:0;background:transparent">
      <div style="position:absolute;left:100px;top:100px;width:824px;height:824px;
        border-radius:185px;overflow:hidden;
        background:radial-gradient(circle at 50% 45%, #3b2b24 0%, #140e0c 70%);
        box-shadow:inset 0 0 0 6px rgba(255,255,255,0.06)">
        <img src="data:image/png;base64,${zombie}" style="position:absolute;
          left:92px;top:92px;width:640px;height:640px;transform:rotate(-90deg);
          filter:drop-shadow(0 18px 24px rgba(0,0,0,0.6))" />
      </div>
    </body>`);
  await page.screenshot({ path: OUT_PNG, omitBackground: true });
  await browser.close();

  const iconset = fs.mkdtempSync(path.join(os.tmpdir(), "highrise-icon-"));
  const iconsetDir = path.join(iconset, "icon.iconset");
  fs.mkdirSync(iconsetDir);
  for (const size of [16, 32, 128, 256, 512]) {
    for (const scale of [1, 2]) {
      const pixels = String(size * scale);
      const name = `icon_${size}x${size}${scale === 2 ? "@2x" : ""}.png`;
      execFileSync("sips", [
        "-z",
        pixels,
        pixels,
        OUT_PNG,
        "--out",
        path.join(iconsetDir, name),
      ]);
    }
  }
  execFileSync("iconutil", ["-c", "icns", iconsetDir, "-o", OUT_ICNS]);
  fs.rmSync(iconset, { recursive: true });
  console.log(`Wrote ${OUT_PNG} and ${OUT_ICNS}`);
}

main();
