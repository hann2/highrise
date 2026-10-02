import {
  Buffer,
  BufferUsage,
  Container,
  GlProgram,
  Mesh,
  MeshGeometry,
  Renderer,
  RenderTexture,
  Shader,
} from "pixi.js";
import Game from "../../core/Game";
import type { Body } from "../../core/physics/body/Body";
import { V2d } from "../../core/Vector";
import type Light from "./Light";
import { LIGHT_RESOLUTION } from "./lightingConstants";
import { CAST_SHADOW_TAG } from "./occluders";
import frag_shadowMask from "./shadowMask.frag?raw";
import vert_shadowMask from "./shadowMask.vert?raw";
import { getShapeCorners } from "./shapeUtils";

/** Vertices per wall edge: its two corners, and the two far ends of its shadow */
const EDGE_VERTICES = 4;
/** `aCorner` of the corners of a shape's interior */
const SOLID_CORNER = 4;
/** Meters across the squares of the grid the casters are split up by */
const CHUNK_SIZE = 16;
/** Floats per light in a chunk's instance buffer (see `shadowMask.vert`) */
const LIGHT_FLOATS = 6;

/**
 * The casters whose shapes' middles are in one square of a grid, as a mesh of
 * their own, with the lights to draw it for this time
 */
interface Chunk {
  mesh: Mesh<MeshGeometry, Shader>;
  /** Around all of its shapes, which can reach past its square */
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  /** Per light: x, y of the light; half the size of its square and its source radius; x, y of the middle of its square in the page */
  lightBuffer: Buffer;
  lightData: Float32Array;
  lightCount: number;
  /** The light it was last given, so one in several of its grid squares isn't given it twice */
  lastLight: number;
}

/**
 * Every static shadow caster's edges (and interiors) as meshes that stay on
 * the GPU, for drawing the shadow masks of a whole page of the light atlas in
 * one render pass: each mesh is drawn once per light (instanced), and the
 * vertex shader turns each edge into its shadow from that light, in that
 * light's square of the page, while the fragment shader works out how much of
 * the light each edge hides (`shadowMask.vert`, `shadowMask.frag`). Rebuilt
 * only when the set of casters changes (a new level), so drawing masks costs
 * the CPU nothing per wall.
 *
 * The casters are split into chunks by a grid, a mesh each, and each chunk is
 * only drawn for the lights whose squares reach it: the vertex shader runs on
 * every edge of a mesh for every light it's drawn for, even the ones too far
 * away to matter, so with one mesh for the whole level a big level's far
 * walls would cost every light (in a 240 by 160 m level, about as much GPU as
 * the near ones). A shape is in one chunk only (the one its middle is in), so
 * no shadow is drawn twice. A chunk is listed in every grid square its shapes
 * reach, so a light only looks in the few squares its own square is in, and
 * shapes longer than a square have chunks of their own, so a room's long
 * outside wall doesn't drag a square of small walls along to every light.
 *
 * Moving casters (doors) don't cast shadows from lights.
 */
export class ShadowCasters {
  /** The casters the meshes were built from */
  private bodies = new Set<Body>();
  /** Goes up every time the casters change, for lights drawn before to know */
  version = 0;
  private shader: Shader;
  private chunks: Chunk[] = [];
  /** The chunks by the grid squares their shapes reach (see `gridKey`) */
  private grid = new Map<number, Chunk[]>();
  /** The chunks given lights last time (only they have to be reset) */
  private touched: Chunk[] = [];
  /** Counts the lights given to chunks, for `Chunk.lastLight` */
  private lightNumber = 0;
  /** What gets drawn: the chunks with lights this time */
  private container = new Container();
  /** `WEBGL_clip_cull_distance`, once asked for (null where it's missing) */
  private clipExtension?: { CLIP_DISTANCE0_WEBGL: number } | null;

  constructor() {
    const glProgram = new GlProgram({
      vertex: vert_shadowMask,
      fragment: frag_shadowMask,
      name: "shadowMask",
    });
    // Clip planes (see `draw`) need the extension turned on in the shader,
    // before any code, which Pixi puts its own lines in front of: right
    // after the version line it adds. Where the extension is missing, this
    // only warns, and the shader doesn't write the clip distances.
    (glProgram as { vertex: string }).vertex = glProgram.vertex!.replace(
      /^#version 300 es\n/,
      "#version 300 es\n#extension GL_ANGLE_clip_cull_distance : enable\n",
    );
    this.shader = new Shader({ glProgram, resources: {} });
  }

  /** Whether there's nothing to cast shadows */
  get isEmpty(): boolean {
    return this.chunks.length === 0;
  }

  /** Rebuilds the meshes if casters were added or removed since the last call */
  update(game: Game) {
    const current: Body[] = [];
    let changed = false;
    for (const entity of game.entities.getTagged(CAST_SHADOW_TAG)) {
      const body = entity.body;
      if (body && body.motion === "static") {
        current.push(body);
        changed ||= !this.bodies.has(body);
      }
    }
    if (!changed && current.length === this.bodies.size) {
      return;
    }
    this.bodies = new Set(current);
    this.version += 1;
    this.build(current);
  }

  /** Splits the shapes of `bodies` into chunks, and makes a mesh for each */
  private build(bodies: readonly Body[]) {
    this.destroyChunks();
    // Each shape's corners, by the grid square its middle is in. Shapes
    // longer than a square (a room's whole side) go in chunks of their own,
    // so they don't make the small ones near them reach far too
    const bySquare = new Map<string, V2d[][]>();
    for (const body of bodies) {
      for (const shape of body.shapes) {
        const corners = getShapeCorners(shape, body);
        if (corners.length < 2) {
          continue;
        }
        const [minX, minY, maxX, maxY] = bounds(corners);
        const column = Math.floor((minX + maxX) / 2 / CHUNK_SIZE);
        const row = Math.floor((minY + maxY) / 2 / CHUNK_SIZE);
        const long =
          maxX - minX > CHUNK_SIZE || maxY - minY > CHUNK_SIZE ? "long" : "";
        const key = `${column},${row},${long}`;
        let shapes = bySquare.get(key);
        if (!shapes) {
          shapes = [];
          bySquare.set(key, shapes);
        }
        shapes.push(corners);
      }
    }

    for (const shapes of bySquare.values()) {
      let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
      for (const corners of shapes) {
        const b = bounds(corners);
        minX = Math.min(minX, b[0]);
        minY = Math.min(minY, b[1]);
        maxX = Math.max(maxX, b[2]);
        maxY = Math.max(maxY, b[3]);
      }
      const lightBuffer = new Buffer({
        data: new Float32Array(LIGHT_FLOATS),
        usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
      });
      const mesh = new Mesh({
        geometry: buildGeometry(shapes, lightBuffer),
        shader: this.shader,
      });
      mesh.blendMode = "add";
      const chunk: Chunk = {
        mesh,
        minX,
        minY,
        maxX,
        maxY,
        lightBuffer,
        lightData: new Float32Array(0),
        lightCount: 0,
        lastLight: -1,
      };
      this.chunks.push(chunk);
      // In every grid square its shapes reach, so a light only has to look
      // in the squares its own square is in
      const lastColumn = Math.floor(maxX / CHUNK_SIZE);
      const lastRow = Math.floor(maxY / CHUNK_SIZE);
      for (let row = Math.floor(minY / CHUNK_SIZE); row <= lastRow; row++) {
        for (
          let column = Math.floor(minX / CHUNK_SIZE);
          column <= lastColumn;
          column++
        ) {
          const key = gridKey(column, row);
          const inSquare = this.grid.get(key);
          if (inSquare) {
            inSquare.push(chunk);
          } else {
            this.grid.set(key, [chunk]);
          }
        }
      }
    }
  }

  /**
   * Draws the shadow masks of `lights`, which have their slots, into
   * `target`, a page of the mask atlas.
   *
   * Each light's shadows reach well past its square, which a texture of its
   * own would clip for free (the GPU clips triangles to the render target
   * before it shades a pixel), but the page doesn't. So with
   * `WEBGL_clip_cull_distance` the vertex shader gives the GPU four clip
   * planes per light, the edges of its square, and it clips to those
   * instead. Without the extension the fragment shader throws those pixels
   * away itself, which gives the same picture but costs a shader run each.
   */
  draw(
    renderer: Renderer,
    lights: readonly Light[],
    target: RenderTexture,
    /** Clear the page first; else the lights' squares have to be clear already */
    clear: boolean,
  ) {
    this.setLights(lights);
    const gl = (renderer as { gl?: WebGL2RenderingContext }).gl;
    this.clipExtension ??= gl?.getExtension("WEBGL_clip_cull_distance");
    const clip = this.clipExtension;
    if (gl && clip) {
      for (let i = 0; i < 4; i++) {
        gl.enable(clip.CLIP_DISTANCE0_WEBGL + i);
      }
    }
    renderer.render({
      container: this.container,
      target,
      clear,
      // The default clear color is the renderer's opaque background
      clearColor: [0, 0, 0, 0],
    });
    if (gl && clip) {
      // Off again: they'd apply to every other shader too
      for (let i = 0; i < 4; i++) {
        gl.disable(clip.CLIP_DISTANCE0_WEBGL + i);
      }
    }
    this.container.removeChildren();
  }

  /**
   * Gives each chunk the lights whose squares reach it, and puts the chunks
   * that have any in the container
   */
  private setLights(lights: readonly Light[]) {
    const touched = this.touched;
    for (const chunk of touched) {
      chunk.lightCount = 0;
    }
    touched.length = 0;
    // At least a pixel, which antialiases hard shadows
    const minSourceRadius = 1 / LIGHT_RESOLUTION;
    for (const light of lights) {
      const number = this.lightNumber++;
      const halfSize = light.size / 2;
      const minX = light.x - halfSize;
      const minY = light.y - halfSize;
      const maxX = light.x + halfSize;
      const maxY = light.y + halfSize;
      // The chunks in the grid squares the light's square is in might reach
      // it, and their bounds say whether they do
      const lastColumn = Math.floor(maxX / CHUNK_SIZE);
      const lastRow = Math.floor(maxY / CHUNK_SIZE);
      for (let row = Math.floor(minY / CHUNK_SIZE); row <= lastRow; row++) {
        for (
          let column = Math.floor(minX / CHUNK_SIZE);
          column <= lastColumn;
          column++
        ) {
          const inSquare = this.grid.get(gridKey(column, row));
          if (!inSquare) {
            continue;
          }
          for (const chunk of inSquare) {
            if (
              chunk.lastLight === number ||
              chunk.minX >= maxX ||
              chunk.maxX <= minX ||
              chunk.minY >= maxY ||
              chunk.maxY <= minY
            ) {
              continue;
            }
            chunk.lastLight = number;
            if (chunk.lightCount === 0) {
              touched.push(chunk);
            }
            const j = chunk.lightCount * LIGHT_FLOATS;
            if (chunk.lightData.length < j + LIGHT_FLOATS) {
              const bigger = new Float32Array(
                Math.max(j + LIGHT_FLOATS, 2 * chunk.lightData.length),
              );
              bigger.set(chunk.lightData);
              chunk.lightData = bigger;
            }
            const data = chunk.lightData;
            data[j] = light.x;
            data[j + 1] = light.y;
            data[j + 2] = halfSize;
            data[j + 3] = Math.max(light.sourceRadius, minSourceRadius);
            data[j + 4] = light.slot!.x;
            data[j + 5] = light.slot!.y;
            chunk.lightCount += 1;
          }
        }
      }
    }
    for (const chunk of touched) {
      if (chunk.lightBuffer.data !== chunk.lightData) {
        // A bigger array (setting it uploads it all)
        chunk.lightBuffer.data = chunk.lightData;
      } else {
        chunk.lightBuffer.update(chunk.lightCount * LIGHT_FLOATS * 4);
      }
      chunk.mesh.geometry.instanceCount = chunk.lightCount;
      this.container.addChild(chunk.mesh);
    }
  }

  private destroyChunks() {
    for (const chunk of this.chunks) {
      const geometry = chunk.mesh.geometry;
      chunk.mesh.destroy();
      // Its buffers too, the chunk's lights' among them
      geometry.destroy(true);
    }
    this.chunks = [];
    this.touched = [];
    this.grid.clear();
  }

  destroy() {
    this.destroyChunks();
    this.shader.destroy();
    this.container.destroy();
  }
}

/** A grid square's key (squares 32 km either way of the origin are all different) */
function gridKey(column: number, row: number): number {
  return column + 32768 + (row + 32768) * 65536;
}

/** The bounding box of `corners`: min x, min y, max x, max y */
function bounds(corners: readonly V2d[]): [number, number, number, number] {
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of corners) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return [minX, minY, maxX, maxY];
}

/**
 * A mesh's geometry for the shapes with these corners, drawn once per light in
 * `lightBuffer`. See `shadowMask.vert` for what the attributes mean.
 */
function buildGeometry(
  shapes: readonly (readonly V2d[])[],
  lightBuffer: Buffer,
): MeshGeometry {
  const first: number[] = [];
  const second: number[] = [];
  const normals: number[] = [];
  const cornerIds: number[] = [];
  const indices: number[] = [];
  const addVertex = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    nx: number,
    ny: number,
    corner: number,
  ) => {
    first.push(ax, ay);
    second.push(bx, by);
    normals.push(nx, ny);
    cornerIds.push(corner);
  };
  const addEdge = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    nx: number,
    ny: number,
  ) => {
    const start = cornerIds.length;
    for (let corner = 0; corner < EDGE_VERTICES; corner++) {
      addVertex(ax, ay, bx, by, nx, ny, corner);
    }
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  };

  for (const corners of shapes) {
    const n = corners.length;
    if (n < 2) {
      continue;
    }
    let cx = 0;
    let cy = 0;
    for (const [x, y] of corners) {
      cx += x / n;
      cy += y / n;
    }
    for (let i = 0; i < (n === 2 ? 1 : n); i++) {
      const [ax, ay] = corners[i];
      const [bx, by] = corners[(i + 1) % n];
      const length = Math.hypot(bx - ax, by - ay);
      if (length === 0) {
        continue;
      }
      let nx = (by - ay) / length;
      let ny = -(bx - ax) / length;
      if (n === 2) {
        // A line has no inside: it blocks from both sides
        addEdge(ax, ay, bx, by, nx, ny);
        addEdge(ax, ay, bx, by, -nx, -ny);
        continue;
      }
      if (nx * (ax - cx) + ny * (ay - cy) < 0) {
        nx = -nx;
        ny = -ny;
      }
      addEdge(ax, ay, bx, by, nx, ny);
    }
    if (n >= 3) {
      // The inside is always in shadow, as a fan of triangles, which carry
      // the shape's bounding box for culling
      const [minX, minY, maxX, maxY] = bounds(corners);
      const start = cornerIds.length;
      for (const [x, y] of corners) {
        addVertex(x, y, minX, minY, maxX, maxY, SOLID_CORNER);
      }
      for (let i = 1; i < n - 1; i++) {
        indices.push(start, start + i, start + i + 1);
      }
    }
  }

  const geometry = new MeshGeometry({
    positions: new Float32Array(first),
    uvs: new Float32Array(second),
    indices: new Uint32Array(indices),
  });
  geometry.addAttribute("aNormal", {
    buffer: new Float32Array(normals),
    format: "float32x2",
  });
  geometry.addAttribute("aCorner", {
    buffer: new Float32Array(cornerIds),
    format: "float32",
  });
  // The lights, one per instance, interleaved
  const stride = LIGHT_FLOATS * 4;
  geometry.addAttribute("aLight", {
    buffer: lightBuffer,
    format: "float32x2",
    stride,
    offset: 0,
    instance: true,
  });
  geometry.addAttribute("aLightSize", {
    buffer: lightBuffer,
    format: "float32x2",
    stride,
    offset: 8,
    instance: true,
  });
  geometry.addAttribute("aSlot", {
    buffer: lightBuffer,
    format: "float32x2",
    stride,
    offset: 16,
    instance: true,
  });
  return geometry;
}
