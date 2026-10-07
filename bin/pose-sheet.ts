import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { makeRandom } from "../src/core/util/Random";
import { composeBodySvg } from "../src/highrise/looks/composeBody";
import { drawBody } from "../src/highrise/looks/drawBody";
import { DeathContext, NO_DEATH } from "../src/highrise/looks/lyingPose";
import { randomLook } from "../src/highrise/looks/randomLook";

/*
 * A contact sheet of how corpses lie (`lyingPose`): a row for each way of
 * dying, each a few zombies killed that way, for judging the poses by eye
 * without the game.
 *
 *   npx tsx bin/pose-sheet.ts [--columns 8] [--seed 1] [--scale 110] [--only shotgun,burned]
 *     [--out tests/output/pose-sheet.png]
 */

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const whole = NO_DEATH.missing;

/** Ways of dying, each as the corpse would be told it */
const DEATHS: [string, string, DeathContext][] = [
  ["dropped", "Just dropped, nothing in particular (the editor's still)", NO_DEATH],
  [
    "reaching",
    "A light shot from behind, arms reaching out ahead as it fell",
    {
      ...NO_DEATH,
      kind: "bullet",
      force: 0.25,
      arms: [
        { angle: 0.35, reach: 0.9 },
        { angle: 0.3, reach: 0.85 },
      ],
    },
  ],
  [
    "knocked back",
    "A light shot from in front: the arms that reached for it now point back past the feet",
    {
      ...NO_DEATH,
      kind: "bullet",
      force: 0.3,
      arms: [
        { angle: 2.8, reach: 0.9 },
        { angle: 2.85, reach: 0.85 },
      ],
    },
  ],
  [
    "shotgun",
    "A shotgun up close, off to its right",
    { ...NO_DEATH, kind: "bullet", force: 0.95, side: 0.7 },
  ],
  [
    "axe",
    "A heavy swing into its left side",
    { ...NO_DEATH, kind: "melee", force: 0.6, side: -1 },
  ],
  [
    "explosion",
    "A grenade: thrown, everything flung out",
    { ...NO_DEATH, kind: "explosion", force: 1 },
  ],
  [
    "burned",
    "Burned to death: drawn up",
    { ...NO_DEATH, kind: "burn", force: 0.1 },
  ],
  [
    "sprinter",
    "A sprinter flat out, mid-stride, its left foot out ahead",
    {
      ...NO_DEATH,
      kind: "bullet",
      force: 0.35,
      speed: 1,
      legs: [{ angle: 0.25, reach: 0.55 }, { angle: 2.9, reach: 0.4 }],
    },
  ],
  [
    "headshot",
    "Its head popped: limp",
    {
      ...NO_DEATH,
      kind: "bullet",
      force: 0.4,
      missing: { ...whole, head: true },
    },
  ],
  [
    "arm off",
    "Its left arm shot off",
    {
      ...NO_DEATH,
      kind: "bullet",
      force: 0.5,
      side: -1,
      missing: { ...whole, leftArm: true },
    },
  ],
  [
    "halved",
    "Cut in half: the top half, reaching",
    {
      ...NO_DEATH,
      kind: "bullet",
      force: 0.8,
      missing: { ...whole, legs: true },
    },
  ],
  [
    "crawler",
    "A crawler, killed where it lay",
    {
      ...NO_DEATH,
      kind: "bullet",
      force: 0.3,
      lying: true,
      missing: { ...whole, legs: true },
      arms: [
        { angle: 0.5, reach: 0.8 },
        { angle: 0.6, reach: 0.75 },
      ],
    },
  ],
];

async function main() {
  const columns = Number(arg("columns") ?? 8);
  const seed = Number(arg("seed") ?? 1);
  const scale = Number(arg("scale") ?? 110);
  const only = arg("only")?.split(",");
  const out = arg("out") ?? "tests/output/pose-sheet.png";

  const random = makeRandom(seed);
  const looks = Array.from({ length: columns }, () => randomLook(random, true));
  let html = `<style>
    body { margin: 0; padding: 16px; background: #8d8a84; font: 13px sans-serif; color: #222; }
    h2 { margin: 16px 0 2px; font-size: 15px; }
    p { margin: 0 0 6px; }
    .row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    figure { margin: 0; background: #a9a59c; border-radius: 6px; padding: 4px; }
  </style>`;
  DEATHS.forEach(([name, about, death], row) => {
    if (only && !only.includes(name.replace(/ /g, ""))) {
      return;
    }
    html += `<h2>${name}</h2><p>${about}</p><div class="row">`;
    looks.forEach((look, i) => {
      const body = drawBody(look, `r${row}c${i}`);
      html += `<figure>${composeBodySvg(body, {
        pose: "lying",
        scale,
        death,
        poseSeed: seed * 1000 + row * 50 + i,
      })}</figure>`;
    });
    html += `</div>`;
  });

  fs.mkdirSync(path.dirname(out), { recursive: true });
  const htmlFile = out.replace(/\.png$/, ".html");
  fs.writeFileSync(htmlFile, html);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 800 } });
  await page.goto(`file://${path.resolve(htmlFile)}`);
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log(`${out} (and ${htmlFile})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
