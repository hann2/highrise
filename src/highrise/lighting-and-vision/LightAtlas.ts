import { RenderTexture } from "pixi.js";
import type Light from "./Light";
import { LIGHT_RESOLUTION } from "./lightingConstants";

/** Where a light is in the atlas: which page, and the middle of its square, in meters */
export interface AtlasSlot {
  page: number;
  x: number;
  y: number;
}

/** One page of the atlas: the lights' shadow masks, and the lights themselves */
export interface AtlasPage {
  mask: RenderTexture;
  light: RenderTexture;
}

/** Pixels across the biggest page; more lights than fit go on more pages */
const MAX_PAGE_PIXELS = 4096;
/** Pixels across the smallest page */
const MIN_PAGE_PIXELS = 512;
/** Empty pixels around each light's square, so filtering never reads a neighbor */
const PADDING = 2;

/**
 * Squares for every light in view, packed into pages of two textures (masks
 * and lights) at `LIGHT_RESOLUTION`, so that all the lights can be drawn in a
 * handful of render passes rather than a couple each. Texture coordinates are
 * in meters, like the world. Packed afresh every frame (it's a few
 * microseconds), in rows from the biggest light down. Pages grow to fit
 * what's in view, and stay that big.
 */
export class LightAtlas {
  pages: AtlasPage[] = [];
  private pagePixels = 0;

  /** Gives each light a slot (see `Light.placeInAtlas`); returns the lights on each page */
  pack(lights: readonly Light[]): Light[][] {
    const sorted = [...lights].sort((a, b) => b.size - a.size);
    const sides = new Map<Light, number>();
    let area = 0;
    for (const light of sorted) {
      const side = Math.ceil(light.size * LIGHT_RESOLUTION) + 2 * PADDING;
      sides.set(light, side);
      area += side * side;
    }
    // Room to spare, since rows don't pack perfectly
    const wanted = Math.min(
      MAX_PAGE_PIXELS,
      Math.max(
        MIN_PAGE_PIXELS,
        2 ** Math.ceil(Math.log2(Math.sqrt(area * 1.3))),
        2 ** Math.ceil(Math.log2(sides.get(sorted[0]) ?? 0)),
      ),
    );
    if (wanted > this.pagePixels) {
      this.resize(wanted);
    }

    const pageSize = this.pagePixels;
    const perPage: Light[][] = [[]];
    let x = 0;
    let y = 0;
    let rowHeight = 0;
    for (const light of sorted) {
      const side = Math.min(sides.get(light)!, pageSize);
      if (x + side > pageSize) {
        // Next row
        x = 0;
        y += rowHeight;
        rowHeight = 0;
      }
      if (y + side > pageSize) {
        // Next page
        perPage.push([]);
        x = 0;
        y = 0;
        rowHeight = 0;
      }
      const page = perPage.length - 1;
      this.ensurePage(page);
      light.placeInAtlas(
        {
          page,
          x: (x + side / 2) / LIGHT_RESOLUTION,
          y: (y + side / 2) / LIGHT_RESOLUTION,
        },
        this.pages[page],
      );
      perPage[page].push(light);
      x += side;
      rowHeight = Math.max(rowHeight, side);
    }
    return perPage;
  }

  private resize(pixels: number) {
    this.pagePixels = pixels;
    const count = this.pages.length;
    this.destroy();
    for (let i = 0; i < count; i++) {
      this.ensurePage(i);
    }
  }

  private ensurePage(index: number) {
    while (this.pages.length <= index) {
      const meters = this.pagePixels / LIGHT_RESOLUTION;
      const make = () =>
        RenderTexture.create({
          width: meters,
          height: meters,
          resolution: LIGHT_RESOLUTION,
        });
      this.pages.push({ mask: make(), light: make() });
    }
  }

  destroy() {
    for (const page of this.pages) {
      page.mask.destroy(true);
      page.light.destroy(true);
    }
    this.pages = [];
  }
}
