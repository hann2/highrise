import { CanvasSource, Rectangle, Texture } from "pixi.js";
import { LegTextures } from "../creature-stuff/Legs";
import { BodyLook } from "./BodyLook";
import { BODY_PARTS, BodyPart, drawBody } from "./drawBody";
import { Drawing, n } from "./svg";
import { DangleKind } from "./dangles";
import { lyingWaist } from "./parts/torso";
// Hand-drawn pieces, so looks can wear them
import "./pieces/index";

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
  /** From the shoulder to the elbow, and the elbow to the middle of the hand */
  upperArm: number;
  forearm: number;
  handSize: number;
  headRadius: number;
  /** Lying face down, how far behind the shoulders the waist is, where the legs go */
  lyingWaist: number;
}

/** The images a `BodySprite` is drawn with, and how they fit together */
export interface BodyTextures {
  head: Texture;
  torso: Texture;
  /** Whole and straight, stretched from shoulder to hand */
  leftArm: Texture;
  rightArm: Texture;
  /** In two, bent at the elbow: each starts at its origin and runs along +x */
  leftUpperArm: Texture;
  leftForearm: Texture;
  rightUpperArm: Texture;
  rightForearm: Texture;
  leftHand: Texture;
  rightHand: Texture;
  /** What swings, drawn over the torso and under the head, in order (none lying down) */
  dangles: DangleTexture[];
  metrics: BodyMetrics;
}

/** Something that swings (see `DangleDrawing`): its image hangs along +x from its anchor */
export interface DangleTexture {
  kind: DangleKind;
  on: "head" | "torso";
  texture: Texture;
  /** Where it hangs from on that part, which way, and how far to its tip, in meters for a human-sized body */
  pivot: [number, number];
  angle: number;
  length: number;
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
  /** Its legs up and walking */
  legs: LegTextures;
}

const baked = new Map<BodyLook, BodyAppearance>();
/** The atlas pages each look's parts are on */
const pagesOf = new Map<BodyLook, CanvasSource[]>();

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
  const danglesByBody = bodies.map((body) =>
    body.dangles.map((dangle) => {
      const placement: Placement = {
        drawing: dangle.drawing,
        page: 0,
        x: 0,
        y: 0,
        width: Math.ceil(dangle.drawing.width * scale),
        height: Math.ceil(dangle.drawing.height * scale),
      };
      placements.push(placement);
      return placement;
    }),
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
    const texture = (part: BodyPart | Placement) => {
      const p = typeof part === "string" ? placed[part] : part;
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
      upperArm: dims.upperArm / 1000,
      forearm: dims.forearm / 1000,
      handSize: dims.handSize / 1000,
      headRadius: dims.headRy / 1000,
      lyingWaist: lyingWaist(dims) / 1000,
    };
    const limbs = {
      leftArm: texture("leftArm"),
      rightArm: texture("rightArm"),
      leftUpperArm: texture("leftUpperArm"),
      leftForearm: texture("leftForearm"),
      rightUpperArm: texture("rightUpperArm"),
      rightForearm: texture("rightForearm"),
      leftHand: texture("leftHand"),
      rightHand: texture("rightHand"),
      metrics,
    };
    const dangles = body.dangles.map((dangle, j): DangleTexture => ({
      kind: dangle.kind,
      on: dangle.on,
      texture: texture(danglesByBody[i][j]),
      pivot: [dangle.pivot[0] / 1000, dangle.pivot[1] / 1000],
      angle: dangle.angle,
      length: dangle.length / 1000,
    }));
    pagesOf.set(toBake[i], [
      ...new Set(
        [...Object.values(placed), ...danglesByBody[i]].map(
          (p) => sources[p.page],
        ),
      ),
    ]);
    baked.set(toBake[i], {
      look: body.look,
      standing: {
        ...limbs,
        head: texture("head"),
        torso: texture("torso"),
        dangles,
      },
      lying: {
        ...limbs,
        dangles: [],
        head: texture("lyingHead"),
        torso: texture("lyingTorso"),
      },
      lyingLegs: texture("lyingLegs"),
      legs: {
        leg: texture("leg"),
        leftFoot: texture("leftFoot"),
        rightFoot: texture("rightFoot"),
        thickness: dims.legThickness / 1000,
      },
    });
  });
}

/**
 * Lets go of a look baked by `bakeBodies`, and frees the atlas pages no
 * other look is on. Nothing may be drawn with its textures any more. For
 * looks that come and go, like the character editor's preview.
 */
export function forgetLook(look: BodyLook) {
  const pages = pagesOf.get(look);
  baked.delete(look);
  pagesOf.delete(look);
  const inUse = new Set([...pagesOf.values()].flat());
  for (const page of pages ?? []) {
    if (!inUse.has(page)) {
      page.destroy();
    }
  }
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
