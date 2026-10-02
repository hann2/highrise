import { RenderTexture } from "pixi.js";
import type Light from "./Light";
import { LIGHT_RESOLUTION } from "./lightingConstants";

/** Where a light is in the atlas: which page, and the middle of its square, in meters */
export interface AtlasSlot {
  page: number;
  x: number;
  y: number;
  /** Pixels across the square, padding included */
  side: number;
}

/** One page of an atlas: the lights' shadow masks, and the lights themselves */
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

/** Pixels across a light's square in the atlas, padding included */
function slotSide(light: Light): number {
  return Math.ceil(light.size * LIGHT_RESOLUTION) + 2 * PADDING;
}

/** The smallest page (a power of two) for squares adding up to `area` pixels */
function pageSizeFor(area: number, biggestSide: number): number {
  // Room to spare, since rows don't pack perfectly
  return Math.min(
    MAX_PAGE_PIXELS,
    Math.max(
      MIN_PAGE_PIXELS,
      2 ** Math.ceil(Math.log2(Math.sqrt(area * 1.3))),
      2 ** Math.ceil(Math.log2(biggestSide)),
    ),
  );
}

function makePage(pixels: number): AtlasPage {
  const meters = pixels / LIGHT_RESOLUTION;
  const make = () =>
    RenderTexture.create({
      width: meters,
      height: meters,
      resolution: LIGHT_RESOLUTION,
    });
  return { mask: make(), light: make() };
}

function destroyPage(page: AtlasPage) {
  page.mask.destroy(true);
  page.light.destroy(true);
}

/**
 * Packs squares into a page in rows, left to right and top to bottom. Gives
 * up (returns undefined) when the page is full.
 */
class RowPacker {
  private x = 0;
  private y = 0;
  private rowHeight = 0;

  constructor(public pixels: number) {}

  /** The middle of a free square of `side` pixels, in meters */
  place(side: number): { x: number; y: number } | undefined {
    if (this.x + side > this.pixels) {
      this.x = 0;
      this.y += this.rowHeight;
      this.rowHeight = 0;
    }
    if (side > this.pixels || this.y + side > this.pixels) {
      return undefined;
    }
    const middle = {
      x: (this.x + side / 2) / LIGHT_RESOLUTION,
      y: (this.y + side / 2) / LIGHT_RESOLUTION,
    };
    this.x += side;
    this.rowHeight = Math.max(this.rowHeight, side);
    return middle;
  }
}

/**
 * Squares for the dynamic lights in view, packed into pages of two textures
 * (masks and lights) at `LIGHT_RESOLUTION`, so that all the lights can be
 * drawn in a handful of render passes rather than a couple each. Texture
 * coordinates are in meters, like the world. Packed afresh every frame (it's
 * a few microseconds), in rows from the biggest light down. Pages grow to fit
 * what's in view, and stay that big.
 */
export class LightAtlas {
  pages: AtlasPage[] = [];
  private pagePixels = 0;

  /** Gives each light a slot (see `Light.placeInAtlas`); returns the lights on each page */
  pack(lights: readonly Light[]): Light[][] {
    const sorted = [...lights].sort((a, b) => b.size - a.size);
    let area = 0;
    for (const light of sorted) {
      area += slotSide(light) ** 2;
    }
    const wanted = pageSizeFor(area, slotSide(sorted[0]));
    if (wanted > this.pagePixels) {
      this.destroy();
      this.pagePixels = wanted;
    }

    const perPage: Light[][] = [[]];
    let packer = new RowPacker(this.pagePixels);
    for (const light of sorted) {
      const side = Math.min(slotSide(light), this.pagePixels);
      let middle = packer.place(side);
      if (!middle) {
        perPage.push([]);
        packer = new RowPacker(this.pagePixels);
        middle = packer.place(side)!;
      }
      const page = perPage.length - 1;
      while (this.pages.length <= page) {
        this.pages.push(makePage(this.pagePixels));
      }
      light.placeInAtlas({ page, side, ...middle }, this.pages[page]);
      perPage[page].push(light);
    }
    return perPage;
  }

  destroy() {
    this.pages.forEach(destroyPage);
    this.pages = [];
  }
}

/**
 * Squares for the static lights, which keep them from frame to frame, so a
 * light that hasn't changed isn't drawn again: one page, filled up in rows as
 * lights come into view. A light keeps its square while it's out of view, in
 * case it comes back, but is drawn again when it does: what happens out of
 * view (a door moving) isn't kept track of. When the page is full, it starts
 * over with just the lights in view (growing if they need it), and they're
 * all drawn again.
 */
export class StaticLightAtlas {
  page?: AtlasPage;
  private packer = new RowPacker(0);
  private slots = new Map<Light, AtlasSlot>();
  /** The frame each light was last in view */
  private lastInView = new Map<Light, number>();
  /** Set when the page was started over, so it needs clearing */
  needsClear = false;

  /**
   * Gives each light in view a slot (see `Light.placeInAtlas`), and returns
   * the ones that have to be drawn: changed (`dirty`), in a new square, or
   * back in view (not in view last `frame`).
   */
  update(lights: readonly Light[], frame: number): Light[] {
    for (const light of lights) {
      if (this.lastInView.get(light) !== frame - 1) {
        light.dirty = true;
      }
      this.lastInView.set(light, frame);
    }
    const toDraw: Light[] = [];
    if (!this.placeAll(lights, toDraw)) {
      // Full: start over with just these, on a page big enough for them
      let area = 0;
      let biggest = 0;
      for (const light of lights) {
        const side = slotSide(light);
        area += side * side;
        biggest = Math.max(biggest, side);
      }
      this.startOver(pageSizeFor(area, biggest));
      toDraw.length = 0;
      this.placeAll(lights, toDraw);
    }
    return toDraw;
  }

  /** Places each light; false if one didn't fit */
  private placeAll(lights: readonly Light[], toDraw: Light[]): boolean {
    for (const light of lights) {
      const side = slotSide(light);
      let slot = this.slots.get(light);
      if (!slot || slot.side < side) {
        const middle = this.page ? this.packer.place(side) : undefined;
        if (!middle) {
          return false;
        }
        slot = { page: 0, side, ...middle };
        this.slots.set(light, slot);
        light.dirty = true;
      }
      light.placeInAtlas(slot, this.page!);
      if (light.dirty) {
        toDraw.push(light);
      }
    }
    return true;
  }

  private startOver(pixels: number) {
    if (!this.page || pixels > this.packer.pixels) {
      if (this.page) {
        destroyPage(this.page);
      }
      this.page = makePage(Math.max(pixels, this.packer.pixels));
    }
    this.packer = new RowPacker(Math.max(pixels, this.packer.pixels));
    this.slots.clear();
    this.needsClear = true;
  }

  /** Everything has to be drawn again (the walls changed) */
  invalidateAll() {
    for (const light of this.slots.keys()) {
      light.dirty = true;
    }
  }

  /** The lights whose squares overlap `area` have to be drawn again (a door moved there) */
  invalidateArea([minX, minY, maxX, maxY]: readonly number[]) {
    for (const light of this.slots.keys()) {
      const halfSize = light.size / 2;
      if (
        light.x - halfSize < maxX &&
        light.x + halfSize > minX &&
        light.y - halfSize < maxY &&
        light.y + halfSize > minY
      ) {
        light.dirty = true;
      }
    }
  }

  /** A light that's gone, or isn't static any more */
  forget(light: Light) {
    this.slots.delete(light);
    this.lastInView.delete(light);
  }

  destroy() {
    if (this.page) {
      destroyPage(this.page);
    }
    this.page = undefined;
  }
}
