/**
 * Tools for drawing guns from reference photos (see .claude/skills/gun-art/SKILL.md for the workflow):
 *
 *   npx tsx bin/gun-art/cli.ts <command> [gun] [options]
 *
 *   build [gun...] [--check]   write each gun's pickup and top view from its generator; --check fails if one
 *                              isn't up to date. A draft gun (still being drawn) is only built when named, into
 *                              tests/output/gun-art/
 *   grid <gun> [--crop x,y,w,h] [--mode side|over|photo|drawing] [--scale 1] [--grid 20] [--opacity 0.55]
 *        [--photo file] [--trace "x,y x,y ..."] [--options '{...}'] [--out file]
 *                              a region of the photo with a labeled grid in its pixels, and the drawing beside it
 *                              (side), over it (over), or neither (photo); --trace draws a red line over both.
 *        --view top: the top view in millimeters (--scale 6 px a mm, --grid 5 mm), beside or over a photo from
 *        above, straightened by its registration (four points we know in it)
 *   measure <gun> edges x=600 y=340 ... [--jump 50]    where the photo's colors jump along columns or rows
 *   measure <gun> runs rows|cols <from> <to> <step> [lo hi] [--white 228]   the gun's extent along rows or
 *                              columns: everything but white (all channels over --white; raise it for polished
 *                              steel, which is nearly white) and pale blue. Transparent pixels read as white
 *   measure <gun> sample x,y x,y ...                   the photo's colors there (5 px averages)
 *   options <gun> <variants.json> [--crop x,y,w,h] [--view top] [--out file]
 *                              a sheet of variations: variants.json is {"A": {"label": "...", "options": {...}}}
 *   sheet <gun> [--out file]   the photo and the drawing, and the drawing at the pickups' size beside the others
 *   cutout <gun> [--out file]  the photo with its background removed, beside the drawing, light and dark
 *   model <gun> [folder] [--from +x --up +y] [--mirror] [--width 2400] [--background #fff] [--out file]
 *                              renders the 3D model in references/<gun>/<folder> (default "model", a .gltf) straight
 *                              on, with no perspective and even light, to a PNG to draw over like a photo: from
 *                              --from (an axis: the camera on +x looking back), into references/<gun>/<folder>-<from>.png.
 *                              Without --from, all six views on one sheet, to find which is the right side and
 *                              which is up
 *   ingame <gun> --port 1234   screenshots of the pickup in the arena (on the floor, and in the HUD), from a
 *                              running dev server
 *
 * Images go to tests/output/gun-art/ unless --out says otherwise. Measurements are in the photo's pixels, the
 * units the generators draw in.
 */
import fs from "fs";
import path from "path";
import {
  closeBrowser,
  dataUrl,
  newPage,
  renderSheet,
  svgDataUrl,
  withPixels,
} from "./lib/browser";
import { cssMatrix, homography, type Matrix3 } from "./lib/homography";
import {
  generatedFiles,
  OUTPUT,
  photoPath,
  pickupSvg,
  PICKUPS,
  REFERENCES,
  type GunDrawing,
} from "./lib/gun";
import { GUNS } from "./guns";
import { AXES, defaultUp, renderModel, type Axis } from "./lib/model";
import { GUNS as GUN_STATS } from "../../src/highrise/weapons/guns/gun-stats/gunStats";

const [command, ...rest] = process.argv.slice(2);

/** --name value options, and everything else in order */
function parseArgs(args: string[]): {
  flags: Record<string, string | true>;
  positional: string[];
} {
  const flags: Record<string, string | true> = {};
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const next = args[i + 1];
      if (next === undefined || next.startsWith("--")) {
        flags[arg.slice(2)] = true;
      } else {
        flags[arg.slice(2)] = next;
        i++;
      }
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

const { flags, positional } = parseArgs(rest);
const flag = (name: string, fallback?: string): string | undefined => {
  const value = flags[name];
  return typeof value === "string" ? value : fallback;
};

function findGun(name: string | undefined): GunDrawing<any> {
  const gun = GUNS.find((g) => g.name === name);
  if (!gun) {
    throw new Error(
      `No gun "${name}". There are: ${GUNS.map((g) => g.name).join(", ")}`,
    );
  }
  return gun;
}

function photoFor(gun: GunDrawing<any>): {
  file: string;
  width: number;
  height: number;
} {
  const other = flag("photo");
  const photo = other
    ? ((gun.otherPhotos ?? []).find((p) => p.file === other) ?? {
        file: other,
        width: 0,
        height: 0,
        about: "",
      })
    : gun.photo;
  const file = path.isAbsolute(photo.file) ? photo.file : photoPath(gun, photo);
  if (!fs.existsSync(file)) {
    throw new Error(
      `The reference photo ${file} isn't here: reference photos aren't committed (see ${REFERENCES})`,
    );
  }
  return { file, width: photo.width, height: photo.height };
}

function out(name: string): string {
  return path.resolve(flag("out") ?? path.join(OUTPUT, name));
}

function crop(
  fallback: [number, number, number, number],
): [number, number, number, number] {
  const value = flag("crop");
  return value
    ? (value.split(",").map(Number) as [number, number, number, number])
    : fallback;
}

function options(): unknown {
  const value = flag("options");
  return value ? JSON.parse(value) : undefined;
}

async function build() {
  // Drafts only when asked for by name (--check never asks for them)
  const names = positional.length
    ? positional
    : GUNS.filter((g) => !g.draft).map((g) => g.name);
  let stale = 0;
  for (const name of names) {
    const gun = findGun(name);
    for (const { file, svg } of generatedFiles(gun)) {
      const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
      if (flags.check) {
        if (current !== svg) {
          stale++;
          console.error(
            `${path.relative(process.cwd(), file)} isn't what bin/gun-art/guns/${name}.ts draws`,
          );
        }
      } else if (current !== svg) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, svg);
        console.log(`wrote ${path.relative(process.cwd(), file)}`);
      } else {
        console.log(`${path.relative(process.cwd(), file)} is up to date`);
      }
    }
  }
  if (stale) {
    console.error("Run npx tsx bin/gun-art/cli.ts build to write them");
    process.exitCode = 1;
  }
}

/** A grid in the photo's pixels over a crop, every `step`, labeled every line */
function gridSvg(
  c: [number, number, number, number],
  scale: number,
  step: number,
): string {
  const [cx, cy, cw, ch] = c;
  const W = cw * scale;
  const H = ch * scale;
  let markup = "";
  const label = (x: number, y: number, text: number) =>
    `<text x="${x}" y="${y}" font-size="12" font-weight="bold" fill="#c08" stroke="#fff" stroke-width="3" ` +
    `paint-order="stroke" font-family="sans-serif">${text}</text>`;
  for (let x = Math.ceil(cx / step) * step; x <= cx + cw; x += step) {
    const X = (x - cx) * scale;
    const major = x % (step * 2) === 0;
    markup += `<line x1="${X}" y1="0" x2="${X}" y2="${H}" stroke="${major ? "#f0a" : "#0af"}" stroke-width="${major ? 0.8 : 0.4}" opacity="0.7"/>`;
    markup += label(X + 2, 12, x);
  }
  for (let y = Math.ceil(cy / step) * step; y <= cy + ch; y += step) {
    const Y = (y - cy) * scale;
    const major = y % (step * 2) === 0;
    markup += `<line x1="0" y1="${Y}" x2="${W}" y2="${Y}" stroke="${major ? "#f0a" : "#0af"}" stroke-width="${major ? 0.8 : 0.4}" opacity="0.7"/>`;
    markup += label(2, Y + 12, y);
  }
  return `<svg width="${W}" height="${H}" style="position:absolute;left:0;top:0">${markup}</svg>`;
}

/** The viewBox of an SVG, as x, y, width, height */
function viewBoxOf(svg: string): [number, number, number, number] {
  const match = /viewBox="([^"]*)"/.exec(svg);
  return match![1].split(/\s+/).map(Number) as [number, number, number, number];
}

/** An SVG shown at a crop of its own units, `scale` pixels a unit */
function viewedImg(
  svg: string,
  [cx, cy, cw, ch]: [number, number, number, number],
  scale: number,
  opacity = 1,
): string {
  const viewed = svg
    .replace(/viewBox="[^"]*"/, `viewBox="${cx} ${cy} ${cw} ${ch}"`)
    .replace(
      / width="[\d.]+" height="[\d.]+"/,
      ` width="${cw * scale}" height="${ch * scale}"`,
    );
  return `<img src="${svgDataUrl(viewed)}" style="position:absolute;left:0;top:0;width:${cw * scale}px;height:${ch * scale}px;opacity:${opacity}">`;
}

/**
 * The top view: a region of it in millimeters, with a labeled grid, beside or over a photo from above that's
 * been registered (four points whose places we know), which undoes its tilt and perspective
 */
async function gridTop(gun: GunDrawing<any>) {
  if (!gun.top) {
    throw new Error(`${gun.name} has no top view yet`);
  }
  const mode = flag("mode", "side")!;
  const drawing = gun.top.draw(options());
  const c = crop(viewBoxOf(drawing));
  const [cx, cy, cw, ch] = c;
  const scale = Number(flag("scale", "6"));
  const step = Number(flag("grid", "5"));
  const opacity = Number(flag("opacity", "0.55"));
  const registrations = gun.top.registrations ?? [];
  const registration =
    registrations.find((r) => r.file === flag("photo")) ?? registrations[0];
  let photoImg = "";
  if (registration) {
    const photo = (gun.otherPhotos ?? []).find(
      (p) => p.file === registration.file,
    )!;
    const file = photoPath(gun, photo);
    const h = homography(
      registration.points.map(([px]) => px),
      registration.points.map(([, mm]) => mm),
    );
    // Then from millimeters to this panel's pixels
    const t: Matrix3 = [scale, 0, -cx * scale, 0, scale, -cy * scale, 0, 0, 1];
    const m = Array.from({ length: 9 }, (_, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      return (
        t[row * 3] * h[col] +
        t[row * 3 + 1] * h[3 + col] +
        t[row * 3 + 2] * h[6 + col]
      );
    }) as Matrix3;
    photoImg = `<img src="${dataUrl(file)}" style="position:absolute;left:0;top:0;width:${photo.width}px;height:${photo.height}px;transform-origin:0 0;transform:${cssMatrix(m)}">`;
  }
  const panel = (content: string) =>
    `<div style="flex:none;position:relative;width:${cw * scale}px;height:${ch * scale}px;overflow:hidden;background:#fff">${content}${gridSvg(c, scale, step)}</div>`;
  const panels: string[] = [];
  if (photoImg && (mode === "side" || mode === "photo" || mode === "over")) {
    panels.push(
      panel(
        photoImg +
          (mode === "over" ? viewedImg(drawing, c, scale, opacity) : ""),
      ),
    );
  }
  if (mode === "side" || mode === "drawing" || !photoImg) {
    panels.push(panel(viewedImg(drawing, c, scale)));
  }
  const file = out(`${gun.name}-top-grid.png`);
  await renderSheet(
    `<div style="display:flex;flex-direction:column;gap:10px;background:#fff">${panels.join("")}</div>`,
    file,
    "#fff",
  );
  console.log(file);
}

async function grid() {
  if (flag("view") === "top") {
    return gridTop(findGun(positional[0]));
  }
  const gun = findGun(positional[0]);
  const photo = photoFor(gun);
  const mode = flag("mode", "side")!;
  const c = crop([0, 0, gun.photo.width, gun.photo.height]);
  const [cx, cy, cw, ch] = c;
  const scale = Number(flag("scale", "1"));
  const step = Number(flag("grid", "20"));
  const opacity = Number(flag("opacity", "0.55"));
  let drawing = gun.drawSide(options());
  const trace = flag("trace");
  if (trace) {
    drawing = drawing.replace(
      "</svg>",
      `<polyline points="${trace}" stroke="red" stroke-width="${2 / scale + 1}" fill="none" opacity="0.85"/></svg>`,
    );
  }
  // The drawing shown at the crop, in the photo's pixels (another photo has its own pixels: no drawing over it)
  const ownPhoto = !flag("photo");
  const drawingImg = (overPhoto: boolean) => {
    const viewed = drawing
      .replace(/viewBox="[^"]*"/, `viewBox="${cx} ${cy} ${cw} ${ch}"`)
      .replace(
        /width="\d+" height="\d+"/,
        `width="${cw * scale}" height="${ch * scale}"`,
      );
    return `<img src="${svgDataUrl(viewed)}" style="position:absolute;left:0;top:0;width:${cw * scale}px;height:${ch * scale}px;opacity:${overPhoto ? opacity : 1}">`;
  };
  const photoImg = `<img src="${dataUrl(photo.file)}" style="position:absolute;left:${-cx * scale}px;top:${-cy * scale}px;width:${photo.width * scale}px;height:${photo.height * scale}px">`;
  const panel = (content: string) =>
    `<div style="flex:none;position:relative;width:${cw * scale}px;height:${ch * scale}px;overflow:hidden;background:#fff">${content}${gridSvg(c, scale, step)}</div>`;
  const panels: string[] = [];
  if (mode === "side" || mode === "photo" || mode === "over") {
    panels.push(
      panel(photoImg + (mode === "over" && ownPhoto ? drawingImg(true) : "")),
    );
  }
  if ((mode === "side" && ownPhoto) || mode === "drawing") {
    panels.push(panel(drawingImg(false)));
  }
  const file = out(`${gun.name}-grid.png`);
  await renderSheet(
    `<div style="display:flex;gap:10px;background:#fff">${panels.join("")}</div>`,
    file,
    "#fff",
  );
  console.log(file);
}

async function measure() {
  const gun = findGun(positional[0]);
  const photo = photoFor(gun);
  const kind = positional[1];
  const url = dataUrl(photo.file);
  if (kind === "edges") {
    const lines = positional.slice(2);
    const jump = Number(flag("jump", "40"));
    const result = await withPixels(
      url,
      ({ width, height, data }, { lines, jump }) => {
        const at = (x: number, y: number) => {
          const i = (y * width + x) * 4;
          return [data[i], data[i + 1], data[i + 2]];
        };
        return lines.map((line) => {
          const [axis, v] = line.split("=");
          const n = Number(v);
          const len = axis === "x" ? height : width;
          const px = (t: number) => (axis === "x" ? at(n, t) : at(t, n));
          const edges: string[] = [];
          let last = -10;
          for (let t = 2; t < len - 2; t++) {
            const a = px(t - 2);
            const b = px(t + 2);
            if (
              Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) > jump &&
              t - last > 4
            ) {
              edges.push(`${t} (${a.join(",")} → ${b.join(",")})`);
              last = t;
            }
          }
          return `${line}: ${edges.join("  ")}`;
        });
      },
      { lines, jump },
    );
    console.log(result.join("\n"));
  } else if (kind === "runs") {
    const [mode, from, to, step, lo, hi] = positional.slice(2);
    const result = await withPixels(
      url,
      ({ width, height, data }, a) => {
        // The gun: anything not near white and not pale blue (a photo on a light backdrop)
        const isGun = (x: number, y: number) => {
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          return !(
            Math.min(r, g, b) > a.white ||
            (b - r > 22 && b > 185 && g > 170)
          );
        };
        const outLines: string[] = [];
        for (let n = a.from; n <= a.to; n += a.step) {
          const len = a.mode === "rows" ? width : height;
          const start0 = a.lo ?? 0;
          const end0 = a.hi ?? len - 1;
          const runs: string[] = [];
          let start = -1;
          let streak = 0;
          for (let t = start0; t <= end0; t++) {
            const gun = a.mode === "rows" ? isGun(t, n) : isGun(n, t);
            if (gun) {
              if (start < 0) start = t;
              streak = 0;
            } else if (start >= 0 && ++streak > 3) {
              if (t - streak - start > 4) runs.push(`${start}-${t - streak}`);
              start = -1;
              streak = 0;
            }
          }
          if (start >= 0) runs.push(`${start}-${end0}`);
          outLines.push(
            `${a.mode === "rows" ? "y" : "x"}=${n}: ${runs.join(" ")}`,
          );
        }
        return outLines;
      },
      {
        mode,
        white: Number(flag("white", "228")),
        from: Number(from),
        to: Number(to),
        step: Number(step),
        lo: lo === undefined ? undefined : Number(lo),
        hi: hi === undefined ? undefined : Number(hi),
      },
    );
    console.log(result.join("\n"));
  } else if (kind === "sample") {
    const points = positional.slice(2);
    const result = await withPixels(
      url,
      ({ width, data }, points) =>
        points.map((p) => {
          const [x, y] = p.split(",").map(Number);
          const sum = [0, 0, 0];
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const i = ((y + dy) * width + x + dx) * 4;
              sum[0] += data[i];
              sum[1] += data[i + 1];
              sum[2] += data[i + 2];
            }
          }
          return `${p}: ${sum.map((s) => Math.round(s / 25)).join(" ")}`;
        }),
      points,
    );
    console.log(result.join("\n"));
  } else {
    throw new Error("measure <gun> edges|runs|sample ...");
  }
}

/** A gun's pickup at the given size on the given background, from its SVG */
function pickupImg(svg: string, size: number, background: string): string {
  return `<div style="background:${background};padding:4px;line-height:0"><img src="${svgDataUrl(svg)}" style="width:${size}px;height:${size}px"></div>`;
}

async function optionsSheet() {
  const gun = findGun(positional[0]);
  const variants: Record<string, { label: string; options: unknown }> =
    JSON.parse(fs.readFileSync(positional[1], "utf8"));
  if (flag("view") === "top") {
    const top = gun.top;
    if (!top) {
      throw new Error(`${gun.name} has no top view yet`);
    }
    const c = crop(viewBoxOf(top.draw()));
    const scale = Math.min(900 / c[2], 240 / c[3]);
    const cards = Object.entries(variants).map(
      ([
        key,
        { label, options },
      ]) => `<div style="background:#fff;padding:12px;border-radius:6px">
      <div style="font-weight:600;margin-bottom:6px">${key}. ${label}</div>
      <div style="position:relative;width:${c[2] * scale}px;height:${c[3] * scale}px">${viewedImg(top.draw(options), c, scale)}</div>
      <div style="margin-top:8px;background:#3a3a3a;display:inline-block;padding:6px;line-height:0">
        <div style="position:relative;width:${c[2] * 0.6}px;height:${c[3] * 0.6}px">${viewedImg(top.draw(options), c, 0.6)}</div>
      </div></div>`,
    );
    const file = out(`${gun.name}-top-options.png`);
    await renderSheet(
      `<div style="padding:20px;display:flex;flex-direction:column;gap:16px">${cards.join("")}</div>`,
      file,
    );
    console.log(file);
    return;
  }
  const [cx, cy, cw, ch] = crop([0, 0, gun.photo.width, gun.photo.height]);
  const scale = Math.min(320 / cw, 340 / ch);
  const cards = Object.entries(variants).map(([key, { label, options }]) => {
    const side = gun
      .drawSide(options)
      .replace(/viewBox="[^"]*"/, `viewBox="${cx} ${cy} ${cw} ${ch}"`)
      .replace(
        /width="\d+" height="\d+"/,
        `width="${cw * scale}" height="${ch * scale}"`,
      );
    const pickup = pickupSvg(gun, options);
    return `<div style="background:#fff;padding:12px;border-radius:6px">
      <div style="font-weight:600;margin-bottom:6px;max-width:${cw * scale + 150}px">${key}. ${label}</div>
      <div style="display:flex;gap:10px;align-items:flex-end">
        <img src="${svgDataUrl(side)}" style="width:${cw * scale}px;height:${ch * scale}px">
        <div style="display:flex;flex-direction:column;gap:8px">${pickupImg(pickup, 128, "#fff")}${pickupImg(pickup, 128, "#3a3a3a")}</div>
      </div></div>`;
  });
  const file = out(`${gun.name}-options.png`);
  await renderSheet(
    `<div style="padding:20px;display:grid;grid-template-columns:repeat(3,auto);gap:16px">${cards.join("")}</div>`,
    file,
  );
  console.log(file);
}

async function sheet() {
  const gun = findGun(positional[0]);
  const photo = photoFor(gun);
  const pickup = pickupSvg(gun, options());
  const others = fs
    .readdirSync(PICKUPS)
    .filter(
      (f) =>
        f.endsWith("-pickup.png") ||
        (f.endsWith("-pickup.svg") && f !== `${gun.name}-pickup.svg`),
    )
    .filter((f) => !f.startsWith("baseball-bat"))
    .slice(0, 6);
  const other = (f: string) =>
    `<div style="background:#fff;padding:4px;line-height:0"><img src="${dataUrl(path.join(PICKUPS, f))}" style="width:128px;height:128px;image-rendering:pixelated"></div>`;
  const body = `<div style="padding:24px">
    <div style="font-weight:600;margin-bottom:8px">The photo, and the pickup (vector, 2.5×)</div>
    <div style="display:flex;gap:16px;align-items:center">
      <img src="${dataUrl(photo.file)}" style="width:640px;background:#fff">
      ${pickupImg(pickup, 640, "#fff")}
    </div>
    <div style="font-weight:600;margin:20px 0 8px">At the pickups' 128 px, beside others; and on the floor's dark</div>
    <div style="display:flex;gap:12px;align-items:center">
      ${pickupImg(pickup, 128, "#fff")}${others.map(other).join("")}
      ${pickupImg(pickup, 128, "#3a3a3a")}${pickupImg(pickup, 64, "#fff")}
    </div></div>`;
  const file = out(`${gun.name}-sheet.png`);
  await renderSheet(body, file);
  console.log(file);
}

async function cutout() {
  const gun = findGun(positional[0]);
  const photo = photoFor(gun);
  const page = await newPage({ width: 400, height: 300 }, 1);
  // Inside the drawing's outline it's all kept, well outside it all dropped, and between the photo's colors
  // decide; background is only removed where it's connected to the outside or to holes in the drawing, so
  // blown-out highlights inside the gun stay
  const png: string = await page.evaluate(
    async ({ photoUrl, svgUrl }) => {
      const load = async (src: string) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        return img;
      };
      const photo = await load(photoUrl);
      const svg = await load(svgUrl);
      const w = photo.width;
      const h = photo.height;
      const read = (draw: (g: CanvasRenderingContext2D) => void) => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const g = c.getContext("2d", { willReadFrequently: true })!;
        draw(g);
        return g.getImageData(0, 0, w, h).data;
      };
      const silhouette = document.createElement("canvas");
      silhouette.width = w;
      silhouette.height = h;
      const sg = silhouette.getContext("2d")!;
      sg.drawImage(svg, 0, 0, w, h);
      const covered = read((g) => g.drawImage(silhouette, 0, 0));
      const blurred = read((g) => {
        g.filter = "blur(15px)";
        g.drawImage(silhouette, 0, 0);
      });
      const pixels = read((g) => g.drawImage(photo, 0, 0));
      const isBackground = (i: number) => {
        const r = pixels[i * 4];
        const gr = pixels[i * 4 + 1];
        const b = pixels[i * 4 + 2];
        return Math.min(r, gr, b) > 222 || (b - r > 18 && b > 175 && gr > 160);
      };
      const alpha = new Uint8ClampedArray(w * h).fill(255);
      const stack: number[] = [];
      for (let i = 0; i < w * h; i++) {
        // Outside the drawing (or in its holes) and away from its edge: background
        if (
          blurred[i * 4 + 3] / 255 < 0.03 ||
          (covered[i * 4 + 3] === 0 && blurred[i * 4 + 3] / 255 < 0.6)
        ) {
          alpha[i] = 0;
          stack.push(i);
        }
      }
      while (stack.length) {
        const i = stack.pop()!;
        const x = i % w;
        for (const j of [i - 1, i + 1, i - w, i + w]) {
          if (j < 0 || j >= w * h || alpha[j] === 0) continue;
          if ((j === i - 1 && x === 0) || (j === i + 1 && x === w - 1))
            continue;
          if (blurred[j * 4 + 3] / 255 > 0.995 || !isBackground(j)) continue;
          alpha[j] = 0;
          stack.push(j);
        }
      }
      const mask = document.createElement("canvas");
      mask.width = w;
      mask.height = h;
      const mg = mask.getContext("2d")!;
      const md = mg.createImageData(w, h);
      for (let i = 0; i < w * h; i++) md.data[i * 4 + 3] = alpha[i];
      mg.putImageData(md, 0, 0);
      const result = document.createElement("canvas");
      result.width = w;
      result.height = h;
      const rg = result.getContext("2d")!;
      rg.filter = "blur(0.7px)";
      rg.drawImage(mask, 0, 0);
      rg.filter = "none";
      rg.globalCompositeOperation = "source-in";
      rg.drawImage(photo, 0, 0);
      return result.toDataURL("image/png");
    },
    {
      photoUrl: dataUrl(photo.file),
      svgUrl: svgDataUrl(gun.drawSide(options())),
    },
  );
  await page.close();
  const cutoutFile =
    out(`${gun.name}-cutout.png`).replace(/\.png$/, "") + ".png";
  fs.mkdirSync(path.dirname(cutoutFile), { recursive: true });
  fs.writeFileSync(cutoutFile, Buffer.from(png.split(",")[1], "base64"));
  // Beside the drawing, at the same scale, light and dark
  const scale = 0.45;
  const W = photo.width * scale;
  const H = photo.height * scale;
  const pair = `<img src="${png}" style="width:${W}px;height:${H}px"><img src="${svgDataUrl(gun.drawSide(options()))}" style="width:${W}px;height:${H}px">`;
  const row = (bg: string) =>
    `<div style="background:${bg};padding:20px;display:flex;gap:30px">${pair}</div>`;
  const file = cutoutFile.replace(/\.png$/, "-beside.png");
  await renderSheet(row("#e9e7e3") + row("#2e2f31"), file);
  console.log(cutoutFile);
  console.log(file);
}

async function model() {
  const [gun, folder = "model"] = positional;
  const dir = path.join(REFERENCES, gun ?? "", folder);
  if (!gun || !fs.existsSync(dir)) {
    throw new Error(`No model folder ${dir}`);
  }
  const width = Number(flag("width", "2400"));
  const background = flag("background");
  const from = flag("from") as Axis | undefined;
  if (from) {
    if (!AXES.includes(from)) {
      throw new Error(`--from is one of ${AXES.join(", ")}`);
    }
    const up = (flag("up") as Axis | undefined) ?? defaultUp(from);
    const out =
      flag("out") ??
      path.join(
        REFERENCES,
        gun,
        `${folder}-${from.replace("+", "p").replace("-", "m")}.png`,
      );
    const [render] = await renderModel(
      dir,
      [{ from, up, mirror: flags.mirror === true, out }],
      { width, background },
    );
    console.log(
      `${render.file}: ${render.width} by ${render.height} px, ${render.unitsPerPixel.toPrecision(4)} model ` +
        `units a pixel; the model is ${render.size.map((v) => v.toPrecision(4)).join(" by ")} units (x, y, z)`,
    );
    return;
  }
  const renders = await renderModel(
    dir,
    AXES.map((axis) => ({
      from: axis,
      up: defaultUp(axis),
      out: path.join(OUTPUT, `model-${gun}-${folder}-${axis}.png`),
    })),
    { width: 900, background: background ?? "#ffffff" },
  );
  const out = flag("out") ?? path.join(OUTPUT, `model-${gun}-${folder}.png`);
  await renderSheet(
    renders
      .map(
        (r, i) =>
          `<div style="display:inline-block;margin:10px;vertical-align:top"><div>--from ${AXES[i]} ` +
          `(up ${defaultUp(AXES[i])})</div><img src="${dataUrl(r.file)}" style="width:900px;border:1px solid #999"></div>`,
      )
      .join(""),
    out,
  );
  console.log(
    `${out}\nThe model is ${renders[0].size.map((v) => v.toPrecision(4)).join(" by ")} units (x, y, z)`,
  );
}

async function ingame() {
  const gun = findGun(positional[0]);
  const port = flag("port", "1234");
  const page = await newPage({ width: 1280, height: 720 }, 2);
  page.on("pageerror", (e) => console.error("pageerror:", e.message));
  // The gun in both slots: one in hand (the HUD shows its pickup), one dropped at the player's feet
  // The arena names guns by their stats' name ("S&W Revolver" is "swrevolver"): the one whose pickup this is
  const pickup =
    gun.name.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase()) +
    "Pickup";
  const stats = GUN_STATS.find((s) => s.textures.pickup === pickup);
  if (!stats) throw new Error(`No gun's textures.pickup is "${pickup}"`);
  const slug = stats.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  await page.goto(
    `http://localhost:${port}/?scene=arena&seed=1&god&weapons=${slug},${slug}`,
  );
  await page.waitForFunction(
    () => (window as any).DEBUG?.game?.entities,
    null,
    { timeout: 60000 },
  );
  await page.waitForTimeout(4000);
  const found = await page.evaluate(() => {
    const game = (window as any).DEBUG.game;
    const human = [...game.entities.all].find(
      (e: any) => e.constructor.name === "Human",
    );
    if (!human) return false;
    human.dropWeapon(1 - human.activeSlot);
    game.manualFrames = true;
    game.stepFrames(10);
    const pickup = [...game.entities.all].find(
      (e: any) => e.constructor.name === "WeaponPickup",
    );
    if (!pickup) return false;
    const [hx, hy] = human.getPosition();
    pickup.sprite.position.set(hx + 0.8, hy);
    pickup.sprite.rotation = 0.3;
    game.camera.x = hx + 0.4;
    game.camera.y = hy;
    game.stepFrames(30);
    return true;
  });
  if (!found) {
    throw new Error(
      "Couldn't find the player or the dropped pickup in the arena",
    );
  }
  const game = out(`${gun.name}-ingame.png`);
  fs.mkdirSync(path.dirname(game), { recursive: true });
  await page.screenshot({ path: game });
  await page.evaluate(() => {
    const game = (window as any).DEBUG.game;
    game.camera.z *= 4;
    game.stepFrames(2);
  });
  const close = game.replace(/\.png$/, "-close.png");
  await page.screenshot({ path: close });
  await page.close();
  console.log(game);
  console.log(close);
}

const COMMANDS: Record<string, () => Promise<void>> = {
  build,
  grid,
  measure,
  options: optionsSheet,
  sheet,
  cutout,
  ingame,
  model,
};

async function main() {
  const run = COMMANDS[command];
  if (!run) {
    console.error(
      `Commands: ${Object.keys(COMMANDS).join(", ")} (see the top of bin/gun-art/cli.ts)`,
    );
    process.exit(1);
  }
  try {
    await run();
  } finally {
    await closeBrowser();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
