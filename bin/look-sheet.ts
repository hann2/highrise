import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { makeRandom } from "../src/core/util/Random";
import { PartialLook } from "../src/highrise/looks/BodyLook";
import { composeBodySvg } from "../src/highrise/looks/composeBody";
import { BODY_PARTS, drawBody } from "../src/highrise/looks/drawBody";
import { randomLook } from "../src/highrise/looks/randomLook";
import {
  pieceNames,
  PIECE_PLACES,
  registerPiece,
} from "../src/highrise/looks/pieces";

/*
 * A contact sheet of generated bodies, for looking at the generator's art
 * without the game: every character (standing, lying, and their parts),
 * then random zombies and people.
 *
 *   npx tsx bin/look-sheet.ts [--zombies 24] [--people 0] [--parts] [--only andy,chad]
 *     [--seed 1] [--scale 200] [--out tests/output/look-sheet.png]
 */

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const zombies = Number(arg("zombies") ?? 24);
  const people = Number(arg("people") ?? 0);
  const only = arg("only")?.split(",");
  const scale = Number(arg("scale") ?? 200);
  const showParts = process.argv.includes("--parts");
  const out = arg("out") ?? "tests/output/look-sheet.png";
  const random = makeRandom(Number(arg("seed") ?? 1));

  // The pieces, as the game's import.meta.glob would have them
  for (const place of PIECE_PLACES) {
    const dir = `src/highrise/looks/pieces/${place}`;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
      registerPiece(
        file.replace(/\.svg$/, ""),
        place,
        fs.readFileSync(path.join(dir, file), "utf8"),
      );
    }
  }

  const dataDir = "src/highrise/characters/data";
  const characters: [string, PartialLook][] = fs
    .readdirSync(dataDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const data = JSON.parse(
        fs.readFileSync(path.join(dataDir, file), "utf8"),
      );
      return [data.name as string, data.look as PartialLook] as [
        string,
        PartialLook,
      ];
    })
    .filter(
      ([name, look]) => look && (!only || only.includes(name.toLowerCase())),
    );

  const cell = (svg: string, label = "") =>
    `<figure>${svg}<figcaption>${label}</figcaption></figure>`;
  let html = `<style>
    body { margin: 0; padding: 16px; background: #8d8a84; font: 13px sans-serif; color: #222; }
    h2 { margin: 18px 0 6px; }
    .row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
    figure { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: #a9a59c; border-radius: 6px; padding: 6px; }
    figcaption { margin-top: 4px; }
  </style>`;

  const showBody = (name: string, look: PartialLook, i: number) => {
    const body = drawBody(look, `x${i}`);
    let row = cell(composeBodySvg(body, { scale }), name);
    row += cell(
      composeBodySvg(drawBody(look, `y${i}`), {
        scale: scale * 0.7,
        pose: "lying",
      }),
      "lying",
    );
    if (showParts) {
      for (const part of BODY_PARTS) {
        row += cell(
          drawBody(look, `p${i}${part}`).parts[part].toSvg(scale),
          part,
        );
      }
    }
    return row;
  };

  if (characters.length) {
    html += `<h2>Characters</h2><div class="row">`;
    characters.forEach(([name, look], i) => (html += showBody(name, look, i)));
    html += `</div>`;
  }
  if (process.argv.includes("--pieces")) {
    html += `<h2>Pieces</h2><div class="row">`;
    pieceNames().forEach((name, i) => {
      const look = {
        pieces: [{ name, color: "#c0392b", secondary: "#f1c40f" }],
        seed: i,
      };
      html += cell(composeBodySvg(look, { scale }, `pc${i}`), name);
    });
    html += `</div>`;
  }
  if (zombies) {
    html += `<h2>Zombies</h2><div class="row">`;
    for (let i = 0; i < zombies; i++) {
      const look = randomLook(random, true);
      html += cell(composeBodySvg(look, { scale }, `z${i}`));
    }
    html += `</div>`;
  }
  if (people) {
    html += `<h2>People</h2><div class="row">`;
    for (let i = 0; i < people; i++) {
      const look = randomLook(random, false);
      html += cell(composeBodySvg(look, { scale }, `h${i}`));
    }
    html += `</div>`;
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  const htmlFile = out.replace(/\.png$/, ".html");
  fs.writeFileSync(htmlFile, html);
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1400, height: 800 },
  });
  await page.goto(`file://${path.resolve(htmlFile)}`);
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log(`${out} (and ${htmlFile})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
