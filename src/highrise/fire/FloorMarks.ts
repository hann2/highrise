import { Container, RenderTexture, Sprite, Texture } from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { clamp } from "../../core/util/MathUtil";
import {
  FLOOR_MARK_RESOLUTION,
  FUEL_STAIN_ALPHA,
  FUEL_STAIN_COLOR,
  FUEL_STAIN_FADE_INTERVAL,
  FUEL_STAIN_FULL,
  FUEL_STAIN_STEP,
  MARK_BLOB_RADIUS,
  SCORCH_ALPHA,
  SCORCH_COLOR,
} from "./fireConstants";
import type FireGrid from "./FireGrid";
import { cellJitter } from "./FireRenderer";
import { gpuTimed, measureCpuAndGpu } from "../../core/util/GpuProfiler";

/** How many differently shaped blobs there are to paint with */
const BLOB_SHAPES = 6;

/**
 * What fire leaves on the floor, painted with soft, irregular blobs so the
 * grid doesn't show: fuel stains (repainted when the fuel changes enough) and
 * scorch marks (painted on as cells burn, and never taken off). Each is a
 * texture the size of the level.
 */
export default class FloorMarks extends BaseEntity implements Entity {
  tickLayer = "fire" as const;
  sprite: Container & GameSprite;
  private scorchSprite: Sprite & GameSprite;
  private fuelSprite: Sprite & GameSprite;
  private scorchTexture = RenderTexture.create({ width: 1, height: 1 });
  private fuelTexture = RenderTexture.create({ width: 1, height: 1 });
  /** How much scorch has been painted on each cell, 0 to 1 */
  private paintedScorch = new Float32Array(0);
  /** The grid's fuel when the fuel stains were last looked at */
  private paintedFuelVersion = -1;
  /** How dark each cell's fuel stain was painted (see `stainAlpha`) */
  private paintedFuel = new Float32Array(0);
  /** The cells with a fuel stain painted */
  private paintedFuelCells: number[] = [];
  /** When the fuel stains were last painted, in unpaused seconds */
  private fuelPaintedAt = -Infinity;
  /** The fuel stains are painted from scratch next frame, whatever the fuel */
  private fuelStale = true;
  private blobTextures = Array.from({ length: BLOB_SHAPES }, (_, i) =>
    makeIrregularBlobTexture(i),
  );
  private blobContainer = new Container();
  private blobs: Sprite[] = [];

  constructor(private grid: FireGrid) {
    super();
    this.scorchSprite = new Sprite(this.scorchTexture);
    this.scorchSprite.alpha = SCORCH_ALPHA;
    this.fuelSprite = new Sprite(this.fuelTexture);
    this.fuelSprite.alpha = FUEL_STAIN_ALPHA;
    const marks = new Container();
    marks.addChild(this.scorchSprite, this.fuelSprite);
    this.sprite = gpuTimed("FloorMarks", marks);
    this.sprite.layerName = Layer.FLOOR_DECALS;
  }

  /** Blank marks for a level of `width` × `height` meters */
  reset(width: number, height: number) {
    // Textures that change size are made afresh: resizing doesn't update the
    // sprites already showing them
    this.scorchTexture.destroy(true);
    this.fuelTexture.destroy(true);
    const options = { width, height, resolution: FLOOR_MARK_RESOLUTION };
    this.scorchTexture = RenderTexture.create(options);
    this.fuelTexture = RenderTexture.create(options);
    this.scorchSprite.texture = this.scorchTexture;
    this.fuelSprite.texture = this.fuelTexture;
    this.paintedScorch = new Float32Array(this.grid.columns * this.grid.rows);
    this.paintedFuel = new Float32Array(this.grid.columns * this.grid.rows);
    this.paintedFuelCells = [];
    this.fuelStale = true;
  }

  /** Takes all the marks off */
  clear() {
    this.paintedScorch.fill(0);
    this.fuelStale = true;
    if (this.isAdded) {
      this.paint(this.scorchTexture, 0, true);
    }
  }

  @on("render")
  onRender() {
    const grid = this.grid;

    // Scorch builds up under burning cells: paint on the difference
    let count = 0;
    for (const cell of grid.burning) {
      const target = grid.scorchAt(cell);
      const painted = this.paintedScorch[cell];
      if (target - painted > 0.02) {
        // Painting alpha a over alpha A gives A + a(1 - A)
        const alpha = (target - painted) / (1 - painted);
        this.addBlob(count++, cell, SCORCH_COLOR, alpha, 1.1);
        this.paintedScorch[cell] = target;
      }
    }
    if (count > 0) {
      this.paint(this.scorchTexture, count, false);
    }

    // Fuel stains, from scratch, since they fade as the fuel burns
    if (this.fuelStale || grid.fuelVersion !== this.paintedFuelVersion) {
      this.paintedFuelVersion = grid.fuelVersion;
      const now = this.game.elapsedUnpausedTime;
      const change = this.fuelStale ? "darker" : this.fuelStainChange();
      if (
        change === "darker" ||
        (change === "lighter" &&
          now - this.fuelPaintedAt >= FUEL_STAIN_FADE_INTERVAL)
      ) {
        this.paintFuelStains();
        this.fuelPaintedAt = now;
        this.fuelStale = false;
      }
    }
  }

  /** How dark the fuel stain in `cell` should be */
  private stainAlpha(cell: number): number {
    return clamp(this.grid.fuelInCell(cell) / FUEL_STAIN_FULL) * 0.4;
  }

  /**
   * Whether any fuel stain is more than a step darker than it was painted
   * (or new), else whether any is lighter (or gone)
   */
  private fuelStainChange(): "darker" | "lighter" | undefined {
    const fuelCells = this.grid.fuelCells;
    let lighter = fuelCells.size < this.paintedFuelCells.length;
    for (const cell of fuelCells) {
      const difference = this.stainAlpha(cell) - this.paintedFuel[cell];
      if (difference > FUEL_STAIN_STEP) {
        return "darker";
      } else if (difference < -FUEL_STAIN_STEP) {
        lighter = true;
      }
    }
    return lighter ? "lighter" : undefined;
  }

  private paintFuelStains() {
    for (const cell of this.paintedFuelCells) {
      this.paintedFuel[cell] = 0;
    }
    this.paintedFuelCells = [];
    let count = 0;
    for (const cell of this.grid.fuelCells) {
      const alpha = this.stainAlpha(cell);
      this.addBlob(count++, cell, FUEL_STAIN_COLOR, alpha, 1);
      this.paintedFuel[cell] = alpha;
      this.paintedFuelCells.push(cell);
    }
    this.paint(this.fuelTexture, count, true);
  }

  private addBlob(
    index: number,
    cell: number,
    color: number,
    alpha: number,
    size: number,
  ) {
    let blob = this.blobs[index];
    if (!blob) {
      blob = new Sprite();
      blob.anchor.set(0.5);
      this.blobs.push(blob);
      this.blobContainer.addChild(blob);
    }
    const [x, y] = this.grid.cellCenter(cell);
    const [jx, jy] = cellJitter(cell);
    blob.texture = this.blobTextures[cell % BLOB_SHAPES];
    blob.visible = true;
    blob.position.set(x + jx * 0.12, y + jy * 0.12);
    blob.rotation = jx * Math.PI;
    blob.width = MARK_BLOB_RADIUS * 2 * size;
    blob.height = MARK_BLOB_RADIUS * 2 * size;
    blob.tint = color;
    blob.alpha = clamp(alpha);
  }

  /** Paints the first `count` blobs into `target` */
  private paint(target: RenderTexture, count: number, clear: boolean) {
    for (let i = count; i < this.blobs.length; i++) {
      this.blobs[i].visible = false;
    }
    measureCpuAndGpu("FloorMarks.paint", () =>
      this.game.renderer.app.renderer.render({
        container: this.blobContainer,
        target,
        clear,
        clearColor: [0, 0, 0, 0],
      }),
    );
  }

  @on("destroy")
  onDestroy() {
    this.blobContainer.destroy({ children: true });
    this.scorchTexture.destroy(true);
    this.fuelTexture.destroy(true);
    for (const texture of this.blobTextures) {
      texture.destroy(true);
    }
  }
}

/**
 * A white blob with a lumpy, soft edge, different for each `variant`. Made
 * without the seeded random numbers, which mustn't be used for looks.
 */
export function makeIrregularBlobTexture(variant: number): Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d")!;
  const image = context.createImageData(size, size);
  // The edge's distance from the middle wobbles with the angle
  const lumps = [2, 3, 5, 7].map((frequency, i) => ({
    frequency,
    phase: variant * 1.9 + i * 2.3,
    amount: 0.12 / (i + 1),
  }));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5;
      const dy = (y + 0.5) / size - 0.5;
      const angle = Math.atan2(dy, dx);
      let edge = 0.78;
      for (const { frequency, phase, amount } of lumps) {
        edge += amount * Math.sin(angle * frequency + phase);
      }
      const r = (Math.hypot(dx, dy) * 2) / edge;
      const value = clamp(1 - r) ** 0.7;
      const i = (y * size + x) * 4;
      image.data[i] = 255;
      image.data[i + 1] = 255;
      image.data[i + 2] = 255;
      image.data[i + 3] = Math.round(value * 255);
    }
  }
  context.putImageData(image, 0, 0);
  return Texture.from(canvas);
}
