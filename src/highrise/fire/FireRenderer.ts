import {
  Container,
  GlProgram,
  Matrix,
  Mesh,
  MeshGeometry,
  RenderTexture,
  Shader,
  Sprite,
  Texture,
} from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import { clamp } from "../../core/util/MathUtil";
import Burning from "./Burning";
import {
  BURN_FADE_TIME,
  FIRE_CELL_SIZE,
  HEAT_BLOB_JITTER,
  HEAT_BLOB_RADIUS,
  HEAT_MARGIN,
  HEAT_RESOLUTION,
  BURNING_HEAT_RADIUS,
  BURNING_TAIL,
  DEAD_BURNING_FADE_TIME,
  FLAME_WARP,
} from "./fireConstants";
import type FireGrid from "./FireGrid";
import frag_flames from "./flames.frag";
import vert_flames from "./flames.vert";

/**
 * Draws all the fire: every burning cell of the grid and every burning thing
 * draws a soft blob of heat into the heat buffer, a low-resolution texture
 * over what the camera sees, and one mesh turns that heat into flames with a
 * shader (`flames.frag`). The blobs are bigger than cells and nudged off their
 * middles, so neighboring ones melt together and the grid doesn't show, and
 * fire from different things merges into one.
 */
export default class FireRenderer extends BaseEntity implements Entity {
  sprite: Container & GameSprite;
  private mesh: Mesh<MeshGeometry, Shader>;
  private shader: Shader;
  private heat: RenderTexture;
  /** What's drawn into the heat buffer */
  private heatContainer = new Container();
  /** Reused from frame to frame; the unused ones are hidden */
  private blobs: Sprite[] = [];
  private blobTexture = makeBlobTexture();
  /** Where each burning thing was last frame, and how hot */
  private lastBurning = new Map<
    Burning,
    { x: number; y: number; heat: number }
  >();
  /** The part of the world the heat buffer covers: x, y, width, height */
  private rect = new Float32Array(4);

  constructor(private grid: FireGrid) {
    super();

    this.heat = RenderTexture.create({
      width: 1,
      height: 1,
      resolution: HEAT_RESOLUTION,
    });
    this.shader = new Shader({
      glProgram: GlProgram.from({
        vertex: vert_flames,
        fragment: frag_flames,
        name: "flames",
      }),
      resources: {
        uHeat: this.heat.source,
        flameUniforms: {
          uRect: { value: this.rect, type: "vec4<f32>" },
          uTime: { value: 0, type: "f32" },
          uWarp: { value: FLAME_WARP, type: "f32" },
          uTexel: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
        },
      },
    });
    this.mesh = new Mesh({
      geometry: new MeshGeometry({
        positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
        uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
        indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
      }),
      shader: this.shader,
    });
    this.mesh.blendMode = "add";

    this.sprite = new Container();
    this.sprite.layerName = Layer.EMISSIVES;
    this.sprite.addChild(this.mesh);
  }

  @on("render")
  onRender(dt: number) {
    const blobCount = this.drawHeat(dt);
    this.mesh.visible = blobCount > 0;
    const uniforms = this.shader.resources.flameUniforms.uniforms;
    uniforms.uTime = this.game.elapsedUnpausedTime;
  }

  /** Draws the heat buffer; returns how many blobs went into it */
  private drawHeat(dt: number): number {
    const camera = this.game.camera;
    const viewport = camera.getWorldViewport();
    const x = viewport.left - HEAT_MARGIN;
    const y = viewport.top - HEAT_MARGIN;
    const width = viewport.right - viewport.left + 2 * HEAT_MARGIN;
    const height = viewport.bottom - viewport.top + 2 * HEAT_MARGIN;

    let count = 0;
    const addBlob = (bx: number, by: number, radius: number, heat: number) => {
      if (
        heat <= 0 ||
        bx < x - radius ||
        by < y - radius ||
        bx > x + width + radius ||
        by > y + height + radius
      ) {
        return;
      }
      let blob = this.blobs[count];
      if (!blob) {
        blob = new Sprite(this.blobTexture);
        blob.anchor.set(0.5);
        blob.blendMode = "add";
        this.blobs.push(blob);
        this.heatContainer.addChild(blob);
      }
      blob.visible = true;
      blob.position.set(bx, by);
      blob.width = radius * 2;
      blob.height = radius * 2;
      blob.alpha = clamp(heat);
      count++;
    };

    // The fire on the floor
    const grid = this.grid;
    for (const cell of grid.burning) {
      const [cx, cy] = grid.cellCenter(cell);
      const [jx, jy] = cellJitter(cell);
      addBlob(
        cx + jx * HEAT_BLOB_JITTER,
        cy + jy * HEAT_BLOB_JITTER,
        HEAT_BLOB_RADIUS,
        grid.cellHeat(cell),
      );
    }

    // Burning things, with a tail of heat trailing behind them
    for (const burning of this.game.entities.getByConstructor(Burning)) {
      const [px, py] = burning.target.getPosition();
      const heat = clamp(burning.timeLeft / BURN_FADE_TIME);
      addBlob(px, py, BURNING_HEAT_RADIUS, heat);
      this.lastBurning.set(burning, { x: px, y: py, heat });
      const velocity = burning.target.body?.velocity;
      if (velocity) {
        for (let i = 1; i <= 3; i++) {
          const back = (i * BURNING_TAIL) / 3;
          addBlob(
            px - velocity[0] * back,
            py - velocity[1] * back,
            BURNING_HEAT_RADIUS * (1 - i * 0.2),
            heat * (1 - i * 0.22),
          );
        }
      }
    }

    // Things that died burning: their fire dies down where they fell
    const fade = (this.game.paused ? 0 : dt) / DEAD_BURNING_FADE_TIME;
    for (const [burning, last] of this.lastBurning) {
      if (burning.isDestroyed) {
        last.heat -= fade;
        if (last.heat <= 0) {
          this.lastBurning.delete(burning);
        } else {
          addBlob(last.x, last.y, BURNING_HEAT_RADIUS, last.heat);
        }
      }
    }

    for (let i = count; i < this.blobs.length; i++) {
      this.blobs[i].visible = false;
    }
    if (count === 0) {
      return 0;
    }

    // The buffer follows the camera, and only changes size when the view does
    if (
      Math.abs(this.heat.width - width) > 0.5 ||
      Math.abs(this.heat.height - height) > 0.5
    ) {
      this.heat.resize(Math.ceil(width), Math.ceil(height));
    }
    const bufferWidth = this.heat.width;
    const bufferHeight = this.heat.height;
    this.rect[0] = x;
    this.rect[1] = y;
    this.rect[2] = bufferWidth;
    this.rect[3] = bufferHeight;
    const texel = this.shader.resources.flameUniforms.uniforms.uTexel;
    texel[0] = 1 / (bufferWidth * HEAT_RESOLUTION);
    texel[1] = 1 / (bufferHeight * HEAT_RESOLUTION);

    this.game.renderer.app.renderer.render({
      container: this.heatContainer,
      target: this.heat,
      clear: true,
      clearColor: [0, 0, 0, 0],
      transform: new Matrix().translate(-x, -y),
    });

    this.mesh.position.set(x, y);
    this.mesh.scale.set(bufferWidth, bufferHeight);
    return count;
  }

  @on("destroy")
  onDestroy() {
    this.heatContainer.destroy({ children: true });
    this.heat.destroy(true);
    this.blobTexture.destroy(true);
  }
}

/**
 * Where a cell's blob of heat sits, relative to the cell's middle: the same
 * for the same cell every frame, between -1 and 1 on each axis
 */
export function cellJitter(cell: number): [number, number] {
  const a = Math.sin(cell * 12.9898) * 43758.5453;
  const b = Math.sin(cell * 78.233) * 12543.123;
  return [(a - Math.floor(a)) * 2 - 1, (b - Math.floor(b)) * 2 - 1];
}

/** A white disc that fades out smoothly to its edge */
function makeBlobTexture(): Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d")!;
  const image = context.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5;
      const dy = (y + 0.5) / size - 0.5;
      const r = Math.min(1, Math.hypot(dx, dy) * 2);
      const value = (1 - r * r) * (1 - r * r);
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
