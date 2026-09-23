import { ConsumableStats } from "./ConsumableStats";

/**
 * A picture of a consumable for HTML, as an SVG data URL: the same shape
 * `drawConsumable` draws in the world (a rounded body with a band and a pin
 * ring), since consumables have no image files.
 */
export function consumableImageUrl(stats: ConsumableStats): string {
  const [length, width] = stats.size;
  const pad = width * 0.4;
  const accent = cssColor(stats.accentColor);
  const viewBox = [
    -length / 2 - pad,
    -width / 2 - pad,
    length + pad * 2,
    width + pad * 2,
  ].join(" ");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${(length + pad * 2) * 400}" height="${(width + pad * 2) * 400}">` +
    `<rect x="${-length / 2}" y="${-width / 2}" width="${length}" height="${width}" rx="${width / 2}" fill="${cssColor(stats.color)}" stroke="rgba(0,0,0,0.6)" stroke-width="${width * 0.06}"/>` +
    `<rect x="${length / 2 - width * 0.35}" y="${-width * 0.3}" width="${width * 0.35}" height="${width * 0.6}" fill="${accent}"/>` +
    `<circle cx="${length / 2 + width * 0.1}" cy="${width * 0.35}" r="${width * 0.18}" fill="none" stroke="${accent}" stroke-width="${width * 0.07}"/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function cssColor(color: number): string {
  return "#" + color.toString(16).padStart(6, "0");
}
