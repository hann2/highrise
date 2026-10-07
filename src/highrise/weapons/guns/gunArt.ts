import { CanvasSource, Texture } from "pixi.js";
import ak47 from "./art/ak-47.svg?raw";
import ar15 from "./art/ar-15.svg?raw";
import desertEagle from "./art/desert-eagle.svg?raw";
import doubleBarrelShotgun from "./art/double-barrel-shotgun.svg?raw";
import fiveSeven from "./art/five-seven.svg?raw";
import glock from "./art/glock.svg?raw";
import m1911 from "./art/m1911.svg?raw";
import p90 from "./art/p90.svg?raw";
import remington870 from "./art/remington-870.svg?raw";
import revolver from "./art/revolver.svg?raw";
import spas12 from "./art/spas-12.svg?raw";
import { GUN_PART_NAMES, GunPartName } from "./GunPose";

/*
 * Guns as they're held, drawn as SVG (`art/`, see its README) and
 * rasterized when the game starts, so they're as sharp as they're drawn.
 * Each is cut into layers in drawing order: every moving part (a top-level
 * group named for one, `GUN_PART_NAMES`) on a layer of its own, and what's
 * between them on layers that stay put, so the parts can move over and under
 * the rest of the gun.
 */

const GUN_ART = {
  ak47,
  ar15,
  desertEagle,
  doubleBarrelShotgun,
  fiveSeven,
  glock,
  m1911,
  p90,
  remington870,
  revolver,
  spas12,
};

export type GunArtName = keyof typeof GUN_ART;

/** How many pixels a meter of gun gets when it's rasterized */
export const GUN_PIXELS_PER_METER = 600;

/** One layer of a gun's art, anchored at the gun's origin */
export interface GunLayer {
  readonly texture: Texture;
  /** The moving part it is, or none for the parts that stay put */
  readonly part?: GunPartName;
}

const baked = new Map<GunArtName, GunLayer[]>();

/** A gun's art as layers, bottom first; scale them by `1 / GUN_PIXELS_PER_METER` */
export function getGunLayers(name: GunArtName): readonly GunLayer[] {
  const layers = baked.get(name);
  if (!layers) {
    throw new Error(`Gun art "${name}" isn't baked yet (bakeGuns)`);
  }
  return layers;
}

/** Rasterizes every gun's art (call once at boot, before any gun is drawn) */
export async function bakeGuns(): Promise<void> {
  await Promise.all(
    Object.entries(GUN_ART).map(async ([name, svg]) => {
      baked.set(name as GunArtName, await bakeLayers(svg));
    }),
  );
}

async function bakeLayers(svg: string): Promise<GunLayer[]> {
  const root = new DOMParser().parseFromString(
    svg,
    "image/svg+xml",
  ).documentElement;
  const open = svg.slice(0, svg.indexOf(">") + 1);
  let defs = "";
  const layers: { part?: GunPartName; content: string[] }[] = [];
  for (const element of root.children) {
    if (element.tagName === "defs") {
      defs += element.outerHTML;
      continue;
    }
    const part = (GUN_PART_NAMES as readonly string[]).includes(element.id)
      ? (element.id as GunPartName)
      : undefined;
    const last = layers[layers.length - 1];
    if (part || !last || last.part) {
      layers.push({ part, content: [] });
    }
    layers[layers.length - 1].content.push(element.outerHTML);
  }
  return Promise.all(
    layers.map(async ({ part, content }) => ({
      part,
      texture: await rasterize(`${open}${defs}${content.join("")}</svg>`),
    })),
  );
}

async function rasterize(svg: string): Promise<Texture> {
  const [minX, minY, width, height] = svg
    .match(/viewBox="([^"]+)"/)![1]
    .split(/[\s,]+/)
    .map(Number);
  // Pixels per millimeter
  const scale = GUN_PIXELS_PER_METER / 1000;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    canvas
      .getContext("2d")!
      .drawImage(image, 0, 0, width * scale, height * scale);
  } finally {
    URL.revokeObjectURL(url);
  }
  return new Texture({
    source: new CanvasSource({ resource: canvas, autoGenerateMipmaps: true }),
    defaultAnchor: {
      x: (-minX * scale) / canvas.width,
      y: (-minY * scale) / canvas.height,
    },
  });
}
