import {
  Container,
  GlProgram,
  Matrix,
  Mesh,
  MeshGeometry,
  RenderTexture,
  Shader,
} from "pixi.js";
import { Layer } from "../../config/layers";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { GameSprite } from "../../core/entity/GameSprite";
import { on } from "../../core/entity/handler";
import Game from "../../core/Game";
import { gpuTimed, measureCpuAndGpu } from "../../core/util/GpuProfiler";
import { V2d } from "../../core/Vector";
import { Persistence } from "../constants/constants";
import ContactShadow, {
  CONTACT_SHADOW_INDICES,
  CONTACT_SHADOW_VERTICES,
} from "./ContactShadow";
import frag_contactShadows from "./contactShadows.frag?raw";
import vert_contactShadows from "./contactShadows.vert?raw";
import { getContactShadowTexture } from "./contactShadowTexture";

/** Meters across the squares of the grid the shadows are split up by */
const CHUNK_SIZE = 16;
/** Meters across the cells of the floor that get darkened (see `Chunk.floor`) */
const CELL_SIZE = 0.5;
const CELLS_PER_CHUNK = CHUNK_SIZE / CELL_SIZE;
/**
 * The texture's pixels per screen pixel. Contact shadows are soft, so half
 * as many each way is plenty, and a quarter of the pixels to clear and draw.
 */
const TEXTURE_SCALE = 0.5;

/** The shadows (that don't move) and floor in one square of a grid */
interface Chunk {
  /** Its shadows, drawn into the texture */
  shadows: Mesh;
  /** The cells of the floor any shadow can reach, darkened by the texture */
  floor: Mesh<MeshGeometry, Shader>;
  /** The middle of everything in it, and how far from there it reaches */
  x: number;
  y: number;
  radius: number;
}

/**
 * Soft shadows on the floor where walls and doors (and anything else with a
 * `ContactShadow`) meet it.
 *
 * The shadows are drawn into a texture over the screen, cleared to white, in
 * the "min" blend mode. That is the point: where shadows overlap (along a
 * wall, at a corner where two meet, a door against its frame) the darkest
 * one wins rather than them darkening each other, so every shadow can go
 * all the way around what casts it and they join up whatever shape the
 * level is.
 *
 * Then the floor is multiplied by the texture, but only near the shadows: a
 * mesh of the cells of a grid that any shadow can reach, each once, so none
 * is darkened twice. Multiplying the whole screen cost a millisecond of GPU
 * a frame on a retina display; this costs only what's near walls.
 *
 * The shadows that don't move are built into meshes when they change (a new
 * level), split into chunks by a grid so that only the ones in view are
 * drawn, and cost the CPU nothing per frame. One that moves (a door) has a
 * small mesh of its own, which is only moved: writing a mesh's vertices
 * again every frame stalled on the GPU still drawing the last frame's. The
 * floor under a door is everywhere it can swing.
 */
export default class ContactShadows extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;

  /** The floor near shadows, darkened by the texture */
  sprite: Container & GameSprite;
  private texture!: RenderTexture;
  /** What gets drawn into the texture, in world coordinates */
  private shadowContainer = new Container();
  private floorContainer = new Container();
  private floorShader: Shader;
  private staticShadows = new Set<ContactShadow>();
  private movingShadows = new Set<ContactShadow>();
  /** Where each moving shadow can get to, for culling */
  private movingAreas = new Map<
    ContactShadow,
    [number, number, number, number]
  >();
  /** Whether the shadows changed since the chunks were built */
  private changed = false;
  private chunks: Chunk[] = [];

  constructor() {
    super();
    this.floorShader = new Shader({
      glProgram: GlProgram.from({
        vertex: vert_contactShadows,
        fragment: frag_contactShadows,
        name: "contactShadows",
      }),
      resources: {
        uShadows: getContactShadowTexture().source,
        contactShadowUniforms: {
          uWorldToShadows: { value: new Matrix(), type: "mat3x3<f32>" },
        },
      },
    });
    this.sprite = gpuTimed("ContactShadows.floor", this.floorContainer);
    this.sprite.layerName = Layer.FLOOR_AO;
  }

  private get renderer() {
    return this.game.renderer.app.renderer;
  }

  addShadow(shadow: ContactShadow) {
    if (shadow.moves) {
      this.movingShadows.add(shadow);
      this.shadowContainer.addChild(shadow.mesh);
    } else {
      this.staticShadows.add(shadow);
    }
    this.changed = true;
  }

  removeShadow(shadow: ContactShadow) {
    if (this.movingShadows.delete(shadow)) {
      this.shadowContainer.removeChild(shadow.mesh);
    }
    this.staticShadows.delete(shadow);
    this.changed = true;
  }

  @on("add")
  onAdd({ game }: { game: Game }) {
    const [width, height] = game.renderer.getSize();
    this.texture = RenderTexture.create({
      width,
      height,
      resolution: this.renderer.resolution * TEXTURE_SCALE,
    });
    this.floorShader.resources.uShadows = this.texture.source;
  }

  @on("resize")
  onResize({ size: [width, height] }: { size: V2d }) {
    // The graphics quality setting changes the renderer's resolution, and
    // this texture has to match or the shadows are drawn at the wrong scale
    this.texture.resize(
      width,
      height,
      this.renderer.resolution * TEXTURE_SCALE,
    );
  }

  @on("destroy")
  onDestroy() {
    this.destroyChunks();
    // Before the texture it's bound to
    this.floorShader.destroy();
    this.texture.destroy(true);
  }

  @on("lateRender")
  onLateRender() {
    if (this.changed) {
      this.changed = false;
      this.build();
    }

    const camera = this.game.camera;
    for (const chunk of this.chunks) {
      const inView = camera.isInView([chunk.x, chunk.y], chunk.radius);
      chunk.shadows.visible = inView;
      chunk.floor.visible = inView;
    }
    for (const [shadow, [minX, minY, maxX, maxY]] of this.movingAreas) {
      const inView = camera.isInView(
        [(minX + maxX) / 2, (minY + maxY) / 2],
        (maxX - minX) / 2,
      );
      shadow.mesh.visible = inView;
      if (inView) {
        shadow.place();
      }
    }

    const cameraMatrix = camera.getMatrix();
    this.shadowContainer.setFromMatrix(cameraMatrix);
    // From the world to the texture's coordinates, 0 to 1 across the screen
    const [width, height] = this.game.renderer.getSize();
    const uniforms = this.floorShader.resources.contactShadowUniforms.uniforms;
    (uniforms.uWorldToShadows as Matrix)
      .copyFrom(cameraMatrix)
      .scale(1 / width, 1 / height);

    measureCpuAndGpu("ContactShadows", () => {
      this.renderer.render({
        container: this.shadowContainer,
        target: this.texture,
        clear: true,
        clearColor: [1, 1, 1, 1],
      });
    });
  }

  /** Builds the chunks' meshes from the shadows */
  private build() {
    this.destroyChunks();
    this.movingAreas.clear();

    const byChunk = new Map<
      number,
      { shadows: ContactShadow[]; cells: Set<number>; area: number[] }
    >();
    const getChunk = (cx: number, cy: number) => {
      const key = gridKey(cx, cy);
      let entry = byChunk.get(key);
      if (!entry) {
        entry = {
          shadows: [],
          cells: new Set(),
          area: [Infinity, Infinity, -Infinity, -Infinity],
        };
        byChunk.set(key, entry);
      }
      return entry;
    };

    // Every cell any shadow can reach, in the chunk it's in
    const addCells = ([minX, minY, maxX, maxY]: number[]) => {
      const lastX = Math.floor(maxX / CELL_SIZE);
      const lastY = Math.floor(maxY / CELL_SIZE);
      for (let cy = Math.floor(minY / CELL_SIZE); cy <= lastY; cy++) {
        for (let cx = Math.floor(minX / CELL_SIZE); cx <= lastX; cx++) {
          const chunk = getChunk(
            Math.floor(cx / CELLS_PER_CHUNK),
            Math.floor(cy / CELLS_PER_CHUNK),
          );
          chunk.cells.add(gridKey(cx, cy));
          growArea(chunk.area, [
            cx * CELL_SIZE,
            cy * CELL_SIZE,
            (cx + 1) * CELL_SIZE,
            (cy + 1) * CELL_SIZE,
          ]);
        }
      }
    };

    for (const shadow of this.staticShadows) {
      const area = shadow.getArea();
      // A shadow is in the chunk its middle is in, so none is drawn twice
      const chunk = getChunk(
        Math.floor((area[0] + area[2]) / 2 / CHUNK_SIZE),
        Math.floor((area[1] + area[3]) / 2 / CHUNK_SIZE),
      );
      chunk.shadows.push(shadow);
      growArea(chunk.area, area);
      addCells(area);
    }
    for (const shadow of this.movingShadows) {
      const area = shadow.getArea();
      this.movingAreas.set(shadow, area);
      addCells(area);
    }

    for (const { shadows, cells, area } of byChunk.values()) {
      const [minX, minY, maxX, maxY] = area;
      const chunk: Chunk = {
        shadows: shadowsMesh(shadows),
        floor: this.floorMesh(cells),
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
        radius: Math.hypot(maxX - minX, maxY - minY) / 2,
      };
      this.chunks.push(chunk);
      // Order doesn't matter to "min", but keep the moving ones together
      this.shadowContainer.addChildAt(chunk.shadows, 0);
      this.floorContainer.addChild(chunk.floor);
    }
  }

  private destroyChunks() {
    for (const chunk of this.chunks) {
      chunk.shadows.destroy();
      chunk.floor.destroy();
    }
    this.chunks.length = 0;
  }

  /** A quad over each run of cells in a row of the grid */
  private floorMesh(cells: Set<number>): Mesh<MeshGeometry, Shader> {
    const sorted = [...cells].map(fromGridKey);
    sorted.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const quads: number[] = [];
    for (let i = 0; i < sorted.length;) {
      const [startX, y] = sorted[i];
      let endX = startX;
      i++;
      while (
        i < sorted.length &&
        sorted[i][1] === y &&
        sorted[i][0] === endX + 1
      ) {
        endX++;
        i++;
      }
      quads.push(
        startX * CELL_SIZE,
        y * CELL_SIZE,
        (endX + 1) * CELL_SIZE,
        (y + 1) * CELL_SIZE,
      );
    }
    const count = quads.length / 4;
    const positions = new Float32Array(count * 8);
    const indices = new Uint32Array(count * 6);
    for (let q = 0; q < count; q++) {
      const [x0, y0, x1, y1] = quads.slice(q * 4, q * 4 + 4);
      positions.set([x0, y0, x1, y0, x1, y1, x0, y1], q * 8);
      const v = q * 4;
      indices.set([v, v + 1, v + 2, v, v + 2, v + 3], q * 6);
    }
    const mesh = new Mesh({
      // Texture coordinates are where it is in the world (see the shader)
      geometry: new MeshGeometry({ positions, uvs: positions, indices }),
      shader: this.floorShader,
    });
    mesh.blendMode = "multiply";
    return mesh;
  }
}

/** The shadows' quads, in one mesh drawn into the texture */
function shadowsMesh(shadows: ContactShadow[]): Mesh {
  const positions = new Float32Array(
    shadows.length * CONTACT_SHADOW_VERTICES * 2,
  );
  const uvs = new Float32Array(shadows.length * CONTACT_SHADOW_VERTICES * 2);
  const indices = new Uint32Array(shadows.length * CONTACT_SHADOW_INDICES);
  shadows.forEach((shadow, i) => shadow.writeMesh(i, positions, uvs, indices));
  const mesh = new Mesh({
    geometry: new MeshGeometry({ positions, uvs, indices }),
    texture: getContactShadowTexture(),
  });
  mesh.blendMode = "min";
  // A chunk can have only cells (of a neighbor's shadows), and nothing to draw
  mesh.renderable = shadows.length > 0;
  return mesh;
}

/** One number for a square of a grid (within a million squares each way) */
function gridKey(x: number, y: number): number {
  return (x + 1e6) * 4e6 + (y + 1e6);
}

function fromGridKey(key: number): [number, number] {
  const y = key % 4e6;
  return [(key - y) / 4e6 - 1e6, y - 1e6];
}

function growArea(area: number[], [minX, minY, maxX, maxY]: number[]) {
  area[0] = Math.min(area[0], minX);
  area[1] = Math.min(area[1], minY);
  area[2] = Math.max(area[2], maxX);
  area[3] = Math.max(area[3], maxY);
}
