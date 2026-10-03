import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

/*
 * Renders SVGs to PNGs at the SVGs' own size, with transparent backgrounds,
 * in a browser (so filters and the like come out as they do there). For art
 * drawn as SVG in assets/source:
 *
 *   npx tsx bin/render-svg.ts --out resources/images/weapons/magazines assets/source/magazines/*.svg
 */

async function main() {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf("--out");
  if (outIndex < 0) {
    throw new Error("Usage: render-svg.ts --out <folder> <file.svg>...");
  }
  const out = args[outIndex + 1];
  const files = args.filter((_, i) => i !== outIndex && i !== outIndex + 1);
  fs.mkdirSync(out, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const file of files) {
    const svg = fs.readFileSync(file, "utf8");
    const width = Number(svg.match(/width="([0-9.]+)"/)?.[1]);
    const height = Number(svg.match(/height="([0-9.]+)"/)?.[1]);
    await page.setViewportSize({ width, height });
    await page.setContent(
      `<body style="margin:0;background:transparent">${svg}</body>`,
    );
    const png = path.join(out, path.basename(file).replace(/\.svg$/, ".png"));
    await page.screenshot({
      path: png,
      omitBackground: true,
      clip: { x: 0, y: 0, width, height },
    });
    console.log(`${file} → ${png} (${width}×${height})`);
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
