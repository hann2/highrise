import { Graphics } from "pixi.js";
import { UsableStats } from "./UsableStats";

// A usable is drawn as a little case with a cross on it, seen from above

/** Length and width of the case, in meters */
const SIZE: [number, number] = [0.3, 0.22];

/** The case, as Pixi graphics centered on the origin */
export function drawUsable(stats: UsableStats): Graphics {
  const [w, h] = SIZE;
  const bar = h * 0.18;
  return new Graphics()
    .roundRect(-w / 2, -h / 2, w, h, 0.03)
    .fill(stats.color)
    .stroke({ width: 0.012, color: 0x000000, alpha: 0.6 })
    .rect(-bar * 2, -bar / 2, bar * 4, bar)
    .fill(stats.accentColor)
    .rect(-bar / 2, -bar * 2, bar, bar * 4)
    .fill(stats.accentColor);
}

/** The same case as an SVG, for the HUD and the encyclopedia */
export function usableSvg(stats: UsableStats): string {
  const [w, h] = SIZE;
  const bar = h * 0.18;
  const pad = h * 0.3;
  const color = cssColor(stats.color);
  const accent = cssColor(stats.accentColor);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-w / 2 - pad} ${-h / 2 - pad} ${w + pad * 2} ${h + pad * 2}">`,
    `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="0.03" fill="${color}" stroke="rgba(0,0,0,0.6)" stroke-width="0.012"/>`,
    `<rect x="${-bar * 2}" y="${-bar / 2}" width="${bar * 4}" height="${bar}" fill="${accent}"/>`,
    `<rect x="${-bar / 2}" y="${-bar * 2}" width="${bar}" height="${bar * 4}" fill="${accent}"/>`,
    `</svg>`,
  ].join("");
}

/** `usableSvg` as a data URL, for an <img> */
export function usableImageUrl(stats: UsableStats): string {
  return `data:image/svg+xml,${encodeURIComponent(usableSvg(stats))}`;
}

function cssColor(color: number): string {
  return "#" + color.toString(16).padStart(6, "0");
}
