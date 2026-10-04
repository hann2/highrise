import { CanvasSource, Rectangle, Texture } from "pixi.js";
import { LegColors } from "../creature-stuff/Legs";
import { BodyLook } from "./BodyLook";
import { BODY_PARTS, BodyPart, drawBody } from "./drawBody";
import { Drawing, n } from "./svg";

/** How many pixels a meter of a human-sized body's parts get */
export const BODY_PIXELS_PER_METER = 200;
/** Space round each part on the atlas, so they don't bleed into each other */
const PADDING = 3;
const PAGE_WIDTH = 2048;
const MAX_PAGE_HEIGHT = 4096;

/** Sizes of a body, in meters, for a human-sized one; others scale them */
export interface BodyMetrics {
  /** From the middle to each shoulder joint */
  shoulderOffset: number;
  armThickness: number;
  handSize: number;
  headRadius: number;
}

/** The images a `BodySprite` is drawn with, and how they fit together */
export interface BodyTextures {
  head: Texture;
  torso: Texture;
  leftArm: Texture;
  rightArm: Texture;
  leftHand: Texture;
  rightHand: Texture;
  metrics: BodyMetrics;
}

/** Everything a look is drawn with in the game */
export interface BodyAppearance {
  look: BodyLook;
  /** Up and about */
  standing: BodyTextures;
  /** Face down from the waist up, as a crawler or a corpse */
  lying: BodyTextures;
  /** Face down from the waist down, waist at the right */
  lyingLegs: Texture;
  legColors: LegColors;
}

const baked = new Map<BodyLook, BodyAppearance>();

/** The textures `look` was baked into (by `bakeBodies`, at boot) */
export function getAppearance(look: BodyLook): BodyAppearance {
  const appearance = baked.get(look);
  if (!appearance) {
    throw new Error("That look hasn't been baked; bake it with bakeBodies");
  }
  return appearance;
}

/** Meters per texture pixel for a body of this size next to a human's */
export function bodyPixelScale(sizeRatio: number) {
  return sizeRatio / BODY_PIXELS_PER_METER;
}

interface Placement {
  drawing: Drawing;
  page: number;
  x: number;
  y: number;
  /** Size in pixels, without the padding */
  width: number;
  height: number;
}

/**
 * Draws every look's parts and rasterizes them onto atlas pages (one SVG
 * image decoded per page), then makes each part a texture of its page,
 * anchored where it attaches. Looks already baked are skipped.
 */
export async function bakeBodies(looks: BodyLook[]): Promise<void> {
  const toBake = [...new Set(looks)].filter((look) => !baked.has(look));
  if (toBake.length === 0) {
    return;
  }
  const scale = BODY_PIXELS_PER_METER / 1000;
  const bodies = toBake.map((look, i) => drawBody(look, `k${baked.size + i}`));

  // Shelf packing, tallest first
  const placements: Placement[] = [];
  const byBody = bodies.map(
    (body) =>
      Object.fromEntries(
        BODY_PARTS.map((part) => {
          const drawing = body.parts[part];
          const placement: Placement = {
            drawing,
            page: 0,
            x: 0,
            y: 0,
            width: Math.ceil(drawing.width * scale),
            height: Math.ceil(drawing.height * scale),
          };
          placements.push(placement);
          return [part, placement];
        }),
      ) as Record<BodyPart, Placement>,
  );
  const pageHeights: number[] = [];
  let page = 0;
  let x = 0;
  let y = 0;
  let shelf = 0;
  for (const p of [...placements].sort((a, b) => b.height - a.height)) {
    const w = p.width + PADDING * 2;
    const h = p.height + PADDING * 2;
    if (x + w > PAGE_WIDTH) {
      x = 0;
      y += shelf;
      shelf = 0;
    }
    if (y + h > MAX_PAGE_HEIGHT) {
      pageHeights[page] = y;
      page++;
      x = 0;
      y = 0;
      shelf = 0;
    }
    p.page = page;
    p.x = x + PADDING;
    p.y = y + PADDING;
    x += w;
    shelf = Math.max(shelf, h);
    pageHeights[page] = y + shelf;
  }

  const sources = await Promise.all(
    pageHeights.map((height, i) =>
      rasterize(
        placements.filter((p) => p.page === i),
        PAGE_WIDTH,
        height,
      ),
    ),
  );

  bodies.forEach((body, i) => {
    const placed = byBody[i];
    const texture = (part: BodyPart) => {
      const p = placed[part];
      const d = p.drawing;
      return new Texture({
        source: sources[p.page],
        frame: new Rectangle(p.x, p.y, p.width, p.height),
        // Where the part's origin is: where it attaches
        defaultAnchor: {
          x: (-d.minX * scale) / p.width,
          y: (-d.minY * scale) / p.height,
        },
      });
    };
    const { dims } = body;
    const metrics: BodyMetrics = {
      shoulderOffset: (dims.shoulderHalfWidth - dims.armThickness / 2) / 1000,
      armThickness: dims.armThickness / 1000,
      handSize: dims.handSize / 1000,
      headRadius: dims.headRy / 1000,
    };
    const limbs = {
      head: texture("head"),
      leftArm: texture("leftArm"),
      rightArm: texture("rightArm"),
      leftHand: texture("leftHand"),
      rightHand: texture("rightHand"),
      metrics,
    };
    baked.set(toBake[i], {
      look: body.look,
      standing: { ...limbs, torso: texture("torso") },
      lying: { ...limbs, torso: texture("lyingTorso") },
      lyingLegs: texture("lyingLegs"),
      legColors: { pants: body.look.pants, shoes: body.look.shoes },
    });
  });
}

/** One atlas page: every part in one SVG, decoded by the browser, onto a canvas */
async function rasterize(
  placements: Placement[],
  width: number,
  height: number,
): Promise<CanvasSource> {
  const parts = placements.map(({ drawing: d, x, y, width: w, height: h }) => {
    return (
      `<svg x="${x}" y="${y}" width="${w}" height="${h}" ` +
      `viewBox="${n(d.minX)} ${n(d.minY)} ${n(w / (BODY_PIXELS_PER_METER / 1000))} ${n(h / (BODY_PIXELS_PER_METER / 1000))}" ` +
      `preserveAspectRatio="xMinYMin meet">${d.content()}</svg>`
    );
  });
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    parts.join("") +
    `</svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(image, 0, 0);
    return new CanvasSource({
      resource: canvas,
      autoGenerateMipmaps: true,
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
