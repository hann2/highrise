import { CanvasSource, Texture } from "pixi.js";
import ak47 from "./art/ak-47.svg?raw";
import ar15 from "./art/ar-15.svg?raw";
import desertEagle from "./art/desert-eagle.svg?raw";
import doubleBarrelShotgun from "./art/double-barrel-shotgun.svg?raw";
import fiveSeven from "./art/five-seven.svg?raw";
import glock from "./art/glock.svg?raw";
import p90 from "./art/p90.svg?raw";
import remington870 from "./art/remington-870.svg?raw";
import revolver from "./art/revolver.svg?raw";
import spas12 from "./art/spas-12.svg?raw";

/*
 * Guns as they're held, drawn as SVG (`art/`, see its README) and
 * rasterized when the game starts, so they're as sharp as they're drawn.
 */

const GUN_ART = {
  ak47,
  ar15,
  desertEagle,
  doubleBarrelShotgun,
  fiveSeven,
  glock,
  p90,
  remington870,
  revolver,
  spas12,
};

export type GunArtName = keyof typeof GUN_ART;

/** How big the art is drawn: an SVG unit is this many meters */
export const GUN_ART_METERS_PER_UNIT = 1 / 300;
/** How many pixels a meter of gun gets when it's rasterized */
export const GUN_PIXELS_PER_METER = 600;

const textures = new Map<GunArtName, Texture>();

/** A gun's art, anchored in its middle; scale it by `1 / GUN_PIXELS_PER_METER` */
export function getGunTexture(name: GunArtName): Texture {
  const texture = textures.get(name);
  if (!texture) {
    throw new Error(`Gun art "${name}" isn't baked yet (bakeGuns)`);
  }
  return texture;
}

/** Rasterizes every gun's art (call once at boot, before any gun is drawn) */
export async function bakeGuns(): Promise<void> {
  await Promise.all(
    Object.entries(GUN_ART).map(async ([name, svg]) => {
      textures.set(name as GunArtName, await rasterize(svg));
    }),
  );
}

async function rasterize(svg: string): Promise<Texture> {
  const [, , width, height] = svg
    .match(/viewBox="([^"]+)"/)![1]
    .split(/[\s,]+/)
    .map(Number);
  const scale = GUN_PIXELS_PER_METER * GUN_ART_METERS_PER_UNIT;
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
      x: (width * scale) / 2 / canvas.width,
      y: (height * scale) / 2 / canvas.height,
    },
  });
}
