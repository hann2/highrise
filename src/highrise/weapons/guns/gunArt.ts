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
 * the rest of the gun. Rounds that show (a `rounds` group, top-level or in a
 * moving part) are a layer of their own too, which `GunSprite` slides along
 * the gun and crops to their window as the gun empties.
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

/** A gun's art as it's drawn, in millimeters about the gun's origin (for tools) */
export function gunArtSvg(name: GunArtName): string {
  return GUN_ART[name];
}

/** How many pixels a meter of gun gets when it's rasterized */
export const GUN_PIXELS_PER_METER = 600;

/** One layer of a gun's art, anchored at the gun's origin */
export interface GunLayer {
  readonly texture: Texture;
  /** The moving part it is, or none for the parts that stay put */
  readonly part?: GunPartName;
  /** If it's the rounds, where along the gun they show, in meters: the x of each end of their clip path's rect */
  readonly roundsWindow?: readonly [number, number];
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
  const layers: (Omit<GunLayer, "texture"> & { content: string[] })[] = [];
  /** Adds to the layer below, unless either is a part or the rounds */
  const add = (
    content: string,
    part?: GunPartName,
    roundsWindow?: readonly [number, number],
  ) => {
    const last = layers[layers.length - 1];
    if (part || roundsWindow || !last || last.part || last.roundsWindow) {
      layers.push({ part, roundsWindow, content: [] });
    }
    layers[layers.length - 1].content.push(content);
  };
  for (const element of root.children) {
    if (element.tagName === "defs") {
      defs += element.outerHTML;
      continue;
    }
    const part = (GUN_PART_NAMES as readonly string[]).includes(element.id)
      ? (element.id as GunPartName)
      : undefined;
    const children = [...element.children];
    const rounds =
      element.id === "rounds"
        ? element
        : part && children.find((child) => child.id === "rounds");
    if (!rounds) {
      add(element.outerHTML, part);
      continue;
    }
    // What's under the rounds, the rounds (unclipped, since they slide), and what's over them
    const shown = windowOf(root, rounds);
    const unclipped = rounds.cloneNode(true) as Element;
    unclipped.removeAttribute("clip-path");
    if (rounds === element) {
      add(unclipped.outerHTML, undefined, shown);
      continue;
    }
    // In the part's group, for anything it sets for them
    const inPart = (...content: Element[]) => {
      const group = element.cloneNode(false) as Element;
      group.append(...content.map((child) => child.cloneNode(true)));
      return group.outerHTML;
    };
    const index = children.indexOf(rounds);
    add(inPart(...children.slice(0, index)), part);
    add(inPart(unclipped), part, shown);
    add(inPart(...children.slice(index + 1)), part);
  }
  return Promise.all(
    layers.map(async ({ content, ...layer }) => ({
      ...layer,
      texture: await rasterize(`${open}${defs}${content.join("")}</svg>`),
    })),
  );
}

/** Where along the gun `rounds` show, in meters: the ends of the rect in their clip path */
function windowOf(root: Element, rounds: Element): [number, number] {
  const id = rounds.getAttribute("clip-path")?.match(/url\(#(.+)\)/)?.[1];
  const rect = id && root.querySelector(`[id="${id}"] rect`);
  if (!rect) {
    throw new Error(
      "A gun's rounds need a clip path of a rect to show through",
    );
  }
  const x = Number(rect.getAttribute("x"));
  const width = Number(rect.getAttribute("width"));
  return [x / 1000, (x + width) / 1000];
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
